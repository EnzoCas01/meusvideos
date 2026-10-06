# AlvoManage — vídeo "Tá na garantia!": roteiro final e plano

Vertical 1080x1920, 30 fps, TikTok/Reels. **HyperFrames** (o `motion` entra pela skill `hyperframes`). Voz ElevenLabs,
Lucas (`7lu3ze7orhWaNeSPowWx`), `eleven_multilingual_v2`, mesmos `voice_settings` dos vídeos anteriores
(stability 0.5, similarity 0.8, style 0.25, speaker boost). Alvo 45–60 s. Régua: **19,4 caracteres/s** (medida).

Status: **TEXTO FINAL REVISADO (2026-10-06)** pelo diretor, depois da regra "nunca repetir vídeo anterior".
Aguardando só o ok do usuário para gerar a voz. (A versão de 2026-10-05 foi substituída por esta.)

---

## 0. Conferência contra os vídeos anteriores

Vídeo 1 (`docs/alvomanage-roteiro.md`): cliente liga "ficou pronto?", procura o papel, OS com link, página do cliente
com status/defeito/valor/**garantia**/**assinatura do recebimento** (am05), WhatsApp, painel e OS parada, PDV, produtos,
financeiro, várias lojas, fecho "AlvoManage. Pra você cuidar do conserto…". Vídeo 3 (`docs/alvomanage-3-roteiro.md`):
carregador batendo no balcão, troca de produto com defeito, estoque, movimentações, conta da diferença, fecho
"AlvoManage. Troca certa, estoque certo.".

O que saiu ou mudou na versão antiga deste roteiro por repetir:
| Antes | Problema | Agora |
|---|---|---|
| g03 "o papel da OS sumiu" | vídeo 1 am02 "procura o papel" | "nem lembra desse aparelho" |
| g02 "faz dois meses… voltou" | eco de "dois dias depois liga" (am01) | "no mês passado" |
| g06 "o defeito, o laudo, o serviço e o valor" | am05 "o defeito, o valor" | só data de entrada, laudo e serviço |
| g09 "Na entrega, o cliente assina embaixo" | am05 "assina o recebimento" | **cortada** (assinatura não aparece em fala nem em cena) |
| g12 "Garantias Ativas" no painel | contador 0 na demo; painel é cena do vídeo 1 | **cortada**; no lugar, a data de saída na OS |
| g13 "AlvoManage. Garantia combinada…" | mesma forma "AlvoManage. + frase" dos vídeos 1 e 3 | marca no fim: "…No AlvoManage." |
| g05 "No AlvoManage, você…" | mesma abertura de am03 e p06 (vídeo 3) | "Com o AlvoManage, é só abrir…" |
| Abertura: celular batendo no balcão | é a abertura do vídeo 3 (carregador batendo) | abertura em **face a face** com o dedo apontado |
| g04 "quem paga é a loja" | duro | "dessa conversa ninguém sai feliz" |

**Ângulo novo:** a discussão de garantia no balcão e **o que vale e o que não vale**, resolvida pelos termos escritos
na própria OS (prazo contado da entrega + exclusões). Nada de página do cliente, link, assinatura, painel, estoque ou
troca.

