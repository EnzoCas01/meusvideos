#!/usr/bin/env python3
"""Gera a narração de um vídeo com edge-tts.

  python3 tools/generate-narration-edge.py src/narration-ifood.json public/audio/vo-ifood
  NARRATION_JSON=src/narration-ifood.json VO_DIR=public/audio/vo-ifood \
    python3 tools/generate-narration-edge.py          # retomável (via env)
  FORCE=1 ...                                         # refaz tudo

Para cada item de "lines": sintetiza "text" com voice/rate/pitch do JSON, troca
cada "..." por ellipsisPauseMs de silêncio (as reticências viram pausa, não são
lidas), converte para WAV mono 24000 Hz em VO_DIR/<id>.wav e grava na própria
linha durationInFrames = ceil(segundos*30). O campo "frame" não é tocado.

Por padrão usa a voz GRÁTIS do JSON (edge-tts, pt-BR-AntonioNeural) — escolha do Enzo em 23/09/2026.
Só com ELEVEN=1 tenta a voz George (ElevenLabs, chave em /root/secrets/elevenlabs.env)
se a cota restante cobrir o vídeo INTEIRO; se não cobrir, ou se falhar no meio, o
vídeo todo é refeito com a voz do JSON (edge-tts). Nunca mistura as duas vozes.

Com George, cada fala vem do endpoint /with-timestamps (mesmo custo em
caracteres) e o alinhamento por caractere do áudio gerado fica em
VO_DIR/<id>.align.json — é o que o `tools/word-timings.py --align` lê para
gravar "words" sem estimar nada. Com edge-tts não há esse arquivo.

Retomável: WAV que já existe é medido, não regerado. O JSON é salvo a cada fala.
"""
import asyncio
import base64
import json
import math
import os
import re
import subprocess
import sys
import tempfile
import urllib.request
import wave

FPS = 30
RATE_HZ = 24000
ELLIPSIS = re.compile(r"\.{3,}|…")


def need_env(name):
    value = os.environ.get(name)
    if not value:
        sys.exit(f"defina {name}")
    return value


def synth(text, voice, rate, pitch, out_mp3):
    """Sintetiza um trecho. edge-tts é rede: 3 tentativas antes de desistir."""
    import edge_tts

    last = None
    for attempt in range(1, 4):
        try:
            communicate = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch)
            asyncio.run(communicate.save(out_mp3))
            return
        except Exception as exc:  # rede/instabilidade do serviço
            last = exc
            print(f"    tentativa {attempt} falhou: {exc}", flush=True)
    raise last


ELEVEN_VOICE = os.environ.get("ELEVEN_VOICE_ID", "bIHbv24MWmeRgasZH58o")  # Will
ELEVEN_ENV = os.environ.get("ELEVEN_ENV", "/root/secrets/elevenlabs.env")


class ElevenError(Exception):
    pass


def eleven_key():
    try:
        with open(ELEVEN_ENV, encoding="utf-8") as f:
            for row in f:
                if row.startswith("ELEVENLABS_API_KEY="):
                    return row.split("=", 1)[1].strip()
    except OSError:
        pass
    return None


