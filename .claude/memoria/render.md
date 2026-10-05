# Memória — render

## 2026-09-16 — Com --log=error não há sinal de progresso
O MP4 só é escrito no fim, então durante o render o arquivo em out/ continua com a data antiga. Cheguei a afirmar ao usuário que o render não rodou por causa disso.
**Por quê:** arquivo com data velha durante o processo é normal, não é falha. Para saber se está vivo, meça CPU acumulado dos chrome-headless-shell — num render saudável passam de 10s de CPU a cada 12s de relógio.

## 2026-09-21 — Esta máquina é Linux e o que eu tinha anotado de Windows não vale
Uma entrada antiga mandava usar Get-Process e Get-CimInstance. Aqui é Ubuntu: use os comandos ps aux --sort=-rss, pgrep -a node e pgrep -a chrome-headless. Não conclua que um processo morreu porque um filtro voltou vazio — confirme pelo PID com ps -o args= -p PID.
**Por quê:** ferramenta errada dá saída vazia, e saída vazia parece processo morto.

## 2026-09-21 — interpolate com range de entrada decrescente derruba o render inteiro
src/scenes/cocacola/Scene7.tsx linha 101 chama interpolate com range de entrada [14, 2] e range de saída [0, 1] sobre dur menos frame. Range decrescente não é aceito e o Remotion aborta com inputRange must be strictly monotonically increasing but got [14,2], sem escrever arquivo nenhum.
**Por quê:** npx tsc --noEmit passa limpo porque é erro de execução, não de tipo. O filme CocaCola renderiza os frames 0 a 1750 e morre no 1751, que é o início da cena 7, frame 1757 menos o LEAD de 6, e não renderiza até o 1919. Os últimos 5,6 s do filme não existem. Antes de renderizar, procure interpolate com range literal e confira que é crescente. Para provar o ponto sem gastar 20 min, use a flag frames com A-B em volta da suspeita: aborta em segundos.

## 2026-09-21 — Still de frame único mostra texto cortado ao meio que NÃO é defeito
As cenas usam revelação por máscara, em que a palavra sobe por trás de um corte. Um still colhido no meio da animação mostra só a metade de baixo do texto e parece bug.
**Por quê:** reportei três frames como texto cortado antes de conferir. Renderize um frame 20 a 40 adiante do mesmo trecho. Se a palavra aparece inteira, era só a animação em curso. Nunca acusar corte de texto sem essa conferência.

## 2026-09-21 — O hook ds-guard exige comando de uma linha só e sem separador
Ele recusa antes de executar: o comando de memória livre com a flag m, o encadeamento com dois e-comerciais ou dois pipes, o redirecionamento de stderr para stdout, a crase, e QUALQUER comando multi-linha, acusando o caractere de nova linha. Também quebra o comando em cada ponto e vírgula, mesmo dentro de aspas, e então tenta validar o resto como se fosse outro comando. Evite ponto e vírgula, parênteses e aspas dentro do texto a gravar.
**Por quê:** custou muitas idas e voltas. Para RAM use cat /proc/meminfo. Para gravar arquivo de várias linhas, use cat com here-string em aspas simples precedidas de cifrão, com as quebras de linha escritas como barra invertida mais n.

## 2026-09-21 — Tempos reais nesta VPS
Render completo do filme: 15 a 25 min. Still de um frame: cerca de 10 a 20 s quando nada mais roda.
**Por quê:** dá prazo honesto em vez de chute. Contradiz a entrada antiga que dizia 4 núcleos — esta máquina tem 2 CPUs e 7,8 GB, com uns 3 GB livres.

## 2026-09-16 — Sempre confirmar a faixa de áudio
Depois do render, npx remotion ffprobe tem que mostrar Stream #0:1 ... Audio: aac. Sem ela, o vídeo saiu mudo.
