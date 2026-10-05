#!/usr/bin/env python3
"""Passo 2: tira a cauda de silêncio do edge-tts e encaixa a fala na duração alvo.

Cada trecho do edge-tts sai com ~0,7 s de silêncio no fim. Em vez de comprimir
tudo com atempo (que era o caminho quando a voz era o George), aqui primeiro se
corta esse silêncio — deixa 0,30 s de respiro — e só o que sobra é comprimido,
se sobrar. O cru fica em public/audio/vo-mq/raw/; o final vai para
public/audio/vo-mq/<id>.wav com durationInFrames = ceil(segundos*30).
"""
import json
import math
import os
import subprocess
import sys
import wave

os.chdir("/root/meusvideos")

JSON = "src/narration-mq.json"
RAW = "public/audio/vo-mq/raw"
OUT = "public/audio/vo-mq"
TARGET_FRAMES = 1783  # soma dos durationInFrames: mesma janela falada da versão anterior
FPS = 30
TAIL = 0.30  # respiro que fica depois da última palavra
THRESH = 300


def save_json(doc, path):
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


def speech_bounds(path):
    """(início, fim) do som útil em segundos — fim já com TAIL de respiro."""
    with wave.open(path, "rb") as w:
        rate = w.getframerate()
        frames = w.readframes(w.getnframes())
    samples = memoryview(frames).cast("h")
    first = next((i for i, s in enumerate(samples) if abs(s) > THRESH), None)
    if first is None:
        return 0.0, 0.0
    last = next(
        (len(samples) - 1 - i for i, s in enumerate(reversed(samples)) if abs(s) > THRESH)
    )
    total = len(samples) / rate
    return first / rate, min(total, last / rate + TAIL)


def wav_seconds(path):
    with wave.open(path, "rb") as w:
        return w.getnframes() / w.getframerate()


doc = json.load(open(JSON, encoding="utf-8"))
lines = doc["lines"]

bounds = {}
silence = 0.0
for line in lines:
    path = f"{RAW}/{line['id']}.wav"
    start, end = speech_bounds(path)
    total = wav_seconds(path)
    bounds[line["id"]] = (start, end, total)
    silence += total - (end - start)

kept = sum(e - s for s, e, _ in bounds.values())
target = TARGET_FRAMES / FPS
factor = max(1.0, kept / target)
print(f"cru {sum(t for _, _, t in bounds.values()):.2f}s | silencio cortado {silence:.2f}s "
      f"| util {kept:.2f}s | alvo {target:.2f}s | atempo {factor:.4f}")

for line in lines:
    line_id = line["id"]
    start, end, _ = bounds[line_id]
    dst = f"{OUT}/{line_id}.wav"
    tmp = f"{OUT}/.{line_id}.tmp.wav"
    filters = [f"atrim=start={start:.4f}:end={end:.4f}"]
    if factor > 1.001:
        filters.append(f"atempo={factor:.6f}")
    subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error", "-i", f"{RAW}/{line_id}.wav",
         "-filter:a", ",".join(filters), "-ac", "1", "-ar", "24000",
         "-c:a", "pcm_s16le", tmp],
        check=True,
    )
    os.replace(tmp, dst)
    seconds = wav_seconds(dst)
    line["durationInFrames"] = math.ceil(seconds * FPS)
    print(f"{line_id:<10} {seconds:6.2f}s -> {line['durationInFrames']:4d} frames")

doc["speed"] = round(factor, 3)
save_json(doc, JSON)

total = sum(l["durationInFrames"] for l in lines)
gaps = sum(l.get("gapAfter", 0) for l in lines)
print(f"\nsoma das falas {total} frames | gaps {gaps} | fim da ultima fala "
      f"frame {doc['headFrames'] + total + gaps}")
sys.exit(0)
