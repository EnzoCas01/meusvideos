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

## 2026-09-16 — Um processo pesado por vez (o gargalo é CPU, não RAM)
Deixei render e narração rodando juntos. Os dois congelaram por mais de uma hora sem erro nenhum.
**Por quê:** Celeron 4205U, 2 núcleos físicos sem hyperthreading, e a GPU integrada não acelera torch. Não há paralelismo real aqui. A RAM (19,9 GB) é folgada e NÃO é o limite — a causa é contenção de CPU. Corrigido em 2026-09-17: a versão anterior desta entrada dizia "4 núcleos / 7,9 GB", números que nunca foram desta máquina e que levaram a economizar memória sem necessidade.

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

## 2026-09-17 — `generate_group` reescreve o `frame` de quase toda fala
Numa geração por grupo, só a PRIMEIRA fala do grupo mantém o `frame` que você escreveu. As demais recebem `frame = frame_da_primeira + onset dentro do áudio do grupo` — o grupo sai como uma tomada contínua, com apenas a pausa natural do modelo entre as falas.
**Por quê:** o passo "reposicionar `frame` conforme a nova timeline" deixa de ser opcional e passa a ser obrigatório depois de QUALQUER síntese agrupada. E, principalmente: **pausa dramática não vem do modelo** — o silêncio antes de uma revelação só existe no `frame` que você escreve depois. Planeje o valor da pausa junto com o roteiro, senão a revelação chega colada na frase anterior.

## 2026-09-17 — Agrupar para economizar chamada custa fidelidade de pontuação
O fatiador de grupo corta por silêncio, e uma pausa de fim-de-frase (ponto final ou dois-pontos) DENTRO de uma linha é indistinguível de uma fronteira real entre linhas — vira corte fantasma. A regra que funciona: **uma frase por linha; vírgula é segura, ponto e dois-pontos não.**
**Por quê:** frases do briefing com dois-pontos ("...uma decisão importante: a Movile investiu") precisam virar duas linhas. Isso não muda o texto, mas muda a contagem de falas — e portanto a conta de quantos grupos cabem.

## 2026-09-17 — Dtype da narração é decisão de peça inteira, não de fala
`DTYPE` em `generate-narration.py` (bfloat16 vs float32) muda o TIMBRE, não só o consumo. Trocar no meio de uma peça quebra a regra de um só locutor e obriga a regerar todas as falas, não apenas as que faltam.
**Por quê:** o bfloat16 padrão foi escolhido contra um limite de RAM que não existe nesta máquina (são 19,9 GB). Vale reavaliar — mas só ANTES da primeira chamada de uma peça nova, nunca com falas já gravadas no disco.

## 2026-09-17 — Pronúncia de marca é risco que eu não consigo verificar
Nomes estrangeiros e de marca ("iFood", "iPhone", "Android", "Disk Cook") podem sair com leitura errada, e nenhum agente do projeto consegue ouvir o resultado. Respelling fonético preventivo é pior: erra em outra direção.
**Por quê:** a saída não é adivinhar, é isolar o custo do conserto. Refazer UMA fala custa uma chamada (~10 min), não o filme todo: basta apagar o WAV dela — o gerador degrada só aquele grupo para falas individuais e pula as que já existem, mantendo a mesma voz clonada. Então: gere, e peça ao usuário para ouvir as falas de risco, nomeando quais são.

## 2026-09-18 — O Commons não tem foto de época para 2011-2018
Consulta de objeto cotidiano no Wikimedia Commons ("desk telephone office") devolve quase só material de arquivo em domínio público — de 1910 a 1970. Das 6 candidatas baixadas para a cena 2 do iFood (que exibe "2011" na tela), todas eram dessa faixa, e uma trazia um chefe de estado reconhecível no Salão Oval.
**Por quê:** o Commons é forte onde a licença já expirou, ou seja, justamente no que é ANTIGO. Para cena datada de 2011 em diante ele é a fonte errada por construção, e nenhuma reformulação de consulta corrige isso. Cena com ano na tela deve ser desenhada em código, ou a imagem tem que vir de outra fonte — decisão do usuário, não do agente de imagem.

