# AlvoManage — vídeo de produto nº 1: roteiro e plano

Vertical 1080x1920, 30 fps. Alvo: **~78 s** (meta 70–80 s). Voz: ElevenLabs, Lucas
(`7lu3ze7orhWaNeSPowWx`), `eleven_multilingual_v2`, só ela. Trilha e efeitos sintetizados por código.
Estimativa: 2,7 palavras/s (medir de verdade depois de gerar; Lucas "social media" pode sair mais rápido).

Status: **ROTEIRO APROVADO PELO USUÁRIO (2026-10-05), com WhatsApp incluído (fala am06).** Texto final das
falas na seção 1. Gerar voz só depois que o `navegador` devolver o resultado do teste de tempo real (decide am04).

---

## 1. Roteiro de falas (FINAL)

Uma fala por arquivo em `src/narration-alvomanage.json` (id entre colchetes). Pausas planejadas entre parênteses
— pausa não vem do modelo, vem do `frame` que a gente escreve.

| # | Cena | Fala (exata) | Pal. | Fala ≈ | Cena ≈ | Início ≈ |
|---|---|---|---|---|---|---|
| 1 | Gancho | [am01] "Sabe quando o cliente deixa o iPhone com a tela trincada, e dois dias depois liga. E aí, ficou pronto?" | 20 | 7,4 s | 7,8 s | 0,0 |
| 2 | A bagunça | [am02] "Aí você para tudo, procura o papel, pergunta pro técnico... e o cliente esperando na linha." | 16 | 5,9 s | 6,3 s | 7,8 |
| 3 | A OS e o link | [am03] "No AlvoManage, cada conserto vira uma ordem de serviço. E toda OS tem um link só dela." | 17 | 6,3 s | 6,7 s | 14,1 |
| 4 | Link no celular | [am04] "Você manda esse link pro cliente, e ele acompanha o conserto pelo celular, em tempo real. Sem baixar aplicativo, sem senha." ⚠ condicional | 21 | 7,8 s | 8,2 s | 20,8 |
| 5 | O que o cliente vê | [am05] "Ele vê se tá em aberto, pronto ou entregue. O defeito, o valor, a garantia. E assina o recebimento ali mesmo." | 21 | 7,8 s | 8,2 s | 29,0 |
| 6 | WhatsApp (desenho) | [am06] "E com o plano de WhatsApp, quando a OS fica pronta, o aviso chega sozinho no celular do cliente." | 19 | 7,0 s | 7,4 s | 37,2 |
| 7 | Respiro (humor) | [am07] "Resultado? O telefone toca bem menos." (pausa 0,6 s antes) | 6 | 2,2 s | 3,2 s | 44,6 |
| 8 | Virada p/ ERP | [am08] "Mas o AlvoManage não é só OS. É o sistema da loja inteira." | 13 | 4,8 s | 5,2 s | 47,8 |
| 9 | Painel | [am09] "No painel você vê o que tá em andamento, e ele te avisa quando tem OS parada há mais de cinco dias." | 22 | 8,1 s | 8,5 s | 53,0 |
| 10 | Vendas e produtos | [am10] "Tem o PDV pro balcão. Produtos com preço, custo, lucro e estoque na mesma tela." | 15 | 5,6 s | 6,0 s | 61,5 |
| 11 | Financeiro | [am11] "Financeiro também: caixa, contas a pagar e a receber, fluxo de caixa." | 12 | 4,4 s | 4,8 s | 67,5 |
| 12 | Várias lojas | [am12] "Tem mais de uma loja? Cuida de todas no mesmo lugar." | 11 | 4,1 s | 4,5 s | 72,3 |
| 13 | Fecho | [am13] "AlvoManage. Pra você cuidar do conserto, e não da bagunça." (pausa 0,4 s após "AlvoManage.") | 10 | 3,7 s | 5,5 s | 76,8 |
| | **Total** | | **203** | **~75 s** | **~82 s bruto → ~78 s com sobreposição de 12 transições (7 frames)** | |

**⚠ am04 é condicional ao teste de tempo real (pedido 6 ao navegador):**
- Teste confirma (página do cliente muda sozinha, sem recarregar) → fica o texto acima (21 palavras).
- Teste não confirma, ou não roda → usar: "Você manda esse link pro cliente, e ele acompanha o conserto pelo celular,
  a hora que quiser. Sem baixar aplicativo, sem senha." (22 palavras, ~8,1 s). Nenhum outro tempo muda além de +0,3 s.