**Base verificada (suficiente, mas estreita):** print `public/images/alvomanage/os_aberta.png` (OS #13, zoom 100%):
Dados Gerais com **Entrada / Previsão de Entrega / Saída**, Problema com **Defeito Relatado / Laudo Técnico**,
**Serviços**, e **Termos de Garantia** ("garantia de 90 (noventa) dias, contados da data de entrega"; "A GARANTIA NÃO
COBRE: dano físico… queda, impacto, pressão, trinca ou rompimento; contato com água, umidade…"). Os 90 dias e as
exclusões são **o texto desta conta demo**: a fala trata como exemplo ("nessa loja aqui"), nunca como regra do sistema.
Não verificado e **não dito**: se os termos são configuráveis, busca de OS, contador de garantias, retorno em garantia.

---

## 1. Roteiro final

| # | Fala (exata) | Car. | ≈ Lucas | Início ≈ | vs. vídeos 1 e 3 |
|---|---|---|---|---|---|
| g01 | Isso aí tá na garantia! Toda assistência já ouviu essa frase, com o dedo apontado pro balcão. | 93 | 4,8 s | 0,0 | novo |
| g02 | O cliente trocou o conector de carga aqui no mês passado. Agora o celular não liga. | 83 | 4,3 s | 5,2 | novo |
| g03 | Ele jura que não molhou. E você, sinceramente, nem lembra desse aparelho. | 73 | 3,8 s | 9,9 | novo |
| g04 | Vira a sua palavra contra a dele. E dessa conversa ninguém sai feliz. | 69 | 3,6 s | 14,0 | novo |
| g05 | Com o AlvoManage, é só abrir a OS dele: a história tá contada. | 62 | 3,2 s | 18,0 | novo |
| g06 | O dia que entrou, o que o técnico achou no laudo, e o serviço que foi feito. | 76 | 3,9 s | 21,6 | novo |
| g07 | E os termos de garantia ficam escritos na própria OS. Nessa loja aqui, noventa dias a partir da entrega. | 104 | 5,4 s | 25,9 | novo |
| g08 | Com o que não cobre também: queda, trinca, contato com água. | 60 | 3,1 s | 31,7 | novo |
| g09 | Aí a conversa fica fácil. Abriu e tá oxidado? Não é garantia, é conserto novo. | 78 | 4,0 s | 35,2 | novo |
| g10 | Agora, se for o mesmo defeito e tiver dentro do prazo, é garantia. E você atende sem drama. | 91 | 4,7 s | 39,6 | novo |
| g11 | A data de saída tá ali na OS. Ninguém precisa puxar pela memória. | 65 | 3,4 s | 44,7 | novo |
| g12 | Garantia combinada, garantia escrita. No AlvoManage. | 52 | 2,7 s | 48,5 | novo |
| | **Total: 12 falas** | **906** | **~46,7 s de fala** | | **~52,6 s com respiros de 0,4 s e 1,5 s de fecho** |

Fatos por fala: g06 campos Entrada / Laudo Técnico / Serviços; g07 e g08 bloco Termos de Garantia (texto da demo,
tratado como exemplo); g11 campo **Saída** nos Dados Gerais (na OS #13 está "—" porque ainda não saiu; a cena mostra o
campo, não uma data inventada). g01–g04 e g09–g10: situação do balcão, sem afirmação sobre o sistema.

Pronúncia/tom: **AlvoManage**, **OS**, "oxidado"; "sinceramente" e "sem drama" precisam soar conversa. Pedir ao
usuário para ouvir g01, g03, g05, g12.

---

## 2. Plano cena a cena

Convenções: TELA = print real numa moldura escura arredondada sobre fundo da marca, com zoom/pan e realce amarelo
desenhado por cima; DESENHO = SVG/CSS + GSAP, traço limpo, sem efeito cômico. Texto na tela: 2–4 palavras. Troca de
plano a cada ~2–3 s, transições de 6–8 frames. **Única tela real usada: `os_aberta.png`** (recortes diferentes);
nenhuma tela do vídeo 1 (página do cliente, link, painel, PDV, produtos) nem do vídeo 3 (troca, movimentações).
Recorte proibido em `os_aberta.png`: a faixa "LINK DO CLIENTE" e o bloco "Assinatura do Cliente".

**Logo fixa:** `public/images/alvomanage/logo/logo-alvomanage-claro.png` (variante clara já gerada: "Alvo" branco,
seta amarela, "Manage" azul), ~210 px de largura, canto superior esquerdo, x = 64, topo em y ≈ 250; opacidade 0,92,
`drop-shadow(0 1px 4px rgba(0,0,0,.55))`, parada desde o frame 0. Elemento do `index.html` raiz, acima de todas as
cenas. A área x 0–340 / y 200–360 fica sempre sobre fundo escuro/médio e livre de elementos grandes.

**Som:** trilha do frame 0 ao fim, +2 dB vs vídeo 1 (×1,26), ducking sob a voz. Efeitos -5 dB (×0,56), só em evento
na tela; whoosh/tic baixo em cada troca de cena. Tudo sintetizado por código.

**Personagem visual: o celular do cliente**, com uma pequena gota azul no canto (o "molhou?") que só se explica na
cena 9. Paleta da marca (escuro + amarelo + azul).

**1. Face a face (0–5,2 s) — DESENHO. Abertura.**
- **Frame 0, já cheio:** tela dividida na diagonal; à esquerda o cliente em close, braço esticado, **dedo apontado
  para a câmera/balcão**; à direita o dono, de sobrancelha levantada. O balão **"TÁ NA GARANTIA!"** já está na tela
  no frame 0, grande, amarelo, ocupando o meio (abaixo da logo).
- **Frames 0–8:** o balão dá um "soco" de escala (100% → 112% → 100%) junto com a primeira sílaba da fala; leve
  tremida de câmera de 4 frames. Som: "tum" grave curto.
- **~2,5 s ("toda assistência já ouviu"):** a câmera recua e a cena se multiplica em 4 balcões iguais, lado a lado,
  cada um com um dedo apontado — é "toda assistência". Texto pequeno: "todo balcão".
- **"com o dedo apontado pro balcão":** volta ao close do dedo tocando o balcão. Tic seco no toque.

**2. O caso (5,2–9,9 s) — DESENHO.** Ficha "mês passado": o conector de carga sendo trocado (traço simples, cor
dessaturada); corte para hoje: o celular na bancada, tela preta, o botão de ligar apertado duas vezes sem resposta.
Texto: "não liga". Som: dois cliques secos do botão.

**3. "Não molhou" (9,9–14,0 s) — DESENHO.** O cliente com a mão no peito; um balão de pensamento do dono abre vazio,
com um ícone de celular genérico e um "?" — "nem lembra desse aparelho". A gota azul do celular brilha 1 frame
(pista para a cena 9).

**4. Palavra contra palavra (14,0–18,0 s) — DESENHO.** Dois balões frente a frente ("é garantia!" x "será?") se
empurrando no meio da tela; em "ninguém sai feliz", os dois murcham e caem. Som: dois "bloop" baixos.

**5. Abre a OS (18,0–21,6 s) — TELA.** Corte seco para `os_aberta.png`, recorte no cabeçalho **sem a faixa do link**:
"OS #13 · Em Aberto · 02/10/2026". Texto: "a história tá contada". Whoosh de entrada.

**6. O registro (21,6–25,9 s) — TELA, pan.** Realce no tempo da fala: "o dia que entrou" → campo **Entrada
02/10/2026**; "o que o técnico achou no laudo" → **Laudo Técnico**; "o serviço que foi feito" → linha de
**Serviços**. Não realçar valor. Tic leve em cada realce.

**7. Os termos (25,9–31,7 s) — TELA, zoom forte.** Pan desce até **Termos de Garantia**; zoom no item 1, com
sublinhado a traço em "90 (noventa) dias, contados da data de entrega" quando a fala diz "noventa dias a partir da
entrega". Etiqueta pequena "exemplo desta loja" ao lado (reforça que é texto da loja, não regra).

**8. O que não cobre (31,7–35,2 s) — TELA + desenho.** Mesmo bloco, "A GARANTIA NÃO COBRE"; três ícones desenhados
saltam ao lado, um por palavra: queda (celular caindo), trinca (vidro rachando), água (gota). Três tics leves.

**9. Conserto novo (35,2–39,6 s) — DESENHO.** Volta à bancada: a tampa do celular abre e a placa aparece com manchas
verde-azuladas de oxidação; a gota azul da cena 3 "se explica". Em "é conserto novo", carimbo **"CONSERTO NOVO"**
(baixo, sem estardalhaço). Som: carimbo baixo.

**10. É garantia (39,6–44,7 s) — DESENHO.** Contraponto honesto: outro celular, mesma bancada, selo verde **"GARANTIA
✓"** em "é garantia"; o cliente sai com um aceno em "sem drama". Texto: "sem drama".

**11. A data de saída (44,7–48,5 s) — TELA.** `os_aberta.png`, recorte em Dados Gerais: zoom em **Saída** (e
**Entrada** ao lado). Um calendário desenhado ao lado conta "+90" a partir da Saída (desenho, sem data inventada no
print). Texto: "sem puxar pela memória".

**12. Fecho (48,5–~52,6 s) — DESENHO + logo.** Os balões da cena 4 voltam, agora como uma única folha de OS onde se
lê **"Garantia combinada. Garantia escrita."**; em "No AlvoManage." a logo grande (variante clara) entra no centro (a
logo fixa continua no canto) + `app.alvomanage.com`. Acorde de fecho, segura 1,5 s.

Tela real em 5 de 12 cenas (5, 6, 7, 8, 11), todas recortes da mesma OS.

---

## 3. Capturas

**Nenhuma captura nova é necessária.** Tudo sai de `os_aberta.png` (1351 px de largura, zoom 100%). Risco: no zoom
forte das cenas 7 e 8 o texto pode ficar um pouco mole no vertical. Se o motion achar ilegível, a opção é um print
`--hd` (2x) da mesma OS #13 — e aí o `navegador` só age **com ok direto do usuário no chat dele** (só leitura).

---

## 4. Ordem de execução

1. **Usuário** — aprova o texto da seção 1. **É a única pendência.**
2. **narracao** (ElevenLabs, Lucas) — g01–g12 em `public/audio/vo-alvomanage-2/`, manifesto
   `src/narration-alvomanage-2.json` (id, texto, duração medida, `frame` com respiros de 0,4 s e 1,5 s no fim),
   `previous_text`/`next_text`. Direção: conversa natural, não locução.
3. **motion** (skill `hyperframes` primeiro) — projeto HyperFrames próprio, vídeo inteiro com som e sincronia, logo
   fixa (variante clara), sem tocar nos vídeos 1 e 3.
4. **Usuário** — revisa (e ouve g01, g03, g05, g12). Sem `render` nem `revisor` por padrão.

## 5. Riscos

1. Os 90 dias e as exclusões são o texto da conta demo; a fala diz "nessa loja aqui" e a tela leva a etiqueta
   "exemplo desta loja".
2. "Data de saída" é o rótulo do campo "Saída"; na OS #13 está vazio, e a cena mostra o campo, não uma data.
3. O tom solto depende da entrega da voz; só ouvindo.
