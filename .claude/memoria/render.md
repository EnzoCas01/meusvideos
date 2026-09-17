# Memória — render

## 2026-09-16 — Com `--log=error` não há sinal de progresso
O MP4 só é escrito no fim, então durante o render o arquivo em `out/` continua com a data antiga. Cheguei a afirmar ao usuário que o render "não rodou" por causa disso.
**Por quê:** arquivo com data velha durante o processo é normal, não é falha. Para saber se está vivo, meça CPU acumulado dos `chrome-headless-shell` — num render saudável passam de 10s de CPU a cada 12s de relógio.

## 2026-09-16 — `tasklist` filtrado devolve vazio enganoso
Duas vezes concluí que processos tinham morrido. Estavam vivos: dois Python segurando 3,6 GB, e depois o próprio render.
**Por quê:** use `Get-Process`. Antes de encerrar um processo, confirme pela linha de comando com `Get-CimInstance Win32_Process` que é deste projeto.

## 2026-09-16 — Tempos reais nesta máquina
Render completo do filme: 14 a 20 min (4 núcleos, sem GPU). Still de um frame: menos de 1 min quando nada mais roda, vários minutos quando há disputa.
**Por quê:** serve para dar prazo honesto ao usuário em vez de chute.

## 2026-09-16 — Sempre confirmar a faixa de áudio
Depois do render, `npx remotion ffprobe` tem que mostrar `Stream #0:1 ... Audio: aac`. Sem ela, o vídeo saiu mudo.

## 2026-09-16 — Nunca declarar pronto sem ver o arquivo
Confirme data e tamanho novos em `out/` antes de avisar que terminou.
