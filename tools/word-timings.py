#!/usr/bin/env python3
"""Tempo real de cada palavra falada, medido do WAV — e os frames de cada fala.

  python3 tools/word-timings.py                       # Disney v2 (default)
  python3 tools/word-timings.py src/narration-x.json public/audio/vo-x
  python3 tools/word-timings.py --edge                # motor alternativo

Para cada linha de "lines", transcreve VO_DIR/<id>.wav com faster-whisper
(pt, word_timestamps) e alinha as palavras reconhecidas às do roteiro. Grava na
linha:

  "words": [{"w": palavra do roteiro (pontuação original), "s": frame, "e": frame}]
      frames de 30 fps RELATIVOS ao início daquele WAV.
  "wordsMatched": "casadas/total" — quantas casaram de fato na transcrição.

Palavra sem correspondência tem o tempo interpolado entre as vizinhas. Em
seguida recalcula "frame" de cada linha (headFrames, depois
frame_anterior + durationInFrames_anterior + gapAfter) e confere sobreposição.

--edge troca o motor: em vez de transcrever o WAV, re-sintetiza o texto com o
edge-tts e usa os WordBoundary que o próprio TTS devolve (mede a intenção da
síntese, não o áudio gravado; confere a duração contra o WAV). Serve para quando
faster-whisper não está instalado — mas só vale se o WAV veio do edge-tts; com
voz ElevenLabs as marcas do edge não são as do áudio e a fala sai dessincronizada.

--align lê o VO_DIR/<id>.align.json que o gerador grava quando a voz é o George
(ElevenLabs): é o alinhamento por CARÁTER que a própria API devolveu junto do
áudio gerado, então é medida do áudio, não estimativa. Não precisa de
faster-whisper. As palavras do roteiro são casadas por posição contra
"characters" (o alinhamento reproduz o texto exato enviado). Não aceita texto
com "..." pelo mesmo motivo do --edge.

O motor --edge NÃO aceita texto com "..." : o gerador fatia esses textos em
trechos e concatena com pausa, e cada trecho traz o próprio atraso de mp3 — um
deslocamento único não vale para o arquivo todo. A linha é pulada em vez de
receber tempo errado.

Retomável não é necessário: são poucos segundos de CPU por fala. Rode sozinho.
"""
import asyncio
import difflib
import json
import os
import re
import sys
import unicodedata
import wave

FPS = 30
DEFAULT_JSON = "src/narration-disney.json"
DEFAULT_VO = "public/audio/vo-disney"


def norm(word):
    """Compara em minúsculas, sem acento e sem pontuação."""
    flat = unicodedata.normalize("NFD", word.lower())
    flat = "".join(c for c in flat if not unicodedata.combining(c))
    return re.sub(r"[^a-z0-9]", "", flat)


def wav_seconds(path):
    with wave.open(path, "rb") as w:
        return w.getnframes() / w.getframerate()


def transcribe_words(model, path):
    segments, _info = model.transcribe(
        path, language="pt", word_timestamps=True, vad_filter=False
    )
    words = []
    for segment in segments:
        for w in segment.words or []:
            token = w.word.strip()
            if token:
                words.append({"text": token, "start": w.start, "end": w.end})
    return words


def edge_marks(text, voice, rate, pitch):
    """WordBoundary do próprio edge-tts + o áudio que ele acabou de sintetizar."""
    import edge_tts

    async def run():
        # sem boundary="WordBoundary" o serviço manda SentenceBoundary (default
        # da 7.2.8) e a lista de marcas vem vazia.
        communicate = edge_tts.Communicate(
            text, voice, rate=rate, pitch=pitch, boundary="WordBoundary"
        )
        audio = bytearray()
        marks = []
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio += chunk["data"]
            elif chunk["type"] == "WordBoundary":
                # offset vem em ticks de 100 ns
                start = chunk["offset"] / 1e7
                marks.append(
                    {
                        "text": chunk["text"],
                        "start": start,
                        "end": start + chunk["duration"] / 1e7,
                    }
                )
        return marks, bytes(audio)

    return asyncio.run(run())


