import json, sys

p = "src/narration-gg.json"
d = json.load(open(p, encoding="utf-8"))
print("voice:", d["voice"])
total = 0
for l in d["lines"]:
    n = len(l["text"])
    total += n
    print(f'{l["id"]:14s} {n:4d} chars  ~{n/18:5.1f}s  {l["text"]}')
print(f"TOTAL {total} chars  ~{total/18:.1f}s de fala (18 chars/s)")
bad = [l["id"] for l in d["lines"] if "..." in l["text"] or '"' in l["text"]]
print("reticencias/aspas:", bad or "nenhuma")
