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

## 2026-09-19 — Lâmina que afunila nas DUAS pontas vira folha, não faca
Em `PrintedGuide.tsx` (capa do guia, iFood), a faca era uma única bezier fechada com `Z` direto do topo (ponta) à base — a base também virava ponta, e a forma lia como paisley/gota, não como lâmina.
**Por quê:** faca de verdade tem ponta só em cima; embaixo o talão (bolster) é largo e encontra o cabo em linha reta. Corrigido com `L` reto na base (não curva convergindo a um ponto) antes de fechar o path de volta à ponta.

## 2026-09-19 — iFood: sincronia de "01-gancho" já estava correta
Conferi contra o áudio medido (frame 12–231, `durationInFrames: 219`): a pausa em `l.at(0.63)` cai em 150 e "PAPEL" em `l.at(0.8)` cai em 187 — dentro das janelas pedidas (150–165 e 185–225). Não havia dessincronia; o timing em `Scene1Hook.tsx` já deriva certo do JSON via `cueForIF`.

## 2026-09-19 — CaptionsIF ocupa top:1560 — DisplayIF de rótulo não pode descer até lá
Cenas 4-7 (iFood) tinham labels como "SITE + APP" e "INVESTIMENTO" em `top={1500..1560}`, direto em cima da legenda (`CaptionsIF`, fixa em `top:1560`). Corrigido para `top={1220}`, igual ao padrão já usado em `Scene2Start` (DISK COOK em 1240).
**Por quê:** `CaptionsIF` documenta que scenes devem compor a imagem acima de 1180px e deixar 1560-1720 livre para a legenda; um rótulo grande com `scrim` radial nessa faixa comia a legenda por baixo.

## 2026-09-19 — DisplayIF sem `end` fica em cena inteira: ok perto do topo, ruim sobre um elemento que ainda vai crescer
Em `Scene7Turn`, "2018" (fontSize huge, scrim escuro) ficava sem `end` e continuava full-screen durante o shot seguinte, em cima da área onde os pins do mapa (RESTAURANTE/IFOOD/ENTREGADOR/CLIENTE) pousam.
**Por quê:** dei `end={nodesStart - 4}` para o ano sumir antes dos pins aparecerem. Regra prática: se um DisplayIF grande ocupa o miolo do quadro (não só o topo), sempre dar `end` antes do próximo elemento importante entrar nessa área.

## 2026-09-19 — Mapa abstrato (grid + pins + rotas curvas) é a metáfora que resolveu "logística" sem virar Google Maps
Para as cenas 6/7/8/9 do iFood (desafio de entrega, virada de 2018, transformação, fechamento), criei `MapProps.tsx`: `CityMap` (grid de quarteirões, nunca um mapa real), `MapPin` (ponto rotulado que pousa com spring), `MapRoute` (bezier com reveal por `strokeDashoffset`, controles calculados a partir de normal do segmento) e `mapRoutePoint` (mesma curva, para posicionar um `Courier` andando nela). A cadeia RESTAURANTE → IFOOD → ENTREGADOR → CLIENTE, repetida em miniatura ("ecos") ao afastar a câmera, é o que deu a sensação de escala pedida no briefing.
**Por quê:** o usuário já tinha rejeitado "pontinho com linha aleatória" como genérico em outro projeto (LifePhases). A diferença aqui é que cada ponto tem NOME e a rota conecta papéis concretos da história (quem cozinha, quem entrega, quem recebe) — não é decoração, é o diagrama do próprio modelo de negócio.

## 2026-09-19 — Cena final "silenciosa": tirar CityMap inteiro, não só reduzir opacidade
Para a Cena 9 (fechamento do iFood), a primeira ideia era reusar `CityMap` com opacidade baixa atrás do ponto viajando. Troquei por fundo liso (`BackgroundIF` sozinho) com só `MapRoute` + um círculo pulsante — sem grid nenhum.
**Por quê:** o briefing pedia "reduzir elementos, tela mais limpa" depois de uma cena de montagem rápida (cena 8). Grid de mapa, mesmo apagado, ainda lê como "mais um elemento"; tirar por completo é que fez a cena ler como respiro.

## 2026-09-17 — Pull-back de câmera escala o grupo para BAIXO
Para "três viram uma cidade", os pontos da multidão ficam espalhados numa área bem maior que o quadro (x -1000..2080) e o `<g>` inteiro escala de 1 para 0.32.
**Por quê:** escalar o grupo para cima só amplia o que já está lá. Área maior + escala menor é o que lê como câmera se afastando e revelando mais.

## 2026-09-19 — Netflix (documentário): foto real = protagonista, movimento DENTRO dela
`GradedPhoto` (src/components/netflix) é o padrão: foto em inset sobre cópia própria desfocada/escurecida (parallax entre as duas), grade por filtro CSS (`GRADES.*`), zoom/pan/rotação lentos dentro da cena, `circle` para recortar disco, `cropTop` para esconder texto/rosto impresso na foto. Cena troca de imagem só onde a fala troca.
**Por quê:** o iFood foi rejeitado por cortes rápidos e cara de apresentação. Os arquivos em public/images/netflix/ estão reduzidos a 1920 px de largura (o `largura` do manifest é do original, não do arquivo) — meça o arquivo (PIL) antes de dimensionar. Bebas Neue ≈ 0,4em por caractere (Inter ≈ 0,55em).

