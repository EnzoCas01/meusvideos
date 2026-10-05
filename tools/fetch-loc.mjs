#!/usr/bin/env node
// Coletor do acervo da Library of Congress (loc.gov) para as pastas disney/.
//
//   node tools/fetch-loc.mjs <subpasta> "<consulta>" [--n=6] [--dry=1]
//
// O Google/Bing não servem para foto histórica (devolvem Alamy/Pinterest/blog
// moderno). A LoC tem o acervo de imprensa dos anos 1920-30 com o campo
// `rights` explícito, então seria a fonte certa para retrato de época — mas em
// 2026-09-19 a API respondeu 403 neste host mesmo com cabeçalhos de navegador
// (bloqueio de datacenter). O script fica para quando/se isso mudar.
//
// A API é pública: https://www.loc.gov/photos/?q=<termo>&fo=json
// Grava na mesma estrutura de manifest do fetch-disney.mjs (upsert por
// `url_original`, então reexecutar só baixa o que faltou).

import { writeFile, mkdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const BASE = '/root/meusvideos/public/images/disney';
const UA =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const HEADERS = {
  'User-Agent': UA,
  Accept: 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  Referer: 'https://www.loc.gov/',
};

const args = process.argv.slice(2);
const [folder, query] = args;
const opt = (k, d) => {
  const hit = args.find((a) => a.startsWith(`--${k}=`));
  return hit ? hit.split('=').slice(1).join('=') : d;
};
const LIMIT = Number(opt('n', 6));
const DRY = opt('dry', '') === '1';

if (!folder || !query) {
  console.error('uso: fetch-loc.mjs <subpasta> "<consulta>" [--n=6] [--dry=1]');
  process.exit(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const slug = (s) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);

const url = new URL('https://www.loc.gov/photos/');
url.search = new URLSearchParams({ q: query, fo: 'json', c: '60' });
const res = await fetch(url, { headers: HEADERS });
if (!res.ok) {
  console.error(`loc.gov respondeu ${res.status} — bloqueio de host, não adianta insistir.`);
  process.exit(2);
}
const dados = await res.json();

const resultados = (dados.results ?? []).map((r) => ({
  titulo: r.title ?? '(sem título)',
  img: r.image_url?.[r.image_url.length - 1] ?? r.image_url?.[0] ?? null,
  data: r.date ?? null,
  rights: Array.isArray(r.rights) ? r.rights.join(' / ') : (r.rights ?? null),
  pagina: r.id ?? r.url ?? null,
}));

const utilizaveis = resultados.filter((r) => r.img).slice(0, LIMIT);

console.log(`loc.gov "${query}" → ${resultados.length} resultados, ${utilizaveis.length} com imagem`);
for (const r of utilizaveis) {
  console.log(`  ${r.data ?? '?'} | ${(r.rights ?? 'SEM rights').slice(0, 70)}`);
  console.log(`     "${String(r.titulo).slice(0, 100)}"`);
  console.log(`     ${r.pagina}`);
}
if (DRY) process.exit(0);

const dir = join(BASE, folder);
await mkdir(dir, { recursive: true });
let manifest = { pasta: folder, consulta: query, engine: 'loc.gov', imagens: [] };
try {
  manifest = JSON.parse(await readFile(join(dir, 'manifest.json'), 'utf8'));
} catch {}
const conhecidas = new Set(manifest.imagens.map((i) => i.url_original));

for (const r of utilizaveis) {
  if (conhecidas.has(r.img)) continue;
  try {
    const resp = await fetch(r.img, { headers: HEADERS });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const buf = Buffer.from(await resp.arrayBuffer());
    if (buf.length < 8000) throw new Error(`arquivo pequeno (${buf.length}B)`);
    const nome = `${String(manifest.imagens.length + 1).padStart(2, '0')}-${slug(r.titulo) || 'loc'}${r.img.endsWith('.png') ? '.png' : '.jpg'}`;
    await writeFile(join(dir, nome), buf);
    manifest.imagens.push({
      arquivo: nome,
      titulo: r.titulo,
      autor: null,
      licenca: r.rights,
      licenca_url: null,
      data_obra: r.data,
      pagina_origem: r.pagina,
      url_original: r.img,
      engine: 'loc.gov',
      fonte: 'Library of Congress',
      largura: null,
      altura: null,
      via: 'loc',
      descricao: `loc.gov — rights: ${(r.rights ?? 'não informado').slice(0, 200)}`,
    });
    console.log(`  baixado ${nome} (${(buf.length / 1024).toFixed(0)} KB)`);
  } catch (e) {
    console.log(`  FALHOU "${String(r.titulo).slice(0, 50)}": ${e.message}`);
  }
  await sleep(800);
}

await writeFile(join(dir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(`manifest: ${dir}/manifest.json (${manifest.imagens.length} imagens)`);
