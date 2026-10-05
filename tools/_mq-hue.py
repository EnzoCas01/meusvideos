import json
import subprocess
import tempfile
import os
from PIL import Image

for clip in ["mq-ia/clip-01.mp4", "mq-ia/clip-02.mp4", "mq-monetizacao/clip-04.mp4"]:
    path = f"public/videos/{clip}"
    dur = float(json.loads(subprocess.run(
        ["ffprobe", "-v", "quiet", "-print_format", "json", "-show_streams", path],
        capture_output=True, text=True).stdout)["streams"][0].get("duration", 0) or 0)
    out = []
    ts = [i * 0.5 for i in range(0, 21) if i * 0.5 <= (dur or 10)]
    with tempfile.TemporaryDirectory() as td:
        for i, t in enumerate(ts):
            f = os.path.join(td, f"f{i}.png")
            subprocess.run(["ffmpeg", "-v", "quiet", "-ss", str(t), "-i", path, "-frames:v", "1", f], check=True)
            if os.path.exists(f):
                im = Image.open(f).convert("RGB").resize((8, 14))
                px = list(im.getdata())
                r = sum(p[0] for p in px) / len(px)
                g = sum(p[1] for p in px) / len(px)
                b = sum(p[2] for p in px) / len(px)
                out.append(f"{t:4.1f}s R{r:3.0f} G{g:3.0f} B{b:3.0f}")
    print(clip, "->", " | ".join(out))