## 2026-09-18 — O bash do `deepseek-agent.mjs` era cmd.exe, e isso impedia a narração
`execFileSync(cmd, {shell: true})` no Windows abre cmd.exe, que não executa `tools/vs/.venv/Scripts/python.exe` (barra normal) nem aceita `VAR=valor` antes do comando. Como a allowlist exige esse prefixo literal, o agente `narracao` ficava impedido de rodar exatamente o comando que lhe era permitido, e relatava o erro como se fosse do projeto. Corrigido: roda `bash -c`, a allowlist ignora o prefixo de env, e o teto de tempo virou 75 min para `narracao` e 45 min para `render`.
**Por quê:** os 15 min genéricos de timeout matavam no meio qualquer narração (4 chamadas × ~10 min) ou render (15-20 min), e o agente reportava "timeout" para algo que estava só rodando. Antes de culpar o script da peça, confira em que shell o comando delegado está realmente caindo.

## 2026-10-05 — AlvoManage: com ElevenLabs a voz vem ANTES do motion fechar tempos
Na peça de produto do AlvoManage a voz é ElevenLabs (Lucas), que é rede e não CPU, rápida e barata em tempo. Então a ordem inverte: roteiro aprovado → captura (navegador) → voz → motion monta com as durações medidas → reposiciona frames → som → render → revisor. A voz pode rodar junto com trabalho de código, nunca junto com render.
**Por quê:** a regra "visual primeiro" existia porque a voz local custava ~10 min por chamada. Sem esse custo, a duração real das falas é o melhor dado para cortar o vídeo. Ainda assim: só gerar depois do ok do usuário no roteiro (gasta crédito).

## 2026-10-05 — AlvoManage: o que o roteiro pode e não pode afirmar
Pode (verificado): página do cliente `/acompanhar/<uuid>` sem login, com stepper Em Aberto/Pronto/Entregue, aparelho, defeito, laudo, itens, valor, garantia e assinatura; Produtos com preço/custo/lucro/estoque; Painel com contadores e alerta de OS parada há mais de 5 dias; WhatsApp **só com a ressalva "com o plano de WhatsApp"** (o próprio aviso de plano do sistema diz: mensagem automática ao marcar Pronto, envio da OS em um clique, comprovante do PDV no WhatsApp). Não pode sem confirmação: "tempo real" (só fica se o teste do navegador confirmar; senão "a hora que quiser"), PDV baixando estoque, aprovar orçamento pelo link (não existe), comparação com concorrente. Na tela nunca: aviso "Caixa fechado", Fluxo de Caixa (-R$ 0,10 + aviso de roadmap), tela de WhatsApp/Loja Virtual (bloqueadas; WhatsApp entra só como desenho).
**Por quê:** vídeo de produto que promete o que o sistema não faz vira problema comercial para o usuário. Roteiro e plano em `docs/alvomanage-roteiro.md`.

## 2026-10-05 — AlvoManage: roteiro aprovado, 13 falas am01–am13, ~203 palavras
Usuário aprovou o roteiro e pediu o WhatsApp, entrando como am06 entre "o que o cliente vê" e a piada "o telefone toca bem menos" (o aviso automático vira causa da piada). Para caber na meta 70–80 s foram cortados "lá" (am02), "o serviço" (am05), "ordem de serviço"→"OS" (am08) e "Clientes, estoque, tudo junto." (am10). Estimativa ~78 s, topo da meta. Usuário autorizou ao navegador: testar tempo real na OS #13 (mudar para Pronto e voltar), abrir o caixa da demo, regravar clipes. NÃO autorizou mexer em datas de OS.
**Por quê:** a 2,7 pal/s cada fala nova custa ~6–7 s; acima de ~205 palavras o filme passa de 80 s. Se a voz medir longa, encurtar respiros antes de mexer no texto aprovado, e perguntar antes de cortar frase.

## 2026-10-05 — Lucas fala ~19,4 caracteres/s; a régua de 2,7 pal/s superestima ~35%
Medido no vídeo 1 do AlvoManage: 1063 caracteres em 54,8 s de fala (~4 pal/s). Para estimar duração de roteiro com o Lucas, use caracteres/19,4 e some os respiros (~0,4 s por troca + 1,5 s no fecho).
**Por quê:** o roteiro do vídeo 1 foi estimado em ~78 s e saiu com ~61 s. ~870–900 caracteres dão ~50 s de vídeo.

