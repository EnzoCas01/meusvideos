#!/usr/bin/env python3
"""Passo 3: cabeçalho do JSON (engine/nota) e palavras em ordem crescente.

O `align` do word-timings casa cada palavra com um trecho do whisper; quando duas
palavras caem no mesmo trecho, elas herdam o mesmo início (ex.: "E" e "eu" com
s=0 em 06-ideia). Aqui cada palavra passa a começar onde a anterior terminou —
sem isso, uma legenda por palavra pisca duas palavras no mesmo frame.
"""
import json
import os

os.chdir("/root/meusvideos")
JSON = "src/narration-mq.json"

NOTA = (
    "Fonte única da narração de 'MaquinaIA' (sufixo mq, modo livre: promo do time de "
    "agentes, CTA 'EU QUERO' + meta de 100 mil likes). Voz PADRÃO do projeto: edge-tts "
    "grátis pt-BR-AntonioNeural com rate +35% — a versão anterior saiu com o George "
    "(ElevenLabs) por engano e foi regerada em 23/09/2026. 'frame', 'durationInFrames' e "
    "'words' saem de tools/generate-narration-edge.py e tools/word-timings.py (motor "
    "whisper: os tempos são medidos do WAV, não estimados). NÃO usar reticências no "
    "texto: o word-timings --edge pula linhas com '...'. A fala 'eu quero' está em "
    "minúsculas de propósito (em CAIXA ALTA a voz pode soletrar as letras); o texto na "
    "tela continua 'EU QUERO'. O gerador escreve o cru em public/audio/vo-mq/raw/ e "
    "tools/_mq-2-ajusta.py corta a cauda de ~0,7 s de silêncio que o edge-tts deixa em "
    "cada trecho (guarda 0,30 s), aplica o atempo de 'speed' e grava os WAVs finais em "
    "public/audio/vo-mq/. Para refazer UMA fala: apague raw/<id>.wav e <id>.wav e rode "
    "RETOMA=1 python3 tools/_mq-1-cru.py, python3 tools/_mq-2-ajusta.py e "
    "python3 tools/_wt-mq.py. A versão George antiga ficou guardada em "
    "public/audio/vo-mq-george/. Gaps: 3 frames entre falas, 6 antes de 'Quer aprender' "
    "(11-quer) e antes de 'Vamos descobrir' (16-fim). O campo 'speed' é informativo — "
    "nenhum script o lê."
)


def save_json(doc, path):
    blocks = []
    for key, value in doc.items():
        if key == "lines":
            body = ",\n".join(
                f"    {json.dumps(line, ensure_ascii=False)}" for line in value
            )
            blocks.append(f'  "lines": [\n{body}\n  ]')
        else:
            blocks.append(
                f"  {json.dumps(key, ensure_ascii=False)}: "
                f"{json.dumps(value, ensure_ascii=False)}"
            )
    with open(path, "w", encoding="utf-8") as f:
        f.write("{\n" + ",\n".join(blocks) + "\n}\n")


doc = json.load(open(JSON, encoding="utf-8"))
doc["engine"] = "edge-tts"
doc["note"] = NOTA

fixed = []
for line in doc["lines"]:
    previous = 0
    for word in line["words"]:
        if word["s"] < previous:
            fixed.append(f"{line['id']}:{word['w']}")
            word["s"] = previous
        if word["e"] <= word["s"]:
            word["e"] = word["s"] + 1
        previous = word["e"]

save_json(doc, JSON)

lines = doc["lines"]
print(f"palavras reencostadas: {len(fixed)} ({', '.join(fixed) if fixed else 'nenhuma'})")
overlaps = [
    f"{a['id']} x {b['id']}"
    for a, b in zip(lines, lines[1:])
    if a["frame"] + a["durationInFrames"] > b["frame"]
]
print(f"sobreposicao: {'nenhuma' if not overlaps else ', '.join(overlaps)}")
for line in lines:
    bad = [w for w in line["words"] if w["e"] > line["durationInFrames"]]
    if bad:
        print(f"  ATENCAO {line['id']}: palavra fora do clipe -> {bad}")
print(f"falas: {len(lines)} | falado {sum(l['durationInFrames'] for l in lines) / 30:.2f}s "
      f"| fim da ultima fala frame {lines[-1]['frame'] + lines[-1]['durationInFrames']} "
      f"| filme {lines[-1]['frame'] + lines[-1]['durationInFrames'] + doc['tailFrames']} "
      f"frames ({(lines[-1]['frame'] + lines[-1]['durationInFrames'] + doc['tailFrames']) / 30:.2f}s)")