def eleven_call(path, key, body=None):
    req = urllib.request.Request(
        "https://api.elevenlabs.io/v1" + path,
        data=json.dumps(body).encode() if body else None,
        headers={"xi-api-key": key, "Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            return r.read()
    except Exception as exc:
        raise ElevenError(str(exc)) from None


def eleven_remaining(key):
    sub = json.loads(eleven_call("/user/subscription", key))
    return sub["character_limit"] - sub["character_count"]


def synth_eleven(text, key, out_mp3):
    """Baixa o áudio JÁ com o tempo de cada caractere (endpoint /with-timestamps):

    é o timing medido do áudio que o George realmente falou, sem ASR. Devolve o
    alinhamento, que o chamador grava em <id>.align.json para o
    `word-timings.py --align` usar. Custa os mesmos caracteres da síntese simples.

    A síntese é rede: 3 tentativas antes de desistir (como no edge-tts).
    """
    body = {
        "text": text, "model_id": "eleven_multilingual_v2", "language_code": "pt",
    }
    last = None
    for attempt in range(1, 4):
        try:
            raw = eleven_call(
                f"/text-to-speech/{ELEVEN_VOICE}/with-timestamps"
                "?output_format=mp3_44100_96",
                key, body,
            )
            data = json.loads(raw)
            with open(out_mp3, "wb") as f:
                f.write(base64.b64decode(data["audio_base64"]))
            return data["alignment"]
        except ElevenError as exc:
            last = exc
            print(f"    tentativa {attempt} falhou: {exc}", flush=True)
        except (KeyError, ValueError) as exc:
            raise ElevenError(f"resposta sem alinhamento: {exc}") from None
    raise last


def merge_aligns(aligns, offsets):
    """Alinhamentos de vários trechos concatenados, com o tempo já deslocado."""
    merged = {
        "characters": [],
        "character_start_times_seconds": [],
        "character_end_times_seconds": [],
    }
    for align, offset in zip(aligns, offsets):
        merged["characters"] += align["characters"]
        merged["character_start_times_seconds"] += [
            t + offset for t in align["character_start_times_seconds"]
        ]
        merged["character_end_times_seconds"] += [
            t + offset for t in align["character_end_times_seconds"]
        ]
    return merged


# Corta o silêncio do começo e do fim de cada trecho e encurta toda pausa interna longa (ponto final do
# edge-tts dá ~0,6 s) para ~0,25 s: a fala emenda sem "fala... volta a falar" (pedido do Enzo, 23/09/2026).
PAUSAS = ("silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.05,areverse,"
          "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.06,areverse,"
          "silenceremove=stop_periods=-1:stop_duration=0.18:stop_threshold=-45dB:stop_silence=0.1")


def to_wav(src, dst):
    subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error", "-i", src, "-af", PAUSAS,
         "-ac", "1", "-ar", str(RATE_HZ), "-c:a", "pcm_s16le", dst],
        check=True,
    )


