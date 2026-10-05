# LifePhases

Curta de motion design em Remotion — "Você não está atrasado". 1080x1920, 30 fps, vertical.

Responder ao usuário **em português**. Comentários e identificadores no código seguem em inglês.

## Equipe de agentes

**Quem comanda é o código** (`tools/orquestrador.py`, chamado pelo painel). Os modelos só fazem o trabalho de cada etapa, e o **Jev** decide:

1. **Triagem (Jev):** antes do vídeo, dá nota à dificuldade do trabalho de cada agente naquele pedido. O código converte em modelo + esforço pela escada do `modelos.json` (fácil = mais barato/esforço baixo; difícil = um degrau acima/esforço alto). Na edição, o Jev também decide quais agentes precisam agir.
2. **Plano (`diretor`, uma vez):** escreve `plano.json` com as cenas e a tarefa de cada agente, e termina.
3. **Agentes na ordem**, cada entrega conferida por código. Falhou: repete com o erro. Falhou de novo: sobe um degrau de modelo.
4. **Render:** `tools/render.sh`, sem IA.
5. **Revisão:** `tools/revisao.py`. O código mede; o `olho` descreve cada cena; o Jev julga (fiel à fala? qualidade? texto ok? repete um 👎?) e aponta quem corrige. No máximo 2 voltas de correção.

| Agente | Domínio |
|---|---|
| `diretor` | só planeja: cenas e tarefas em `plano.json` |
| `motion` | timeline da peça, `Root.tsx`, cenas e componentes visuais, animação, tipografia; grava `cenas.json` com os frames reais |
| `som` | efeitos sonoros (trilha só por pedido) |
| `narracao` | voz, roteiro falado, sincronia |
| `imagem` | buscar fotos e clipes para cada cena; grava `midia.json` |
| `olho` | descreve em JSON o quadro de cada cena para o Jev (não julga) |
| `render`, `revisor` | substituídos por `tools/render.sh` e `tools/revisao.py` no fluxo do painel; continuam disponíveis para uso manual |

Definições em `.claude/agents/`.

## Estrutura

```
src/LifePhases.tsx      timeline: as 7 cenas e a sobreposição entre elas
src/scenes/             uma cena por arquivo
src/components/         peças visuais reutilizáveis
src/utils/audio.ts      quais sons tocam em quais frames
src/narration.json      fonte única da narração (texto, frame, duração)
tools/generate-audio.mjs        sintetiza trilha e efeitos
tools/generate-narration-edge.py gera a voz (edge-tts grátis por padrão)
tools/fetch-videos.mjs          busca e baixa clipes de vídeo (Pexels/Pixabay/Commons)
tools/watch-narration.mjs       barra de progresso da narração
tools/fetch-images.mjs          busca e baixa imagens (precisa do SearXNG local)
```

## Comandos

```
npm run dev                                       # Remotion Studio
npx remotion render src/index.ts LifePhases out/life-phases.mp4 --log=error
npx remotion still src/index.ts LifePhases x.png --frame=<n> --log=error
node tools/generate-audio.mjs                     # trilha + efeitos
python3 -u tools/generate-narration-edge.py src/narration-<peca>.json public/audio/vo-<peca>
node tools/fetch-videos.mjs "consulta" --n=4 --vertical
npx eslint src && npx tsc --noEmit
```

## Dois modos: história × livre (o diretor decide sozinho)

Antes de qualquer coisa, o `diretor` classifica o pedido e diz em 1 linha qual modo escolheu.

**Modo história** — o pedido conta uma trajetória no tempo (empresa, pessoa, invenção, "Você sabia que…", cronologia, causa → efeito). Segue TODA a seção "Série Você sabia" abaixo (gancho, foto real com movimento, três níveis de texto, final com recompensa, créditos etc.).

