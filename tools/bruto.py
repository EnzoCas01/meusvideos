#!/usr/bin/env python3
"""Prepara um vídeo bruto (gravado pelo Enzo) para edição no Remotion.

Uso: .venv-whisper/bin/python tools/bruto.py <video> <sx> [--pausa=0.45] [--margem=0.12] [--sem-cortes]

Gera, sem modelo de IA decidindo nada:
  public/bruto/<sx>/fonte.mp4   vídeo padronizado (H.264, 30 fps, AAC)
  src/narration-<sx>.json       falas com tempo por palavra JÁ no tempo do vídeo cortado
                                (mesmo formato das narrações: a legenda CaptionsStyled usa direto)
                                + "cortes": trechos mantidos do original + "totalFrames"
Cortes = remove as pausas maiores que --pausa segundos (jump cut). A voz é o áudio original.
"""
import json
import subprocess
import sys
from pathlib import Path

FPS = 30
RAIZ = Path(__file__).resolve().parent.parent


def args():
    pos = [a for a in sys.argv[1:] if not a.startswith("--")]
    opt = dict(a[2:].split("=", 1) if "=" in a else (a[2:], "1") for a in sys.argv[1:] if a.startswith("--"))
    if len(pos) != 2:
        sys.exit(__doc__)
    return Path(pos[0]).resolve(), pos[1], float(opt.get("pausa", 0.45)), float(opt.get("margem", 0.12)), "sem-cortes" in opt


def run(*cmd):
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)


def main():
    video, sx, pausa, margem, sem_cortes = args()
    if not video.exists():
        sys.exit(f"vídeo não encontrado: {video}")
    pasta = RAIZ / "public" / "bruto" / sx
    pasta.mkdir(parents=True, exist_ok=True)
    fonte, wav = pasta / "fonte.mp4", pasta / "voz16k.wav"

    print(f"1/3 padronizando {video.name} → {fonte.relative_to(RAIZ)}", flush=True)
    run("ffmpeg", "-y", "-v", "error", "-i", str(video), "-vf", f"fps={FPS}", "-c:v", "libx264", "-preset", "veryfast",
        "-crf", "20", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "160k", "-ar", "48000", "-movflags", "+faststart", str(fonte))
    run("ffmpeg", "-y", "-v", "error", "-i", str(fonte), "-ac", "1", "-ar", "16000", str(wav))
    dur = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(fonte)]))
    w, h = subprocess.check_output(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height",
                                    "-of", "csv=p=0", str(fonte)]).decode().strip().split(",")

    print(f"2/3 transcrevendo {dur:.0f}s de áudio (Whisper small, CPU)", flush=True)
    from faster_whisper import WhisperModel
    modelo = WhisperModel("small", device="cpu", compute_type="int8", cpu_threads=2)
    segs, _ = modelo.transcribe(str(wav), language="pt", vad_filter=True, word_timestamps=True)
    frases = [[(x.word.strip(), x.start, x.end) for x in s.words if x.word.strip()] for s in segs]
    frases = [f for f in frases if f]
    wav.unlink()
    palavras = [p for f in frases for p in f]
    if not palavras:
        sys.exit("nenhuma fala detectada no vídeo")

    # trechos mantidos: junta palavras separadas por menos que `pausa`; cada trecho ganha `margem` nas bordas
    if sem_cortes:
        trechos = [[0.0, dur]]
    else:
        trechos = []
        for _, ini, fim in palavras:
            if trechos and ini - trechos[-1][1] < pausa:
                trechos[-1][1] = fim
            else:
                trechos.append([ini, fim])
        trechos = [[max(0.0, a - margem), min(dur, b + margem)] for a, b in trechos]
        juntos = []
        for a, b in trechos:
            if juntos and a <= juntos[-1][1]:
                juntos[-1][1] = b
            else:
                juntos.append([a, b])
        trechos = juntos

    cortes, saida = [], 0
    for a, b in trechos:
        de, ate = round(a * FPS), round(b * FPS)
        if ate > de:
            cortes.append({"de": de, "ate": ate, "frame": saida, "durationInFrames": ate - de})
            saida += ate - de

    def no_corte(t):
        f = t * FPS
        for c in cortes:
            if c["de"] <= f <= c["ate"]:
                return c["frame"] + (f - c["de"])
        return None

    lines = []
    for i, frase in enumerate(frases, 1):
        ws = [(p, no_corte(a), no_corte(b)) for p, a, b in frase]
        ws = [(p, a, b) for p, a, b in ws if a is not None and b is not None]
        if not ws:
            continue
        ini = round(ws[0][1])
        lines.append({
            "id": f"{i:02d}", "frame": ini, "text": " ".join(p for p, _, _ in ws),
            "durationInFrames": max(1, round(ws[-1][2]) - ini),
            "words": [{"w": p, "s": round(a) - ini, "e": max(round(b) - ini, round(a) - ini + 1)} for p, a, b in ws],
        })

    out = {
        "engine": "bruto", "fonte": f"bruto/{sx}/fonte.mp4", "original": str(video), "fps": FPS,
        "largura": int(w), "altura": int(h), "duracaoOriginalFrames": round(dur * FPS),
        "totalFrames": saida, "pausaCortada": None if sem_cortes else pausa, "cortes": cortes, "lines": lines,
    }
    alvo = RAIZ / "src" / f"narration-{sx}.json"
    alvo.write_text(json.dumps(out, ensure_ascii=False, indent=1))
    print(f"3/3 pronto: {alvo.relative_to(RAIZ)} · {len(cortes)} trechos · {dur:.1f}s → {saida / FPS:.1f}s · "
          f"{len(lines)} falas · {len(palavras)} palavras · vídeo {w}x{h}", flush=True)


if __name__ == "__main__":
    main()
