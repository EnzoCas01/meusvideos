#!/usr/bin/env python3
"""Acelera os WAVs da narracao mdd com ffmpeg atempo e refaz durationInFrames.

Le sempre de VO/orig (guardado na primeira rodada), entao rodar duas vezes nao
acelera duas vezes. `speed` no JSON marca que os WAVs atuais ja sao acelerados.
"""
import json
import math
import os
import shutil
import subprocess
import wave

JSON_PATH = "src/narration-mdd.json"
VO = "public/audio/vo-mdd"
ORIG = os.path.join(VO, "orig")
FPS = 30
TARGET = 1650  # filme alvo em frames (55 s a 30 fps)


def seconds(path):
    with wave.open(path, "rb") as w:
        return w.getnframes() / w.getframerate()


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


with open(JSON_PATH, encoding="utf-8") as f:
    doc = json.load(f)
lines = doc["lines"]

fresh = "speed" not in doc
if fresh:
    if os.path.isdir(ORIG):
        shutil.rmtree(ORIG)
    os.makedirs(ORIG)
    for line in lines:
        shutil.copy2(os.path.join(VO, f"{line['id']}.wav"),
                     os.path.join(ORIG, f"{line['id']}.wav"))
    print("originais guardados em", ORIG)

current = [seconds(os.path.join(ORIG, f"{l['id']}.wav")) for l in lines]
gaps = sum(l.get("gapAfter", 0) for l in lines)
target_speech = TARGET - doc["headFrames"] - gaps
factor = sum(current) * FPS / target_speech
print(f"falado cru {sum(current):.2f}s -> alvo {target_speech} frames "
      f"| atempo {factor:.4f} | gaps {gaps}")

for line, before in zip(lines, current):
    src = os.path.join(VO, f"{line['id']}.wav")
    tmp = src + ".tmp.wav"
    subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error", "-i", os.path.join(ORIG, f"{line['id']}.wav"),
         "-filter:a", f"atempo={factor:.6f}",
         "-ac", "1", "-ar", "24000", "-c:a", "pcm_s16le", tmp],
        check=True,
    )
    os.replace(tmp, src)
    line["durationInFrames"] = math.ceil(seconds(src) * FPS)
    print(f"  {line['id']}: {before:5.2f}s -> {seconds(src):5.2f}s "
          f"-> {line['durationInFrames']:4d} frames")

doc["speed"] = round(factor, 3)
save_json(doc, JSON_PATH)

total = sum(l["durationInFrames"] for l in lines)
end = doc["headFrames"] + sum(l["durationInFrames"] + l.get("gapAfter", 0) for l in lines)
print(f"falado {total} frames ({total / FPS:.1f}s) | ultima fala termina {end} "
      f"| filme {end + doc['tailFrames']} frames ({(end + doc['tailFrames']) / FPS:.1f}s)")
