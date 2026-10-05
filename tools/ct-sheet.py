import glob
from PIL import Image, ImageDraw

frames = [10, 150, 262, 285, 450, 560, 600, 850]
tw, th = 324, 576
cols = 4
sheet = Image.new("RGB", (tw * cols, th * 2), "#111")
d = ImageDraw.Draw(sheet)
for i, f in enumerate(frames):
    im = Image.open(f"/tmp/ct-{f}.png").resize((tw, th))
    x, y = (i % cols) * tw, (i // cols) * th
    sheet.paste(im, (x, y))
    d.rectangle([x, y, x + 90, y + 30], fill="#000")
    d.text((x + 8, y + 6), f"f{f}", fill="#fff")
sheet.save("/tmp/ct-sheet.png")
print("ok")