def mp3_seconds(data):
    """Duração decodificada de um mp3 em memória (para comparar com o WAV)."""
    import os
    import subprocess
    import tempfile

    with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as f:
        f.write(data)
        path = f.name
    try:
        out = subprocess.run(
            ["ffprobe", "-v", "error", "-show_entries", "format=duration",
             "-of", "default=noprint_wrappers=1:nokey=1", path],
            capture_output=True, text=True, check=True,
        )
        return float(out.stdout.strip())
    finally:
        os.unlink(path)


def audio_onset(path):
    """Primeiro instante audível do WAV, em segundos (janelas de 10 ms).

    O edge-tts data a primeira palavra em 0,100 s, mas o mp3 que ele devolve
    passa por encoder e decoder e o som só aparece ~46 ms depois no WAV (o
    atraso padrão do codec). Sem descontar isso, toda marca fica ~1,5 frame
    adiantada em relação ao que se ouve."""
    import numpy as np

    with wave.open(path, "rb") as w:
        rate = w.getframerate()
        samples = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16)

    window = int(rate * 0.01)
    if window < 1 or samples.size < window:
        return 0.0
    frames = samples[: samples.size // window * window]
    frames = frames.reshape(-1, window).astype(np.float64)
    energy = np.sqrt(np.mean(frames**2, axis=1))
    peak = float(energy.max())
    if peak <= 0:
        return 0.0
    loud = np.nonzero(energy > peak * 0.02)[0]
    return float(loud[0] * window / rate) if loud.size else 0.0


def alignment_check(path, frames):
    """Onde o som realmente começa e termina no WAV, contra a primeira e a última
    palavra. Se as marcas valem para este WAV, os dois praticamente coincidem;
    um deslocamento constante (padding de mp3, por exemplo) aparece aqui."""
    import numpy as np

    with wave.open(path, "rb") as w:
        rate = w.getframerate()
        samples = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16)

    loud = np.nonzero(np.abs(samples) > 200)[0]
    if loud.size == 0:
        return None
    return loud[0] / rate, frames[0]["s"] / 30, loud[-1] / rate, frames[-1]["e"] / 30


def align(script_norm, asr):
    """Tempos do roteiro alinhados à transcrição.

    Devolve (times, matched): times[i] é (início, fim) em segundos ou None
    quando a palavra não casou, e matched é quantas casaram de fato.
    """
    times = [None] * len(script_norm)
    matched = 0
    asr_norm = [norm(w["text"]) for w in asr]
    ops = difflib.SequenceMatcher(None, script_norm, asr_norm, autojunk=False)
    for tag, i1, i2, j1, j2 in ops.get_opcodes():
        if tag == "equal":
            pairs = zip(range(i1, i2), range(j1, j2))
            counted = True
        elif i2 - i1 == j2 - j1:
            # mesma contagem: casa posição a posição, sem contar como acerto
            pairs = zip(range(i1, i2), range(j1, j2))
            counted = False
        else:
            continue
        for i, j in pairs:
            times[i] = (asr[j]["start"], asr[j]["end"])
            if counted:
                matched += 1
    return times, matched


def align_times(line, script, vo_dir):
    """(início, fim) de cada palavra do roteiro pelo alinhamento por CARÁTER que o
    ElevenLabs devolveu com o áudio (VO_DIR/<id>.align.json) — medido do áudio
    gerado, sem ASR. As palavras casam por posição porque "characters" reproduz o
    texto exato enviado.

    Devolve (None, 0) quando não dá para usar: texto com reticências (os
    caracteres removidos no split não estão no align, e o deslocamento das partes
    concatenadas não é único), arquivo ausente/ilegível, ou texto divergente.
    """
    if re.search(r"\.{3,}|…", line["text"]):
        print("    [align] texto com reticencias: pulando (ver docstring)", flush=True)
        return None, 0
    path = os.path.join(vo_dir, f"{line['id']}.align.json")
    try:
        with open(path, encoding="utf-8") as f:
            data = json.load(f)
    except (OSError, ValueError):
        print(f"    [align] sem {path} legivel: pulando", flush=True)
        return None, 0
    joined = "".join(data["characters"])
    if joined != line["text"]:
        print("    [align] 'characters' difere do roteiro: pulando", flush=True)
        return None, 0
    starts = data["character_start_times_seconds"]
    ends = data["character_end_times_seconds"]
    times, cursor = [], 0
    for word in script:
        while joined[cursor] == " ":
            cursor += 1
        times.append((starts[cursor], ends[cursor + len(word) - 1]))
        cursor += len(word)
    return times, len(script)


