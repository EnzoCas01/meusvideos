import sys
from PIL import Image, ImageDraw

frames = [int(x) for x in sys.argv[1].split(",")]
out = sys.argv[2]
tiles = []
for f in frames:
    im = Image.open(f"/tmp/mq-{f}.png").resize((360, 640))
    d = ImageDraw.Draw(im)
    d.rectangle([0, 0, 90, 34], fill=(0, 0, 0))
    d.text((8, 6), str(f), fill=(61, 255, 138))
    tiles.append(im)
cols = 4
rows = (len(tiles) + cols - 1) // cols
sheet = Image.new("RGB", (360 * cols, 640 * rows), (20, 20, 20))
for i, t in enumerate(tiles):
    sheet.paste(t, ((i % cols) * 360, (i // cols) * 640))
sheet.save(out)
print("ok", out)
