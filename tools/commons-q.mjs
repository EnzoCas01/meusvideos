#!/usr/bin/env node
// Consulta ad-hoc à API do Wikimedia Commons.
//   node tools/commons-q.mjs busca "<consulta>" [--n=20] [--espera=30]
//   node tools/commons-q.mjs cat "<Categoria>" [--n=50] [--sub=1] [--espera=30]
//   node tools/commons-q.mjs file "File:X.jpg" ["File:Y.jpg" ...] [--espera=30]
// Imprime título, dimensões, licença e autor. Não baixa nada.
// --espera=N aguarda N segundos antes da primeira chamada (acalma o 429).

const UA = 'LifePhases-imagem/1.0 (documentario historico; curadoria de imagens)';
const API = 'https://commons.wikimedia.org/w/api.php';
const args = process.argv.slice(2);
const [modo, alvo] = args;
const opt = (k, d) => {
  const hit = args.find((a) => a.startsWith(`--${k}=`));
  return hit ? hit.split('=').slice(1).join('=') : d;
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const strip = (v) => (v?.value ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() || null;

async function api(params) {
  const url = new URL(API);
  url.search = new URLSearchParams({ format: 'json', ...params });
  let ultimo = 0;
  for (const espera of [10000, 25000, 45000, 60000]) {
    await sleep(espera);
    const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' } });
    if (res.ok) return res.json();
    ultimo = res.status;
    if (res.status !== 429) throw new Error(`HTTP ${res.status}`);
  }
  throw new Error(`HTTP ${ultimo} (429 persistente)`);
}

const arquivo = (t) => (t.startsWith('File:') ? t : `File:${t}`);

async function info(titulos) {
  const linhas = [];
  for (let i = 0; i < titulos.length; i += 20) {
    const d = await api({
      action: 'query',
      prop: 'imageinfo',
      iiprop: 'url|size|mime|extmetadata|user',
      titles: titulos.slice(i, i + 20).join('|'),
    });
    for (const p of Object.values(d.query?.pages ?? {})) {
      const ii = p.imageinfo?.[0];
      if (!ii) {
        linhas.push(`  ? ${p.title} — sem imageinfo`);
        continue;
      }
      const m = ii.extmetadata ?? {};
      const lic = strip(m.LicenseShortName) ?? strip(m.UsageTerms) ?? 'SEM LICENÇA';
      const aut = strip(m.Artist) ?? strip(m.Credit) ?? ii.user ?? '?';
      const data = strip(m.DateTimeOriginal) ?? strip(m.DateTime) ?? '';
      const desc = (strip(m.ImageDescription) ?? '').slice(0, 220);
      linhas.push(
        `  [${ii.width}x${ii.height}] ${lic} | ${p.title.replace(/^File:/, '')}\n` +
          `      autor: ${String(aut).slice(0, 100)}${data ? ` | data: ${data}` : ''}\n` +
          (desc ? `      desc: ${desc}\n` : '') +
          `      ${ii.descriptionurl}`,
      );
    }
  }
  return linhas;
}

await sleep(Number(opt('espera', 0)) * 1000);

if (modo === 'busca') {
  const d = await api({
    action: 'query',
    srnamespace: '6',
    list: 'search',
    srlimit: String(opt('n', 20)),
    srsearch: alvo + ' filetype:bitmap',
  });
  const t = (d.query?.search ?? []).map((h) => h.title);
  console.log(`busca "${alvo}" -> ${t.length} arquivos`);
  console.log((await info(t)).join('\n'));
} else if (modo === 'cat') {
  const cat = alvo.startsWith('Category:') ? alvo : `Category:${alvo}`;
  const d = await api({
    action: 'query',
    list: 'categorymembers',
    cmtype: opt('sub', '') === '1' ? 'subcat|file' : 'file',
    cmlimit: String(opt('n', 50)),
    cmtitle: cat,
  });
  const todos = d.query?.categorymembers ?? [];
  const subs = todos.filter((m) => m.ns === 14).map((m) => m.title);
  const files = todos.filter((m) => m.ns === 6).map((m) => m.title);
  console.log(`${cat} -> ${files.length} arquivos, ${subs.length} subcategorias`);
  if (subs.length) console.log('SUB: ' + subs.join(' | '));
  console.log((await info(files)).join('\n'));
} else if (modo === 'file') {
  const titulos = args.slice(1).filter((a) => !a.startsWith('--'));
  console.log((await info(titulos.map(arquivo))).join('\n'));
}