def spread(times, weights, i1, i2, t0, t1):
    total = sum(weights[i1:i2]) or 1
    span = max(0.0, t1 - t0)
    cursor = t0
    for i in range(i1, i2):
        step = span * weights[i] / total
        times[i] = (cursor, cursor + step)
        cursor += step


def interpolate(times, weights, audio_end):
    """Preenche as lacunas entre as palavras que casaram, proporcional ao tamanho."""
    known = [i for i, t in enumerate(times) if t is not None]
    if not known:
        spread(times, weights, 0, len(times), 0.0, audio_end)
        return
    first = known[0]
    if first > 0:
        spread(times, weights, 0, first, 0.0, times[first][0])
    for a, b in zip(known, known[1:]):
        if b > a + 1:
            spread(times, weights, a + 1, b, times[a][1], times[b][0])
    last = known[-1]
    if last < len(times) - 1:
        spread(times, weights, last + 1, len(times), times[last][1], audio_end)


def to_frames(times, limit):
    """Converte para frames relativos, em ordem, dentro de [0, limit]."""
    out = []
    previous_end = 0
    for start, end in times:
        s = max(previous_end, int(round(start * FPS)))
        e = max(s + 1, int(round(end * FPS)))
        s = min(s, limit - 1)
        e = min(max(e, s + 1), limit)
        out.append({"s": s, "e": e})
        previous_end = e  # a palavra seguinte nunca começa antes desta terminar
    return out


def save_json(doc, path):
    """Mantém o estilo do gerador: um objeto de fala por linha."""
    blocks = []
    for key, value in doc.items():
        if key == "lines":
            body = ",\n".join(
                f"    {json.dumps(line, ensure_ascii=False)}" for line in value
            )
            blocks.append(f'  "lines": [\n{body}\n  ]')
        else:
            blocks.append(
                f"  {json.dumps(key, ensure_ascii=False)}: "
                f"{json.dumps(value, ensure_ascii=False)}"
            )
    with open(path, "w", encoding="utf-8") as f:
        f.write("{\n" + ",\n".join(blocks) + "\n}\n")


def load_model():
    """O modelo ASR. Sem ele, a fala ainda ganha "frame" — só não ganha "words"."""
    try:
        from faster_whisper import WhisperModel
    except ImportError as exc:
        print(f"AVISO: faster-whisper indisponivel -> {exc}", flush=True)
        print("       'words' e 'wordsMatched' NAO serao gravados.", flush=True)
        return None
    print("carregando whisper small (int8, cpu)...", flush=True)
    return WhisperModel("small", device="cpu", compute_type="int8")


