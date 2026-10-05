#!/usr/bin/env node
// Inspeção dos SVG da pasta 11-mapa: nº de paths, ids legíveis por país,
// viewBox/width/height, fill do oceano/fundo, Antártida, e se os ids são
// códigos ISO (dá para o motion endereçar país por nome).
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const DIR = '/root/meusvideos/public/images/netflix/11-mapa';
for (const f of (await readdir(DIR)).filter((f) => f.endsWith('.svg')).sort()) {
  const txt = await readFile(join(DIR, f), 'utf8');
  const paths = txt.match(/<path\b[^>]*>/g) ?? [];
  const ids = paths.map((p) => /\sid\s*=\s*"([^"]+)"/.exec(p)?.[1]).filter(Boolean);
  const iso2 = ids.filter((i) => /^[a-z]{2}$/.test(i));
  const nomes = ids.filter((i) => i.length > 3 && /^[A-Za-z][A-Za-z_ -]+$/.test(i));
  const fills = [...new Set(paths.map((p) => /\bfill\s*=\s*"([^"]+)"/.exec(p)?.[1]).filter(Boolean))];
  const rects = (txt.match(/<rect\b[^>]*>/g) ?? []).map((r) => r.slice(0, 120));
  const svgTag = /<svg\b[^>]*>/.exec(txt)?.[0] ?? '';
  const estilo = /<style\b[^>]*>([\s\S]{0,600})/.exec(txt)?.[1] ?? '';
  console.log(`\n=== ${f}  (${(txt.length / 1024).toFixed(0)} KB)`);
  console.log(`svg tag: ${svgTag.slice(0, 300)}`);
  console.log(`viewBox: ${/viewBox\s*=\s*"([^"]+)"/.exec(txt)?.[1] ?? 'AUSENTE'}`);
  console.log(`width/height: ${/\bwidth\s*=\s*"([^"]*)"/.exec(txt)?.[1]} x ${/\bheight\s*=\s*"([^"]*)"/.exec(txt)?.[1]}`);
  console.log(`paths: ${paths.length} | com id: ${ids.length} | ids tipo ISO2: ${iso2.length} | ids longos: ${nomes.length}`);
  console.log(`ids ISO2 (amostra): ${iso2.slice(0, 30).join(' ')}`);
  console.log(`ids longos (amostra): ${[...new Set(nomes)].slice(0, 12).join(' | ')}`);
  console.log(`fills distintos nos paths: ${fills.slice(0, 8).join(' ')}`);
  console.log(`<rect>: ${rects.length ? rects.join(' ').slice(0, 200) : 'nenhum'}`);
  console.log(`<style>: ${estilo ? estilo.replace(/\s+/g, ' ').slice(0, 250) : 'nenhum'}`);
  console.log(`menciona antarctica/antártida: ${/antarctica|ant[áa]rtida/i.test(txt)}`);
  console.log(`menciona oceano/sea/water: ${[...new Set(txt.match(/\b(ocean|sea|water|background)\w*/gi) ?? [])].slice(0, 6).join(' ')}`);
}