def write_silence(path, ms):
    with wave.open(path, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(RATE_HZ)
        w.writeframes(b"\x00\x00" * int(RATE_HZ * ms / 1000))


def concat_wavs(parts, dst):
    """Junta WAVs mono 16-bit na taxa RATE_HZ (todos vêm do mesmo to_wav)."""
    with wave.open(dst, "wb") as out:
        out.setnchannels(1)
        out.setsampwidth(2)
        out.setframerate(RATE_HZ)
        for part in parts:
            with wave.open(part, "rb") as src:
                out.writeframes(src.readframes(src.getnframes()))


def wav_seconds(path):
    with wave.open(path, "rb") as w:
        return w.getnframes() / w.getframerate()


def save_json(doc, path):
    """Mantém o estilo do arquivo: um objeto por linha dentro de "lines"."""
    blocks = []
    for key, value in doc.items():
        if key == "lines":
            body = ",\n".join(
                f"    {json.dumps(line, ensure_ascii=False)}" for line in value
            )
            blocks.append(f'  "lines": [\n{body}\n  ]')
        else:
            blocks.append(f"  {json.dumps(key, ensure_ascii=False)}: {json.dumps(value, ensure_ascii=False)}")
    with open(path, "w", encoding="utf-8") as f:
        f.write("{\n" + ",\n".join(blocks) + "\n}\n")


def main():
    json_path = sys.argv[1] if len(sys.argv) > 1 else need_env("NARRATION_JSON")
    vo_dir = sys.argv[2] if len(sys.argv) > 2 else need_env("VO_DIR")
    force = os.environ.get("FORCE") == "1"

    with open(json_path, encoding="utf-8") as f:
        doc = json.load(f)

    voice = doc["voice"]
    # Velocidade fixa no código (+10% com as pausas cortadas ≈ 18 caracteres/s): nem rápido demais nem lenta.
    # Não acelere depois com atempo. Só muda com VOZ_RATE, por pedido do Enzo.
    rate = os.environ.get("VOZ_RATE", "+10%")
    doc["rate"] = rate
    pitch = doc.get("pitch", "+0Hz")
    pause_ms = int(doc.get("ellipsisPauseMs", 0))
    lines = doc["lines"]
    os.makedirs(vo_dir, exist_ok=True)

    print(f"{len(lines)} falas | voz {voice} | rate {rate} | pitch {pitch} | pausa {pause_ms}ms", flush=True)

    key = None
    if os.environ.get("ELEVEN", "0") == "1":
        key = eleven_key()
        pending = [
            len(seg)
            for ln in lines
            if force or not os.path.exists(os.path.join(vo_dir, f"{ln['id']}.wav"))
            for seg in ELLIPSIS.split(ln["text"]) if seg.strip()
        ]
        need = sum(pending)
        try:
            left = eleven_remaining(key) if key else 0
        except ElevenError as exc:
            print(f"ElevenLabs indisponível ({exc})", flush=True)
            left = 0
        if key and left >= need:
            print(f"ElevenLabs George: precisa {need} de {left} caracteres restantes", flush=True)
        else:
            print(f"ElevenLabs George descartado (precisa {need}, restam {left}): usando {voice}", flush=True)
            key = None

    created = []
    while True:
        rows = []
        try:
            rows = render(lines, vo_dir, force, key, voice, rate, pitch, pause_ms, doc, json_path, created)
            break
        except ElevenError as exc:
            print(f"ElevenLabs falhou no meio ({exc}); refazendo TUDO com {voice}", flush=True)
            for path in created:
                os.remove(path)
                align = f"{path[:-4]}.align.json"
                if os.path.exists(align):
                    os.remove(align)
            created.clear()
            key = None
    report(rows)


def render(lines, vo_dir, force, key, voice, rate, pitch, pause_ms, doc, json_path, created):
    rows = []
    for index, line in enumerate(lines, 1):
        line_id, text = line["id"], line["text"]
        wav_path = os.path.join(vo_dir, f"{line_id}.wav")

        if os.path.exists(wav_path) and not force:
            print(f"[{index}/{len(lines)}] {line_id}: já existe, medindo", flush=True)
        else:
            segments = [s.strip() for s in ELLIPSIS.split(text) if s.strip()]
            print(f"[{index}/{len(lines)}] {line_id}: {len(segments)} trecho(s)", flush=True)
            with tempfile.TemporaryDirectory() as tmp:
                parts, aligns, offsets, cursor = [], [], [], 0.0
                for position, segment in enumerate(segments):
                    mp3 = os.path.join(tmp, f"{position}.mp3")
                    wav = os.path.join(tmp, f"{position}.wav")
                    offsets.append(cursor)
                    if key:
                        aligns.append(synth_eleven(segment, key, mp3))
                    else:
                        synth(segment, voice, rate, pitch, mp3)
                    to_wav(mp3, wav)
                    parts.append(wav)
                    cursor += wav_seconds(wav)
                    if position < len(segments) - 1 and pause_ms > 0:
                        gap = os.path.join(tmp, f"gap{position}.wav")
                        write_silence(gap, pause_ms)
                        parts.append(gap)
                        cursor += pause_ms / 1000
                concat_wavs(parts, wav_path)
                created.append(wav_path)
                align_path = os.path.join(vo_dir, f"{line_id}.align.json")
                if aligns:
                    with open(align_path, "w", encoding="utf-8") as f:
                        json.dump(merge_aligns(aligns, offsets), f, ensure_ascii=False)
                elif os.path.exists(align_path):
                    # veio de uma rodada anterior com George: o WAV agora é edge
                    os.remove(align_path)

        seconds = wav_seconds(wav_path)
        line["durationInFrames"] = math.ceil(seconds * FPS)
        save_json(doc, json_path)
        rows.append((line_id, seconds, line["durationInFrames"]))
        print(f"    {seconds:.2f}s -> {line['durationInFrames']} frames", flush=True)

    return rows


def report(rows):
    total_seconds = sum(r[1] for r in rows)
    total_frames = sum(r[2] for r in rows)

    width = max(len(r[0]) for r in rows)
    print(f"\n{'id'.ljust(width)} | {'segundos'.rjust(9)} | {'frames'.rjust(6)}")
    print(f"{'-' * width}-+-{'-' * 9}-+-{'-' * 6}")
    for line_id, seconds, frames in rows:
        print(f"{line_id.ljust(width)} | {seconds:9.2f} | {frames:6d}")
    print(f"{'-' * width}-+-{'-' * 9}-+-{'-' * 6}")
    print(f"{'TOTAL'.ljust(width)} | {total_seconds:9.2f} | {total_frames:6d}")


if __name__ == "__main__":
    main()
