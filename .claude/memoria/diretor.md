# Memória — diretor

## 2026-09-16 — O usuário rejeita abstração genérica
Pontos e linhas aleatórias repetidos em toda cena foram recusados: "não combina nada com o que o vídeo quer passar". Ele pediu "coisas diferentes que vai deixar a pessoa assistindo com prazer de assistir".
**Por quê:** uma mesma trajetória abstrata em sete cenas lê como template pronto, não como peça autoral. Cada cena precisa de uma imagem que seja a própria ideia do texto.

## 2026-09-16 — Ele quer a entrega funcionando, não instruções
Ofereci que ele instalasse o app de voz e me passasse os arquivos. Resposta: "voce tem que fazer tudo junto nesse projeto para que quando estiver um video com narração voce ja colocar no video a vox".
**Por quê:** ele quer o resultado, não a tarefa. Prefira sempre o caminho automatizável dentro do projeto, mesmo que dê mais trabalho.

## 2026-09-16 — Ritmo: ele achou 57s arrastado
Pediu para acelerar. O alvo passou a ser ~45s, que era o piso do briefing original.
**Por quê:** silêncio demais entre as frases. Silêncio é intenção da peça, mas em excesso vira lentidão.

## 2026-09-16 — Ordem obrigatória quando mexe em tempo
Visual primeiro, narração depois, reposicionar falas, reposicionar efeitos, renderizar, conferir.
**Por quê:** as durações das falas só existem depois de geradas, e elas definem onde cada `frame` cai. Mexer fora dessa ordem faz refazer a narração duas vezes — e ela custa quase uma hora nesta máquina.

## 2026-09-16 — Um processo pesado por vez
Deixei render e narração rodando juntos. Os dois entraram em swap e congelaram por mais de uma hora sem erro nenhum.
**Por quê:** 4 núcleos e 7,9 GB de RAM, sem GPU. Não há paralelismo disponível aqui.

## 2026-09-16 — Não confie em `tasklist` filtrado
Concluí duas vezes que processos tinham morrido. Estavam vivos, segurando 3,6 GB. Use `Get-Process` no PowerShell.
**Por quê:** afirmar ao usuário que algo falhou quando está apenas lento destrói a confiança no relatório — e leva a matar e reiniciar trabalho que estava quase pronto.

## 2026-09-17 — O custo da narração é por CHAMADA, não por palavra
`generate-narration.py` gasta ~9-10 min por chamada ao modelo nesta máquina, praticamente igual para uma frase longa e para uma palavra só. Medido comparando "Em dois mil e treze, o Nubank começou..." com "Hoje, você provavelmente conhece o nome." — mesmo tempo.
**Por quê:** o número de falas, não o tamanho do texto, é o que define o tempo total. Um roteiro com fragmentos curtos ("Aprender.", "E outro.") multiplica o overhead fixo. A saída é gerar por grupo e fatiar o WAV de volta em um arquivo por `id` — a consolidação fica dentro do gerador e nada a jusante muda. Os 2-3 min/fala do CLAUDE.md são otimistas demais; conte ~10.

## 2026-09-17 — `Get-Process nome*` também mente, e pelo mesmo motivo
Concluí que a narração tinha morrido porque `Get-Process python*` voltou vazio. O processo estava vivo e trabalhando havia 50 minutos. Quem revelou foi `Get-CimInstance Win32_Process -Filter "Name like '%python%'"`, que ainda mostra a linha de comando completa e o PID pai.
**Por quê:** a lição antiga era "não confie em `tasklist` filtrado"; ela é mais larga — não confie em NENHUMA consulta filtrada por nome. Use `Get-CimInstance Win32_Process`. E confira a evidência indireta antes de declarar morte: uma fala leva ~10 min, então poucos arquivos novos é o esperado, não sinal de falha. Declarar falha no que está só lento leva a matar trabalho quase pronto.

## 2026-09-17 — Para saber o que um run está fazendo, leia o log dele
Perdi tempo tentando deduzir se a geração em andamento tinha lido os campos `grupo` comparando a data de modificação do `narration.json` com a hora de início do processo. Dedução errada: o script reescreve o JSON a cada fala medida, então o mtime é sempre recente e não diz nada sobre o que ele leu na partida. A resposta estava em uma linha do log: `... (10 falas em 4 chamada(s), float32)`.
**Por quê:** o processo anuncia o próprio plano na inicialização. Redirecione a geração para um log (`gen-<peca>.log`) e leia — é mais rápido e mais confiável que qualquer inferência por PID, por mtime ou por contagem de arquivos.

## 2026-09-17 — Imagem autêntica no lugar errado ainda é afirmação falsa
Na peça do Nubank, um screenshot real do app (dez/2023) tinha sido arquivado na cena que exibe "2013", e a foto da sede atual na cena que narra "escritório pequeno". Ambas legítimas, ambas mentindo pelo contexto.
**Por quê:** conferir licença e procedência não basta — o que a cena AFIRMA na tela também precisa bater com a imagem. O `fontes.json` ganhou um campo `epoca` justamente para essa pergunta ser respondível em dado, e não na memória de quem montou.
