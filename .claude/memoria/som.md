# Memória — som

## 2026-09-16 — Efeito tem que nascer do que está na tela
A primeira leva de efeitos era genérica: blip, whoosh de transição, swell espalhados pelo filme. Recusada: "os efeitos que voce colocou nao combina nada com o video, quero efeitos ligando ao desenho que voce fez".
**Por quê:** som descolado da imagem chama atenção para si e compete com a mensagem. Desenhe o som só depois que a imagem estiver fechada, um por evento visual.

## 2026-09-16 — Cena sem evento fica em silêncio
A cena 6 (respiração) ficou sem nenhum efeito, de propósito — só trilha e voz.
**Por quê:** a tentação de preencher todo momento com som é o que produz trilha genérica. Ausência é escolha válida.

## 2026-09-16 — O `frame` da cue é absoluto, não local
As cues em `src/utils/audio.ts` usam o frame do filme inteiro. É preciso somar o início da cena ao tempo local do evento.
**Por quê:** errar isso desloca o som em vários segundos e não dá erro nenhum — só soa errado.

## 2026-09-16 — O lint do Remotion exige callback em volume
`volume={cue.volume}` falha no eslint. Use `volume={() => cue.volume}`, mesmo para valor constante.

## 2026-09-16 — Os WAV pesam, e isso é aceitável
`ambient-piano.wav` tem ~10 MB e o conjunto passa de 20 MB em `public/audio/`. Nada disso entra no MP4 final, que sai com AAC comprimido.
**Por quê:** já pensei em converter para MP3 por peso. Não vale a perda de qualidade na mixagem; se incomodar, o caminho é ignorar no git e manter o script gerador versionado.

## 2026-09-17 — Duas peças, dois namespaces de áudio, um só gerador
"Comece Pequeno" é peça separada do LifePhases mas usa o mesmo `tools/generate-audio.mjs`, estendido por alvo: `node tools/generate-audio.mjs comece-pequeno` escreve em `public/audio/cp/`, `all`/`sfx`/`music` continuam intocados escrevendo na raiz de `public/audio/`. `writeWav` ganhou um 4º parâmetro `outDir` (default a raiz) para isso — sem essa mudança teria que duplicar o gerador inteiro.
**Por quê:** o usuário quer as duas peças integradas ao mesmo projeto, não scripts paralelos que divergem.

## 2026-09-17 — Cue de SFX derivada da voz precisa ser getter, não array estático
Em `audio-cp.ts`, `AUDIO_CP.sfx.cues` é um `get cues()` que chama uma função computando as cues a partir de `line(id)` (narration-cp.ts) e `SCENE_STARTS_CP` (ComecePequeno.tsx) — não um array fixo. `audio-cp.ts` importa `SCENE_STARTS_CP` de `ComecePequeno.tsx`, que importa as cenas, que importam `cue-cp.ts`, que importa `audio-cp.ts` de volta (via SoundtrackCP) — ciclo. Um array calculado no topo do módulo cairia na temporal dead zone. `cue-cp.ts` já resolve isso com uma factory só lida em render-time; copiei o mesmo padrão para `audio-cp.ts`. `SoundtrackCP.tsx` não precisou mudar porque `obj.cues` com getter se comporta como array normal ao iterar.
**Por quê:** sem isso, ou o build quebra na inicialização do módulo, ou as cues ficam presas em números que a narração real vai invalidar assim que for regerada.

## 2026-09-17 — Nem toda cue "travada na voz" precisa ser exata ao pixel
O usuário permitiu explicitamente que eventos puramente visuais (grid mínimo, halo da coisa pequena, cidade subindo, topo da curva, corte pro preto) fossem expressos como offset fixo a partir do início da cena, mesmo quando o código da cena na verdade deriva o instante exato de uma `cue()` (ex.: "cidade sobe" é `l9.at(0.5)`, não uma constante). Segui a instrução ao pé da letra em vez de re-derivar tudo da fala.
**Por quê:** overengenharia aqui significa mais imports cruzados sem necessidade; o usuário já sinalizou que a aproximação visual-relativa é aceitável para esses casos específicos.

## 2026-09-16 — A narração manda na mixagem
Efeitos entre 0,10 e 0,22; trilha com pico 0,5 e ducking automático sob cada fala.
**Por quê:** o usuário quer a mensagem em primeiro plano. Efeito que disputa atenção com a frase está alto demais.
