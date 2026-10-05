from PIL import Image, ImageDraw

frames = [660, 1400]
tiles = []
for f in frames:
    im = Image.open(f"out/_check/gg-f{f}.png").resize((360, 640))
    d = ImageDraw.Draw(im)
    d.rectangle([0, 0, 90, 26], fill=(0, 0, 0))
    d.text((4, 4), str(f), fill=(255, 255, 0))
    tiles.append(im)

sheet = Image.new("RGB", (360 * 2, 640))
for i, im in enumerate(tiles):
    sheet.paste(im, (i * 360, 0))
sheet.save("out/_check/gg-sheet2.png")
