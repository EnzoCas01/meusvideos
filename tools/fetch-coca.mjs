#!/usr/bin/env node
// Coletor de imagens da série "Você sabia" (Coca-Cola) — Wikimedia Commons.
//
//   node tools/fetch-coca.mjs busca <subpasta> "<consulta>" [--n=8] [--dry=1] [--drop=trecho,...]
//   node tools/fetch-coca.mjs cat   <subpasta> "<Categoria>" [--n=12]
//   node tools/fetch-coca.mjs file  <subpasta> "@tools/coca-01.txt"
//
// Baixa a maior versão útil (thumb de 1920 px quando o original é maior), reduz
// com ffmpeg para no máximo 1920 px de largura e mede o resultado com ffprobe.
// SVG e TIFF entram pelo render que o Commons faz na largura pedida (o TIFF da
// Library of Congress só existe nesse formato, e o render entrega JPEG).
// Só aceita licença declarada e reutilizável (PD, CC0, CC BY, CC BY-SA).
// A restrição de marca registrada NÃO descarta o arquivo — o tema da peça é a
// própria marca — mas fica registrada no manifest.json.
// A API do Commons devolve 429 com facilidade: chamadas espaçadas em 5-8 s.

import { writeFile, mkdir, readFile, readdir, unlink } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, extname } from 'node:path';
import { spawnSync } from 'node:child_process';

const BASE = '/root/meusvideos/public/images/cocacola';
const UA = 'LifePhases-imagem/1.0 (documentario historico; curadoria de imagens)';
const API = 'https://commons.wikimedia.org/w/api.php';
const MAX_W = 1920;
const MIN_W = 1000;

const args = process.argv.slice(2);
const [source, folder, query] = args;
const opt = (k, d) => {
  const hit = args.find((a) => a.startsWith(`--${k}=`));
  return hit ? hit.split('=').slice(1).join('=') : d;
};
const LIMIT = Number(opt('n', 8));
const DRY = opt('dry', '') === '1';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const strip = (v) => (v?.value ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() || null;

async function api(params) {
  const url = new URL(API);
  url.search = new URLSearchParams({ format: 'json', ...params });
  let ultimo = '?';
  for (const espera of [0, 8000, 20000, 40000]) {
    if (espera) await sleep(espera);
    const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' } });
    if (res.ok) return res.json();
    ultimo = res.status;
    if (res.status !== 429) throw new Error(`HTTP ${res.status}`);
  }
  throw new Error(`HTTP ${ultimo} (desisti depois de 4 tentativas)`);
}

const LICENCAS_OK = /^(public domain|pd-|cc0|cc-by|cc by|cc-zero|no restrictions|attribution)/i;

async function titulos() {
  if (source === 'file') {
    const linhas = (await readFile(query.slice(1), 'utf8'))
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith('#'));
    return linhas.map((t) => (t.startsWith('File:') ? t : `File:${t}`));
  }
  if (source === 'cat') {
    const cat = query.startsWith('Category:') ? query : `Category:${query}`;
    const d = await api({
      action: 'query',
      list: 'categorymembers',
      cmtype: 'file',
      cmlimit: String(LIMIT * 4),
      cmtitle: cat,
    });
    return (d.query?.categorymembers ?? []).map((m) => m.title);
  }
  const d = await api({
    action: 'query',
    srnamespace: '6',
    list: 'search',
    srlimit: String(LIMIT * 4),
    srsearch: query + ' filetype:bitmap',
  });
  return (d.query?.search ?? []).map((h) => h.title);
}

async function detalhes(lista) {
  const out = [];
  for (let i = 0; i < lista.length; i += 20) {
    if (i) await sleep(6000);
    const d = await api({
      action: 'query',
      prop: 'imageinfo',
      iiprop: 'url|size|mime|extmetadata|user',
      iiurlwidth: String(MAX_W),
      titles: lista.slice(i, i + 20).join('|'),
    });
    for (const p of Object.values(d.query?.pages ?? {})) {
      const ii = p.imageinfo?.[0];
      if (!ii) continue;
      const m = ii.extmetadata ?? {};
      const svg = ii.mime === 'image/svg+xml';
      const tif = /image\/tiff/.test(ii.mime ?? '');
      out.push({
        titulo: p.title.replace(/^File:/, ''),
        largura: svg ? MAX_W : ii.width,
        altura: svg ? Math.round((MAX_W * ii.height) / ii.width) : ii.height,
        mime: svg ? 'image/png' : tif ? 'image/jpeg' : ii.mime,
        render: svg || tif,
        licenca: strip(m.LicenseShortName) ?? strip(m.UsageTerms) ?? '',
        licenca_url: strip(m.LicenseUrl),
        restricoes: strip(m.Restrictions),
        autor: strip(m.Artist) ?? strip(m.Credit) ?? ii.user ?? null,
        data_obra: strip(m.DateTimeOriginal) ?? strip(m.DateTime),
        descricao: (strip(m.ImageDescription) ?? '').slice(0, 400) || null,
        categorias: (strip(m.Categories) ?? '').slice(0, 300) || null,
        credito: strip(m.Credit),
        pagina_origem: ii.descriptionurl,
        url_original: svg || tif ? null : ii.url,
        url_thumb:
          ii.thumburl ??
          `https://commons.wikimedia.org/w/thumb.php?f=${encodeURIComponent(p.title.replace(/^File:/, ''))}&w=${MAX_W}`,
        formato_original: ii.mime,
      });
    }
  }
  return out;
}

const slug = (s) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 58);

