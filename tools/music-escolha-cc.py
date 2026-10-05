#!/usr/bin/env python3
"""Escolhe o trecho da cama musical de "Coca-Cola" dentro de uma faixa candidata.

Mesmo metodo do Disney v2 (tools/music-energy.py), do Anthropic
(tools/music-escolha-at.py) e do Microsoft (tools/music-escolha-ms.py):
decodifica para mono 22050 Hz, mede o RMS em janelas de 0,5 s, suaviza com um
envelope de 2 s (a media crua de 0,5 s mede o espaco entre notas, nao o volume
percebido) e correlaciona cada deslocamento possivel da cama com o arco que o
filme pede: contida no gancho e no comeco da historia, subindo da virada
(SCENE_STARTS_CC[3], o Candler, 28,7 s) ao pico (SCENE_STARTS_CC[5], a
revelacao dos dois bilhoes por dia, 48,8 s) e assentando no fecho.

Os comprimentos e instantes vem do proprio filme: 1920 frames / 30 = 64,0 s de
cama, virada em SCENE_STARTS_CC[3]/30, pico em SCENE_STARTS_CC[5]/30. Mudou a
narracao, mudam estes numeros.

Uso: python3 tools/music-escolha-cc.py <entrada.mp3> [saida.json] [offset-s]

O terceiro argumento forca o offset do detalhe (para conferir um trecho que a
tabela nao escolheu). A coluna `min` mostra o ponto mais baixo da janela: um
minimo muito abaixo da vizinhanca e um BURACO na cama, nao um trecho contido, e
desclassifica o offset — a trilha nao pode cair a zero em nenhum ponto.
"""
import json
import subprocess
import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
SRC = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "out/musica-candidatas/Odyssey.mp3"
OUT = Path(sys.argv[2]) if len(sys.argv) > 2 else ROOT / "out/musica-candidatas" / (SRC.stem.lower().replace(" ", "-") + "-cc-energia.json")

SR = 22050
WIN_S = 0.5
BED_S = 64.0          # 1920 frames / 30 (END_CC)
RISE_AT = 28.70       # SCENE_STARTS_CC[3] / 30 — a virada (Candler assume a formula)
PEAK_AT = 48.83       # SCENE_STARTS_CC[5] / 30 — a revelacao da escala atual
PEAK_END = 58.37      # SCENE_STARTS_CC[6] / 30 — comeco do fecho
FLOOR = -70.0
HOLE_DB = 20.0        # queda abaixo da mediana que ja e buraco, nao contencao

# trechos de referencia do arco, em segundos dentro da cama
STARTS = (0.0, 20.0)          # abertura contida
RISE = (32.0, 40.0)           # subida em curso (a virada ja passou)
PEAK = (PEAK_AT, PEAK_END)    # ponto mais alto do filme
SETTLE = (60.0, 63.5)         # o fecho, depois da ultima palavra


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


def drop_db(seg: np.ndarray) -> float:
    """Quanto o ponto mais baixo da janela cai abaixo da mediana dela.

    Uma secao contida tem as notas baixas, nao o silencio: queda de 20 dB para
    baixo e um BURACO (pausa na faixa), nao um trecho quieto. E relativo de
    proposito — um master baixo desloca a janela inteira e nao pode virar
    buraco so por estar baixo.
    """
    return float(np.median(seg) - seg.min())


def timbre(seg: np.ndarray) -> tuple:
    """(brilho, ataques por segundo) do trecho.

    Brilho = fracao da energia acima de 4 kHz (sino, glockenspiel e prato vivem
    ali; cordas e pads, nao). Ataques = quadros de 20 ms que sobem 6 dB acima da
    media dos 200 ms anteriores, por segundo — le como pulso/bateria.
    """
    n = 4096
    hann = np.hanning(n)
    freqs = np.fft.rfftfreq(n, 1 / SR)
    acc = np.zeros(len(freqs))
    k = 0
    for i in range(0, len(seg) - n, n):
        acc += np.abs(np.fft.rfft(seg[i:i + n] * hann)) ** 2
        k += 1
    acc /= max(1, k)
    bright = float(acc[freqs > 4000].sum() / max(1e-12, acc.sum()))

    hop = int(0.02 * SR)
    m = len(seg) // hop
    rms = np.sqrt(np.mean(seg[: m * hop].reshape(-1, hop).astype(np.float64) ** 2, axis=1) + 1e-12)
    db = 20 * np.log10(rms + 1e-9)
    hits = 0
    for i in range(10, m):
        if db[i] - db[i - 10:i].mean() > 6.0:
            hits += 1
    return bright, hits / max(1e-6, len(seg) / SR)


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
        rows.append({
            "score": score, "off": off, "a0": a0, "a1": a1, "a2": a2, "a3": a3,
            "pk": float(seg.max()), "pkt": float(np.argmax(seg) * WIN_S),
            "mn": float(seg.min()), "mnt": float(np.argmin(seg) * WIN_S),
            "queda": drop_db(seg),
        })

    rows.sort(key=lambda r: -r["score"])
    limpos = [r for r in rows if r["queda"] <= HOLE_DB]
    print(f"\nmelhores trechos de {BED_S:.1f} s (score = correlacao com o arco alvo):")
    print(f"  {len(rows) - len(limpos)} offsets descartados por buraco (queda > {HOLE_DB:.0f} dB)")
    print("  score   off   0-20s  32-40s  49-58s  60-63s   pico  pico_em  sub  desce"
          "  queda  no_s")
    for r in limpos[:10]:
        print(f"  {r['score']:5.2f}  {r['off']:4d}s  {r['a0']:6.1f}  {r['a1']:6.1f}"
              f"  {r['a2']:6.1f}  {r['a3']:6.1f}  {r['pk']:6.1f}  {r['pkt']:6.1f}s"
              f"  {r['a1'] - r['a0']:+5.1f}  {r['a3'] - r['a2']:+5.1f}"
              f"  {r['queda']:5.1f}  {r['mnt']:4.0f}s")

    best = int(sys.argv[3]) if len(sys.argv) > 3 else limpos[0]["off"]
    i = int(best / WIN_S)
    print(f"\ndetalhe do melhor (off {best} s, passos de 2 s):")
    for j in range(0, n, 4):
        mark = ""
        if abs(j * WIN_S - RISE_AT) < 2:
            mark = "  <- virada (Candler)"
        elif abs(j * WIN_S - PEAK_AT) < 2:
            mark = "  <- pico (dois bilhoes)"
        elif abs(j * WIN_S - PEAK_END) < 2:
            mark = "  <- comeco do fecho"
        if env[i + j] < np.median(env[i:i + n]) - HOLE_DB:
            mark += "  <- BURACO"
        bar = "#" * int(max(0.0, env[i + j] + FLOOR + 15.0))
        print(f"    +{j * WIN_S:5.1f} s  {env[i + j]:6.1f} dB  {bar}{mark}")

    seg = x[int(best * SR): int((best + BED_S) * SR)]
    b, hits = timbre(seg)
    print(f"\ntimbre do trecho: brilho (>4 kHz) {b * 100:.2f}% da energia"
          f"   ataques {hits:.2f}/s   (brilho alto = sino/prato; ataques altos = pulso/bateria)")

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
