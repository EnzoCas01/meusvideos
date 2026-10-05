#!/usr/bin/env node
// Inspeção e classificação de uso das pastas public/images/disney/.
//
//   node tools/uso-disney.mjs ver <pasta>
//       lista arquivo, status_uso, licença, autor, dimensões, título e página de origem
//
//   node tools/uso-disney.mjs ver-todos
//       resumo de todas as pastas (contagem + quantas sem status_uso)
//
//   node tools/uso-disney.mjs uso <pasta> <arquivo>=<status> [mais...] [--motivo-pd="..."]
//       grava status_uso em cada arquivo listado. Status: livre | provavel_PD | desconhecida
//       --motivo-pd grava o mesmo motivo_pd em todos os que ficarem provavel_PD.
//
// Aceita os dois formatos de manifest: o do fetch-images.mjs (SearXNG, campos
// em camelCase) e o do fetch-disney.mjs (Commons/Openverse). O manifest.json é
// a fonte da verdade; nada aqui mexe em src/.

import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const BASE = '/root/meusvideos/public/images/disney';
const args = process.argv.slice(2);
const cmd = args[0];
const flag = (k) => args.find((a) => a.startsWith(`--${k}=`))?.split('=').slice(1).join('=');

const ler = async (p) => JSON.parse(await readFile(join(BASE, p, 'manifest.json'), 'utf8'));
const gravar = async (p, m) =>
  writeFile(join(BASE, p, 'manifest.json'), JSON.stringify(m, null, 2) + '\n');

const dim = (i) => (i.largura ? `${i.largura}x${i.altura}` : (i.dimensoes ?? '?x?'));
const pag = (i) => i.pagina_origem ?? i.paginaDeOrigem ?? '';

const pastas = (await readdir(BASE, { withFileTypes: true }))
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort();

if (cmd === 'ver' || cmd === 'ver-todos') {
  const alvo = cmd === 'ver-todos' ? pastas : [args[1]];
  for (const p of alvo) {
    const m = await ler(p);
    const sem = m.imagens.filter((i) => !i.status_uso).length;
    const cont = m.imagens.reduce(
      (a, i) => ((a[i.status_uso ?? 'sem'] = (a[i.status_uso ?? 'sem'] ?? 0) + 1), a),
      {},
    );
    console.log(`\n=== ${p} — ${m.imagens.length} imagens, ${sem} sem status_uso`, JSON.stringify(cont));
    for (const i of m.imagens) {
      console.log(`  ${i.arquivo}  [${dim(i)}]`);
      console.log(
        `    ${i.status_uso ?? '—'} | lic: ${i.licenca ?? 'DESCONHECIDA'} | autor: ${i.autor ?? '?'} | ${i.data_obra ?? '?'}`,
      );
      console.log(`    "${(i.titulo ?? '').slice(0, 120)}"`);
      console.log(`    ${pag(i)} [${i.engine ?? i.fonte ?? ''}]`);
    }
  }
  process.exit(0);
}

if (cmd === 'uso') {
  const pasta = args[1];
  const m = await ler(pasta);
  const motivo = flag('motivo-pd');
  const pares = args.slice(2).filter((a) => a.includes('=') && !a.startsWith('--'));
  let n = 0;
  for (const par of pares) {
    const [arq, status] = par.split('=');
    const item = m.imagens.find((i) => i.arquivo === arq);
    if (!item) {
      console.log(`  não achei ${arq} em ${pasta}`);
      continue;
    }
    item.status_uso = status;
    if (status === 'provavel_PD' && motivo) item.motivo_pd = motivo;
    n++;
  }
  await gravar(pasta, m);
  const cont = m.imagens.reduce((a, i) => ((a[i.status_uso ?? 'sem'] = (a[i.status_uso ?? 'sem'] ?? 0) + 1), a), {});
  console.log(`${pasta}: ${n} marcadas —`, JSON.stringify(cont));
  process.exit(0);
}

console.error('uso: uso-disney.mjs ver <pasta> | ver-todos | uso <pasta> arq=status ... [--motivo-pd=...]');
process.exit(1);
