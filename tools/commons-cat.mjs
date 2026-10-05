#!/usr/bin/env node
// Consulta o Wikimedia Commons para achar CATEGORIAS e ver o que há dentro,
// antes de baixar qualquer coisa.
//
//   node tools/commons-cat.mjs cat "<consulta>"        → categorias que batem
//   node tools/commons-cat.mjs membros "<Categoria>"   → arquivos da categoria, com tamanho e licença
//   node tools/commons-cat.mjs busca "<consulta>"      → busca textual em arquivos, com tamanho e licença
//   node tools/commons-cat.mjs sub "<Categoria>"       → subcategorias
//
// Só leitura, nada é salvo. Serve para escolher onde vale a pena usar o
// fetch-disney.mjs sem queimar downloads em material ruim.
// A API do Commons devolve 429 com facilidade: chamadas espaçadas, lotes de 10
// títulos e 4 tentativas com espera crescente.

const UA = 'LifePhases-imagem/1.0 (curadoria de imagens documentais)';
const args = process.argv.slice(2);
const modo = args[0];
const termo = args.slice(1).join(' ');

const api = async (params) => {
  const url = new URL('https://commons.wikimedia.org/w/api.php');
  url.search = new URLSearchParams({ format: 'json', ...params });
  let ultimo = '?';
  for (const espera of [0, 6000, 15000, 30000]) {
    if (espera) await new Promise((r) => setTimeout(r, espera));
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    if (res.ok) return res.json();
    ultimo = res.status;
    if (res.status !== 429) throw new Error(`HTTP ${res.status}`);
  }
  throw new Error(`HTTP ${ultimo} (desisti depois de 4 tentativas)`);
};

const strip = (v) => (v?.value ?? '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() || '?';

const detalhes = async (titulos) => {
  if (!titulos.length) return [];
  const out = [];
  for (let i = 0; i < titulos.length; i += 10) {
    if (i) await new Promise((r) => setTimeout(r, 5000));
    const d = await api({
      action: 'query',
      prop: 'imageinfo',
      iiprop: 'url|size|mime|extmetadata',
      titles: titulos.slice(i, i + 10).join('|'),
    });
    for (const p of Object.values(d.query?.pages ?? {})) {
      const ii = p.imageinfo?.[0];
      if (!ii) continue;
      const m = ii.extmetadata ?? {};
      out.push({
        titulo: p.title.replace(/^File:/, ''),
        w: ii.width,
        h: ii.height,
        mime: ii.mime,
        lic: strip(m.LicenseShortName),
        autor: strip(m.Artist ?? m.Credit),
        pagina: ii.descriptionurl,
      });
    }
  }
  return out;
};

const mostrar = (lista) => {
  for (const c of lista) {
    console.log(`  [${c.w}x${c.h}] ${c.lic} | ${c.autor.slice(0, 40)} | ${c.titulo.slice(0, 95)}`);
  }
  console.log(`  (${lista.length} itens)`);
};

if (modo === 'cat') {
  const d = await api({ action: 'query', list: 'search', srsearch: termo, srnamespace: '14', srlimit: '30' });
  for (const r of d.query?.search ?? []) console.log('  ' + r.title);
} else if (modo === 'sub') {
  const cat = termo.startsWith('Category:') ? termo : `Category:${termo}`;
  const d = await api({ action: 'query', list: 'categorymembers', cmtitle: cat, cmtype: 'subcat', cmlimit: '60' });
  for (const m of d.query?.categorymembers ?? []) console.log('  ' + m.title);
} else if (modo === 'membros') {
  const cat = termo.startsWith('Category:') ? termo : `Category:${termo}`;
  const d = await api({ action: 'query', list: 'categorymembers', cmtitle: cat, cmtype: 'file', cmlimit: '60' });
  const t = (d.query?.categorymembers ?? []).map((m) => m.title);
  console.log(`${cat}: ${t.length} arquivos`);
  mostrar(await detalhes(t));
} else if (modo === 'busca') {
  const d = await api({ action: 'query', list: 'search', srsearch: `${termo} filetype:bitmap`, srnamespace: '6', srlimit: '30' });
  const t = (d.query?.search ?? []).map((s) => s.title);
  console.log(`busca "${termo}": ${t.length} arquivos`);
  mostrar(await detalhes(t));
} else {
  console.error('uso: commons-cat.mjs cat|sub|membros|busca "<termo>"');
  process.exit(1);
}
