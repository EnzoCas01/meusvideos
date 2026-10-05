#!/usr/bin/env python3
"""Escolhe o trecho da cama musical de "Microsoft" dentro de uma faixa candidata.

Mesmo metodo do Disney v2 (tools/music-energy.py) e do Anthropic
(tools/music-escolha-at.py): decodifica para mono 22050 Hz, mede o RMS em
janelas de 0,5 s, suaviza com um envelope de 2 s (a media crua de 0,5 s mede o
espaco entre notas, nao o volume percebido) e correlaciona cada deslocamento
possivel da cama com o arco que o filme pede: contida na abertura, subindo da
virada (cena 4, "Mas cinco anos depois aconteceu algo gigantesco", 25,2 s) ao
pico (cena 5, US$ 17,3 milhoes, 36,7-44,4 s) e assentando no fecho.

Os comprimentos e instantes vem do proprio filme: END_MS/30 = 59,2 s de cama,
virada em SCENE_STARTS_MS[3]/30, pico na cena 5. Mudou a narracao, mudam estes
numeros.

Uso: python3 tools/music-escolha-ms.py <entrada.mp3> [saida.json]
"""
import json
import subprocess
import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
SRC = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "out/musica-candidatas/Limit 70.mp3"
OUT = Path(sys.argv[2]) if len(sys.argv) > 2 else ROOT / "out/musica-candidatas" / (SRC.stem.lower().replace(" ", "-") + "-energia.json")

SR = 22050
WIN_S = 0.5
BED_S = 59.17         # END_MS / 30
RISE_AT = 25.17       # SCENE_STARTS_MS[3] / 30 — a virada (IBM procura a Microsoft)
PEAK_AT = 36.70       # SCENE_STARTS_MS[4] / 30 — US$ 17,3 milhoes
PEAK_END = 44.40      # fim da cena 5
FLOOR = -70.0

# trechos de referencia do arco, em segundos dentro da cama
STARTS = (0.0, 20.0)          # abertura contida
RISE = (28.0, 36.0)           # subida em curso (a virada ja passou)
PEAK = (PEAK_AT, PEAK_END)    # ponto mais alto do filme
SETTLE = (48.0, 57.0)         # o fecho, depois da ultima palavra


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
    """Arco alvo: 0 ate a virada, subindo ate 1 no pico, mantendo ate o fim da
    cena 5 e assentando no fecho (nunca a zero — a trilha nao pode ter buraco)."""
    t = np.arange(n) * WIN_S
    rise = np.clip((t - RISE_AT) / (PEAK_AT - RISE_AT), 0.0, 1.0)
    settle = np.clip((t - PEAK_END) / max(1e-6, BED_S - PEAK_END), 0.0, 1.0)
    return rise * (1.0 - 0.45 * settle)


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
        a3 = window(env, off, *SETTLE)
        pk = float(seg.max())
        pkt = float(np.argmax(seg) * WIN_S)
        rows.append((score, off, a0, a1, a2, a3, pk, pkt))

    rows.sort(reverse=True)
    print(f"\nmelhores trechos de {BED_S:.1f} s (score = correlacao com o arco alvo):")
    print("  score   off   0-20s  28-36s  37-44s  48-57s   pico  pico_em  sub  desce")
    for score, off, a0, a1, a2, a3, pk, pkt in rows[:10]:
        print(f"  {score:5.2f}  {off:4d}s  {a0:6.1f}  {a1:6.1f}  {a2:6.1f}  {a3:6.1f}"
              f"  {pk:6.1f}  {pkt:6.1f}s  {a1 - a0:+5.1f}  {a3 - a2:+5.1f}")

    best = rows[0][1]
    i = int(best / WIN_S)
    print(f"\ndetalhe do melhor (off {best} s, passos de 2 s):")
    for j in range(0, n, 4):
        mark = ""
        if abs(j * WIN_S - RISE_AT) < 2:
            mark = "  <- virada"
        elif abs(j * WIN_S - PEAK_AT) < 2:
            mark = "  <- pico (US$ 17,3 milhoes)"
        elif abs(j * WIN_S - PEAK_END) < 2:
            mark = "  <- fim do pico"
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
