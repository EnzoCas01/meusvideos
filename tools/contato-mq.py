import glob
from PIL import Image, ImageDraw

files = sorted(glob.glob(".tmp-mq-stills/f*.png"), key=lambda p: int(p.split("/f")[1].split(".")[0]))
W, H = 360, 640
COLS = 4
frames = [int(p.split("/f")[1].split(".")[0]) for p in files]

def sheet(names, out):
    rows = (len(names) + COLS - 1) // COLS
    canvas = Image.new("RGB", (COLS * W, rows * (H + 26)), "#222")
    d = ImageDraw.Draw(canvas)
    for i, (p, fr) in enumerate(names):
        img = Image.open(p).resize((W, H))
        x, y = (i % COLS) * W, (i // COLS) * (H + 26)
        canvas.paste(img, (x, y + 26))
        d.text((x + 8, y + 6), f"frame {fr}", fill="#fff")
    canvas.save(out)

half = (len(files) + 1) // 2
sheet(list(zip(files[:half], frames[:half])), ".tmp-mq-stills/sheet1.png")
sheet(list(zip(files[half:], frames[half:])), ".tmp-mq-stills/sheet2.png")
print("ok", len(files))
