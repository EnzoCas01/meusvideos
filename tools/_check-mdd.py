#!/usr/bin/env python3
"""Confere os 'words' da mdd: monotonia, s<e, limites e as palavras nao casadas."""
import json

doc = json.load(open("src/narration-mdd.json", encoding="utf-8"))
bad = 0
for line in doc["lines"]:
    words = line["words"]
    limit = line["durationInFrames"]
    problems = []
    prev_e = -1
    for i, w in enumerate(words):
        if w["e"] <= w["s"]:
            problems.append(f"vazio {w}")
        if w["s"] < prev_e:
            problems.append(f"fora de ordem {w}")
        if w["s"] < 0 or w["e"] > limit:
            problems.append(f"fora do clipe {w}")
        prev_e = w["s"]
    bad += len(problems)
    flag = "OK " if not problems else "!! "
    print(f"{flag}{line['id']:<12} {line['wordsMatched']:>6} "
          f"dur={limit:4d} ult={words[-1]['e']:4d} "
          f"1a={words[0]['w']}[{words[0]['s']}-{words[0]['e']}] "
          + ("; ".join(problems) if problems else ""))
    if line["id"] in ("03-caltime", "04-ideia", "05-agentes"):
        print("     " + " ".join(f"{w['w']}({w['s']}-{w['e']})" for w in words))
print("problemas:", bad)
print("total falas:", len(doc["lines"]), "| headFrames", doc["headFrames"],
      "| tailFrames", doc["tailFrames"], "| speed", doc.get("speed"))

lines = doc["lines"]
overlaps = [f"{a['id']} x {b['id']}" for a, b in zip(lines, lines[1:])
            if a["frame"] + a["durationInFrames"] > b["frame"]]
print("sobreposicao:", "nenhuma" if not overlaps else ", ".join(overlaps))
print("falado:", sum(l["durationInFrames"] for l in lines) / 30, "s")
print("fim da ultima fala:", lines[-1]["frame"] + lines[-1]["durationInFrames"])
print("fim da ultima palavra:", lines[-1]["frame"] + lines[-1]["words"][-1]["e"])
