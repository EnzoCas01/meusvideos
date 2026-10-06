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
**Por quê:** a máquina atual tem 2 núcleos físicos (Celeron 4205U). Verifique com `Get-Process` antes.

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

## 2026-10-05 — AlvoManage: tempo vem do JSON, sem ciclo de import
`src/utils/timing-am.ts` deriva início/duração de cada cena das falas de `src/narration-alvomanage.json` (frame medido vence; null cai na estimativa do roteiro). Cena i começa 5 frames antes da fala (am07: 18), nunca antes da fala anterior acabar; dura até a próxima cena terminar a transição (7 frames); a última segura 30 frames (≈1 s) sob o acorde.
**Por quê:** a voz foi refeita duas vezes no mesmo dia (am04 mudou e empurrou am05–am13). Com tudo derivado, nada precisou ser reescrito. O módulo não importa cenas, então não existe o ciclo do `cue-cp`.

## 2026-10-05 — AlvoManage: "tempo real" é proibido na tela
O teste do navegador mostrou que a página do cliente NÃO atualiza sozinha (só ao abrir/recarregar). am04 usa "a hora que quiser". Nada de "tempo real"/"ao vivo" em texto, nem stepper avançando sozinho; o badge "Ao vivo" do print de Visão Geral fica mascarado.
**Por quê:** afirmação não verificada é vetada pelo usuário; o revisor confere isso.

## 2026-10-05 — Prints do sistema: máscara, não só recorte
Em `images-am.ts` cada print tem `masks` (retângulos na cor do painel, amostrada com ffmpeg `crop=1:1:x:y,format=rgb24`). Fundo do app = #1A1A1A, header = #262626. Cobrem botão WhatsApp, cursores gravados no print, "Ao vivo". Recorte sozinho falha porque o movimento de câmera passa por cima.
**Por quê:** os prints vêm com cursor do navegador e com elementos que não podem aparecer; ao interpolar câmera entre dois recortes, a área intermediária vaza.

## 2026-10-05 — Still do Remotion leva ~1m40 nesta máquina
Um único `remotion still` (frame 600, AlvoManage) levou 99 s, boa parte carregando 28 requisições de fonte Inter.
**Por quê:** orçar o tempo; um still por rodada quando a CPU está disputada.

## 2026-10-05 — Regra é "nunca sem SOM", não "nunca sem voz"
Respiro de ~0,4 s entre falas e ~1 s no fim são permitidos, desde que algo soe. Em AlvoManage cada corte de cena (que cai no respiro) ganha um whoosh/tick suave em `audio-am.ts` (pulado se já houver cue a ±6 frames) e a trilha só mergulha (quietAM até 35%), nunca zera.
**Por quê:** o usuário corrigiu a regra no mesmo dia; rabo de 12 frames e falas coladas foram desfeitos.

## 2026-10-05 — loadFont sem `subsets` = 7 requisições por peso
`@remotion/google-fonts` sem `subsets` baixa cyrillic, greek, vietnamese etc. `font.ts` (4 pesos = 28 requisições) roda em TODO render porque `Root.tsx` importa todos os filmes. Sempre `subsets: ["latin"]` (cobre o português).
**Por quê:** era o aviso de 28 requisições e um suspeito do render travado do AlvoManage (cada fonte é um delayRender de 60 s por aba).

## 2026-10-05 — Gravações do navegador são WebM com extensão .mp4
Os arquivos em `public/images/alvomanage/videos/*.mp4` são VP9/matroska sem duração nem cues (`ffprobe` dá duration=N/A). Nunca apontar `<OffthreadVideo>` para eles: recortar e reencodar para H.264 em `videos/leve/` (`-c:v libx264 -crf 28 -g 15 -an -movflags +faststart`). Contar frames com `ffmpeg -f null -progress`, não com ffprobe.
**Por quê:** sem índice o extrator do Remotion precisa decodificar desde o início a cada seek; candidato forte a travamento.

