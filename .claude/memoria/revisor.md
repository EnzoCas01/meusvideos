# Memória — revisor

## 2026-09-16 — Ler o código não substitui olhar o still
Dois defeitos passaram pela leitura e só apareceram na imagem: o anel de impacto virando um quadrado de luz em volta do ícone, e o texto "Estou atrasado?" quase estourando a largura do quadro.
**Por quê:** o recorte de viewport e a largura real de uma fonte não aparecem no código. Renderize e olhe.

## 2026-09-16 — Elemento pode existir e mesmo assim não ser visto
Os ícones de fase estavam na tela a 56px com 45% de opacidade. O usuário disse que não havia ícone nenhum.
**Por quê:** "está no código" e "está visível" são checagens diferentes. Sobre fundo #050505, avalie presença, não existência.

## 2026-09-16 — Conferir se a animação fecha antes do fade
O anel em volta de "fase" completava depois do início do fade da cena. Tecnicamente correto, invisível na prática.
**Por quê:** compare o fim de cada animação com o início do fade, não com o fim da cena.

## 2026-09-16 — O que eu não consigo verificar
Não ouço o áudio nem assisto ao vídeo em movimento. Consigo medir duração, streams, sobreposição de falas e enquadramento por still. Não julgo pronúncia, mixagem, nem a sensação do ritmo.
**Por quê:** o usuário reclamou do ritmo lento e da troca de voz — dois problemas reais que nenhuma checagem minha pegaria. Diga sempre, com todas as letras, o que ficou fora da verificação, em vez de deixar implícito que está tudo aprovado.
