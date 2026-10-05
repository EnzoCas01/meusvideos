#!/usr/bin/env node
// Coletor de imagens da série "Você sabia" (Anthropic) — Commons + Openverse.
// Uso: node tools/fetch-anthropic.mjs <commons|cat|file|openverse> <subpasta> "<consulta>" [--n=8] [--dry=1]
// Grava em public/images/anthropic/<subpasta>/ e refaz o manifest.json da pasta.
//
//   file      títulos exatos separados por "|" (o caso normal aqui: os arquivos
//             do Commons já foram escolhidos à mão via tools/commons-cat.mjs)
//
// Depois de baixar, cada arquivo é normalizado: webp vira png (é o formato em que
// os logos chegam com alpha) e qualquer imagem acima de 1920px de largura é
// reduzida com ffmpeg. O manifest guarda as dimensões REAIS do arquivo em disco,
// não as do original no Commons.
//
// Reexecutar a mesma consulta só baixa o que faltou (dedupe por url_original),
// então serve para retentar os 429 do upload.wikimedia.org.
//
// Nomes de arquivo: NN-titulo-em-slug.ext (a extensão do título original é
// removida antes do slug, senão sai "titulo-jpg.jpg").

import { writeFile, mkdir, readFile, unlink, rename, stat } from 'node:fs/promises';
import { join, extname, basename } from 'node:path';
import { spawnSync } from 'node:child_process';

const BASE = '/root/meusvideos/public/images/anthropic';
const UA = 'LifePhases-imagem/1.0 (busca de imagens documentais)';
const MAX_W = 1920;

