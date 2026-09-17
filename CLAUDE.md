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

## Princípios da peça

1. **Metáfora, não abstração.** Cada cena tem uma imagem que significa o texto (ampulheta, colunas, fases da lua, brotos, respiração, amanhecer). Pontos e linhas aleatórias foram rejeitados como genéricos.
2. **Som só onde há evento visual.** Cena sem acontecimento fica em silêncio.
3. **Uma voz no filme inteiro**, clonada de `public/audio/vo/_voice-ref.wav`. Gerar com `instruct` puro inventa um timbre novo a cada fala.
4. **Todo áudio é sintetizado por código.** Sem stock, sem samples.
5. **Entregar integrado**, não em forma de instruções para o usuário executar.

## Limites da máquina

Intel i3-3220, **2 núcleos físicos** (4 lógicos via hyperthreading, não conta como paralelismo real), 7,9 GB de RAM, **sem GPU**.

- Narração: 2 a 3 min por fala · Render: 15 a 20 min
- **Um processo pesado por vez.** Dois em paralelo entram em swap e congelam sem erro.
- Para saber se um processo está vivo use `Get-Process` (PowerShell). `tasklist` com filtro devolve vazio de forma enganosa e já causou dois diagnósticos errados.
- O Python do Windows não abre caminhos acima de 260 caracteres — por isso o VoiceStudio fica em `tools/vs` e não no diretório temporário.