**Modo livre** — tudo o mais: anúncio, promo, produto, tutorial, lista/dicas, motivacional, institucional, clipe visual, teaser, evento, depoimento. **A seção "Série Você sabia" NÃO se aplica** (nada de gancho "Você sabia", cronologia, "final com recompensa narrativa", duração 75-90s). No modo livre o `diretor` monta a melhor edição possível **para o objetivo do pedido**:
- define objetivo, público, tom e duração pelo pedido (sem duração dita: a que o conteúdo pede; formato padrão 1080x1920 30 fps, salvo pedido);
- estrutura conforme o gênero (anúncio: gancho → benefício → prova → chamada para ação; tutorial: passos claros; lista: item por item com ritmo; etc.);
- usa **tudo que o projeto oferece**: vídeos (`fetch-videos`), imagens (`fetch-images`), fotos já em `public/images/`, efeitos do Remotion, texto animado, som e a voz padrão;
- mantém o que vale sempre: abertura forte nos primeiros 2-3 s (foco, não acúmulo), imagem nunca embaçada, legibilidade, voz manda sobre qualquer trilha, números verificáveis, sem marca/personagem de terceiros sem o Enzo pedir, e fechamento limpo.
Se o pedido for ambíguo entre os modos, o diretor decide pelo que serve melhor e segue (o painel não responde perguntas).

**Modo vídeo bruto** — quando o Enzo envia o próprio vídeo (`public/uploads/<id>/bruto.*`). Tem prioridade sobre os outros dois: o vídeo dele é a base e **a voz é a dele** (nada de voz gerada). O trabalho é editar o vídeo completo, como um editor profissional de conteúdo curto:
1. `narracao` roda `.venv-whisper/bin/python tools/bruto.py <video> <sx>` — padroniza o vídeo, transcreve com tempo por palavra e corta as pausas (`--pausa=0.45` padrão; `--sem-cortes` se o pedido quiser o vídeo corrido). Gera `public/bruto/<sx>/fonte.mp4` e `src/narration-<sx>.json` (falas já no tempo do vídeo cortado + `cortes` + `totalFrames`). A `narracao` confere a transcrição e corrige palavras erradas no JSON (sem mexer nos tempos).
2. `motion` monta a timeline com o componente PRONTO `src/components/bruto/VideoCortado.tsx` (`src={n.fonte} cortes={n.cortes}`, duração = `n.totalFrames`) + `CaptionsStyled` com `lines={n.lines}`; acrescenta por cima texto de impacto nas palavras-chave, e clipes/imagens de apoio (b-roll) só onde a fala cita algo mostrável — pedir ao `imagem`.
3. `som` só efeitos em eventos visuais, sempre abaixo da voz; `render` e `revisor` como sempre (o revisor confere se nenhum corte comeu palavra).
Transcrição roda na CPU (~1/3 da duração do vídeo): nunca junto com render.

## Avaliações do Enzo (aprendizado)

`.claude/memoria/avaliacoes.md` é gravado pelo painel quando o Enzo avalia um vídeo: 👍 = esse tipo de escolha deu certo, repetir; 👎 = o motivo escrito é defeito a evitar. O `diretor` lê antes de planejar e leva as lições relevantes para o texto das tarefas; o `revisor` usa os 👎 como lista de conferência. Não editar à mão.

## Caixa de ferramentas (vale nos dois modos)

- **Vídeo:** `node tools/fetch-videos.mjs "consulta" --n=4 [--vertical] [--pasta=x]` → `public/videos/<pasta>/clip-NN.mp4` (H.264, sem áudio) + `manifest.json` com licença. Fontes: Pexels e Pixabay (chave grátis em `/root/secrets/pexels.env` / `pixabay.env`, opcional) e Wikimedia Commons (sem chave). No Remotion: `<OffthreadVideo src={staticFile(...)} muted startFrom endAt playbackRate style={{objectFit:"cover"}}/>` (nunca `<Video>` no render). Clipe mais curto que a cena: cortar/`playbackRate`, não congelar.
- **Imagem:** `node tools/fetch-images.mjs` (ver agente `imagem`).
- **Vídeo não é obrigatório:** em cada cena vale o que ficar mais bonito e fiel ao texto, clipe ou foto. Clipe feio ou fora do assunto nunca entra (pedido do Enzo, 23/09/2026).
- **Efeitos do Remotion:** `spring`, `interpolate`, `Easing`, `Sequence`, `Series`, `AbsoluteFill`, `Img`, `loop`; máscaras e recortes com SVG/`clipPath`; strokes animados (`strokeDashoffset`); contadores; parallax; zoom/pan (Ken Burns) em foto ou vídeo; cortes no ritmo da fala; texto por palavra (`WordReveal`) e legendas (`components/captions`). Transições prontas em `components/CinematicTransition.tsx`. Só instalar dependência (ex.: `@remotion/transitions`) se um efeito realmente precisar.
- **Legenda "rápida"** (`CaptionsStyled`, `posicao="meio"|"baixo"|"alto"`): o `diretor` escolhe a posição conforme o vídeo (meio se a tela está livre; baixo/alto se há texto de impacto, título ou assunto no centro) e passa ao `motion`; o `revisor` confere num still.
- **Voz:** edge-tts grátis `pt-BR-AntonioNeural` por padrão (ver princípio 3).
- **Áudio:** efeitos sonoros sintetizados por `tools/generate-audio.mjs`; trilha só se o Enzo pedir.
- **Licença/crédito:** vídeos e imagens ficam nos manifests; `creditos.mjs` cobre as imagens do modo história, e no modo livre o diretor lista as fontes de vídeo/imagem no resumo final.