const args = process.argv.slice(2);
const [source, folder, query] = args;
const opt = (k, d) => {
  const hit = args.find((a) => a.startsWith(`--${k}=`));
  return hit ? hit.split('=').slice(1).join('=') : d;
};
const LIMIT = Number(opt('n', 8));
const MIN_W = Number(opt('minw', 700));
const LIC = opt('lic', 'commercial,modification');
const DRY = opt('dry', '') === '1';
const LARGURA_THUMB = 1800;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const api = (url) => fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' } });
const strip = (v) => (v?.value ?? '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() || null;

// ---------------------------------------------------------------- Commons
async function commonsTitles() {
  if (source === 'file' || source === 'lista') {
    const bruto = source === 'lista' ? await readFile(query, 'utf8') : query;
    return bruto
      .split(source === 'lista' ? /[\r\n|]/ : '|')
      .map((t) => t.trim())
      .filter((t) => t && !t.startsWith('#'))
      .map((t) => (t.startsWith('File:') ? t : `File:${t}`));
  }
  if (source === 'cat') {
    const cat = query.startsWith('Category:') ? query : `Category:${query}`;
    const url =
      'https://commons.wikimedia.org/w/api.php?action=query&format=json&list=categorymembers' +
      `&cmtype=file&cmlimit=${LIMIT * 3}&cmtitle=${encodeURIComponent(cat)}`;
    const res = await api(url);
    if (!res.ok) throw new Error(`commons category HTTP ${res.status}`);
    return ((await res.json()).query?.categorymembers ?? []).map((m) => m.title);
  }
  const url =
    'https://commons.wikimedia.org/w/api.php?action=query&format=json&srnamespace=6' +
    `&list=search&srlimit=${LIMIT * 3}&srsearch=${encodeURIComponent(query + ' filetype:bitmap')}`;
  const res = await api(url);
  if (!res.ok) throw new Error(`commons search HTTP ${res.status}`);
  return ((await res.json()).query?.search ?? []).map((h) => h.title);
}

async function commonsCandidates() {
  const titles = (await commonsTitles()).slice(0, LIMIT * 3);
  if (!titles.length) return [];
  const out = [];
  for (let i = 0; i < titles.length; i += 20) {
    await sleep(1800);
    const lote = titles.slice(i, i + 20);
    const info = await api(
      'https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo' +
        `&iiprop=url|size|mime|extmetadata|user&iiurlwidth=${LARGURA_THUMB}` +
        `&titles=${encodeURIComponent(lote.join('|'))}`,
    );
    if (!info.ok) throw new Error(`commons imageinfo HTTP ${info.status}`);
    for (const p of Object.values((await info.json()).query?.pages ?? {})) {
      const ii = p.imageinfo?.[0];
      if (!ii) continue;
      const m = ii.extmetadata ?? {};
      const nome = p.title.replace(/^File:/, '');
      out.push({
        titulo: nome,
        largura: ii.width,
        altura: ii.height,
        mime: ii.mime,
        autor: strip(m.Artist) ?? strip(m.Credit) ?? ii.user ?? null,
        licenca: strip(m.LicenseShortName) ?? strip(m.UsageTerms),
        licenca_url: strip(m.LicenseUrl),
        restricoes: strip(m.Restrictions),
        data_obra: strip(m.DateTimeOriginal) ?? strip(m.DateTime) ?? null,
        pagina_origem: ii.descriptionurl,
        url_original: ii.url,
        fontes: [
          ii.thumburl ?? ii.url,
          ii.url,
          `https://commons.wikimedia.org/w/thumb.php?f=${encodeURIComponent(nome)}&w=${LARGURA_THUMB}`,
        ],
      });
    }
  }
  return out;
}

// -------------------------------------------------------------- Openverse
async function openverseCandidates() {
  const url =
    'https://api.openverse.org/v1/images/?mature=false&page_size=' +
    Math.min(LIMIT * 2, 20) +
    `&license_type=${encodeURIComponent(LIC)}&q=${encodeURIComponent(query)}`;
  const res = await api(url);
  if (!res.ok) throw new Error(`openverse HTTP ${res.status}`);
  return ((await res.json()).results ?? []).map((r) => ({
    titulo: r.title || '(sem título)',
    largura: r.width,
    altura: r.height,
    mime: null,
    autor: r.creator || null,
    licenca: r.license ? `${r.license.toUpperCase()} ${r.license_version ?? ''}`.trim() : null,
    licenca_url: r.license_url || null,
    pagina_origem: r.foreign_landing_url || r.url,
    url_original: r.url,
    fontes: [r.url],
  }));
}

// ------------------------------------------------------------------ corpo
const EXT = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif' };
const MAX_BYTES = 30 * 1024 * 1024;
const semExt = (s) => s.replace(/\.(jpe?g|png|webp|gif|tiff?)$/i, '');
const slug = (s) =>
  semExt(s)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);

async function baixar(c) {
  let ultimo = '';
  for (const [i, u] of c.fontes.entries()) {
    for (const espera of [0, 4000, 12000]) {
      if (espera) await sleep(espera);
      try {
        const res = await fetch(u, { headers: { 'User-Agent': UA } });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        if (Number(res.headers.get('content-length') ?? 0) > MAX_BYTES) throw new Error('grande demais');
        const buf = Buffer.from(await res.arrayBuffer());
        if (buf.length < 5000) throw new Error(`arquivo pequeno (${buf.length}B)`);
        return { buf, via: ['thumb', 'original', 'thumb.php'][i] };
      } catch (e) {
        ultimo = e.message;
      }
    }
  }
  throw new Error(ultimo);
}

// ffmpeg normaliza: no máximo MAX_W de largura, webp vira png.
const ff = (...a) => spawnSync('ffmpeg', ['-y', '-v', 'error', ...a], { encoding: 'utf8' });
const filtro = `scale='min(${MAX_W},iw)':-2`;

function medidas(arquivo) {
  const r = spawnSync(
    'ffprobe',
    ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0:s=x', arquivo],
    { encoding: 'utf8' },
  );
  const [w, h] = (r.stdout ?? '').trim().split('x').map(Number);
  return w && h ? { w, h } : null;
}

