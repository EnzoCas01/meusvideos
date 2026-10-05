#!/usr/bin/env node
// Mapa-múndi em branco para a Cena 8 (expansão global) — Wikimedia Commons.
// Uso: node tools/fetch-world-map.mjs [--n=8] [--dry=1] ["consulta"]
// Grava em public/images/netflix/11-mapa/ e refaz o manifest.json da pasta.
//
// Diferente de tools/fetch-netflix.mjs, este aceita SVG: a Cena 8 precisa de
// um <path> por país para o motion acender os países individualmente.
// Também inspeciona o SVG baixado (nº de paths, presença de id/name por path,
// viewBox, projeção declarada) porque é isso que decide se serve.

import { writeFile, mkdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const DIR = '/root/meusvideos/public/images/netflix/11-mapa';
const UA = 'LifePhases-imagem/1.0 (mapa-mundi cena expansao)';
const API = 'https://commons.wikimedia.org/w/api.php';

const args = process.argv.slice(2);
const opt = (k, d) => {
  const hit = args.find((a) => a.startsWith(`--${k}=`));
  return hit ? hit.split('=')[1] : d;
};
const LIMIT = Number(opt('n', 8));
const DRY = opt('dry', '') === '1';
const CONSULTAS = args.filter((a) => !a.startsWith('--'));
const QUERIES = CONSULTAS.length
  ? CONSULTAS
  : [
      'BlankMap-World.svg',
      'Blank map of the world filetype:drawing',
      'World map blank political borders filetype:drawing',
      'BlankMap-World6 filetype:drawing',
      'World map robinson projection blank filetype:drawing',
    ];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const api = (url) => fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' } });
const strip = (v) => (v?.value ?? '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() || null;

async function buscar(query) {
  const u =
    `${API}?action=query&format=json&srnamespace=6&list=search` +
    `&srlimit=${LIMIT * 2}&srsearch=${encodeURIComponent(query)}`;
  const res = await api(u);
  if (!res.ok) throw new Error(`search HTTP ${res.status}`);
  return ((await res.json()).query?.search ?? []).map((h) => h.title);
}

async function info(titles) {
  await sleep(1500);
  const u =
    `${API}?action=query&format=json&prop=imageinfo&iiprop=url|size|mime|extmetadata|user` +
    `&titles=${encodeURIComponent(titles.join('|'))}`;
  const res = await api(u);
  if (!res.ok) throw new Error(`imageinfo HTTP ${res.status}`);
  return Object.values((await res.json()).query?.pages ?? {})
    .map((p) => {
      const ii = p.imageinfo?.[0];
      if (!ii) return null;
      const m = ii.extmetadata ?? {};
      return {
        titulo: p.title.replace(/^File:/, ''),
        largura: ii.width,
        altura: ii.height,
        mime: ii.mime,
        bytes: ii.size,
        autor: strip(m.Artist) ?? strip(m.Credit) ?? ii.user ?? null,
        licenca: strip(m.LicenseShortName) ?? strip(m.UsageTerms),
        licenca_url: strip(m.LicenseUrl),
        descricao: (strip(m.ImageDescription) ?? '').slice(0, 500) || null,
        pagina_origem: ii.descriptionurl,
        url_original: ii.url,
      };
    })
    .filter(Boolean);
}

// ------------------------------------------------------------------ inspeção
// O que decide se o SVG serve para "acender países": cada país num <path>
// próprio, com id ou name legível. Sem isso o motion não tem como endereçar.
function inspecionarSvg(txt) {
  const paths = txt.match(/<path\b[^>]*>/g) ?? [];
  const grupos = (txt.match(/<g\b[^>]*>/g) ?? []).length;
  const comId = paths.filter((p) => /\sid\s*=\s*"/.test(p));
  const comName = paths.filter((p) => /\s(?:name|data-name|inkscape:label)\s*=\s*"/.test(p));
  const ids = comId
    .map((p) => /\sid\s*=\s*"([^"]+)"/.exec(p)?.[1])
    .filter((v) => v && !/^(path|svg|layer|g)\d*$/i.test(v));
  const viewBox = /viewBox\s*=\s*"([^"]+)"/.exec(txt)?.[1] ?? null;
  const w = Number(/\bwidth\s*=\s*"([\d.]+)/.exec(txt)?.[1] ?? 0);
  const h = Number(/\bheight\s*=\s*"([\d.]+)/.exec(txt)?.[1] ?? 0);
  // heurística barata de projeção: o texto do arquivo costuma declarar
  const proj = /robinson/i.test(txt)
    ? 'Robinson'
    : /mercator/i.test(txt)
      ? 'Mercator'
      : /equirectangular|plate carr|winkel|eckert|natural earth|miller/i.exec(txt)?.[0]
        ? /(equirectangular|plate carr)/i.exec(txt)[0]
        : null;
  return {
    paths_total: paths.length,
    paths_com_id: comId.length,
    paths_com_name: comName.length,
    grupos,
    viewBox,
    width: w || null,
    height: h || null,
    aspect: w && h ? Number((w / h).toFixed(3)) : null,
    ids_exemplo: [...new Set(ids)].slice(0, 12),
    projecao_no_arquivo: proj,
    tem_antartida: /\bantarctica|ant[áa]rtida\b/i.test(txt),
    tem_estilo_inline: (txt.match(/style\s*=/g) ?? []).length,
    px_por_unidade: 'vetorial — escala indefinida, usar viewBox',
  };
}

// -------------------------------------------------------------------- corpo
const dir = DIR;
await mkdir(dir, { recursive: true });

let manifest = { pasta: '11-mapa', consultas: [], imagens: [] };
try {
  manifest = JSON.parse(await readFile(join(dir, 'manifest.json'), 'utf8'));
} catch {}
const conhecidas = new Set(manifest.imagens.map((i) => i.url_original));

const vistos = new Set();
const cands = [];
for (const q of QUERIES) {
  await sleep(2000 + Math.floor(Math.random() * 1500));
  let titles = [];
  try {
    titles = await buscar(q);
  } catch (e) {
    console.log(`busca "${q}" falhou: ${e.message}`);
    continue;
  }
  const novos = titles.filter((t) => !vistos.has(t) && !conhecidas.has(t));
  novos.forEach((t) => vistos.add(t));
  if (!novos.length) continue;
  try {
    const infos = (await info(novos))
      .filter((c) => c.mime === 'image/svg+xml')
      .sort((a, b) => (a.bytes ?? 0) - (b.bytes ?? 0));
    cands.push(...infos.map((c) => ({ ...c, consulta: q })));
  } catch (e) {
    console.log(`info "${q}" falhou: ${e.message}`);
  }
}

console.log(`\n${cands.length} SVGs candidatos:`);
for (const c of cands) {
  console.log(
    `  ${(c.bytes / 1024).toFixed(0).padStart(6)} KB | ${c.licenca ?? 'SEM LICENÇA'} | ${c.autor ?? '?'} | ${c.titulo}`,
  );
  console.log(`         ${c.descricao?.slice(0, 160) ?? ''}`);
}
if (DRY) process.exit(0);

const MAX = isNaN(Number(opt('max', '2'))) ? 2 : Number(opt('max', '2'));
let baixados = 0;
for (const c of cands) {
  if (baixados >= MAX) break;
  // descarta licenças que não servem para vídeo publicado
  if (/\bBY-NC|\bBY-ND|NonCommercial|NoDeriv/i.test(c.licenca ?? '')) {
    console.log(`  pulado (licença NC/ND): ${c.titulo}`);
    continue;
  }
  try {
    const res = await fetch(c.url_original, { headers: { 'User-Agent': UA } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    const txt = buf.toString('utf8');
    if (!/<svg/i.test(txt)) throw new Error('não parece SVG');
    const nome = `${String(manifest.imagens.length + 1).padStart(2, '0')}-${c.titulo
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60)}.svg`;
    await writeFile(join(dir, nome), buf);
    const ins = inspecionarSvg(txt);
    manifest.imagens.push({
      arquivo: nome,
      titulo: c.titulo,
      vetorial: true,
      formato: 'SVG',
      autor: c.autor,
      licenca: c.licenca,
      licenca_url: c.licenca_url,
      pagina_origem: c.pagina_origem,
      url_original: c.url_original,
      engine: 'wikimedia-commons',
      fonte: 'wikimedia-commons',
      consulta: c.consulta,
      largura: c.largura,
      altura: c.altura,
      bytes: buf.length,
      descricao: c.descricao,
      svg: ins,
    });
    baixados++;
    console.log(
      `  baixado ${nome} (${(buf.length / 1024).toFixed(0)} KB) — ` +
        `${ins.paths_total} paths, ${ins.paths_com_id} com id, viewBox ${ins.viewBox}`,
    );
  } catch (e) {
    console.log(`  FALHOU ${c.titulo.slice(0, 60)}: ${e.message}`);
  }
  await sleep(1200);
}

manifest.consultas = [...new Set([...(manifest.consultas ?? []), ...QUERIES])];
await writeFile(join(dir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(`\nmanifest: ${dir}/manifest.json (${manifest.imagens.length} imagens)`);
