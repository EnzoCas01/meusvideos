# Memória — imagem

## 2026-09-16 — O usuário quer busca no Google, e decidiu isso ciente do risco
Pedido dele: "ele pesquisa a imagem no google de preferencia e baixa e tras a imagem para o proximo agente so pegar ela e colocar no video". Eu levantei a questão de direitos autorais, ele reafirmou.
**Por quê:** é decisão dele, e está tomada — não reabra a discussão a cada busca. O que continua sendo seu dever é registrar a origem no `manifest.json` e dizer quantas imagens ficaram sem licença conhecida.

## 2026-09-16 — O JSON do SearXNG vem desligado de fábrica
No `settings.yml` o padrão é `formats: [html]`. Sem adicionar `json`, toda consulta volta 403.
**Por quê:** é o primeiro erro que aparece ao subir uma instância nova, e a mensagem de 403 não explica a causa.

## 2026-09-16 — O clone do SearXNG falha no Windows
`git clone` quebra em `utils/templates/etc/httpd/sites-available/searxng.conf:socket` — o `:` é caractere ilegal em NTFS.
**Por quê:** os objetos baixam normalmente; dá para extrair só o necessário com `git checkout HEAD -- <caminho>`. Para rodar de verdade, o caminho limpo é Docker, não clone.

## 2026-09-16 — O filme é motion graphics, não fotografia
O briefing original proibia imagem externa, e as sete cenas foram desenhadas em código (ampulheta, colunas, fases da lua, brotos, respiração, amanhecer), sobre fundo `#050505`.
**Por quê:** foto de fundo claro ou com aparência de banco de imagens destoa de tudo que já está lá. Priorize material escuro, recortável ou abstrato, e avise quando a imagem encontrada não combinar com a linguagem da peça.

## 2026-09-16 — Esta máquina não tem folga
4 núcleos, 7,9 GB, sem GPU. Uma instância do SearXNG rodando junto com render ou narração compete por CPU.
**Por quê:** processos pesados em paralelo aqui entram em swap e congelam sem erro. Suba a instância, busque, e derrube quando terminar.

## 2026-09-17 — Sem SearXNG local, a API do Wikimedia Commons e a do Openverse bastam
Sem Docker disponível nesta máquina, subir o SearXNG não foi possível. `commons.wikimedia.org/w/api.php?action=query&list=search&srnamespace=6&format=json` devolve resultados com `imageinfo` (licença, autor, URL) sem precisar de scraping; `api.openverse.org/v1/images/` complementa para material CC de bancos como Flickr/rawpixel/stocksnap. As duas têm rate limit agressivo (429) — espaçar chamadas em ~5-8s evita quebrar o lote.
**Por quê:** economiza a etapa de subir infraestrutura quando o pedido é por material fotográfico rastreável (Commons já entrega o `extmetadata` com a licença pronta).

## 2026-09-17 — Unsplash e Pexels bloqueiam scraping direto (Cloudflare challenge)
`curl` simples para páginas de busca do Unsplash/Pexels volta vazio ou challenge da Cloudflare. Não vale a pena insistir sem headless browser.
**Por quê:** evita perder tempo tentando raspar essas páginas; prefira Openverse (agrega Flickr/rawpixel/stocksnap com licença) ou Wikimedia Commons.

## 2026-09-17 — Imagem "publicada pelo próprio Nubank" nem sempre é foto real
No site oficial (nu.com/pt/sala-de-imprensa, nu.com/pt/quem-somos) há ilustrações estilizadas misturadas com fotos reais do escritório. Uma imagem de podcast ("nu videocast") mostrava um homem grisalho que não bate com as fotos confirmadas de David Vélez — descartada por não dar para confirmar identidade, mesmo vindo do domínio oficial.
**Por quê:** vir do site da empresa não faz a imagem virar "registro" automaticamente — abra e compare rosto/legenda antes de classificar. Metadado que não dá para confirmar não entra no manifesto.