Mudanças em relação ao rascunho (para caber o WhatsApp na meta de 80 s): am02 sem "lá"; am05 sem "o serviço";
am08 "ordem de serviço" → "OS" (já apresentada em am03); am10 sem "Clientes, estoque, tudo junto." (estoque
repetia); am11 enxugada. Alavanca se a voz medir longa demais: encurtar respiros entre cenas, não o texto. Se ainda
passar de 80 s, cortar "E assina o recebimento ali mesmo." é o próximo candidato (perde cena boa — perguntar antes).

Notas de texto:
- **WhatsApp (am06)** — base verificada na própria tela do sistema (aviso de plano): com o plano de WhatsApp, o
  cliente recebe mensagem automática quando a OS é marcada como Pronto; a OS pode ser enviada pelo WhatsApp com um
  clique; o comprovante do PDV vai direto no WhatsApp do cliente. O texto diz "com o plano de WhatsApp" de propósito:
  não promete que toda conta tem. Só o aviso automático entra na fala; envio com um clique e comprovante do PDV ficam
  de fora para não inchar a cena.
- O que NÃO é dito: "baixa o estoque quando vende" (não verificado); "aprovar orçamento pelo link" (não existe);
  "só nós temos" (sem confirmação).
- "Sem baixar aplicativo, sem senha" = verificado (página pública `/acompanhar/<uuid>`, abre no navegador, sem login).
- am06 → am07: a mensagem automática prepara a piada; "o telefone toca bem menos" vira consequência do link + aviso.
  am06 também ecoa o gancho ("E aí, ficou pronto?" → "quando a OS fica pronta").
- Palavras de risco de pronúncia: **AlvoManage**, **iPhone**, **OS** ("ó-ésse"), **PDV** ("pê-dê-vê"), **WhatsApp**.
  Gerar e pedir ao usuário para ouvir am01, am03, am06, am08, am10, am13.

---

## 2. Plano do vídeo, cena por cena

Convenções: **TELA** = tela real do sistema (print/vídeo), sempre dentro de uma moldura (celular ou janela
escura com cantos arredondados) sobre fundo da marca, com zoom/pan lento; nunca a tela inteira de desktop
encolhida no vertical. **DESENHO** = motion em código. Cores: azul `#2F6BFF`-ish e amarelo/dourado do logo
AlvoManage, fundo escuro como o app. Texto na tela: no máximo 3–4 palavras por vez, palavra-chave da fala.
Cortes: 1 troca de plano a cada ~2–3 s; transições curtas (6–8 frames), sem fades longos.

**1. Gancho (0–7,8 s) — DESENHO.** Balcão de assistência visto de frente: um iPhone com trinca desenhada (a
trinca "rachando" em 8 frames em "tela trincada"). Corte em "dois dias depois": calendário vira 2 folhas.
Em "liga": o iPhone agora é o telefone do lojista tocando, balão de fala "E aí, ficou pronto?" (texto na tela
idêntico à fala). Sincronia: trinca = "trincada"; folhas = "dois dias"; vibração/balão = "liga".

**2. A bagunça (7,8–14,1 s) — DESENHO.** Bancada vista de cima, papéis de OS (post-its, comandas) espalhados;
uma mão/cursor revira, papéis voam em "procura o papel". Em "pergunta pro técnico": balão "?" sobre uma bancada
ao fundo. Em "esperando na linha": canto da tela mostra o telefone com cronômetro de chamada correndo (00:47,
00:48...). Ritmo: 3 planos de ~2 s.

**3. A OS e o link (14,1–20,8 s) — TELA + desenho de passagem.** Os papéis da cena 2 se alinham e "viram" um
cartão de OS (match cut). Corta para `os_aberta_link` (recaptura em zoom 100%) dentro de janela escura:
zoom no cabeçalho "OS #13 — Em Aberto" em "ordem de serviço"; pan para a faixa **LINK DO CLIENTE** em "tem um
link", com realce amarelo sobre a URL e cursor parando em "Copiar". Texto na tela: "1 conserto = 1 OS" →
"cada OS, um link".

