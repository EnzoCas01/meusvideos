import sys
from PIL import Image, ImageDraw

fs = [int(a) for a in sys.argv[1:]]
W, H = 360, 640
c = Image.new("RGB", (len(fs) * W, H + 26), "#222")
d = ImageDraw.Draw(c)
for i, f in enumerate(fs):
    img = Image.open(f".tmp-mq-stills/v2-f{f}.png").resize((W, H))
    c.paste(img, (i * W, 26))
    d.text((i * W + 8, 6), f"frame {f}", fill="#fff")
c.save(".tmp-mq-stills/sheet3.png")
print("ok")
