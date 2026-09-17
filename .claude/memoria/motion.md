# Memória — motion

## 2026-09-16 — Metáfora, nunca abstração repetida
As sete cenas tinham a mesma trajetória de pontinho com linha. Foi recusado como genérico. Trocamos por: ampulheta, colunas subindo, fases da lua, brotos florescendo, círculo de respiração, amanhecer.
**Por quê:** a imagem tem que significar o que o texto diz. Se a mesma forma serve para qualquer cena, ela não está dizendo nada.

## 2026-09-16 — Ícone discreto demais some
Coloquei os ícones de fase a 56px com 45% de opacidade sobre fundo preto. O usuário reclamou que "só colocou linha, não ícones" — eles estavam lá, invisíveis.
**Por quê:** discrição sobre fundo #050505 vira ausência. Elemento que carrega significado precisa de presença: aumentei para 150px, cor cheia, com pouso e anel de impacto.

## 2026-09-16 — SVG corta o que passa da viewport
O anel de impacto expandia além da caixa do `<svg>` e aparecia como um quadrado de luz em volta do ícone.
**Por quê:** a viewport recorta. Dê à `<svg>` uma caixa maior que o maior estado do elemento — ver `RING_BOX` em `LandingIcon`.

## 2026-09-16 — Medir o texto antes de escolher o tamanho
"Estou atrasado?" a 132px dava ~1030px de largura num quadro de 1080. Quase estourou.
**Por quê:** Inter em peso médio ocupa cerca de 0,52em por caractere. Multiplique antes de decidir; frase longa vai empilhada em duas linhas.

## 2026-09-16 — Animação tem que fechar antes da cena acabar
O anel em volta de "fase" terminava de ser desenhado no frame 570, e o fade da cena começava em 550. Ninguém via o fecho.
**Por quê:** conte para trás a partir do início do fade, não do fim da cena.

## 2026-09-16 — Composição: vazio sem intenção parece erro
Os brotos ocupavam só o terço de baixo e sobrava um vazio enorme em cima. Aumentei as alturas e subi o chão.
**Por quê:** espaço negativo é ferramenta, mas dois terços vazios sem propósito leem como cena inacabada.

## 2026-09-16 — Só renderize still se nada pesado estiver rodando
Renderizei stills enquanto a narração era gerada e travei os dois.
**Por quê:** 4 núcleos. Verifique com `Get-Process` antes.

## 2026-09-17 — Ciclo de import com SCENE_STARTS_CP
`ComecePequeno.tsx` importa as cenas e as cenas precisam de `SCENE_STARTS_CP` dele. Ler esse array no topo de um módulo de cena estoura no temporal dead zone.
**Por quê:** ESM devolve o módulo parcial quando há ciclo. `src/utils/cue-cp.ts` resolve com uma fábrica: `cueFor(i)` devolve um closure que só toca o array em tempo de render.

## 2026-09-17 — Frame de texto nunca é número cravado
Em ComecePequeno todo texto deriva de `line(id).frame` / `.durationInFrames` convertido para frame local da cena.
**Por quê:** a narração é remedida e reposicionada no JSON. Número cravado obriga a refazer a cena inteira; derivado, a peça se re-sincroniza sozinha.

## 2026-09-17 — Manifesto de imagem pode chegar depois
`src/utils/images-cp.ts` importa `public/images/comece-pequeno/fontes.json`. Se o arquivo não existir o build quebra na hora.
**Por quê:** crie um placeholder `{"imagens": []}` antes de escrever o util, e faça toda cena compor sem foto. O agente `imagem` sobrescreve depois.

## 2026-09-17 — O agente imagem baixa logotipo junto
Vieram `nubank-logo.svg` e `nubank-logo-2021.svg` na pasta de cena 1.
**Por quê:** marca de terceiro não pode entrar na tela. O filtro `isBrandMark` em `images-cp.ts` descarta `.svg` e nomes com logo/marca na origem, para nenhuma cena pegar por acidente.

## 2026-09-17 — Pull-back de câmera escala o grupo para BAIXO
Para "três viram uma cidade", os pontos da multidão ficam espalhados numa área bem maior que o quadro (x -1000..2080) e o `<g>` inteiro escala de 1 para 0.32.
**Por quê:** escalar o grupo para cima só amplia o que já está lá. Área maior + escala menor é o que lê como câmera se afastando e revelando mais.