**4. Link no celular (20,8–29,0 s) — TELA no celular.** O link "voa" da faixa até um celular desenhado
(moldura de iPhone genérica, sem marca), que acende com o topo de `link_cliente_celular`: status "Em Aberto" +
stepper. Em "em tempo real" (ou "a hora que quiser"): o stepper avança Em Aberto → Pronto — **só usar a gravação
real se o teste confirmar**; com a fala alternativa, nada de stepper avançando "ao vivo": mostrar o celular sendo
reaberto (tela apaga/acende) com o status atual. Em "sem baixar aplicativo, sem senha": dois selos rápidos riscando
"app" e "senha". Texto: "no celular do cliente".

**5. O que o cliente vê (29,0–37,2 s) — TELA, scroll.** Mesmo celular, a página desce em scroll suave por
`link_cliente_celular` (fullPage 780x4712): stepper ("aberto, pronto ou entregue" — cada etapa pisca no tempo da
palavra) → Defeito relatado ("o defeito") → Valor R$ 260,00 com zoom ("o valor") → Termos de garantia
("a garantia") → caixa de assinatura; em "assina o recebimento" uma assinatura é desenhada a traço (desenho sobre o
print) e o botão Confirmar acende.

**6. WhatsApp (37,2–44,6 s) — SÓ DESENHO, nenhum print.** A tela de WhatsApp do sistema está bloqueada por plano e
**nunca aparece** — nem a do usuário, nem logo/marca do WhatsApp redesenhada como se fosse o app oficial. Plano 1
(~2,5 s, "com o plano de WhatsApp"): selo pequeno "Plano WhatsApp" (pill verde genérico, ícone de balão simples
desenhado em código) entra no canto do cartão de OS desenhado da cena 3. Plano 2 (~2,5 s, "quando a OS fica
pronta"): o cartão de OS desenhado troca o status "Em aberto" → **"Pronta"** (carimbo/check verde, flip curto).
Plano 3 (~2,4 s, "o aviso chega sozinho no celular do cliente"): do cartão sai um balão de mensagem que voa sozinho
(sem cursor, sem mão — é automático) até um celular desenhado do cliente (silhueta à direita); o balão pousa como
notificação: "Seu aparelho está pronto! ✓" (texto genérico, nome de loja fictício). Rótulo na tela: "aviso
automático". Mesma paleta azul/amarelo; o verde só no "Pronta" e no balão.

**7. Respiro (44,6–47,8 s) — DESENHO.** Volta ao telefone do lojista da cena 1, agora quieto em cima do
balcão; um único "trrr" curto que não se completa, ou o ícone de chamadas com contador baixando. Lojista
(silhueta/mão) tomando café. É a única piada; plano parado, curto.

**8. Virada p/ ERP (47,8–53,0 s) — TELA, vídeo.** Vídeo de tela: mouse vai à borda esquerda, o **menu lateral
abre** (os nomes aparecem). Zoom no menu em "sistema da loja inteira": os grupos (Ordem de Serviço, Vendas,
Cadastro, Estoque, Financeiro) acendem um a um com realce amarelo. Texto: "não é só OS". O item WhatsApp/Loja
Virtual do menu (se aparecer com cadeado) fica fora do recorte.

**9. Painel (53,0–61,5 s) — TELA.** `os_dashboard` (recaptura em zoom 100%, caixa aberto) recortado nos contadores
(Em Andamento 8, Prontas, Aguard. Valor, Aguard. Peça, Garantias). Zoom em "8 Em Andamento" em "em
andamento". Em "OS parada há mais de cinco dias": zoom no alerta real de OS parada (precisa de print — ver
pedidos). O aviso vermelho "Caixa fechado" NÃO pode aparecer: recaptura com caixa aberto; se ainda aparecer, recortar.

**10. Vendas e produtos (61,5–67,5 s) — TELA, cortes rápidos.** 2 planos de ~3 s: PDV (recorte no carrinho,
caixa aberto) em "PDV pro balcão" → `produtos` com pan horizontal pelas colunas PREÇO, CUSTO, LUCRO, ESTOQUE, cada
coluna realçando no tempo da palavra (linha "Bateria iPhone 11": 150 / 60 / 90 / 20 un. — conversa com o iPhone do
gancho).

