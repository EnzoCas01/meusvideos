#!/usr/bin/env python3
"""Passo 5: compara o nível da voz edge nova com a George guardada (mesmos ids).

Se a edge sair muito mais baixa, a mistura do filme (volume 1.0 no componente)
fica com a voz fraca e o ajuste tem que ser feito no WAV, não no componente.
"""
import os
import wave

os.chdir("/root/meusvideos")


def levels(path):
    with wave.open(path, "rb") as w:
        rate, count = w.getframerate(), w.getnframes()
        samples = memoryview(w.readframes(count)).cast("h")
    if not count:
        return None
    step = max(1, count // 20000)
    chunk = samples[::step]
    peak = max(abs(s) for s in chunk) / 32768
    # RMS de verdade (sobre amostras quadráticas, passado por float)
    acc = 0.0
    for s in chunk:
        acc += float(s) * float(s)
    rms = (acc / len(chunk)) ** 0.5 / 32768
    return peak, rms


print(f"{'id':<10} {'edge rms':>9} {'george rms':>11} {'edge pega':>10}")
print("-" * 44)
for name in sorted(os.listdir("public/audio/vo-mq")):
    if not name.endswith(".wav"):
        continue
    novo = levels(f"public/audio/vo-mq/{name}")
    velho_path = f"public/audio/vo-mq-george/{name}"
    velho = levels(velho_path) if os.path.exists(velho_path) else None
    razao = f"{20 * __import__('math').log10(novo[1] / velho[1]):+.1f} dB" if velho else "-"
    print(f"{name[:-4]:<10} {novo[1]:9.4f} {velho[1] if velho else 0:11.4f} {razao:>10}")
