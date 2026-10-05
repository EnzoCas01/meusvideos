entry = """
## 2026-09-22 — Faixa real da legenda "rapido" embaixo: abaixo de ~1230 está livre, 1242-1558 não
Com `CaptionsStyled style="rapido" posicao="baixo"` (top 1400), chunks de 2 palavras longas rendem fontSize 150 em DUAS linhas e ocupam ~1242-1558; de 1 palavra, ~1321-1479. Textos de cena em 1230-1320 colidem só nos chunks de 2 linhas (ex.: "VÍDEO FINAL", "CONSEGUE CHEGAR").
**Por quê:** em MaquinaIA a barra de render e o "SEGUE O PERFIL" colidiram com a legenda em stills. Reservar 1240+ como faixa da legenda e terminar todo elemento de cena em <=1230.

## 2026-09-22 — Folha de contato: ler 4-15 stills em UMA imagem
Renderizar stills dos frames-chave e tile-los com PIL (360x640 por tile, rótulo do frame) custa 1 leitura em vez de N. Script descartável de ~15 linhas em `tools/`, apagar depois.
**Por quê:** cada still lido é uma imagem inteira no contexto; a folha mostra layout, colisão e legenda com nitidez suficiente para decidir.

## 2026-09-22 — Cue + duração têm de caber na cena, não no filme
Em MaquinaIA a barra de render começava no "Render" (local 407) com 42 frames de corrida: terminaria em 493 numa cena que acaba em 464 — o still do fim mostrou a barra em 15%. O fim da fala não é o fim da cena; checar `cue + duração < SCENE_DUR` antes de escolher a duração.
**Por quê:** o `durationInFrames` da última fala termina 3 frames antes do corte; qualquer animação que comece numa palavra do fim estoura o corte.
"""
p = ".claude/memoria/motion.md"
s = open(p).read()
if "Folha de contato" not in s:
    open(p, "a").write(entry)
print("mem ok")