**11. Financeiro (67,5–72,3 s) — DESENHO.** Não usar tela (Fluxo de Caixa mostra -R$ 0,10 e aviso de
roadmap). Gaveta de caixa desenhada abre em "caixa"; duas setas/fichas, uma saindo ("a pagar") e uma entrando
("a receber"); as fichas viram um gráfico de linha simples subindo em "fluxo de caixa". Rótulos: Caixa / A
pagar / A receber / Fluxo.

**12. Várias lojas (72,3–76,8 s) — DESENHO.** Três fachadas de loja pequenas desenhadas (ícone de loja do
próprio app como referência visual), uma linha amarela liga as três a um único painel no centro em "no mesmo
lugar". Sem tela do sistema (não verificado como aparece).

**13. Fecho (76,8–~82 s bruto) — DESENHO.** O telefone, os papéis e as lojas se recolhem; logo AlvoManage (arquivo
oficial, não redesenhado) entra em "AlvoManage."; frase de assinatura na tela: "Cuide do conserto. Não da
bagunça." + `app.alvomanage.com` embaixo. Segura 1,5 s após a fala.

Com sobreposição de 7 frames nas 12 transições, total final ≈ 78 s. Medir de verdade após a voz.

---

## 3. Tela real x desenho

| Cena | Tipo | Por quê |
|---|---|---|
| 1, 2, 7 | Desenho | Situação do dia a dia, não é tela; é onde a metáfora trabalha |
| 3, 4, 5 | Tela | Diferencial nº 2 — tem que ser o produto de verdade, já verificado |
| 6 | Desenho | WhatsApp: tela bloqueada por plano; afirmação vem do texto do próprio sistema, imagem é só desenho |
| 8, 9, 10 | Tela | Diferencial nº 1 — telas bonitas e com dados verossímeis |
| 11 | Desenho | Fluxo de Caixa da conta demo é feio/negativo e tem aviso de roadmap |
| 12 | Desenho | Várias lojas não verificado visualmente; conta mostra pouco |
| 13 | Desenho + logo | Assinatura |

Loja Virtual, Orçamentos, Agendamento, Transferências: **fora do vídeo**. WhatsApp: **só na fala am06 e no desenho
da cena 6** — nunca tela do recurso, nunca a conta/WhatsApp do usuário.

### Pedidos ao `navegador` (uma sessão só, Chrome maximizado, zoom 100%, cursor seta)
Autorizado pelo usuário em 2026-10-05: testar tempo real na OS #13 (mudar e voltar), abrir o caixa da conta demo,
regravar clipes. O `navegador` avisa o usuário antes de abrir o navegador, como sempre.

1. **Abrir o caixa da conta demo primeiro** (autorizado), para o aviso vermelho "Caixa fechado" sumir de Painel e
   PDV. Usar valor de abertura R$ 0,00 (ou o mínimo que o sistema aceitar) e informar no relatório o que foi feito.
   Não fechar o caixa depois sem pedido do usuário.
2. **Recapturas em zoom 100%** (as atuais são zoom 0.67), já com caixa aberto: `os_dashboard`, `produtos`,
   `vendas_pdv`, `os_aberta_link`. Para cada um, PNG `--hd` + bbox do elemento-chave. Confirmar que "Caixa fechado"
   não aparece em nenhum. (`cadastro_clientes` saiu do roteiro — não precisa.)
3. **Alerta de OS parada há mais de 5 dias** no painel: localizar e printar com bbox. Se nenhuma OS da conta
   estiver parada há 5 dias, avisar — NÃO mexer em datas (isso não foi autorizado).
4. **Vídeo da sidebar** (regravar): mouse vai à borda esquerda, menu abre, passa devagar por Ordem de Serviço →
   Vendas (PDV, Produtos) → Cadastro → Estoque → Financeiro, ~6 s, sem clicar. Entregar timestamps e bbox de itens
   com cadeado (WhatsApp/Loja Virtual) para recorte.
5. **Página do cliente no celular** (regravar): vídeo 390x844 @2x com scroll suave do topo até a assinatura (~8 s) +
   PNG só do topo (status + stepper).
6. **Teste de tempo real (autorizado; altera dado e volta)**: com `/acompanhar/<uuid>` da OS #13 aberta numa aba em
   viewport de celular, gravando, mudar o status da OS #13 para "Pronto" na outra aba e esperar até 30 s **sem
   recarregar** a página do cliente. Relatar: mudou sozinha? em quantos segundos? Depois **voltar a OS #13 para "Em
   Aberto"** e confirmar por print que voltou. Se mudar o status para Pronto disparar qualquer envio (WhatsApp/e-mail)
   ou pedir confirmação de envio, **cancelar e parar o teste** e relatar. Resultado decide am04:
   confirmou → "em tempo real" + usar a gravação na cena 4; não confirmou → fala alternativa "a hora que quiser".
