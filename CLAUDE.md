# LifePhases

Curta de motion design em Remotion — "Você não está atrasado". 1080x1920, 30 fps, vertical.

Responder ao usuário **em português**. Comentários e identificadores no código seguem em inglês.

## Equipe de agentes

O trabalho é dividido por procedimento. Peça amplo ou que cruze áreas vai para o `diretor`, que delega.

| Agente | Domínio |
|---|---|
| `diretor` | dono da peça; timeline, ritmo, integração, delegação |
| `motion` | cenas e componentes visuais, animação, tipografia |
| `som` | trilha e efeitos sonoros |
| `narracao` | voz, roteiro falado, sincronia |
| `imagem` | buscar e baixar imagens da web para o `motion` |
| `navegador` | abrir o sistema no navegador, tirar prints das abas e a posição dos cliques (`tools/browser-tour.mjs`) |
| `render` | renderizar, medir, vigiar recursos |
| `revisor` | conferir contra o briefing antes de entregar |

Definições em `.claude/agents/`.

## Estrutura

```
src/LifePhases.tsx      timeline: as 7 cenas e a sobreposição entre elas
src/scenes/             uma cena por arquivo
src/components/         peças visuais reutilizáveis
src/utils/audio.ts      quais sons tocam em quais frames
src/narration.json      fonte única da narração (texto, frame, duração)
tools/generate-audio.mjs        sintetiza trilha e efeitos
tools/generate-narration.py     gera a voz
tools/watch-narration.mjs       barra de progresso da narração
tools/fetch-images.mjs          busca e baixa imagens (precisa do SearXNG local)
tools/vs/               checkout do VoiceStudio (não versionado)
```

## Comandos

```
npm run dev                                       # Remotion Studio
npx remotion render src/index.ts LifePhases out/life-phases.mp4 --log=error
npx remotion still src/index.ts LifePhases x.png --frame=<n> --log=error
node tools/generate-audio.mjs                     # trilha + efeitos
tools/vs/.venv/Scripts/python.exe -u tools/generate-narration.py
npx eslint src && npx tsc --noEmit
```

**Próximo vídeo em HyperFrames.** O AlvoManage é o último em Remotion. O vídeo seguinte usa `hyperframes` (já instalado), por decisão do usuário em 2026-10-05; veja a seção no `motion.md`.

## Princípios da peça

1. **Metáfora, não abstração.** Cada cena tem uma imagem que significa o texto (ampulheta, colunas, fases da lua, brotos, respiração, amanhecer). Pontos e linhas aleatórias foram rejeitados como genéricos.
2. **Som só onde há evento visual.** Cena sem acontecimento fica em silêncio.
3. **Uma voz no filme inteiro**, clonada de `public/audio/vo/_voice-ref.wav`. Gerar com `instruct` puro inventa um timbre novo a cada fala.
4. **Todo áudio é sintetizado por código.** Sem stock, sem samples.
5. **Entregar integrado**, não em forma de instruções para o usuário executar.

## Fluxo padrão dos vídeos do AlvoManage (aprovado em 2026-10-06)
`diretor` (Opus) escreve roteiro/plano e decide imagens e efeitos; `motion` (Opus) monta o vídeo inteiro em
**HyperFrames** (`hf-<nome>/`, 1080x1920, 30 fps) com som e sincronia; `narracao` gera a voz Lucas (ElevenLabs,
`tools/generate-narration-elevenlabs.mjs --json=<arquivo>`) só depois de o usuário aprovar o texto;
`navegador` só age com o ok do próprio usuário. Roteiro novo nunca repete vídeo anterior. Logo fixa no canto
superior esquerdo, nunca sem som. Render: `npx hyperframes render --quality looks --output ../out/<nome>.mp4`
em segundo plano, sem agente acompanhando (AlvoManage 3: ~11 min).

## Modelo híbrido: Claude + DeepSeek

Todos os agentes rodam em Claude. Só a `narracao` pode rodar em **DeepSeek** (modelo `deepseek-flash`), por custo.
`som`, `imagem` e `render` voltaram a ser Claude (decisão do usuário em 2026-10-05). O filme AlvoManage usa voz
só da ElevenLabs (`tools/generate-narration-elevenlabs.mjs`), sem DeepSeek na geração de voz.