## Princípios da peça

1. **Metáfora, não abstração.** Cada cena tem uma imagem que significa o texto (ampulheta, colunas, fases da lua, brotos, respiração, amanhecer). Pontos e linhas aleatórias foram rejeitados como genéricos.
2. **Som só onde há evento visual.** Cena sem acontecimento fica em silêncio.
3. **Uma voz no filme inteiro: Will (ElevenLabs)**, padrão de todo vídeo (decisão do Enzo em 23/09/2026 à noite: pagou o plano). Se a cota da ElevenLabs não cobrir o vídeo inteiro, cai sozinho para o edge-tts grátis `pt-BR-AntonioNeural`, sem misturar as duas.
4. **Todo áudio é sintetizado por código.** Sem stock, sem samples.
5. **Entregar integrado**, não em forma de instruções para o usuário executar.

## Série "Você sabia" (MODO HISTÓRIA — documentários curtos)

Formato repetível: gancho "Você sabia que..." → fato surpreendente → como começou → problema → decisão → transformação → grande feito → escala → fechamento. Documentário real, não motion graphics genérico — imagem real da empresa é protagonista.

**Padrão de qualidade da série:** foto real por 4-7s com movimento dentro dela (zoom/pan/parallax, nunca troca de cena só por trocar), legendas e textos derivados do timing da narração (nunca frame cravado), e rigor de verdade visual — foto moderna nunca carimbada com data antiga, imagem nunca afirma mais do que a cena diz.

**Abertura impactante (primeiros 2-3 segundos).** O início tem que impactar na frase E no que aparece na tela. O `diretor` usa a própria criatividade para achar o momento/imagem mais forte da história e abrir com ele (ex.: uma foto marcante já em foco, um detalhe surpreendente, um contraste). Impacto vem de **foco e escolha**, não de acúmulo: NÃO encher a abertura de efeitos, cortes rápidos, flashes ou textos. Uma ideia só, clara; pode ser só uma foto forte com a frase. Vale para todo vídeo novo, sem o Enzo precisar pedir. O `diretor` inclui esta diretriz, com a ideia de abertura que escolheu, no texto de toda tarefa para `motion` e `narracao`, e o `revisor` confere os primeiros 3 s (still + fala) contra ela.

**Imagem NUNCA aparece embaçada.** Toda imagem do vídeo tem que ser vista nítida, inteira e reconhecível. Proibido usar cópia desfocada da foto como fundo/preenchimento do quadro (nem "parallax" entre inset nítido e cópia borrada). Se a foto não preenche o 9:16, recorte/enquadre com zoom-pan nítido ou componha com cor/gráfico sólido — não com borrão. **Única exceção:** a imagem embaçada que serve de base para um texto por cima (legibilidade do texto), e só na cena em que o texto está lá. Pedido repetido do Enzo; o `revisor` reprova o vídeo se achar imagem embaçada sem texto sobre ela.

**História antiga não pode ter cara de vídeo antigo.** O material histórico real é a base, mas a apresentação é moderna e cinematográfica. Nunca uma peça dominada por preto, branco e cinza: foto em preto e branco entra sem colorização artificial, como recorte/camada com profundidade (sombra, luz, parallax) sobre fundo com cor e acentos de cor, tipografia com identidade e pequenos elementos gráficos discretos. Cada momento da história pode ter seu clima de cor (ex.: quente na conquista, frio na perda, brilhante na virada), sem virar carnaval. Foto parada sem composição é slide: sempre dar movimento e enquadramento.

