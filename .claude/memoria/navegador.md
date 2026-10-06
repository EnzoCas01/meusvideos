# Memória — navegador

## Catálogo do acervo (`public/images/alvomanage/`)
Atualize a cada rodada. Formato: tela — arquivo — data — nota — motivo.
Primeira leva: 2026-10-05, zoom 0.67 (pequeno demais para o vídeo final; refazer em zoom normal ou `--hd`). Estão em `historico/` com sufixo `_2026-10-05-zoom067`.

- Painel (Gerenciar O.S) — `os_dashboard` — BOA — 8 OS em andamento, atalhos rápidos. Gancho.
- Ordens de Serviço (lista) — `os_historico` — BOA, a melhor — aparelho, cliente, valor, botões de imprimir/link/WhatsApp.
- Produtos — `produtos` — BOA — preço, custo, lucro, estoque. Mostra o ERP.
- Clientes — `cadastro_clientes` — BOA — 8 clientes, lista limpa.
- PDV — `vendas_pdv` — BOA com ressalva — produtos e carrinho, mas aviso vermelho "caixa fechado". Abrir o caixa antes (pede ok do usuário).
- Fluxo de Caixa — `financeiro_fluxo-caixa` — EVITAR — saldo previsto -R$ 0,10 e aviso de "roadmap".
- Orçamentos — `os_orcamentos` — SÓ ANIMAÇÃO — vazia, só texto explicativo.
- Agendamento — `os_agendamento` — SÓ ANIMAÇÃO — vazio.
- Transferências — `estoque_transferencias` — SÓ ANIMAÇÃO — formulário em branco.
- WhatsApp — `whatsapp` — SÓ ANIMAÇÃO — bloqueado por plano.
- Loja Virtual — `pagina` — SÓ ANIMAÇÃO — bloqueada por plano (mostra os planos Landing, Loja Virtual, Premium).
- Movimentações de estoque e Caixa — `estoque_movimentacoes`, `financeiro_caixa` — AINDA NÃO AVALIADAS.
- OS aberta (#13) — `os_aberta` — BOA (2026-10-05, fullPage) — cabeçalho, "LINK DO CLIENTE" com Copiar/Ver, equipamento, serviços, financeiro. Campo Cliente aparece "—" nos Dados Gerais: preferir `os_aberta_link`.
- Topo da OS com o link — `os_aberta_link` — BOA — recorte 1351x300, seta sobre "Ver". Mostra onde fica o link.
- Página do cliente, celular — `link_cliente_celular` — BOA com ressalva — 390x844 @2x, mas fullPage (780x4712); recortar o topo (status + stepper) para o vídeo.
- Página do cliente, desktop — `link_cliente_desktop` — BOA — coluna central branca, status Em Aberto > Pronto > Entregue.
- Faltam: demais abas do menu.

## 2026-10-05 — Login do AlvoManage
Entrar em `app.alvomanage.com/auth/login`. Antes de digitar, clicar em "Apenas Essenciais" (banner de cookies) e esperar uns 3 s: o clique recarrega a página e quebra o `type` se for imediato.
**Por quê:** sem a espera, deu "Execution context was destroyed".

## 2026-10-05 — Tamanho da janela
Usar `defaultViewport: null` com `--start-maximized`. Com viewport fixo maior que a janela, o sistema aparece cortado para o usuário.
**Por quê:** o usuário reclamou do corte e, depois, de zoom 0.67 (tudo pequeno). Quer tamanho normal do Chrome.

## 2026-10-05 — Cursor
O Puppeteer não desenha o mouse. O script injeta uma seta SVG. O usuário pediu seta, não bola.

## 2026-10-05 — Estado da conta de demonstração
a conta de demonstração (usuário em SISTEMA_USER no .env): 3 lojas, 8 OS, 8 clientes, 9 produtos. WhatsApp e Loja Virtual estão **bloqueados por plano**; Orçamentos e Agendamento estão vazios. Fluxo de Caixa mostra saldo previsto de -R$ 0,10 e um aviso de "roadmap": evitar.
Menu: sub-itens ficam em grupos que rolam; usar `scrollIntoView` antes de clicar e cair para `goto` se a URL não mudar.

## 2026-10-05 — Link de acompanhamento do cliente
Na OS aberta (`/administrativo/os/<uuid>`) há a faixa "LINK DO CLIENTE" com a URL `https://app.alvomanage.com/acompanhar/<uuid>` e botões Copiar e Ver (Ver abre nova aba). Na lista, o botão "Copiar link" (title) grava no clipboard; capturei sobrescrevendo navigator.clipboard.writeText. Página pública, sem login: status com stepper, cliente, aparelho, itens, valor, termos e campo de assinatura (Limpar/Confirmar). Não há botão de aprovar orçamento nem histórico de etapas. Tempo real NÃO confirmado: em 60 s só 2 chamadas supabase (auth/user, profiles) no carregamento, sem polling nem websocket, texto igual.
**Por quê:** o motion precisa saber o que a página do cliente mostra de fato antes de narrar "tempo real".
Cursor: injetar seta com setInterval que reinsere se sumir, em cada aba nova (targetcreated). Usar um único script/sessão; relançar o Chrome repetido incomodou o usuário. Script: tools/_tour_os.mjs.

## 2026-10-05 — Quem opera o navegador
Só o agente `navegador` abre e opera o navegador. O `diretor` (sessão principal) não roda `tools/browser-*.mjs` por conta própria: delega e espera o relatório.
**Por quê:** o usuário viu o diretor abrindo o Chrome e reclamou ("extremamente errado"). A equipe existe para delegar.

## 2026-10-05 — Sidebar recolhida
O menu lateral fica recolhido (só ícones). Para abrir, passar o mouse na borda esquerda da tela (x ≈ 20) ou em cima dele; só então os nomes aparecem. Antes de clicar numa aba pelo menu, mover o mouse para lá e esperar abrir. Mostrar isso no vídeo é bom: o mouse abrindo o menu.

## 2026-10-05 — Os dois links
O link da faixa "LINK DO CLIENTE" dentro da OS (`/acompanhar/<uuid>`) é o **acompanhamento da ordem de serviço** (o usuário diz que é em tempo real; o agente não conseguiu confirmar sem mudar status). Os links de **orçamento** que aparecem nas tabelas são outra coisa: não confundir, e não usar um no lugar do outro no vídeo. Antes de gravar, confirmar qual é qual olhando o rótulo/título do botão.

## 2026-10-05 — Vídeos (public/images/alvomanage/videos/, gerados por tools/browser-record.mjs)
Primeira leva (19-53, viewport 1351x633, sem metadata de duração: medir com `ffmpeg -i X -f null -`):
- `painel_2026-10-05-19-53.mp4` 13,7 s — REGRAVAR — mouse quase parado, sem rolagem, aviso vermelho "Caixa fechado", sem sidebar.
- `os_2026-10-05-19-53.mp4` 23,7 s — REGRAVAR — sem sidebar, faixa do link só no fim, ok mas sem menu.
- `produtos_2026-10-05-19-53.mp4` 32,2 s — REGRAVAR — 32 s com tela parada, rolagem por scrollTop não funcionou.
- `link-celular_2026-10-05-19-53.mp4` 14,8 s — REGRAVAR — seta presa na borda direita, 80% termos de garantia.
Segunda leva (19-59, mesma pasta):
- `link-celular_2026-10-05-19-59.mp4` 16,5 s — BOM — começa no topo (logo, status Em Aberto, etapas), seta visível, rola até assinatura e volta ao topo.
- `os_2026-10-05-19-59.mp4` 70,4 s — MEDIANA — mostra o menu abrindo e a faixa LINK DO CLIENTE com hover em Copiar/Ver, mas o clique no menu falhou e entrou por goto (salto); longo demais.
- `painel_2026-10-05-19-59.mp4` 39,6 s — REGRAVAR — aviso vermelho "Caixa fechado" continua (hideCaixa não pegou), menu falhou, goto.
- `produtos_2026-10-05-19-59.mp4` 35,8 s — NÃO CONFERIDO a fundo; menu falhou, goto.
- `clientes_2026-10-05-19-59.mp4` 199,9 s — REGRAVAR — 3m20, vários trechos com tela e mouse congelados; lista de 8 clientes (nomes de demonstração, telefones fictícios).
**Por quê (menu):** o menu lateral abre como painel sobreposto (~250 px, mostra "Atividades recentes", Painel, Ordens de Serviço, Visão Geral, Cadastro > Fornecedores/Funcionários/Clientes, Vendas > PDV/Produtos/Devolução, Sair). Meu seletor de folhas de texto em aside/nav achou o hover mas o clique não navegou nas 5 tentativas (0 navegações): preciso sondar o DOM do menu (provavelmente o painel fecha ao mover o mouse, ou os itens são grupos que expandem e o texto está dentro de elementos com filhos). Ficou pendente: sondar o DOM antes de gravar de novo.

## 2026-10-05 — Rolar o menu lateral (pedido do usuário)
O menu aberto tem scroll próprio; para chegar em Financeiro, WhatsApp, Configuração etc. é preciso rolar DENTRO do menu, e o usuário quer ver isso. Abrir pela borda esquerda (x≈20), deixar o mouse em cima do menu, rolar com `page.mouse.wheel({deltaY})` em passos pequenos (ou scrollTop do contêiner do menu com easing), mostrando as abas passando; só depois clicar. Não usar scrollIntoView. (Ainda não implementado no script.)
**Por quê:** o usuário quer a navegação real no vídeo, não um salto.

## 2026-10-05 — Rolagem e tela parada
`mouse.wheel` em passos de ~10 px com ease rola direito; escolher "maior contêiner rolável" via scrollTop não rolou nada. Gravação do clientes congelou em muitos trechos (3m20): possível janela coberta/sem foco; não mexer na janela enquanto grava.

## 2026-10-05 — Rodada 2 (sondagem + prints 100%)
Menu (sondado): `aside .sidebar-nav-scroll` (overflow-y auto, 583 px visíveis de 1436) rola com a roda; itens são `aside a` / `aside button` com `span` folha; abre ao passar o mouse na borda (x≈24) e FECHA quando o mouse sai. O item "Ordens de Serviço" fica em y≈578, coberto pelo rodapé "Sair" (div.border-t, y≥583): clicar sem rolar o menu acerta o "Sair"/nada, e era por isso que o clique não navegava. Rolar o menu com a roda até o item ficar entre y 60 e 540, depois clicar. Grupos já vêm expandidos.
**Por quê:** causa do "menu não navega" das rodadas anteriores.
Mouse lento: com Chrome sem foco, cada `mouse.move` levava ~5 s (causa dos vídeos "congelados" de 3m20). Chamar `page.bringToFront()` + `Emulation.setFocusEmulationEnabled` no início resolve (move passou a 10-50 ms).
Chrome persistente: `tools/_nav_launch.mjs` abre 1 Chrome na porta 9333 e `tools/_nav_lib.mjs` se conecta (login, seta, menu, gravar). Login: esperar a URL sair de /auth/login (leva vários s).
Viewport da janela maximizada: 1366x577.
Caixa da conta demo: ABERTO em 05/10 17:26 (funcionário NZ, valor 0,00) com autorização do usuário. Para fechar depois: Financeiro > Caixa > Fechar Caixa.
Painel "Gerenciar O.S" (/os/dashboard) mostra "Sem avisos"; o alerta "3 OS em andamento há mais de 5 dias" está na Visão Geral (/administrativo).
Prints novos (zoom 100%, seta, boxes em prints_100_boxes.json) — todos BONS: os_dashboard_100, os_alerta_parada_100, produtos_100, cadastro_clientes_100, vendas_pdv_100 (caixa aberto), os_aberta_link_100.
Pendente: vídeos novos (menu_lateral, painel, os, produtos, clientes), página do cliente celular, teste de tempo real. Script _nav_s3.mjs falhou com "Target closed" na gravação do menu (Chrome fechou/caiu).

## 2026-10-05 — Teste de tempo real (Fase 1) — RESULTADO: NÃO
Mudei a OS #13 para Pronto (Gerenciar O.S, dropdown "Em aberto" > "Marcar como pronto"; toast "OS #13 → Pronto"; só PATCH ao Supabase, nenhum envio de WhatsApp/e-mail visto). A página /acompanhar/<uuid> (390x844, outra janela, SEM reload) NÃO mudou em ~45 s nem em ~70 s: seguiu "Em Aberto". Após reload mostrou "Pronto para Entrega". Logo: o cliente vê a mudança ao abrir/recarregar; não confirmado push em tempo real. Não afirmar "em tempo real" na voz.
Reverter: o dropdown do painel só oferece "Marcar como entregue" quando Pronto; o caminho de volta é OS > Editar > Situação (select) > Em Aberto > Salvar. Feito: OS #13 está de novo Em Aberto e o nome do cliente se manteve. O link do cliente da OS #13 é /acompanhar/24fe232e-528b-4378-a088-1946d31832bf.
Prints: link_cliente_topo_390.png, link_cliente_topo_390_depois_pronto.png (igual ao antes), link_cliente_topo_390_pronto_apos_reload.png.
Janela extra do celular: Target.createTarget(newWindow) via b.target().createCDPSession(); página com setViewport 390x844 @2x isMobile.