## 2026-09-19 — Foto moderna nunca leva rótulo de data antiga
Envelope (2008), prédio atual e a arte "1998/2023" são fotos modernas: entram sem carimbo de data em cima delas; datas só em tipografia sobre fundo escuro (ex.: logo de 1997, domínio público) ou sobre textura genérica. Ao recortar a arte de 2023, `cropTop` esconde os anos impressos.
**Por quê:** regra de verdade visual do briefing — o que a imagem mostra tem que bater com o que a cena afirma.

## 2026-09-21 — Imagem embaçada é proibida (exceto base de texto)
Nenhuma foto pode aparecer desfocada: nem como fundo atrás de inset, nem como "profundidade". Blur só na imagem que serve de base para um texto, e só na cena do texto. Isso substitui a cópia desfocada do `GradedPhoto` (netflix/anthropic/microsoft): ao reusar o componente, trocar por enquadramento nítido (zoom/pan) ou fundo sólido.
**Por quê:** o Enzo já tinha pedido isso e vídeos saíram com imagem embaçada; pediu que a lição chegasse a todos os agentes.

## 2026-09-22 — Peça registrada no Root.tsx precisa compilar inteira
`Agentes.tsx` ficou registrado no `Root.tsx` importando `src/scenes/agentes/*`, que nunca foram criadas (job interrompido). Como o Remotion empacota o `Root.tsx` inteiro, isso quebrou o render e o still de TODAS as peças, não só da Agentes.
**Por quê:** só registre a composição no `Root.tsx` depois que as cenas existem, e rode `npx tsc --noEmit` antes de devolver a tarefa. Peça inacabada foi guardada em `/root/documentos/operacao/meusvideos/pecas-inacabadas/`.

## 2026-09-22 — Faixa real da legenda "rapido" embaixo: abaixo de ~1230 está livre, 1242-1558 não
Com `CaptionsStyled style="rapido" posicao="baixo"` (top 1400), chunks de 2 palavras longas rendem fontSize 150 em DUAS linhas e ocupam ~1242-1558; de 1 palavra, ~1321-1479. Textos de cena em 1230-1320 colidem só nos chunks de 2 linhas (ex.: "VÍDEO FINAL", "CONSEGUE CHEGAR").
**Por quê:** em MaquinaIA a barra de render e o "SEGUE O PERFIL" colidiram com a legenda em stills. Reservar 1240+ como faixa da legenda e terminar todo elemento de cena em <=1230.

## 2026-09-22 — Folha de contato: ler 4-15 stills em UMA imagem
Renderizar stills dos frames-chave e tile-los com PIL (360x640 por tile, rótulo do frame) custa 1 leitura em vez de N. Script descartável de ~15 linhas em `tools/`, apagar depois.
**Por quê:** cada still lido é uma imagem inteira no contexto; a folha mostra layout, colisão e legenda com nitidez suficiente para decidir.

## 2026-09-22 — Cue + duração têm de caber na cena, não no filme
Em MaquinaIA a barra de render começava no "Render" (local 407) com 42 frames de corrida: terminaria em 493 numa cena que acaba em 464 — o still do fim mostrou a barra em 15%. O fim da fala não é o fim da cena; checar `cue + duração < SCENE_DUR` antes de escolher a duração.
**Por quê:** o `durationInFrames` da última fala termina 3 frames antes do corte; qualquer animação que comece numa palavra do fim estoura o corte.

## 2026-09-23 — Folha de contato tem de ler o MESMO arquivo do still
Perdi 2 renders seguidos "conferindo" um ajuste na cena 2: renderizava em /tmp/mq-190d.png e a folha lia /tmp/mq-190.png (cache da 1ª versão) — três folhas idênticas me fizeram suspeitar de cache do Remotion, que não existia.
**Por quê:** renderizar direto no caminho exato que o script da folha lê; senão a verificação confirma o passado.

## 2026-09-23 — Cor de clipe se mede com ffmpeg+PIL antes de gastar still
Os clipes "neural network" do Pexels em public/videos/mq-ia/ são âmbar/rosa na média (medido por segundo com ffmpeg+PIL: 0 leituras de imagem). O recorte do cartão na cena 2 pegava a região rosada; hue-rotate(90deg) no CSS levou o clipe para a família verde da peça; em tela cheia o dourado ficou como estava.
**Por quê:** a média do arquivo não é a cor do recorte: zoom/objectPosition podem pegar uma região de outra cor. Medir o clipe todo e conferir UM still do enquadramento real resolve sem tentativa e erro visual.

## 2026-09-23 — 👎 do Enzo no vídeo Google (job vmuealmh95c91)
Correção pedida pelo Enzo: (1) A foto ANTIGA precisa entrar sozinha, INTEIRA na tela, sem cortar no meio nem mostrar as duas juntas nem seta apontando. Só quando for a vez de trocar para a foto NOVA é que entra um efeito de transição mostrando ela. (2) Falta efeito de cena para cena no vídeo todo. (3) Quando for mostrar as DUAS fotos juntas (antiga e nova comparadas), cada uma precisa encolher de tela cheia para menor — pequenas o bastante pra CABER as duas lado a lado na tela sem cortar nenhuma — com um efeito de transição inteligente (nunca aparecer já cortada/menor do nada). (4) A cena 2 ficou tempo demais parada na mesma imagem enquanto a voz falava — entediante; nenhuma cena pode ficar tanto tempo sem movimento, corte ou mudança visual.
**Também vale sempre:** o Enzo gosta de improviso na edição — não precisa travar só no óbvio/literal do roteiro; efeitos criativos e ideias próprias do `motion` são bem-vindos, desde que sirvam a fala e não poluam.
**Por quê:** avaliação do Enzo no painel; o Jev atribuiu a você (confiança 1). Não repita isso.