**Três níveis de texto, com hierarquia clara.** (1) Narração = voz principal. (2) Legenda = acompanha a fala, embaixo, legível (não pequena) e com identidade própria — não pode parecer legenda automática de rede social. (3) Texto de impacto = só a informação-chave do momento (data, nome, número), grande, 1-3 palavras, entrando na palavra exata em que a voz a diz. Nunca frase inteira grande na tela.

**Timing por palavra.** Legenda e texto de impacto usam o tempo real de cada palavra falada (`words` no `narration-*.json`, medido do áudio), não estimativa por proporção de caracteres. A fonte única continua sendo o `narration-*.json`; não criar timeline paralela.

**Efeitos sonoros marcam acontecimentos, não transições.** Só onde algo importante acontece (revelação, virada, data-chave, nome-chave). Poucos, elegantes e curtos; nunca "porque a cena mudou". Nunca interrompem a voz. (Isto é efeito, não trilha — ver "SEM trilha de fundo por padrão" abaixo.)

**SEM trilha de fundo por padrão.** Nenhum vídeo novo leva música de fundo a menos que o Enzo peça explicitamente para aquele vídeo. Se pedir, aí sim: contínua, suave, cinematográfica e moderna, com evolução gradual — começa contida e cresce até o ponto emocional (a virada da história e o fechamento). Preferir faixa real royalty-free (CC0/CC BY/domínio público) escolhida pelo Enzo ouvindo candidatas, no lugar de trilha sintetizada por código, que soa fraca; o crédito obrigatório vai na descrição da publicação junto com o das imagens. Efeitos sonoros (não confundir com trilha) podem seguir sintetizados e continuam valendo sempre.

**Se houver trilha (só por pedido), ela fica BAIXA: a voz manda.** Sob a fala, a trilha precisa ficar bem abaixo da voz (meta: pelo menos ~15 dB abaixo da voz em loudness de curto prazo) e ainda ducka mais em cada fala; só sobe um pouco (moderadamente, nunca alta) onde não há voz, como no fecho. Faixa real costuma vir alta e dinâmica: reduza o ganho e comprima, e MEÇA a mistura (voz + trilha com o duck aplicado) em vez de supor. Trilha que compete com a narração é defeito.

**Final com recompensa narrativa.** O fechamento retoma a pergunta do gancho e a responde de forma satisfatória: cadeia clara de causa e efeito, imagem histórica forte, e um encerramento limpo (com música no ponto emocional só se houver trilha) — nunca uma frase genérica solta.

**Duração alvo: 75-90s.** Não é regra matemática rígida, mas não comprimir a explicação só para bater número.

**Continuidade é regra, não detalhe.** A narração deve soar praticamente contínua: micropausa natural entre frases (respiração, ênfase), nunca silêncio longo que dê sensação de vídeo parado. Frase deve emendar na próxima ("Em 1997... Um ano depois...", não "Em 1997." [silêncio] "Um ano depois..."). Efeito sonoro nunca interrompe a voz — toca por cima, curto, a fala continua. Se houver trilha (só por pedido), ela nunca cai a zero sob narração, só duck. Sensação o tempo todo: voz + movimento (+ trilha, se houver), nunca "morto".

**Números reais sempre contextualizados**, nunca soltos. "US$ 1 bilhão" sozinho não conta nada — prefira "começou com X, chegou a Y" ou "de X para Y". Só número verificável (ver "Precisão factual" abaixo); não inflar, não usar estimativa como se fosse oficial. Não sobrecarregar uma cena com mais de 1-2 números.

**Número de crescimento (assinantes, receita, usuários, etc.): número real e citável sempre primeiro.** Buscar (web) antes de escrever qualquer roteiro com números. Só na ausência comprovada de dado real disponível um número **ilustrativo** pode entrar no roteiro — e mesmo assim:
- decisão explícita do Enzo por vídeo, não default automático;
- **o Enzo assume a responsabilidade de sinalizar que não é real ao editar/publicar** (ele mesmo adiciona o aviso depois) — o `diretor`/`revisor` não bloqueia a entrega por falta desse aviso, mas devem apontar no relatório final quais números do vídeo são ilustrativos, pra não passar batido.
- nunca inventar número quando existe dado real disponível por busca simples.

## Créditos das imagens (série "Você sabia")

