#!/usr/bin/env python3
"""Curva de energia RMS (dB) de uma faixa musical candidata.

Decodifica o MP3 com ffmpeg (subprocess, sem shell) para mono 22050 Hz e mede
o RMS em janelas de 0,5 s. Imprime a curva e ranqueia os trechos de 59,1 s cuja
energia melhor descreve o arco do filme (contida -> subida -> pico no fecho).

Uso: python3 tools/music-energy.py [entrada.mp3] [saida.json]
"""
import json
import subprocess
import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
SRC = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "out/musica-candidatas/Odyssey.mp3"
OUT = Path(sys.argv[2]) if len(sys.argv) > 2 else ROOT / "out/musica-candidatas/odyssey-energia.json"

SR = 22050
WIN_S = 0.5
BED_S = 59.1          # duração da cama pedida pelo filme
RISE_AT = 39.0        # nasce o Mickey -> a música já deve estar subindo
PEAK_AT = 54.0        # fecho -> ponto mais forte


def decode(path: Path) -> np.ndarray:
    """MP3 -> float32 mono 22050 Hz, via stdout do ffmpeg."""
    cmd = [
        "ffmpeg", "-v", "error", "-nostdin",
        "-i", str(path),
        "-ac", "1", "-ar", str(SR),
        "-f", "f32le", "-",
    ]
    raw = subprocess.run(cmd, check=True, capture_output=True).stdout
    return np.frombuffer(raw, dtype=np.float32)


def curve(x: np.ndarray) -> np.ndarray:
    """RMS em dB por janela fixa de WIN_S."""
    n = int(SR * WIN_S)
    frames = x[: len(x) // n * n].reshape(-1, n)
    rms = np.sqrt(np.mean(frames.astype(np.float64) ** 2, axis=1) + 1e-12)
    return 20.0 * np.log10(rms + 1e-9)


def template(n: int) -> np.ndarray:
    """Arco alvo: 0 (contida) -> 1 (pico), subindo entre 20 s e 50 s."""
    t = np.arange(n) * WIN_S
    return np.clip((t - 20.0) / 30.0, 0.0, 1.0)


def main() -> None:
    x = decode(SRC)
    db = curve(x)
    total = len(db) * WIN_S

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({
        "source": SRC.name,
        "sampleRate": SR,
        "windowSeconds": WIN_S,
        "durationSeconds": round(total, 3),
        "db": [round(float(v), 2) for v in db],
    }, indent=1))

    print(f"faixa: {SRC.name}  {total:.2f} s  {len(db)} janelas de {WIN_S} s")
    print(f"global: media {db.mean():.1f} dB   min {db.min():.1f}   max {db.max():.1f}")

    print("\ncurva (media por bloco de 5 s):")
    blk = 10
    for i in range(0, len(db) - blk + 1, blk):
        chunk = db[i:i + blk]
        bar = "#" * int(max(0.0, chunk.mean() + 45.0))
        print(f"  {i * WIN_S:6.1f} s  {chunk.mean():6.1f} dB  {bar}")

    # A textura da faixa e pulsada: picos separados por vales de -45 dB fazem a
    # media crua de 0,5 s medir o espaco entre notas, nao o volume percebido.
    # A envelope de 2 s e o que o ouvido segue.
    k = 4
    env = np.convolve(db, np.ones(k) / k, mode="same")
    print("\nenvelope (media movel de 2 s), 175-285 s:")
    for i in range(350, 570, 2):
        bar = "#" * int(max(0.0, env[i] + 45.0))
        print(f"  {i * WIN_S:6.1f} s  {env[i]:6.1f} dB  {bar}")

    # Ranqueia deslocamentos onde caiba a cama inteira.
    n = int(BED_S / WIN_S)
    tpl = template(n)
    tpl = (tpl - tpl.mean()) / tpl.std()
    rows = []
    for off in range(0, int((total - BED_S)) + 1, 2):
        i = int(off / WIN_S)
        seg = env[i:i + n]
        if len(seg) < n:
            break
        s = (seg - seg.mean()) / (seg.std() + 1e-9)
        score = float(np.mean(s * tpl))
        a0 = float(env[i:i + 16].mean())                       # 0-8 s
        a1 = float(env[i + 74:i + 82].mean())                  # 37-41 s
        a2 = float(env[i + 108:i + n].mean())                  # 54-59 s
        pk = float(env[i:i + n].max())                         # pico da cama
        pkt = float(np.argmax(env[i:i + n]) * WIN_S)           # quando ele cai
        rows.append((score, off, a0, a1, a2, pk, pkt))

    rows.sort(reverse=True)
    print("\nmelhores trechos de 59,1 s (score = correlacao com o arco alvo):")
    print("  score   off  inicio  37-41s  54-59s   pico  pico_em  sub1  sub2")
    for score, off, a0, a1, a2, pk, pkt in rows[:15]:
        print(f"  {score:5.2f}  {off:4d}s  {a0:6.1f}  {a1:6.1f}  {a2:6.1f}"
              f"  {pk:6.1f}  {pkt:6.1f}s  {a1 - a0:+5.1f}  {a2 - a1:+5.1f}")

    # Detalhe dos melhores, em passos de 1 s, para escolher sem chutar.
    print("\ndetalhe dos 3 melhores (1 s):")
    for score, off, *_ in rows[:3]:
        i = int(off / WIN_S)
        print(f"  off {off} s (score {score:.2f}):")
        for j in range(0, n, 2):
            bar = "#" * int(max(0.0, env[i + j] + 45.0))
            print(f"    +{j * WIN_S:4.1f} s  {env[i + j]:6.1f} dB  {bar}")

    print(f"\njson: {OUT}")


if __name__ == "__main__":
    main()