7. **WhatsApp: não abrir a tela do recurso nem capturar nada dele.** A cena 6 é desenho.

---

## 4. Tarefas por agente e ordem

Nesta peça a voz vem **antes** do motion fechar tempos: ElevenLabs é rápida e barata em CPU, e a duração real
das falas é que define o corte. (Na LifePhases era o contrário porque a voz local custava ~10 min por chamada.)

1. **Usuário** — roteiro aprovado, WhatsApp incluído, teste/caixa/regravação autorizados. ✓
2. **navegador** (Claude, Agent tool; avisa o usuário antes de abrir) — pedidos 1–7. Processo pesado: sozinho.
3. **narracao** — gerador ElevenLabs (ex.: `tools/generate-narration-el.mjs`, chave do `.env`), uma
   chamada por fala am01–am13, `eleven_multilingual_v2`, mesmos `voice_settings` em todas; arquivos em
   `public/audio/vo-alvomanage/`; `src/narration-alvomanage.json` com id, texto, duração medida (ffprobe) e
   `frame` provisório. Usar `previous_text`/`next_text` para manter a entonação contínua. **Só depois do resultado
   do pedido 6** (texto de am04). Rede, não CPU — pode correr junto com o passo 4, nunca com render.
4. **motion** — composição `AlvoManage` nova (1080x1920, 30 fps) em arquivos próprios
   (`src/AlvoManage.tsx`, `src/scenes/alvomanage/`, `src/components/alvomanage/`), sem tocar LifePhases/iFood;
   13 cenas conforme a seção 2; durações vindas do JSON da narração; moldura de celular e janela; stills de
   conferência por cena. Diretor integra a timeline.
5. **narracao** — reposicionar `frame` das falas na timeline final (pausas planejadas: 0,6 s antes de am07,
   0,4 s dentro de am13 se der para separar).
6. **som** — `src/utils/audio-alvomanage.ts` + síntese em `tools/generate-audio.mjs`. Trilha leve, ducking sob a
   voz. Efeitos só em evento visual: trinca do vidro (c1), toque/vibração do telefone (c1), papéis (c2),
   "tic" no Copiar (c3), whoosh do link indo ao celular (c4), passo do stepper (c4/c5), traço da assinatura
   (c5), carimbo "Pronta" + "plim" de notificação quando o balão pousa (c6), clique da gaveta de caixa (c11), acorde
   de fecho no logo (c13). Cena 7: silêncio quase total — é a piada.
7. **render** (DeepSeek) — render completo sozinho na máquina; medir duração, streams, loudness da voz.
8. **revisor** (Claude) — conferir contra este documento: nenhuma afirmação fora da lista verificada; am04 bate com
   o resultado do teste; am06 diz "com o plano de WhatsApp"; nada de "Caixa fechado"/saldo negativo/tela de
   WhatsApp/Loja Virtual na tela; legibilidade dos zooms no vertical; sincronia palavra x realce nas cenas 5, 6 e 10.
9. **Usuário** — ouvir as falas de risco de pronúncia (am01, am03, am06, am08, am10, am13).

---

## 5. Riscos / pendências
1. **"Em tempo real"**: decidido pelo teste do pedido 6 (autorizado). Sem confirmação, fala alternativa — sem exceção.
2. **Caixa**: abertura autorizada. Se o sistema exigir valor/dados que mudem relatórios da demo, o navegador relata.
3. **Alerta de OS parada**: se não aparecer na conta, perguntar ao usuário: desenhar o alerta (baseado no real) ou
   trocar am09 por "...e vê na hora o que tá pronto pra entregar".
4. Pronúncia de AlvoManage/PDV/OS/WhatsApp na voz Lucas: só dá para saber ouvindo.
5. Duração estimada ~78 s (topo da meta). Se a voz medir acima de 80 s: primeiro encurtar respiros entre cenas;
   depois perguntar ao usuário antes de cortar texto (candidato: "E assina o recebimento ali mesmo.").