def main():
    paths = [a for a in sys.argv[1:] if not a.startswith("--")]
    json_path = paths[0] if paths else DEFAULT_JSON
    vo_dir = paths[1] if len(paths) > 1 else DEFAULT_VO
    engine = (
        "align" if "--align" in sys.argv
        else "edge" if "--edge" in sys.argv
        else "whisper"
    )

    model = load_model() if engine == "whisper" else None

    with open(json_path, encoding="utf-8") as f:
        doc = json.load(f)
    lines = doc["lines"]

    for index, line in enumerate(lines, 1):
        wav = f"{vo_dir}/{line['id']}.wav"
        script = line["text"].split()
        script_norm = [norm(w) for w in script]
        weights = [max(1, len(n)) for n in script_norm]

        if engine == "align":
            times, matched = align_times(line, script, vo_dir)
            if times is None:
                continue
        elif model is not None:
            times, matched = align(script_norm, transcribe_words(model, wav))
        elif engine == "edge":
            if re.search(r"\.{3,}|…", line["text"]):
                print("    [edge] texto com reticencias: pulando (ver docstring)", flush=True)
                continue
            page = wav_seconds(wav)
            asr, audio = edge_marks(
                line["text"], doc["voice"], doc.get("rate"), doc.get("pitch")
            )
            print(
                f"    [edge] sintetizado {mp3_seconds(audio):.3f}s "
                f"x wav {page:.3f}s | {len(asr)} marcas: "
                + " ".join(m["text"] for m in asr[:6]),
                flush=True,
            )
            times, matched = align(script_norm, asr)
        else:
            continue

        if engine == "edge":
            # o mp3 atrasa o som dentro do WAV; devolve esse atraso às marcas
            shift = audio_onset(wav) - asr[0]["start"] if asr else 0.0
            if 0 < shift < 0.2:
                times = [(t[0] + shift, t[1] + shift) for t in times]
            else:
                shift = 0.0
                print("    [edge] atraso do mp3 fora do esperado, sem correcao", flush=True)
        interpolate(times, weights, wav_seconds(wav))

        limit = line["durationInFrames"]
        frames = to_frames(times, limit)
        if engine == "edge":
            check = alignment_check(wav, frames)
            if check:
                onset, first, end, last = check
                print(
                    f"    [edge] som no wav {onset:.3f}s..{end:.3f}s | "
                    f"palavras {first:.3f}s..{last:.3f}s | "
                    f"deslocamento {onset - first:+.3f}s / {end - last:+.3f}s",
                    flush=True,
                )
        line["words"] = [
            {"w": word, "s": fr["s"], "e": fr["e"]}
            for word, fr in zip(script, frames)
        ]
        line["wordsMatched"] = f"{matched}/{len(script)}"
        # de onde vieram os tempos — o filme não pode confundir os dois motores
        line["wordsEngine"] = {
            "align": "ElevenLabs character alignment (medido do audio gerado)",
            "edge": "edge-tts WordBoundary (sem ASR: faster-whisper ausente)",
        }.get(engine, "faster-whisper small int8")

        save_json(doc, json_path)
        print(
            f"[{index}/{len(lines)}] {line['id']}: {matched}/{len(script)} casadas, "
            f"última palavra ate frame {frames[-1]['e']}",
            flush=True,
        )

    # frames absolutos: encadeia duração + gap de cada fala
    cursor = doc["headFrames"]
    for line in lines:
        line["frame"] = cursor
        cursor += line["durationInFrames"] + line.get("gapAfter", 0)
    save_json(doc, json_path)

    print(f"\n{'id':<16} {'seg':>6} {'frame':>6} {'fim':>6} {'gap':>4} {'casadas':>8}")
    print("-" * 52)
    for line in lines:
        seconds = line["durationInFrames"] / FPS
        end = line["frame"] + line["durationInFrames"]
        print(
            f"{line['id']:<16} {seconds:6.2f} {line['frame']:6d} {end:6d} "
            f"{line.get('gapAfter', 0):4d} {line.get('wordsMatched', '-'):>8}"
        )

    overlaps = []
    for a, b in zip(lines, lines[1:]):
        if a["frame"] + a["durationInFrames"] > b["frame"]:
            overlaps.append(f"{a['id']} x {b['id']}")
    print(f"\nsobreposicao: {'nenhuma' if not overlaps else ', '.join(overlaps)}")

    spoken = sum(l["durationInFrames"] for l in lines) / FPS
    last_line_end = lines[-1]["frame"] + lines[-1]["durationInFrames"]
    print(f"falado: {spoken:.2f}s em {len(lines)} falas")
    if "words" in lines[-1]:
        print(f"ultima palavra falada: frame {lines[-1]['frame'] + lines[-1]['words'][-1]['e']}")
    else:
        print("ultima palavra falada: indisponivel (sem 'words')")
    print(
        f"fim da ultima fala: frame {last_line_end} | filme estimado: "
        f"frame {last_line_end + doc['tailFrames']} "
        f"({(last_line_end + doc['tailFrames']) / FPS:.2f}s)"
    )


if __name__ == "__main__":
    main()