## 2026-10-05 — AlvoManage vídeo 2: decisões do usuário
HyperFrames (não Remotion), 1080x1920 30 fps, TikTok/Reels; voz Lucas; abertura forte com frame 0 cheio; nunca sem SOM; efeitos -5 dB e trilha +2 dB em relação ao vídeo 1, voz dominante; sistema aparece só às vezes (zoom/mouse), resto desenho; medir o render do HyperFrames. **Logo fixa** pequena, só a logo, fundo transparente, no canto superior esquerdo o vídeo todo (abaixo de ~y 230 por causa da interface do TikTok/Reels; a direita é da coluna de botões). O usuário **NÃO quer mais menções ao AlvoManage nas falas** que as naturais do assunto + fecho (pediu e desistiu no mesmo dia). Proposta: ideia "Tá na garantia!" (termos de garantia na OS, assinatura, Garantias Ativas), em `docs/alvomanage-2-roteiro.md`, aguardando escolha.
**Por quê:** evita refazer as rodadas de decisão; a marca entra pela imagem (logo fixa), não pela voz.

## 2026-10-06 — Vídeo da garantia retomado e revisado contra os vídeos 1 e 3
Texto final em `docs/alvomanage-2-roteiro.md` (12 falas g01–g12, 906 car., ~52,6 s). Cortados: assinatura (am05 do vídeo 1), painel Garantias Ativas (0 na demo), "papel sumido" (am02), fecho "AlvoManage. + frase" (forma dos vídeos 1 e 3), abertura de objeto batendo no balcão (vídeo 3). Ângulo novo: o que vale e o que não vale, pelos termos escritos na OS. Única tela: recortes de `os_aberta.png`, sem a faixa do link e sem a assinatura.
**Por quê:** cada vídeo novo herda vocabulário e cenas dos anteriores sem perceber; a repetição também é de FORMA (estrutura do fecho, tipo de abertura), não só de assunto.

## 2026-10-05 — Na demo, "Garantias Ativas" está zerado e os termos "90 dias" são texto da conta
Print `os_dashboard_100.png`: contador e quadro Garantias Ativas = 0 ("Nenhuma garantia ativa"). `os_aberta.png` tem Termos de Garantia completos (90 dias da entrega; não cobre queda, trinca, água etc.), Entrada/Previsão/Saída, Defeito, Laudo, Fotos e Assinatura do Cliente.
**Por quê:** mostrar o contador zerado contradiz qualquer fala sobre ele; popular exige marcar OS como entregue (alteração de dado — pedir ao usuário).

## 2026-10-05 — Humor = jeito de falar, NÃO piada montada
O usuário pediu "humor de verdade, estilo narrador" e, vendo a proposta (documentário de natureza com "Homo balconensis", "bagunça em extinção", punchlines marcadas), corrigiu: sem piadas, sem gag, sem trocadilho; só conversa natural, leve, com graça espontânea ("Normal, acontece.", "Ou ia ser anotada depois, né.").
**Por quê:** "engraçado" para ele é o tom de quem conta um caso do balcão, não esquete. Não montar conceito cômico nem cartela de piada; a edição também fica limpa.

