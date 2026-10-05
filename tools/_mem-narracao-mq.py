#!/usr/bin/env python3
"""Grava na memória da narração as lições da peça mq (regerada com edge-tts)."""
p = ".claude/memoria/narracao.md"
s = open(p, encoding="utf-8").read()

# corrige/complementa a entrada de 23/09 do rate x atempo (a peça mq mudou de voz)
agulha = "mas não conte com ele para a conta."
if agulha in s and "Refinado" not in s:
    s = s.replace(
        agulha,
        agulha + "\n**Refinado depois (peça mq regerada com edge-tts):** corte a cauda de "
        "silêncio de cada fala ANTES de medir o total — ver a entrada da peça mq abaixo.",
    )

entrada = """
## 2026-09-23 — Peça mq: saiu com o George por engano e foi regerada com edge-tts
`src/narration-mq.json` estava com `engine: elevenlabs-george` e o Enzo reclamou. Regerada com a voz padrão (pt-BR-AntonioNeural): 16 falas, cru 76,08 s / 2291 frames a rate +35%, cortada a cauda de silêncio → 67,25 s → atempo **1,132** → 1784 frames de fala, última fala terminando no frame 1837, filme 1882 (62,73 s) para uma peça de 63 s. WAVs finais em `public/audio/vo-mq/`, cru em `public/audio/vo-mq/raw/`, versão George guardada em `public/audio/vo-mq-george/`. Caminho: `python3 tools/_mq-1-cru.py` → `python3 tools/_mq-2-ajusta.py` → `python3 tools/_wt-mq.py` (faz `frame`/`words`) → `python3 tools/_mq-3-acabamento.py` (cabeçalho + palavras em ordem). Para refazer UMA fala: apague `raw/<id>.wav` e `<id>.wav` e rode os três primeiros com `RETOMA=1`.
**Por quê:** a peça mq tinha sido gerada com o George e comprimida por 1,39 (16/09→22/09); o certo é a voz grátis, e com ela o número muda inteiro. Deixe os scripts em `tools/` — refazer uma fala é rotina.

## 2026-09-23 — Cortar a cauda do edge-tts antes do atempo: 8,8 s de silêncio em 16 falas
Cada trecho do edge-tts sai com ~0,5-0,7 s de silêncio no fim. Nas 16 falas da mq isso deu **8,83 s** (16 falas cruas 76,08 s; útil 67,25 s). Cortando a cauda para 0,30 s de respiro (`atrim` no `tools/_mq-2-ajusta.py`), o atempo que fecha a duração alvo caiu de 1,28 para **1,13** — a fala fica bem mais natural do que comprimir tudo.
**Por quê:** comprimir silêncio com atempo é pagar velocidade por nada. Meça o total, corte a cauda e só o que sobra vai para o atempo. Com a cauda já cortada, a pausa entre falas fica 0,30 s + `gapAfter` (3 frames = 0,1 s) — não aumente o `gapAfter` para "compensar", 0,4 s entre frases é o respiro contínuo que a série pede.

## 2026-09-23 — `to_frames` do word-timings NÃO garante palavra em ordem
`to_frames` (tools/word-timings.py:260) só impõe `s >= s_anterior` (e `e >= s+1`), não `s >= e_anterior`. Quando o whisper funde duas palavras curtas num trecho, as duas herdam o mesmo início: na mq, `06-ideia` ficou "E"(0,1) e "eu"(0,4) com o mesmo `s`, e `15-cta2` teve "eu"(17,18) e "quero,"(17,22). `tools/_mq-3-acabamento.py` reencosta (`s = max(s, e_anterior)`) — 3 palavras corrigidas.
**Por quê:** legenda palavra-por-palavra (e texto de impacto que procura a palavra por regex) pisca duas palavras no mesmo frame. O `wordsMatched` do whisper não avisa disso; é preciso conferir a monotonia.
"""
if "Peça mq: saiu com o George" not in s:
    s = s.rstrip() + "\n" + entrada
open(p, "w", encoding="utf-8").write(s)
print("memoria ok")
