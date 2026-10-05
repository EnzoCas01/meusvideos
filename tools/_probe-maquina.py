"""Sonda temporária da peça MaquinaDinheiro: ambiente + tamanho do roteiro."""
import json

for mod in ("faster_whisper", "edge_tts"):
    try:
        __import__(mod)
        print(f"{mod}: OK")
    except Exception as e:
        print(f"{mod}: AUSENTE ({e})")

doc = json.load(open("src/narration-maquina.json", encoding="utf-8"))
lines = doc["lines"]
chars = sum(len(l["text"]) for l in lines)
print(f"falas: {len(lines)} | caracteres totais: {chars}")
for l in lines:
    print(f'  {l["id"]:<14} {len(l["text"]):>4} chars  gapAfter={l["gapAfter"]}')
