# AlvoManage — vídeo nº 3: posicionamento ("nada se perde, nada se mistura"), com a TROCA como centro

Vertical 1080x1920, 30 fps, TikTok/Reels. **HyperFrames** (o `motion` entra pela skill `hyperframes`). Voz ElevenLabs,
Lucas (`7lu3ze7orhWaNeSPowWx`), `eleven_multilingual_v2`, mesmos `voice_settings` dos vídeos 1 e 2. Alvo 45–60 s.
Régua: **19,4 caracteres/s** (medida no vídeo 1). Respiros de 0,4 s, sempre com trilha/efeito.

Status: **REVISADO APÓS A TROCA DE TESTE (2026-10-05, ~22h)**. p06–p09 reescritas com o que o sistema mostrou de
fato. Aguardando ok do usuário no texto. O roteiro da garantia (`docs/alvomanage-2-roteiro.md`) fica guardado.

**Tom:** conversa natural, leve, com graça espontânea. Sem piada montada, punchline ou trocadilho.

**Contraste:** troca lançada como *devolução comum* → o defeituoso volta pro estoque como se fosse bom e pode ser
vendido de novo (dito como situação de lançamento, **nunca** como fato sobre outros sistemas; sem marca, sem "quase
nenhum sistema tem"). No AlvoManage → o defeituoso **não volta pro estoque** e o novo **sai do estoque sozinho**.

---

## 0. O que a troca de teste comprovou (prints de 05/10, 21:56–22:09, em `public/images/alvomanage/troca_*`)

O `navegador` fez uma venda de teste e uma troca de teste na demo (foi interrompido antes do relatório; reconstruído
pelos prints e pelo clipe `videos/troca_fluxo_2026-10-06-01-06.mp4`, 66 s).

| Passo | Prova | O que mostra |
|---|---|---|
| Troca exige uma venda | `troca_pdv_venda1_100.png` | modal "Registrar Troca — Digite o número da venda"; "Venda Nº1 não encontrada" antes de existir venda |
| Venda de teste | `troca_venda_resultado_100.png`, `troca_mov_cabo_antes_100.png` | **PDV#1: Cabo USB-C 1m, R$ 29,00, dinheiro**; movimentação "Venda PDV −1" às 21:59 |
| Caminho da troca | clipe 01-06, `troca_pdv_modal_100.png`, `troca_form_100.png` | **PDV > botão Troca** > número da venda > Verificar > abre **Vendas > Devolução/Troca** com a venda carregada |
| Opção de defeito | `troca_form_100.png` | checkbox **"Produto trocado veio com defeito — Não volta pro estoque à venda — já sai e entra acumulando em Estoque > Trocas, pronta pro fornecedor."** |
| Produto novo | `troca_form_preenchida_100.png` | novo Cabo USB-C (R$ 29), diferença R$ 0,00, botão **"Confirmar Troca e enviar pro fornecedor"** |
| Resultado | `troca_pos_confirmar_100.png` | toast: **"Peça(s) sem fornecedor cadastrado — ficaram fora do estoque, mas não entraram em Trocas."** |
| Estoque | `troca_mov_cabo_depois_100.png` | Movimentações do Cabo: **"TROCA#1 — Troca — novo produto entregue −1"** (22:08) + "PDV#1 Venda PDV −1". **Nenhuma entrada do defeituoso.** |
| Lista de Trocas | `troca_gerenciamento_depois_100.png` | continua vazia ("Como funciona a aba Trocas": peças com defeito que voltam pro fornecedor, acumuladas numa troca) |
| Caixa | `troca_caixa_depois_100.png` | caixa aberto (NZ, 17:26), saldo **R$ 29,00** |

**Conclusão:**
- **Comprovado:** a troca é feita pelo botão Troca do PDV a partir de uma venda; dá pra marcar "veio com defeito";
  **o defeituoso NÃO volta ao estoque** (texto da tela + Movimentações sem entrada); **o novo sai do estoque sozinho**
  (movimentação "Troca — novo produto entregue").
- **Não apareceu em Gerenciamento de Trocas** porque o produto não tem fornecedor cadastrado (o próprio sistema
  avisou). A aba Trocas é o lote de peças a devolver **ao fornecedor**, não uma "lista de trocas daquele produto".
  → a frase antiga de p08 ("vai pra lista de trocas daquele produto") **sai**.
- O contraste do vídeo **se mantém** (o defeituoso não volta ao estoque).

---

## 1. Roteiro FINAL (texto fechado pelo diretor; falta só o ok do usuário antes de gerar a voz)

Conferido fala a fala contra o vídeo 1 (`docs/alvomanage-roteiro.md`, am01–am13) e o vídeo 2 reservado (garantia):
**nenhuma ideia, frase, exemplo, gancho ou cena se repete.** Saíram as antigas p11 (OS registrada + link do cliente)
e p12 (alerta de OS parada), que eram do vídeo 1, e o fecho só com "AlvoManage." (o vídeo 1 abre o fecho assim).

| # | Fala (exata) | Car. | ≈ Lucas | Início ≈ | vs. vídeo 1 |
|---|---|---|---|---|---|
| p01 | Cliente chega no balcão, põe o carregador na sua frente e fala: comprei ontem, já parou. | 88 | 4,5 s | 0,0 | novo |
| p02 | Normal, acontece. Você troca, entrega um novo, e ele vai embora feliz. | 70 | 3,6 s | 4,9 | novo |
| p03 | Aí você lança como devolução comum. E o carregador com defeito volta pro estoque, como se fosse bom. | 100 | 5,2 s | 8,9 | novo |
| p04 | Semana que vem, quem vende ele de novo? Você mesmo. Pra outro cliente. | 70 | 3,6 s | 14,5 | novo |
| p05 | Aí o gerente vê carregador sobrando no estoque. De onde veio esse? Ninguém sabe. | 80 | 4,1 s | 18,5 | novo |
| p06 | No AlvoManage, a troca sai do próprio PDV, puxando a venda que o cliente fez. | 77 | 4,0 s | 23,0 | novo |
| p07 | Você marca que o produto veio com defeito e escolhe o novo. | 59 | 3,0 s | 27,4 | novo |
| p08 | E a tela já faz a conta da diferença entre o que ele levou e o novo. | 68 | 3,5 s | 30,8 | novo |
| p09 | O defeituoso não volta pro estoque. Fica separado, fora do que tá à venda. | 74 | 3,8 s | 34,7 | novo |
| p10 | E o novo sai do estoque sozinho, sem ninguém dar baixa na mão. | 62 | 3,2 s | 39,0 | novo |
| p11 | Depois, nas movimentações do produto, cada saída tem nome: essa foi venda, essa foi troca. | 90 | 4,6 s | 42,6 | novo |
| p12 | Aí o que o sistema diz que tem é o que dá pra vender de verdade. | 64 | 3,3 s | 47,6 | novo |
| p13 | Confiável é isso: nada se perde, nada se mistura. | 49 | 2,5 s | 51,3 | novo |
| p14 | AlvoManage. Troca certa, estoque certo. | 39 | 2,0 s | 54,2 | novo |
| | **Total: 14 falas** | **990** | **~51,0 s de fala** | **~57,7 s com respiros de 0,4 s e 1,5 s de fecho** | |

Lógica p03 → p05 → p11: o defeituoso volta pro estoque (p03) e pode ser vendido de novo (p04); o gerente vê um
carregador a mais e não sabe de onde veio (p05) — a fala **não** diz que é o quebrado, o espectador já sabe. No
AlvoManage, o defeituoso nem entra (p09), o novo sai sozinho (p10) e cada saída tem origem nas movimentações (p11):
é a resposta ao "de onde veio?". p12 fecha: o número da tela é o que dá pra vender.

Fatos que sustentam (todos comprovados nos prints/clipe da troca de teste, seção 0):
- p06: botão Troca no PDV + número da venda (`troca_pdv_modal_100`, `troca_pdv_venda1_100`).
- p07: checkbox "Produto trocado veio com defeito" + "Novos produtos" (`troca_form_100`, `troca_form_preenchida_100`).
- p08: bloco **Financeiro** da troca com **Valor original / Novos produtos / Desconto / Diferença** ("R$ 29,00 /
  R$ 29,00 / R$ 0,00 — Sem diferença de valor"; sem produto novo, "Diferença −R$ 29,00 — Devolver R$ 29,00 ao
  cliente") (`troca_form_preenchida_100`, `troca_form_100`). A fala não diz quem paga a diferença.
- p09: texto da tela "Não volta pro estoque à venda" + Movimentações sem entrada do defeituoso + toast "ficaram fora
  do estoque". Vale com ou sem fornecedor cadastrado.
- p10: movimentação automática "Troca — novo produto entregue −1".
- p11: Movimentações do Cabo USB-C: **"PDV#1 · Venda PDV −1 · 05/10/26 21:59"** e **"TROCA#1 · Troca — novo produto
  entregue −1 · 05/10/26 22:08"**, colunas Produto/Tipo/Qtd/Motivo/Data, filtro "Todos os tipos"
  (`troca_mov_cabo_depois_100`).
- p01–p05: jeito comum de lançar a troca (genérico, sem sistema citado). p12–p14: conclusão.

Se a voz medir acima de 60 s: respiros de 0,3 s (−1,3 s); depois tirar "Semana que vem," de p04.

**Não é dito:** aba/lista de Trocas, fornecedor, OS, link do cliente, painel/alerta, garantia, WhatsApp, "quase
nenhum sistema tem isso", nada sobre outro sistema, "tempo real", "mais seguro", "o melhor".

Pronúncia/tom: **AlvoManage**, **PDV**; "Normal, acontece", "Você mesmo." e "Ninguém sabe." precisam soar conversa.
Pedir ao usuário para ouvir p02, p04, p05, p06, p14.

---

## 2. Plano cena a cena

Convenções dos vídeos 1 e 2: TELA = print/clipe real numa moldura escura arredondada sobre fundo da marca, com
zoom/pan; DESENHO = SVG/CSS + GSAP, traço limpo, sem efeito cômico. Texto na tela: 2–4 palavras. Troca de plano a
cada ~2–3 s, transições de 6–8 frames.

**Logo fixa — DECISÃO DO DIRETOR (2026-10-05).** Arquivo real entregue pelo usuário:
`public/images/alvomanage/logo/logo-alvomanage.png` (894x177, RGBA, alfa real). Nele, "Alvo" é quase preto
(#1a1a1a) com a seta amarela e "Manage" é azul escuro; sobre o fundo escuro do vídeo o "Alvo" some (conferido num
teste sobre #1e1e1e).
- **Solução: variante clara, gerada por código a partir do PNG real**, `logo-alvomanage-claro.png`, na mesma pasta:
  só os pixels quase pretos e sem cor (o "Alvo") viram **branco #FFFFFF**, preservando o alfa e o antisserrilhado
  (troca proporcional à luminância, não limiar seco). **Seta amarela e "Manage" azul ficam intactos.** Não
  descaracteriza a marca: é exatamente o tratamento que o próprio app usa no cabeçalho escuro ("Alvo" branco +
  "Manage" azul), visível em todos os prints `*_100.png`.
- **Uma variante só, o vídeo inteiro** (nada de alternar conforme a cena: troca de cor no canto vira piscada).
  Para garantir: a área da logo (x 0–340 / y 200–360) fica **sempre sobre fundo escuro ou médio** em todas as cenas;
  telas claras (página do cliente, modais) entram dentro de molduras posicionadas abaixo de y ≈ 380.
- **Leitura extra, sem placa:** `filter: drop-shadow(0 1px 4px rgba(0,0,0,.55))` — sombra curta que só destaca o
  contorno. Sem brilho, sem contorno grosso, sem caixa. Opacidade 0,92.
- Se o "Manage" azul escuro ficar apagado no fundo da cena no teste do motion, o ajuste permitido é **só** subir a
  luminosidade do azul para o tom do cabeçalho do app (~#3b6ff0), e mostrar ao usuário antes de adotar.
- Posição: canto **superior esquerdo**, ~210 px de largura (≈ 42 px de altura), x = 64, topo em y ≈ 250 (abaixo da
  interface de topo do TikTok/Reels; direita = coluna de botões; rodapé = legenda). Parada desde o frame 0, sem
  animação. No HyperFrames: elemento do `index.html` raiz, acima de todas as sub-composições, do início ao fim.
- **Fecho (cena 14):** a logo grande do centro usa a mesma variante clara.
- **Tarefa do `motion`:** gerar `logo-alvomanage-claro.png` (Node/sharp, Python/PIL ou ffmpeg `geq`), conferir alfa
  com `ffprobe -show_entries stream=pix_fmt` (= `rgba`), e salvar um still de teste sobre #1e1e1e e sobre um print
  claro para o usuário ver. O original não é alterado.

**Som:** trilha do frame 0 ao fim, +2 dB vs vídeo 1 (×1,26), leve, ducking sob a voz. Efeitos -5 dB (×0,56), só em
evento na tela; whoosh/tic baixo nas trocas de cena. Tudo sintetizado por código.

**Personagem visual: o carregador com defeito**, com um pequeno "x" vermelho/LED apagado, para o espectador sempre
saber onde ele está. (O produto real da tela é o Cabo USB-C; nenhum texto liga o desenho à tela — a tela prova o
fluxo.)

**1. Abertura (0–4,9 s) — DESENHO.** Frame 0 já cheio: close no balcão, mão descendo, carregador **a centímetros
do balcão**. Frames 0–5: bate ("toc" seco no início da fala). ~1 s: câmera abre, cliente e dono. Em "comprei ontem,
já parou": o LED pisca e apaga; balão de fala "comprei ontem, já parou".

**2. A troca (4,9–8,9 s) — DESENHO.** Dono pega um novo da prateleira e entrega; cliente sai com um aceno.

**3. Volta pro estoque (8,9–14,5 s) — DESENHO.** Tela genérica de lançamento (janela cinza, **sem nome, sem logo**)
com botão "Devolução"; o carregador com "x" desliza de volta para a prateleira, no meio dos bons; contador +1; em
"como se fosse bom" o "x" some.

**4. Vendido de novo (14,5–18,5 s) — DESENHO.** Calendário "semana que vem"; outra mão pega aquele carregador; o "x"
reaparece por um instante na sacola. Tic de venda.

**5. O carregador sem origem (18,5–23,0 s) — DESENHO.** O gerente (silhueta) olha a tela genérica do sistema:
**"Carregador: +1 em estoque"**; corte para a prateleira com um carregador a mais, igualzinho aos outros (sem "x",
sem LED apagado — **não** se mostra que é o quebrado). Em "de onde veio esse?", um "?" grande sobre o carregador e o
gerente coçando a cabeça, olhando da tela pra prateleira. Som: tic baixo no "+1".

**6–11. A TROCA NO ALVOMANAGE (23,0–47,6 s) — TELA REAL EM ZOOM, do clipe
`troca_fluxo_2026-10-06-01-06.mp4` e dos prints `troca_*`.** Nunca mostrar: o toast "sem fornecedor cadastrado… não
entraram em Trocas", a aba Trocas vazia, o caixa, painel, OS ou link do cliente.
- **Cena 6 (23,0–27,4 s, p06):** a prateleira da cena 5 se dissolve e vira o PDV (match cut). Zoom ~170% no botão roxo
  **Troca** e o clique (realce amarelo); modal "Registrar Troca" com "1" e clique em **Verificar** em "puxando a
  venda". Clique baixo.
- **Cena 7 (27,4–30,8 s, p07):** "Realizar troca/devolução" com a Venda Nº1; zoom na checkbox **"Produto trocado veio
  com defeito"** sendo marcada; corte para "Novos produtos" com o cabo escolhido. Tic no check.
- **Cena 8 (30,8–34,7 s, p08):** zoom no bloco **Financeiro** (`troca_form_preenchida_100`): os campos realçam no tempo
  da fala — "o que ele levou" → Valor original R$ 29,00; "o novo" → Novos produtos R$ 29,00; "a diferença" →
  Diferença R$ 0,00 / "Sem diferença de valor". Tic leve em cada realce.
- **Cena 9 (34,7–39,0 s, p09):** zoom no texto da tela **"Não volta pro estoque à venda"**, sublinhado a traço (o resto
  da frase, "Estoque > Trocas, pronta pro fornecedor", fora do recorte). Por cima, o carregador desenhado, agora
  com "x", passa reto pela prateleira e pousa numa caixa separada à direita em "fica separado". Corte antes de
  confirmar.
- **Cena 10 (39,0–42,6 s, p10):** DESENHO sobre fundo da marca: um carregador novo sai da prateleira e o contador desce
  1 sozinho; uma mão com caneta que ia "dar baixa" num papel para no ar e sai do quadro. (Desenho de propósito, para
  a tela de Movimentações estrear inteira na cena 11.)
- **Cena 11 (42,6–47,6 s, p11):** TELA `troca_mov_cabo_depois_100.png` (Estoque · Movimentações · Cabo USB-C 1m): pan
  lento; em "essa foi venda" realce na linha **PDV#1 · Venda PDV −1**, em "essa foi troca" na linha **TROCA#1 ·
  Troca — novo produto entregue −1**; datas 21:59 / 22:08 legíveis. Texto: "cada saída tem origem". Tic em cada
  linha. É a resposta visual ao "?" da cena 5.

**12. O estoque de verdade (47,6–51,3 s) — DESENHO.** A tela genérica e a prateleira da cena 5 de novo, agora sem "?":
o número da tela igual à quantidade na prateleira, e o carregador com "x" na caixa separada, fora da conta.

**13. A tese (51,3–54,2 s) — DESENHO.** "nada se perde, nada se mistura": duas colunas se separando — estoque bom à
esquerda, o carregador com "x" à direita na caixa "separado".

**14. Fecho (54,2–~57,7 s) — DESENHO + logo.** Logo AlvoManage grande no centro (variante clara; a logo fixa continua no
canto) em "AlvoManage."; texto na tela **"Troca certa. Estoque certo."** + `app.alvomanage.com`. Acorde de fecho,
segura 1,5 s.

Tela real em 5 de 14 cenas (6–9 e 11), sempre em zoom, todas do fluxo da troca; nenhuma tela do vídeo 1 (painel, OS,
link, produtos, PDV comum) entra.

---

## 3. Pedido ao `navegador`: NENHUM (decisão do diretor)

A leitura final de estado (estoque atual do Cabo, onde a TROCA#1 fica registrada, campo de fornecedor) foi
**descartada**: o vídeo não mostra o número do estoque do Cabo (a cena 9 usa a linha "−1" de Movimentações, já
printada), não mostra o registro da TROCA#1 em lista nenhuma, e p08 deixou de depender de fornecedor. Todo o material
de tela do vídeo já existe em `public/images/alvomanage/` (prints `troca_*`, `*_100`, clipe `troca_fluxo_2026-10-06-01-06.mp4`) e a logo veio do usuário. Ninguém precisa abrir o
navegador para este vídeo.

---

## 4. Estado provável da conta demo (só informativo; não afeta o vídeo — o usuário confere à mão se quiser)

Mudado pelo teste, sem reversão:
- **Venda PDV#1**: 1 Cabo USB-C 1m, R$ 29,00, dinheiro, 05/10 21:59.
- **Troca TROCA#1** sobre a Venda Nº1, marcada "veio com defeito", 1 Cabo novo entregue, 05/10 22:08.
- **Estoque do Cabo USB-C 1m: −2** em relação a antes do teste (−1 venda, −1 troca); o defeituoso não voltou.
- **Caixa** (aberto por NZ às 17:26): saldo **R$ 29,00** (a venda; a troca teve diferença R$ 0).
- **Visão Geral:** "Faturamento — mês atual" agora mostra **R$ 29**.
- Gerenciamento de Trocas: **vazio** (produto sem fornecedor).
- O caixa segue **aberto**.

---

## 5. Ordem de execução

1. **Usuário** — aprova o texto final da seção 1. **É a única pendência.**
2. **narracao** (ElevenLabs, Lucas) — p01–p14 em `public/audio/vo-alvomanage-3/`, manifesto
   `src/narration-alvomanage-3.json`, `previous_text`/`next_text`, mesmos `voice_settings` do vídeo 1. Direção:
   conversa natural, não locução de comercial.
3. **motion** (skill `hyperframes` primeiro) — gera a variante clara da logo (seção 2), monta o vídeo inteiro com
   som e sincronia pelas durações medidas, e mede o render completo sozinho na máquina (comparar com Remotion:
   rascunho 16 min ~1,9 fps; completo ~1 h).
4. **Usuário** — revisa (e ouve p02, p04, p05, p06, p14). Sem `render` nem `revisor`.

---

## 6. Riscos

1. O clipe 01-06 é 1366x577: zooms de ~170% no vertical podem ficar moles; nesse caso o motion usa os prints
   `troca_*_100.png` com cursor desenhado.
2. A demo tem venda/troca/caixa de teste (R$ 29): nenhuma tela de faturamento/caixa entra no vídeo.
3. Variante clara da logo: mudança mínima (só "Alvo" preto → branco, como no cabeçalho do app); o usuário vê no
   primeiro preview.
4. O tom solto depende da entrega da voz; só ouvindo p02 e p04.
