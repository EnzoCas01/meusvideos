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
**Por quê:** adicionei `_stable_match`: só aceita a combinação se, ao mexer o `min_silence_ms` em ±30ms, a contagem continuar a mesma. Isso descartou o falso positivo da vírgula sem perder os casos reais (testado com falas curtas e gaps apertados, ao estilo do grupo G3 de "Comece Pequeno"). Sem essa checagem, contagem certa por coincidência ainda é o risco real, mesmo seguindo a regra "não adivinhe" do briefing — ela impede só o caso de contagem ERRADA, não o de contagem certa por motivo errado.
