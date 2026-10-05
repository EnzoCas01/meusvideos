from PIL import Image, ImageDraw

frames = [105, 410, 615, 795, 1020, 1115, 1345, 1475]
tiles = []
for f in frames:
    im = Image.open(f"out/_check/gg-f{f}.png").resize((360, 640))
    d = ImageDraw.Draw(im)
    d.rectangle([0, 0, 90, 26], fill=(0, 0, 0))
    d.text((4, 4), str(f), fill=(255, 255, 0))
    tiles.append(im)

cols, rows = 4, 2
sheet = Image.new("RGB", (360 * cols, 640 * rows))
for i, im in enumerate(tiles):
    x = (i % cols) * 360
    y = (i // cols) * 640
    sheet.paste(im, (x, y))
sheet.save("out/_check/gg-sheet.png")
