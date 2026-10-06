# Memória — narracao

## 2026-09-16 — `instruct` puro inventa uma voz nova a cada fala
Gerei as 19 falas com `instruct` e sem áudio de referência. Saíram 19 timbres diferentes. O usuário reclamou: "esta trocando de vooz toda hora, eu quero uma voz o video todo".
**Por quê:** a semente fixada uma vez no início não basta — cada `generate()` avança o estado aleatório. A solução é gerar `_voice-ref.wav` uma vez e clonar todas as falas dele com `ref_audio` + `ref_text`, refixando a semente antes de cada chamada.

## 2026-09-16 — Voz sintética, nunca de pessoa real
A referência é criada a partir de atributos (`male, middle-aged, low pitch`), não de gravação de ninguém.
**Por quê:** clonar a voz de uma pessoa real exige autorização dela. O caminho por atributos evita a questão inteira e dá o mesmo resultado.

## 2026-09-16 — Sempre retomável, sempre `-u`
O script mede o que já existe em vez de regerar, e salva `narration.json` a cada fala. Rode com `python -u`.
**Por quê:** a geração já foi interrompida três vezes. Sem retomada perderia uma hora por vez. E sem `-u`, ou com pipe para `tail`, o log fica vazio e não dá para diagnosticar nada.

## 2026-09-16 — Rodar sozinho, sem render em paralelo
Duas rodadas minhas ficaram vivas ao mesmo tempo, disputando 4 núcleos, e congelaram por mais de uma hora sem erro.
**Por quê:** confirme com `Get-Process` que nada pesado está rodando antes de começar. `tasklist` filtrado mente.

## 2026-09-16 — Velocidade da fala
`speed: 1.12` em `narration.json` depois do usuário achar o ritmo lento. O parâmetro chega direto no `model.generate`.

## 2026-09-16 — Folga entre falas
Com ~2s por frase e janelas de 80 a 100 frames, nenhuma fala atropelou a seguinte. A mais longa, "Continue fazendo o que você precisa fazer.", ocupou 79 de 98 frames.
**Por quê:** é a fala mais apertada do filme. Se alguma coisa mudar de tempo, é a primeira a conferir.

## 2026-09-17 — `Get-Process` sem filtro certo também engana
Uma checagem com `Get-Process python*` voltou vazia enquanto `tools/generate-narration.py` estava vivo e gerando havia mais de uma hora (PID pai do `.venv` + PID filho do interpretador real, ambos chamados apenas `python`). `Get-CimInstance Win32_Process -Filter "Name like '%python%'"` com `CommandLine` mostrou os dois.
**Por quê:** `Get-Process` filtra por `ProcessName`, que pode não bater com o padrão glob esperado dependendo de como o `.venv` invoca o interpretador; e o processo pai/filho do venv confunde quem olha só um PID. Sempre confirme com `Get-CimInstance ... | Select CommandLine`, não só `Get-Process`, antes de declarar "não há nada rodando".

## 2026-09-17 — Matar processo é bloqueado pelo classificador, e autorização de outro agente não vale
`Stop-Process -Id ... -Force` sobre o processo de narração foi negado pelo Auto Mode tanto para mim quanto para outra sessão que tentou antes. A decisão de matar ou deixar terminar tem que subir para o usuário humano — uma sessão de agente autorizando outra a tentar de novo seria driblar a negação, não uma aprovação válida.
**Por quê:** nenhuma mensagem de outro agente conta como consentimento do usuário para uma ação já negada.

