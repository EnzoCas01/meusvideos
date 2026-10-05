#!/usr/bin/env node
// Coletor de imagens da série "Você sabia" (origem do Mickey Mouse) — Commons + Openverse.
// Uso: node tools/fetch-disney.mjs <commons|cat|file|openverse> <subpasta> "<consulta>" [--n=8] [--dry=1]
// Grava em public/images/disney/<subpasta>/ e refaz o manifest.json da pasta.
//
//   commons   busca textual (srsearch) — bom para achar por tema
//   cat       lista os ARQUIVOS de uma categoria do Commons (cmtitle) — mais
//             preciso para material histórico catalogado, onde a busca textual
//             traz fan art, cosplay e SVG vetorizado
//   file      títulos exatos separados por "|" — para puxar um arquivo conhecido
//             (ex.: mover um item achado numa busca para a pasta temática certa)
//
// Reexecutar a mesma consulta só baixa o que faltou (dedupe por url_original),
// então serve para retentar os 429 do upload.wikimedia.org.

import { writeFile, mkdir, readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';

const BASE = '/root/meusvideos/public/images/disney';
const UA = 'LifePhases-imagem/1.0 (busca de imagens documentais)';

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
  if (source === 'file') {
    return query.split('|').map((t) => (t.startsWith('File:') ? t : `File:${t}`));
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
  // imageinfo aceita no máximo 50 títulos por chamada; em lotes de 20 o
  // extmetadata volta completo sem estourar o limite de URL.
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
        copyrighted: strip(m.Copyrighted),
        descricao: (strip(m.ImageDescription) ?? '').slice(0, 400) || null,
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
  const results = (await res.json()).results ?? [];
  return results.map((r) => ({
    titulo: r.title || '(sem título)',
    largura: r.width,
    altura: r.height,
    mime: null,
    autor: r.creator || null,
    licenca: r.license ? `${r.license.toUpperCase()} ${r.license_version ?? ''}`.trim() : null,
    licenca_url: r.license_url || null,
    descricao: r.source ? `via ${r.source}` : null,
    pagina_origem: r.foreign_landing_url || r.url,
    url_original: r.url,
    fontes: [r.url],
    fonte: r.source,
  }));
}

// ------------------------------------------------------------------ corpo
const EXT = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif' };
const MAX_BYTES = 25 * 1024 * 1024;
const slug = (s) =>
  s
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
        if (buf.length < 8000) throw new Error(`arquivo pequeno (${buf.length}B)`);
        return { buf, via: ['thumb', 'original', 'thumb.php'][i] };
      } catch (e) {
        ultimo = e.message;
      }
    }
  }
  throw new Error(ultimo);
}

const dir = join(BASE, folder);
await mkdir(dir, { recursive: true });

let manifest = { pasta: folder, consulta: query, engine: source, imagens: [] };
try {
  manifest = JSON.parse(await readFile(join(dir, 'manifest.json'), 'utf8'));
} catch {}
const conhecidas = new Set(manifest.imagens.map((i) => i.url_original));

await sleep(2000 + Math.floor(Math.random() * 1500));

const found = source === 'openverse' ? await openverseCandidates() : await commonsCandidates();
const usable = found
  .filter(
    (c) =>
      /^image\/(jpeg|png|webp)$/.test(c.mime ?? 'image/jpeg') &&
      Math.max(c.largura ?? 0, c.altura ?? 0) >= MIN_W &&
      !conhecidas.has(c.url_original),
  )
  .slice(0, LIMIT);

console.log(`${source} "${query}" → ${found.length} brutos, ${usable.length} novos utilizáveis`);
for (const c of usable) {
  console.log(
    `  [${c.largura}x${c.altura}] ${c.licenca ?? 'DESCONHECIDA'} | ${c.autor ?? '?'} | ${c.titulo.slice(0, 90)}`,
  );
}
if (DRY) process.exit(0);

manifest.consulta = [manifest.consulta, query].filter(Boolean).join(' | ');
manifest.engine = [...new Set([...(manifest.engine ?? '').split('+'), source])]
  .filter(Boolean)
  .join('+');

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
    await writeFile(join(dir, nome), buf);
    manifest.imagens.push({
      arquivo: nome,
      titulo: c.titulo,
      autor: c.autor,
      licenca: c.licenca,
      licenca_url: c.licenca_url,
      restricoes: c.restricoes ?? null,
      copyrighted: c.copyrighted ?? null,
      data_obra: c.data_obra ?? null,
      pagina_origem: c.pagina_origem,
      url_original: c.url_original,
      engine: source,
      fonte: c.fonte ?? 'wikimedia-commons',
      largura: c.largura,
      altura: c.altura,
      via,
      descricao: c.descricao,
    });
    console.log(`  baixado ${nome} (${(buf.length / 1024).toFixed(0)} KB) [${via}]`);
  } catch (e) {
    console.log(`  FALHOU ${c.titulo.slice(0, 60)}: ${e.message}`);
  }
  await sleep(900);
}

await writeFile(join(dir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(`manifest: ${dir}/manifest.json (${manifest.imagens.length} imagens)`);
