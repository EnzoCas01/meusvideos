from PIL import Image, ImageDraw

names = ["a1 maq4-c1", "a2 maq5-c1", "a3 maq5-c2", "a4 maq2-c4",
         "a5 maq-c2", "a6 rede-c1", "a7 cel-c1", "a8 cel2-c2"]
tiles = [Image.open("/tmp/mddsheet/" + n.split()[0] + ".jpg") for n in names]
sheet = Image.new("RGB", (4 * 360, 2 * 640))
for i, (t, n) in enumerate(zip(tiles, names)):
    d = ImageDraw.Draw(t)
    d.rectangle([0, 0, 170, 26], fill="black")
    d.text((6, 6), n, fill="white")
    sheet.paste(t, ((i % 4) * 360, (i // 4) * 640))
sheet.save("/tmp/mddsheet/sheet.jpg", quality=82)
print("ok")