Não escreva código para isso: `node tools/creditos.mjs <peca> <sufixo>` (ex.: `node tools/creditos.mjs disney df`) lê `src/utils/imagens-<sufixo>.ts` e grava `out/<peca>-creditos.txt`. Um comando, sem gasto de token.

## Sistema modular (Diretora → Biblioteca → Motor)

Arquitetura em camadas: a **diretora** monta uma `spec.json` (timeline em dados) escolhendo componentes do **catálogo**; o **Motor** (`src/engine/`) renderiza a spec com a **biblioteca**; o Remotion é só o renderizador. As peças antigas (`src/<Peca>.tsx` hand-coded) continuam intactas.

```
biblioteca/componentes/<id>/   meta.json + implementação (12 componentes)
biblioteca/temas/<id>/         tema (cores + fontes) — registro em biblioteca/temas/registro.ts
src/engine/spec.ts             schema zod da spec (validaSpec) — formato video | post | carrossel
src/engine/registro.ts         id → componente (1 linha por componente novo)
src/engine/Motor.tsx           renderiza a spec (cenas + tema + logo)
catalog/                       gerado por tools/catalog.mjs — é o que a diretora lê
src/specs/<sx>.json            spec da peça (ex.: piloto em src/specs/pi.json)
src/Biblioteca.tsx             preview de qualquer componente no Studio
```

Comandos:

```
node tools/catalog.mjs                                # regenera catalog/ (avisa registro faltando)
node tools/spec-composicao.mjs src/specs/<sx>.json    # gera src/<Peca>.tsx + Root + <sx>.cenas.json
node tools/render-post.mjs src/specs/<sx>.json [pasta] # post/carrossel: 1 JPG por cena (still, sequencial)
npx remotion still src/index.ts Biblioteca x.png --props='{"componente":"texto_cta"}'  # preview
```

Novo componente: pasta em `biblioteca/componentes/` (meta.json + TSX) → 1 linha em `src/engine/registro.ts` → `tools/catalog.mjs`. Nada mais muda.

## Limites da máquina

VPS Ubuntu 24.04, **2 CPUs**, 7,8 GB de RAM (~3 GB livres: os serviços de produção rodam no mesmo host), **sem GPU**.

- Render pesado: usar `--concurrency=1` (ou 2) e conferir RAM antes.
- **Um processo pesado por vez.** Dois em paralelo entram em swap e congelam sem erro.
- Para saber se um processo está vivo: `pgrep -a node`, `pgrep -a chrome-headless`, `ps aux --sort=-rss | head`.

## Delegação

Todo agente roda por um único comando, nunca pela ferramenta Agent:

```
tools/agente.sh <agente> "<tarefa completa e autocontida>"
tools/agente.sh <agente> @.tmp-tasks/<arquivo>.txt     # tarefa longa
tools/agente.sh                                         # mostra o modelo de cada agente
```

**Qual modelo cada agente usa fica só em `modelos.json`** (agente → perfil → provedor). Para trocar, edite uma linha lá; prompts e scripts não citam modelo. O painel chama o `diretor` pelo mesmo comando.

**Só o `diretor` pode usar Claude** (decisão do Enzo, 23/09/2026) — é quem planeja e decide, por isso justifica o modelo mais forte (`claude-opus`/`claude-sonnet` na escada). Todos os outros agentes (`imagem`, `narracao`, `motion`, `som`, `olho`, `render`, `revisor`) nunca sobem para Claude: o teto deles é `glm-flash` (glm-5.3-flash), o modelo mais forte que têm disponível. O `Jev` (triagem/revisão) já roda num modelo próprio (`typesafe/jev-1.13`), fora dessa regra. **Exceção autorizada (30/09/2026):** o `assessor` de prompts (`tools/assessor.py`, aba Assessor do painel) usa o Opus pela assinatura para escrever prompts e aprender o gosto do Enzo (`painel/assessor/aprendizado.md`); quando estiver bom, o Enzo troca a linha `assessor` no `modelos.json` para um modelo mais barato. Ele só escreve prompt: quem cria a imagem continua sendo o Jev.

Cada tarefa é um processo `claude` novo, sem memória da chamada anterior: descreva arquivos, frames e o resultado esperado por completo. O agente edita arquivos do projeto e devolve o texto final. `ds.log` registra `▶` (início) e `■` (fim, com perfil, modelo, tempo e negações) ou `✖` (caiu). Chaves em `/root/secrets/*.env` (nunca ler nem imprimir).