async function baixar(url) {
  let ultimo = '?';
  for (const espera of [0, 8000, 20000, 40000]) {
    if (espera) await sleep(espera);
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 5000) throw new Error(`arquivo pequeno (${buf.length} B)`);
      return buf;
    } catch (e) {
      ultimo = e.message;
    }
  }
  throw new Error(ultimo);
}

function medir(arquivo) {
  const r = spawnSync(
    'ffprobe',
    ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', arquivo],
    { encoding: 'utf8' },
  );
  const [w, h] = (r.stdout ?? '').trim().split(',').map(Number);
  return w && h ? { w, h } : null;
}

// Reduz para no máximo 1920 px de largura; nunca amplia. Devolve medidas reais.
function normalizar(arquivo) {
  if (!medir(arquivo)) return null;
  const ext = extname(arquivo).toLowerCase();
  const tmp = arquivo.replace(/\.(jpe?g|png)$/i, `.tmp${ext}`);
  const filtro = `scale='min(${MAX_W},iw)':-2:flags=lanczos`;
  const r = spawnSync(
    'ffmpeg',
    ['-y', '-v', 'error', '-i', arquivo, '-vf', filtro, ...(ext === '.png' ? [] : ['-q:v', '2']), tmp],
    { encoding: 'utf8' },
  );
  if (r.status === 0 && existsSync(tmp)) spawnSync('mv', [tmp, arquivo]);
  else spawnSync('rm', ['-f', tmp]);
  return medir(arquivo);
}

const motivo = (c, conhecidos) => {
  if (!/^image\/(jpeg|png)$/.test(c.mime ?? '')) return `mime ${c.formato_original}`;
  if (c.largura < MIN_W) return `só ${c.largura}px de largura`;
  if (!LICENCAS_OK.test(c.licenca)) return `licença "${c.licenca || 'vazia'}"`;
  if (conhecidos.has(c.titulo)) return 'já baixado em outra pasta';
  return null;
};

// ------------------------------------------------------------------- corpo
const dir = join(BASE, folder);
await mkdir(dir, { recursive: true });

let manifest = { pasta: folder, consulta: query, engine: 'wikimedia-commons', imagens: [] };
try {
  manifest = JSON.parse(await readFile(join(dir, 'manifest.json'), 'utf8'));
} catch {}

// dedupe entre pastas desta peça: nenhum arquivo do Commons entra duas vezes
const conhecidos = new Set();
for (const p of await readdir(BASE, { withFileTypes: true }).catch(() => [])) {
  if (!p.isDirectory()) continue;
  try {
    const m = JSON.parse(await readFile(join(BASE, p.name, 'manifest.json'), 'utf8'));
    for (const i of m.imagens ?? []) conhecidos.add(i.titulo);
  } catch {}
}

const found = await detalhes(await titulos());
const usaveis = found.filter((c) => !motivo(c, conhecidos));

console.log(`${source} "${query}" -> ${found.length} brutos, ${usaveis.length} utilizáveis`);
for (const c of found) {
  const rec = motivo(c, conhecidos);
  console.log(
    `${rec ? '  -' : '  +'} [${c.largura}x${c.altura}] ${c.licenca || 'SEM LICENÇA'} | ${c.titulo.slice(0, 75)}` +
      (rec ? `  (« ${rec})` : ''),
  );
}
if (DRY) process.exit(0);

const drop = opt('drop', '');
const escolhidos = (drop ? usaveis.filter((c) => !drop.split(',').some((d) => c.titulo.includes(d))) : usaveis).slice(
  0,
  LIMIT,
);

manifest.consulta = [...new Set([manifest.consulta, query].filter(Boolean))].join(' | ');

for (const c of escolhidos) {
  const ext = c.mime === 'image/png' ? '.png' : '.jpg';
  const nome = `${String(manifest.imagens.length + 1).padStart(2, '0')}-${slug(c.titulo) || 'imagem'}${ext}`;
  const destino = join(dir, nome);
  // original quando já está no tamanho certo; senão o render de 1920 do Commons
  const viaRender = c.render || c.largura > MAX_W * 1.05;
  const url = viaRender ? c.url_thumb : c.url_original;
  try {
    await writeFile(destino, await baixar(url));
    const medidas = normalizar(destino);
    if (!medidas || medidas.w < MIN_W) {
      await unlink(destino);
      console.log(`  DESCARTADO ${nome}: ficou ${medidas?.w ?? 0}px de largura`);
      continue;
    }
    manifest.imagens.push({
      arquivo: nome,
      titulo: c.titulo,
      autor: c.autor,
      licenca: c.licenca,
      licenca_url: c.licenca_url,
      restricoes: c.restricoes,
      data_obra: c.data_obra,
      descricao: c.descricao,
      categorias: c.categorias,
      pagina_origem: c.pagina_origem,
      url_original: c.url_original,
      engine: 'wikimedia-commons',
      largura: medidas.w,
      altura: medidas.h,
      largura_original: c.largura,
      altura_original: c.altura,
      via: c.render ? `render-1920 (${c.formato_original})` : viaRender ? 'thumb-1920' : 'original',
    });
    console.log(`  baixado ${nome} ${medidas.w}x${medidas.h} | ${c.licenca}`);
  } catch (e) {
    console.log(`  FALHOU ${c.titulo.slice(0, 60)}: ${e.message}`);
  }
  await sleep(2500 + Math.floor(Math.random() * 2000));
}

await writeFile(join(dir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(`manifest: ${dir}/manifest.json (${manifest.imagens.length} imagens)`);
