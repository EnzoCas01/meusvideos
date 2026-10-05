#!/usr/bin/env node
// Descarta os candidatos reprovados e escreve o manifest.json final da
// pasta 11-mapa, já com os fatos que o motion precisa (projeção, esquema de
// id por país, oceano preenchido, Antártida, aspect).
import { writeFile, unlink } from 'node:fs/promises';
import { join } from 'node:path';

const DIR = '/root/meusvideos/public/images/netflix/11-mapa';

for (const f of [
  '01-blankmap-world-simple-svg.svg',
  '02-blank-svg-map-of-the-arab-world-svg.svg',
  '04-blankmap-world-equirectangular-svg.svg',
]) {
  try {
    await unlink(join(DIR, f));
    console.log(`removido ${f}`);
  } catch {}
}

const manifest = {
  pasta: '11-mapa',
  cena: 'Cena 8 — expansão global (Netflix)',
  consultas: [
    'BlankMap-World.svg',
    'Blank world map Robinson projection.svg',
    'BlankMap-World-150E clear.svg',
    'Blank world map.svg',
  ],
  engine: 'wikimedia-commons',
  imagens: [
    {
      arquivo: '05-blank-world-map-robinson-projection-svg.svg',
      titulo: 'Blank world map Robinson projection.svg',
      vetorial: true,
      formato: 'SVG',
      autor: 'Justinkunimune',
      licenca: 'CC0 1.0',
      licenca_url: 'https://creativecommons.org/publicdomain/zero/1.0/',
      pagina_origem:
        'https://commons.wikimedia.org/wiki/File:Blank_world_map_Robinson_projection.svg',
      url_original:
        'https://upload.wikimedia.org/wikipedia/commons/f/fc/Blank_world_map_Robinson_projection.svg',
      engine: 'wikimedia-commons',
      largura: 2048,
      altura: 1038.75,
      bytes: 207_000,
      descricao:
        'Mapa do mundo em branco, fronteiras de facto de 2022, dados Natural Earth. ' +
        'Projeção Robinson. Um <path> por país, com id = código ISO 3166-1 alfa-3.',
      svg: {
        projecao: 'Robinson',
        viewBox: '-180.000 -91.2960 360.000 182.592',
        aspect: 1.972,
        paths_total: 202,
        paths_com_id: 177,
        ids: 'ISO 3166-1 alfa-3 maiúsculo (BRA, USA, GBR, IND, JPN, NGA…) em <path id="XXX">',
        um_path_por_pais: true,
        territorio_nao_contiguo_agrupado: true,
        grupos: 'cada país é um <path> solto, sem <g> aninhado',
        circles_pequenos_paises: {
          total: 83,
          id: '<circle id="AND-circle"> — sufixo -circle',
          visivel_por_padrao: false,
          como_exibir: 'circle { display:block } no CSS, ou style inline',
          uso: 'pontos para países pequenos (Cingapura, Andorra…)',
        },
        paths_sem_id: '5 — o oceano (class="water") e lagos maiores; servem de contexto, não de país',
        oceano: {
          elemento: 'primeiro <path class="water">',
          fill: '#ffffff (branco)',
          problema: 'cobre também os cantos fora do contorno de Robinson — precisa ser ocultado ou re-preenchido',
          correcao: 'path.water { display:none } ou fill:none / fill:#050505',
        },
        antartida: {
          id: 'ATA',
          presente: true,
          observacao: 'path grande na faixa inferior de Robinson; pode ser ocultado com #ATA { display:none }',
        },
        pequenos_paises_ausentes: 'os 83 círculos cobrem os que não têm área visível',
        graticula: false,
        legenda_ou_escala: false,
        texto: false,
        idioma: 'n/a (sem rótulos)',
      },
    },
    {
      arquivo: '03-blankmap-world-svg.svg',
      titulo: 'BlankMap-World.svg',
      vetorial: true,
      formato: 'SVG',
      autor: 'Canuckguy e muitos outros (ver histórico do arquivo)',
      licenca: 'Public domain',
      licenca_url: 'https://commons.wikimedia.org/wiki/Template:PD-self',
      pagina_origem: 'https://commons.wikimedia.org/wiki/File:BlankMap-World.svg',
      url_original: 'https://upload.wikimedia.org/wikipedia/commons/4/4d/BlankMap-World.svg',
      engine: 'wikimedia-commons',
      largura: 2754,
      altura: 1398,
      bytes: 1_101_000,
      descricao:
        'Mapa político em branco detalhado, agrupamento ligado para juntar territórios ' +
        'não contíguos de um mesmo país. Menores países representados por círculos.',
      svg: {
        projecao: 'Robinson',
        viewBox: null,
        aspect: 1.97,
        paths_total: 2213,
        paths_com_id: 2212,
        ids: 'ISO 3166-1 alfa-2 minúsculo no <g> do país (br, us, in…); subdivisões/territórios com id longo (Indonesia_Java, Yemen_Socotra)',
        um_path_por_pais: false,
        territorio_nao_contiguo_agrupado: true,
        grupos: '212 <g id="xx"> — o país é o grupo, os pedaços de terra são os <path> dentro dele',
        circles_pequenos_paises: {
          total: null,
          id: 'classes circlexx / subxx / noxx',
          visivel_por_padrao: false,
          como_exibir: 'opacity:1 nas classes .circlexx / .subxx / .noxx',
          uso: 'pontos para países e territórios pequenos',
        },
        paths_sem_id: 'praticamente nenhum — 2212 de 2213 têm id',
        oceano: {
          elemento: '<path id="ocean" class="oceanxx">',
          fill: 'definido no bloco <style> (class .oceanxx)',
          problema: 'pinta o mar inteiro — precisa ser ocultado para o fundo #050505 aparecer',
          correcao: '#ocean { display:none } ou .oceanxx { fill:none }',
        },
        antartida: {
          id: 'classe .antxx (territórios sem população permanente)',
          presente: true,
          observacao: 'faixa larga no rodapé; recomenda-se .antxx { display:none }',
        },
        pequenos_paises_ausentes: 'cobertos por círculos das classes circlexx/subxx/noxx',
        graticula: false,
        legenda_ou_escala: false,
        texto: false,
        idioma: 'n/a (sem rótulos)',
      },
    },
  ],
  observacoes: [
    'Ambos são vetoriais (SVG) — escalam sem perda para 1080x1920.',
    'Ambos têm o oceano preenchido de claro (branco/cinza): o motion precisa ocultá-lo para o fundo #050505 aparecer.',
    'Projeção Robinson é larga (~1.97:1) — no vertical 1080x1920 o mapa inteiro ocupa pouca altura; prever zoom ou recorte.',
    'Oceano dos dois lados é resultado de busca no Wikimedia Commons; nenhuma imagem ficou sem licença conhecida (CC0 e PD).',
  ],
};

await writeFile(join(DIR, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(`manifest escrito: ${DIR}/manifest.json (${manifest.imagens.length} imagens)`);