**Por que não é um campo de configuração simples**: o Claude Code (2.1.276, a versão instalada aqui)
não tem roteamento de provedor por subagente — `model:` no frontmatter de `.claude/agents/*.md` só
aceita apelidos do próprio Claude, e trocar de backend (`ANTHROPIC_BASE_URL`) é de sessão inteira, não
por subagente. Por isso a integração com a DeepSeek é uma camada separada, não um toggle nos agentes.

**Como funciona**: `tools/deepseek-agent.mjs <agente> "<tarefa>"` roda um loop de ferramentas próprio
(bash restrito por allowlist, read_file, write_file, append_file, glob — inclusive leitura de imagem/
visão) contra `https://api.deepseek.com/anthropic` (endpoint compatível com a Anthropic Messages API,
confirmado em api-docs.deepseek.com/guides/anthropic_api), usando o mesmo `.claude/agents/<agente>.md`
e a mesma `.claude/memoria/<agente>.md` de sempre como prompt e memória. O `diretor` chama esse script
via Bash quando quer delegar para um dos quatro; para `motion`/`revisor` continua usando o Agent tool
normal (Claude), sem qualquer mudança.

**Configurar a chave**: crie/edite `.env` na raiz (já no `.gitignore`, nunca versionado):
```
DEEPSEEK_API_KEY=sua-chave-aqui
```
A chave nunca vai para `.claude/agents/*.md`, `.claude/memoria/*.md`, código versionado ou prompt.

**Testar**:
```
node tools/deepseek-agent.mjs narracao "descreva seu papel em uma frase, sem usar ferramentas"
```
Confirmar que é DeepSeek de verdade (não Claude por trás): a resposta bruta da API traz
`"model":"deepseek-flash"` — dá pra ver rodando o mesmo `curl` que está no histórico deste projeto
contra `https://api.deepseek.com/anthropic/v1/messages` com o header `x-api-key`.

**Fallback**: se a chamada falhar (chave ausente, HTTP de erro, timeout, rate limit, resposta inválida,
comando de bash fora da allowlist, loop sem concluir em 20 turnos), o script sai com código != 0 e
imprime uma linha começando com `FALLBACK:` em stderr. Isso nunca é tratado como sucesso — quem chamou
o script deve delegar aquela tarefa específica para o Claude normal (Agent tool) em vez disso. Não há
fallback silencioso nem troca permanente de modelo por causa de uma falha isolada.

**Desligar a integração**: pare de chamar `tools/deepseek-agent.mjs` e delegue a `narracao` pelo
Agent tool normal (Claude), como antes — nada no projeto depende da DeepSeek para funcionar.

**Limitação conhecida**: a ferramenta `bash` do script só aceita comandos cujo início bate com uma
lista fixa por agente (dentro do próprio `tools/deepseek-agent.mjs`, constante `ALLOWED_BASH`) — é
mais restrito que o Bash real do Claude Code, de propósito, por ser um modelo de terceiro com acesso
real ao sistema de arquivos e shell.

## Limites da máquina

Intel Celeron 4205U @ 1.80GHz, **2 núcleos físicos** (2 lógicos, sem hyperthreading), 19,9 GB de RAM, GPU integrada Intel UHD 610 (sem CUDA — não acelera `torch`, útil só como saída de vídeo).

- Narração: 2 a 3 min por fala · Render: 15 a 20 min (estimativas antigas, feitas com uma CPU mais fraca ainda; pode ser mais rápido nesta máquina — confirme antes de assumir os mesmos tempos)
- **Um processo pesado por vez.** Dois em paralelo entram em swap e congelam sem erro. A CPU é fraca (2 núcleos reais, sem HT) mesmo com mais RAM disponível, então essa regra continua valendo.
- Para saber se um processo está vivo use `Get-Process` (PowerShell). `tasklist` com filtro devolve vazio de forma enganosa e já causou dois diagnósticos errados.
- O Python do Windows não abre caminhos acima de 260 caracteres — por isso o VoiceStudio fica em `tools/vs` e não no diretório temporário.