## 2026-10-05 — Clipe acelerado: Freeze no último frame
Cena 8 toca o menu gravado (237 frames) com `playbackRate` = frames / duração do beat, e usa `<Freeze active={local > clipEnd}>` para nunca pedir frame além do arquivo.
**Por quê:** arredondamento do rate pode pedir um frame inexistente no último quadro do beat.

## 2026-10-05 — Voz rápida: palavras a 7 frames uma da outra
Com a voz Lucas, "link" e "só dela" (am03) caem a 7 frames: pan + anel + clique não cabem. Solução: o evento visual usa `max(palavra, evento anterior + N)` e a cue de som em `audio-am.ts` repete a mesma fórmula.
**Por quê:** ancorar cada evento numa palavra só funciona se as palavras tiverem espaço; quando não têm, keyframes ficam fora de ordem (kf empurra para +1) e o anel some no mesmo frame em que aparece.

## 2026-10-05 — HyperFrames (AlvoManage 3): o projeto é GERADO por tools/build.mjs
`hf-alvomanage-3/index.html` e `compositions/sNN.html` saem de `node hf-alvomanage-3/tools/build.mjs` (rodar da raiz). Tempos vêm de `src/narration-alvomanage-3.json` + `hf-alvomanage-3/words.json` (`tools/word-times.mjs`: silencedetect + pontuação + peso por letras; não há timestamp por palavra da ElevenLabs e o Whisper do CLI só tem modelos `.en` ou large-v3). Edição feita à mão no Studio é sobrescrita no próximo build.
**Por quê:** voz refeita = rodar word-times + build e tudo (cenas, sfx, lane da trilha) ressincroniza; mesma lição do timing-am do Remotion.

## 2026-10-05 — HyperFrames: armadilhas que custaram rodada
- Script de sub-composição roda no escopo global da página: `const tl` em duas cenas = SyntaxError. Embrulhar cada script num IIFE.
- `<audio>` sem `data-duration` vale "até o fim" e o lint acusa sobreposição em massa; dar a duração do wav e espalhar efeitos sobrepostos em trilhas diferentes (4, 5, 6…).
- `tl.fromTo` renderiza o "from" na hora da construção: um fromTo com `opacity:1` no from mostra o elemento desde o frame 0 (dígitos do calendário sobrepostos, mão aparecendo antes da hora). Use `immediateRender:false` ou from com opacity 0.
- `hyperframes check` acusa `content_overlap` em contador rolante (dígitos empilhados em caixa com overflow); trocar por crossfade com o próximo em opacity 0.
- Print com texto de 13 px precisa de zoom ≥ 2,3 no quadro de 960 px para ler no celular; tabela larga não cabe — recortar célula por célula e reempilhar (cena 8 e 11).
**Por quê:** todas apareceram só no snapshot/check, não no lint.

## 2026-10-05 — HyperFrames: velocidade de render nesta máquina
Render de 6 s em 540x960 (cópia com `zoom:.5` nas cenas, `--quality draft`): captura 75,7 s para 180 quadros = **2,4 quadros/s**, mais ~120 s fixos (compile 35, áudio 25, probe 14, setup 53). Relógio total com `npx` foi 11 min (havia um python desconhecido pesado rodando). Modo `screenshot capture · hardware gpu`, 2 workers.
**Por quê:** comparação pedida pelo usuário. Estimativa vídeo inteiro (1714 quadros): ~14 min em metade da resolução, ~30–40 min em 1080x1920 (não medido; 4x pixels). Remotion: rascunho meia resolução 1,9 fps/16 min, completo ~1 h.

## 2026-10-05 — Logo clara: o azul de "Manage" fica fraco sobre fundo escuro
`logo-alvomanage-claro.png` (gerada por `hf-alvomanage-3/tools/make-logo-claro.mjs`, só cinza-escuro sem saturação vira branco, alfa intacto) resolve o "Alvo"; o "Manage" azul escuro original continua com contraste baixo a 210 px no canto. Não alterado, relatado ao usuário (ajuste permitido pelo diretor: subir o azul para ~#3b6ff0, só com ok dele). Personagem atrás da logo também a apaga: manter cabeça/objetos fora de x 0–340, y 200–360 em todo frame, inclusive com câmera em zoom.
