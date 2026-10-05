#!/usr/bin/env python3
"""Passo 4: confere os WAVs finais contra o JSON (duração, pico, silêncio)."""
import json
import math
import os
import wave

os.chdir("/root/meusvideos")
doc = json.load(open("src/narration-mq.json", encoding="utf-8"))

bad = 0
for line in doc["lines"]:
    path = f"public/audio/vo-mq/{line['id']}.wav"
    with wave.open(path, "rb") as w:
        rate, count = w.getframerate(), w.getnframes()
        samples = memoryview(w.readframes(count)).cast("h")
    seconds = count / rate
    expect = math.ceil(seconds * 30)
    peak = max(abs(s) for s in samples[::7]) / 32768
    mean = sum(abs(s) for s in samples[::7]) / (len(samples[::7]) * 32768)
    flag = ""
    if expect != line["durationInFrames"]:
        flag += " DURACAO!=JSON"
    if peak < 0.1 or mean < 0.005:
        flag += " QUASE MUDO"
    if peak > 0.999:
        flag += " PICO NO TETO"
    if flag:
        bad += 1
    print(f"{line['id']:<10} {seconds:6.2f}s {expect:4d} f | "
          f"pico {peak:5.2f} medio {mean:5.3f} | {rate} Hz{flag}")

print(f"\n{len(doc['lines'])} falas | problemas: {bad}")
print("engine:", doc["engine"], "| voz:", doc["voice"], "| rate:", doc["rate"],
      "| speed:", doc["speed"])
print("raw/ (cru do edge, com a cauda):", len(os.listdir("public/audio/vo-mq/raw")), "arquivos")