## 2026-10-05 — AlvoManage vídeo 3: posicionamento
O usuário pediu um vídeo de posicionamento ("mais confiável", "encher a bola"). O roteiro da garantia (vídeo 2) ficou guardado. Proposta em `docs/alvomanage-3-roteiro.md`: 14 falas, 864 caracteres, ~51 s, tom de conversa natural. "Confiável" = nada se perde / tudo registrado / cliente acompanha / dono vê tudo; nunca backup, segurança ou disponibilidade (sem dados), nunca marca concorrente. Piadas só à custa de papel, caderno, planilha e bagunça.
**Por quê:** vídeo de posicionamento empurra para superlativo e comparação; a régua é: só afirmar o que está na tela, e comparar só com "o jeito antigo". Estoque/transferência/cotação/compras ficaram fora da voz porque não foram verificados de verdade (transferência só formulário vazio; cotação/compras nunca abertas).
Atualização 5: **regra do usuário — vídeo novo NÃO pode repetir nada do vídeo 1** (link do cliente, OS registrada, alerta de OS parada, painel, PDV/produtos/financeiro, várias lojas, fecho "AlvoManage." seco). Conferir fala a fala contra `docs/alvomanage-roteiro.md` antes de entregar; o vídeo da garantia também fica reservado. As "falas de reforço" no fim do roteiro são onde a repetição escorrega. p05 final: o gerente vê carregador sobrando e não sabe de onde veio (sem dizer que é o quebrado); p11 Movimentações (cada saída com origem) responde.
Atualização 4 (texto fechado): p08 = "O defeituoso não volta pro estoque. Fica separado, fora do que tá à venda." (vale com ou sem fornecedor; "pronto pro fornecedor" só com fornecedor cadastrado). Leitura final pelo navegador descartada: o vídeo não depende dela. Logo do usuário em `public/images/alvomanage/logo/logo-alvomanage.png` tem "Alvo" quase preto (#1a1a1a) que some no fundo escuro: decisão = variante `logo-alvomanage-claro.png` só com o preto → branco (como o cabeçalho escuro do próprio app), uma variante o vídeo todo, drop-shadow curta, área da logo sempre sobre fundo escuro/médio. Falta só o ok do usuário no texto.
Atualização 3 (comprovado pela troca de teste, prints `troca_*`): PDV > botão Troca exige número de uma venda e abre Vendas > Devolução/Troca; checkbox "Produto trocado veio com defeito — Não volta pro estoque à venda — já sai e entra acumulando em Estoque > Trocas, pronta pro fornecedor"; Movimentações mostra "Troca — novo produto entregue −1" e nenhuma entrada do defeituoso. A aba Estoque > Trocas é o lote para o FORNECEDOR, e só recebe a peça se o produto tiver fornecedor cadastrado (toast: "ficaram fora do estoque, mas não entraram em Trocas"). Nunca dizer "lista de trocas daquele produto". Demo ficou com Venda PDV#1 + TROCA#1 do Cabo USB-C (−2 no estoque), caixa R$ 29.
**Lição:** o navegador foi interrompido sem relatório, mas os prints com nome de passo (antes/depois) permitiram reconstruir tudo. Ler os prints antes de pedir nova rodada.
Atualização 2: o usuário rejeitou caderno/planilha como contraste. O contraste certo é: troca lançada como **devolução comum** → o defeituoso volta pro estoque como se fosse bom e é vendido de novo; no AlvoManage o defeituoso vai pra **lista de trocas do produto** (não volta ao estoque) e o novo sai do estoque sozinho. Dizer como "jeito comum de lançar", nunca como fato sobre outros sistemas. Destino do defeituoso ainda a confirmar pelo navegador; se ele também voltar ao estoque no AlvoManage, o vídeo precisa ser repensado.
Atualização 1: o usuário pôs a **troca de produto defeituoso** como momento central (Troca no PDV → lista de trocas do produto → produto novo sai do estoque sozinho; menus Vendas > Devolução/Troca e Estoque > Gerenciamento de Trocas). **Não verificado ainda**: p07–p10 têm fala alternativa, e troca de teste na demo só com autorização. O usuário acha que "quase nenhum sistema tem isso" — NUNCA dizer nem insinuar no vídeo (sem prova).

## 2026-09-18 — Tarefa grande demais faz o agente DeepSeek estourar os 20 turnos
Pedir duas cenas de imagem numa só chamada consumiu os 20 turnos em buscas e o loop morreu sem entregar nada (`FALLBACK:`). Uma cena por chamada, com o plano de passos escrito na própria tarefa, conclui em 5 a 12 turnos.
**Por quê:** o limite de turnos é do `deepseek-agent.mjs`, não do modelo, e conta CADA ferramenta. Tarefa que precise de mais de ~8 ações não cabe. E o loop também encerra às vezes sem texto final nenhum — então nunca conte a etapa como feita pelo relatório: confira o disco (arquivo existe? `fontes.json` mudou?).