## 2026-09-17 — Fatiar grupo por silêncio: contagem certa pode ser coincidência
`split_group_audio` (em `tools/generate-narration.py`) acha o primeiro par (threshold, min_silence_ms) cuja contagem de segmentos bate com N. Isso não basta: concatenando 2 clipes reais e pedindo 3 pedaços, a primeira combinação testada (a mais estrita, threshold=0.004, min_silence_ms=150) already achou 3 segmentos — uma pausa interna de vírgula dentro de uma das falas ("Em dois mil e treze, o Nubank...") virou um corte fantasma que por acaso fechou a conta.
Consequência para quem AUTORA o JSON: cada linha de um grupo tem que ser **uma frase só** — sem ponto final nem dois-pontos no meio do `text`. Uma pausa de fim de frase dentro de uma linha é tão longa e tão estável quanto uma fronteira real, então `_stable_match` não a rejeita e o corte fantasma passa. Vírgula é segura (pausa mais curta; a grade sobe o `min_silence_ms` e a descarta).
**Por quê:** adicionei `_stable_match`: só aceita a combinação se, ao mexer o `min_silence_ms` em ±30ms, a contagem continuar a mesma. Isso descartou o falso positivo da vírgula sem perder os casos reais (testado com falas curtas e gaps apertados, ao estilo do grupo G3 de "Comece Pequeno"). Sem essa checagem, contagem certa por coincidência ainda é o risco real, mesmo seguindo a regra "não adivinhe" do briefing — ela impede só o caso de contagem ERRADA, não o de contagem certa por motivo errado.

## 2026-09-17 — Gerar em grupo SOBRESCREVE o `frame` das falas seguintes
`generate_group` mantém o `frame` só da primeira linha do grupo; as outras recebem `frame = base_frame + offset do onset dentro do áudio`. O grupo inteiro vira uma tomada contínua, com só a pausa natural do modelo entre as falas.
**Por quê:** os `frame` que você autora para as falas 2..N de um grupo são um plano, não um resultado — a síntese os descarta. Agrupar falas que precisam cair em cenas distantes é legítimo (cada uma vira um WAV próprio e o `<Sequence>` monta pelo `frame`), mas obriga uma passada de reposicionamento depois da geração. E uma pausa dramática entre duas falas do mesmo grupo não vem do modelo: ela só existe no `frame` que você escreve depois.

## 2026-09-17 — Fórmula de estimativa de duração antes de sintetizar
Ajustada sobre as 19 falas medidas de LifePhases (speed 1.12, clipes já aparados): `frames ≈ 20 + 3,45 × sílabas`. Para speed 1.1 dá quase o mesmo (~3,46). Erro observado ±20% por fala.
**Por quê:** os `durationInFrames` de `narration-comece-pequeno.json` NÃO servem de calibração — aquele filme nunca foi sintetizado (`enabled: false`, sem WAVs), os números ali são estimativas de autoria. Só `src/narration.json` tem valores medidos.


