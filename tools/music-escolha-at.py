#!/usr/bin/env python3
"""Escolhe o trecho da cama musical de "Anthropic" dentro de uma faixa candidata.

Mesmo metodo do Disney v2 (tools/music-energy.py): decodifica para mono 22050 Hz,
mede o RMS em janelas de 0,5 s, suaviza com um envelope de 2 s (a media crua de
0,5 s mede o espaco entre notas, nao o volume percebido) e correlaciona cada
deslocamento possivel da cama com o arco que o filme pede: contida na abertura,
subindo a partir da virada (fala 05-nova, "A Anthropic", ~22,5 s) e no ponto mais
alto do filme no pico (cena 6, US$ 380 bilhoes, ~52-57 s).

Os comprimentos e instantes vem do proprio filme: END_AT/30 = 71,2 s de cama,
virada em 675/30, pico em 1551-1700/30. Mudou a narracao, mudam estes numeros.

Uso: python3 tools/music-escolha-at.py <entrada.mp3> [saida.json]
"""
import json
import subprocess
import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
SRC = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "out/musica-candidatas/Numinous Shine.mp3"
OUT = Path(sys.argv[2]) if len(sys.argv) > 2 else ROOT / "out/musica-candidatas" / (SRC.stem.lower().replace(" ", "-") + "-energia.json")

SR = 22050
WIN_S = 0.5
BED_S = 71.2          # END_AT / 30
RISE_AT = 22.5        # 675 / 30 — "A Anthropic."
PEAK_AT = 52.0        # 1560 / 30 — US$ 380 bilhoes
PEAK_END = 56.7       # 1700 / 30 — fim da cena 6
FLOOR = -70.0

# trechos de referencia do arco, em segundos dentro da cama
STARTS = (0.0, 20.0)          # abertura contida
RISE = (28.0, 40.0)           # subida em curso (a virada ja passou)
PEAK = (PEAK_AT, PEAK_END)    # ponto mais alto do filme


def decode(path: Path) -> np.ndarray:
    """MP3 -> float32 mono 22050 Hz, via stdout do ffmpeg (um thread)."""
    cmd = [
        "ffmpeg", "-v", "error", "-nostdin", "-threads", "1",
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
    """Arco alvo: 0 ate a virada, subindo ate 1 no pico, mantendo ate o fim."""
    t = np.arange(n) * WIN_S
    return np.clip((t - RISE_AT) / (PEAK_AT - RISE_AT), 0.0, 1.0)


def window(env: np.ndarray, off: int, a: float, b: float) -> float:
    i = int(round((off + a) / WIN_S))
    j = max(i + 1, int(round((off + b) / WIN_S)))
    return float(env[i:j].mean())


def main() -> None:
    x = decode(SRC)
    db = curve(x)
    total = len(db) * WIN_S
    env = np.convolve(db, np.ones(4) / 4, mode="same")

    print(f"faixa: {SRC.name}  {total:.1f} s  janelas de {WIN_S} s  pico global {db.max():.1f} dB")
    print("\ncurva (media por bloco de 5 s):")
    for i in range(0, len(db) - 9, 10):
        bar = "#" * int(max(0.0, db[i:i + 10].mean() + FLOOR + 15.0))
        print(f"  {i * WIN_S:6.1f} s  {db[i:i + 10].mean():6.1f} dB  {bar}")

    n = int(BED_S / WIN_S)
    tpl = template(n)
    tpl = (tpl - tpl.mean()) / tpl.std()
    rows = []
    for off in range(0, int(total - BED_S) + 1, 2):
        i = int(off / WIN_S)
        seg = env[i:i + n]
        if len(seg) < n:
            break
        s = (seg - seg.mean()) / (seg.std() + 1e-9)
        score = float(np.mean(s * tpl))
        a0 = window(env, off, *STARTS)
        a1 = window(env, off, *RISE)
        a2 = window(env, off, *PEAK)
        pk = float(seg.max())
        pkt = float(np.argmax(seg) * WIN_S)
        rows.append((score, off, a0, a1, a2, pk, pkt))

    rows.sort(reverse=True)
    print(f"\nmelhores trechos de {BED_S:.1f} s (score = correlacao com o arco alvo):")
    print("  score   off   0-20s  28-40s  52-57s   pico  pico_em  sub1  sub2")
    for score, off, a0, a1, a2, pk, pkt in rows[:12]:
        print(f"  {score:5.2f}  {off:4d}s  {a0:6.1f}  {a1:6.1f}  {a2:6.1f}"
              f"  {pk:6.1f}  {pkt:6.1f}s  {a1 - a0:+5.1f}  {a2 - a1:+5.1f}")

    print("\ndetalhe dos 3 melhores (passos de 2 s):")
    for score, off, *_ in rows[:3]:
        i = int(off / WIN_S)
        print(f"  off {off} s (score {score:.2f}, pico {env[i:i + n].max():.1f} dB):")
        for j in range(0, n, 4):
            mark = "  <- virada" if abs(j * WIN_S - RISE_AT) < 2 else ("  <- pico" if abs(j * WIN_S - PEAK_AT) < 2 else "")
            bar = "#" * int(max(0.0, env[i + j] + FLOOR + 15.0))
            print(f"    +{j * WIN_S:5.1f} s  {env[i + j]:6.1f} dB  {bar}{mark}")

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({
        "source": SRC.name,
        "sampleRate": SR,
        "windowSeconds": WIN_S,
        "durationSeconds": round(total, 3),
        "db": [round(float(v), 2) for v in db],
    }, indent=1))
    print(f"\njson: {OUT}")


if __name__ == "__main__":
    main()