async function normalizar(caminho, mime) {
  if (mime === 'image/webp') {
    const png = caminho.replace(/\.webp$/i, '.png');
    if (ff('-i', caminho, '-vf', filtro, '-pix_fmt', 'rgba', png).status === 0 && medidas(png)) {
      await unlink(caminho);
      return png;
    }
    return caminho;
  }
  const m = medidas(caminho);
  if (!m || m.w <= MAX_W) return caminho;
  const tmp = caminho.replace(/(\.\w+)$/, '-r$1');
  const q = mime === 'image/jpeg' ? ['-q:v', '3'] : [];
  if (ff('-i', caminho, '-vf', filtro, ...q, tmp).status !== 0 || !medidas(tmp)) return caminho;
  if ((await stat(tmp)).size >= (await stat(caminho)).size && mime !== 'image/jpeg') {
    await unlink(tmp);
    return caminho;
  }
  await unlink(caminho);
  await rename(tmp, caminho);
  return caminho;
}

const dir = join(BASE, folder);
await mkdir(dir, { recursive: true });

let manifest = { pasta: folder, consultas: [], engine: source, imagens: [] };
try {
  manifest = JSON.parse(await readFile(join(dir, 'manifest.json'), 'utf8'));
} catch {}
manifest.consultas = manifest.consultas ?? [];
manifest.imagens = manifest.imagens ?? [];
const conhecidas = new Set(manifest.imagens.map((i) => i.url_original));

await sleep(1500 + Math.floor(Math.random() * 1500));

const found = source === 'openverse' ? await openverseCandidates() : await commonsCandidates();
const usable = found
  .filter(
    (c) =>
      /^image\/(jpeg|png|webp)$/.test(c.mime ?? 'image/jpeg') &&
      Math.max(c.largura ?? 0, c.altura ?? 0) >= MIN_W &&
      !conhecidas.has(c.url_original),
  )
  .slice(0, LIMIT);

console.log(`${source} "${query.slice(0, 60)}" → ${found.length} brutos, ${usable.length} novos utilizáveis`);
for (const c of usable) {
  console.log(`  [${c.largura}x${c.altura}] ${c.licenca ?? 'SEM LICENÇA'} | ${c.autor ?? '?'} | ${c.titulo.slice(0, 80)}`);
}
if (DRY) process.exit(0);

manifest.consultas = [...new Set([...manifest.consultas, query.slice(0, 200)])];
manifest.engine = [...new Set([...(manifest.engine ?? '').split('+'), source])].filter(Boolean).join('+');

for (const c of usable) {
  const fromUrl = (() => {
    try {
      return extname(new URL(c.url_original).pathname).toLowerCase();
    } catch {
      return '';
    }
  })();
  const ext = EXT[c.mime ?? ''] ?? (fromUrl || '.jpg');
  const nome = `${String(manifest.imagens.length + 1).padStart(2, '0')}-${slug(c.titulo) || 'imagem'}${ext}`;
  try {
    const { buf, via } = await baixar(c);
    const bruto = join(dir, nome);
    await writeFile(bruto, buf);
    const arquivo = basename(await normalizar(bruto, c.mime ?? ''));
    const m = medidas(join(dir, arquivo)) ?? { w: c.largura, h: c.altura };
    manifest.imagens.push({
      arquivo,
      titulo: c.titulo,
      autor: c.autor,
      licenca: c.licenca,
      licenca_url: c.licenca_url,
      restricoes: c.restricoes ?? null,
      data_obra: c.data_obra ?? null,
      pagina_origem: c.pagina_origem,
      url_original: c.url_original,
      engine: source,
      fonte: 'wikimedia-commons',
      largura: m.w,
      altura: m.h,
      via,
    });
    console.log(`  baixado ${arquivo} (${m.w}x${m.h}, ${(buf.length / 1024).toFixed(0)} KB) [${via}]`);
  } catch (e) {
    console.log(`  FALHOU ${c.titulo.slice(0, 60)}: ${e.message}`);
  }
  await sleep(900);
}

await writeFile(join(dir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(`manifest: ${dir}/manifest.json (${manifest.imagens.length} imagens)`);