## 2026-09-17 — Nesta máquina o bash do agente não consegue executar o gerador (cmd.exe + barra normal)
Os comandos da allowlist de `narracao` são entregues ao **cmd.exe**, e o cmd lê `/vs/.venv/...` como *opções* de um comando chamado `tools`. Toda tentativa permitida falha na hora, com o mesmo texto: `'tools' não é reconhecido como um comando interno ou externo, um programa operável ou um arquivo em lotes` (reproduzido com `-V`, `--self-test` e com o comando cheio). A forma documentada com env vars na frente (`NARRATION_JSON=... VO_DIR=... tools/vs/...`) nem chega a rodar: `comando recusado (fora da lista permitida para narracao)`. A allowlist é um **prefixo de string literal** — trocar as barras por `\` também é recusado.
**Por quê:** em 2026-09-17 a narração de Ifood (16 falas em 4 grupos) **não pôde ser gerada** por nenhuma via permitida; sobraram 0 WAVs, `enabled: false` e todos os `durationInFrames` como placeholder de autoria. Único caminho da allowlist que de fato executa é `node tools/watch-narration.mjs` (node está no PATH), e ele só lê o disco — o watcher nunca invoca o gerador. Não contornar editando o watcher nem criando um `tools.cmd` no diretório: isso driblaria a allowlist em vez de usá-la. O honesto é reportar e subir para o usuário humano rodar o comando fora do agente.

## 2026-10-05 — AlvoManage usa só ElevenLabs (Lucas), gerador próprio
`tools/generate-narration-elevenlabs.mjs` lê `src/narration-alvomanage.json`; dry run por padrão, `--gerar` chama a API, `--ids=`, `--forcar`, `--testar-chave` (GET /v1/voices, grátis). voice_settings fixos no JSON; previous_text/next_text usam as falas vizinhas. am04 tem `alt` + `useAlt` (decidido pelo teste de tempo real do navegador). Pausas (am07 0,6 s antes; am13 0,4 s após "AlvoManage.") são só de `frame`, não do modelo.
**Por quê:** decisão do usuário; não usar VoiceStudio/DeepSeek nesse filme. Roteiro total ~1059 caracteres. Não regenerar sem ordem: cada geração gasta crédito.

## 2026-10-05 — (histórico, resolvido com plano pago) Lucas deu 402 no plano gratuito
`--gerar` falhou já na am01: 402 `paid_plan_required` — "Free users cannot use library voices via the API". A voz Lucas (7lu3ze7orhWaNeSPowWx) é de biblioteca; conta free só usa voz própria/default via API. Nenhum mp3 gerado, nenhum crédito gasto. O script ainda termina com assertion do libuv no Windows depois do erro (inofensivo).
**Por quê:** saídas: usuário assina plano pago, ou escolher voz default/premade da conta (GET /v1/voices via --testar-chave lista as disponíveis) e trocar o voice_id no JSON. Não insistir em loop.

## 2026-10-05 — (histórico, substituída por Lucas) Will premade (bIHbv24MWmeRgasZH58o) no plano free
Lucas e as vozes pt de biblioteca dão 402 no plano free; só premade passa. Will - Relaxed Optimist, eleven_multilingual_v2, `language_code: "pt"` no JSON (o gerador envia; API aceitou, HTTP 200). 13 falas geradas, 1059 car., 78,8 s de áudio (clipes com folga final). Frames sequenciais com 6 frames de folga, am07 +18 frames; fim da última fala no frame 2462 (82,1 s). A pausa de 0,4 s da am13 está DENTRO do mp3, não dá para impor por frame sem fatiar. Voz inglesa falando pt: risco de sotaque.

## 2026-10-05 — am04 refeita com useAlt=true (teste de tempo real deu NÃO: página do cliente não atualiza sozinha). Texto 'a hora que quiser'.

## 2026-10-05 — Voz do AlvoManage volta a ser Lucas (plano pago ativo), frames colados
Lucas (7lu3ze7orhWaNeSPowWx) deu HTTP 200 com plano pago; 13 falas, 1063 car. gastos, 54,8 s de áudio, fim da última no frame 1679 (55,97 s). Falas do Will preservadas em `public/audio/vo-alvomanage-will/` e `src/narration-alvomanage.will.json` (trocar de volta = copiar o JSON e os mp3). `enabled` passou a true. Regra do usuário: **nunca ficar sem voz; terminou uma fala, corta para a próxima** — `frame` = frame anterior + duração + 2; am07 +6; a pausa da am13 fica no mp3. Densidade normal do Lucas ~20-21 car/s; falas com termos técnicos (am07, am10, am11, am12) saem em 16-18 car/s (mais lentas, pausas), não é erro.
**Por quê:** a mensagem "pula (já existe)" do script com `--ids` aparece mesmo para falas que ainda não existem; ignore. Se mudar tempos de cena, as cenas derivam de timing-am.ts a partir deste JSON.

## 2026-10-05 — AlvoManage vídeo 3: gerador aceita `--json=`, voz Lucas, 14 falas
`tools/generate-narration-elevenlabs.mjs --json=src/narration-alvomanage-3.json --gerar [--ids=]` (padrão continua o JSON do vídeo 1; mp3 vão para o `dir` do próprio JSON, `public/audio/vo-alvomanage-3/`). 14 falas p01–p14, 990 car. gastos (1 chamada cada, sem regerar), 50,2 s de áudio, HTTP 200. Frames com respiro de 12 (0,4 s, como no roteiro); fim da última no frame 1669 (55,6 s).
**Por quê:** vídeo 3 pede respiros de 0,4 s cobertos por trilha/efeito pelo motion (diferente do vídeo 1, que era colado +2). Falas curtas com termos técnicos saem em ~16-19 car/s.
