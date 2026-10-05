#!/usr/bin/env node
// Curadoria das pastas de public/images/netflix/ — apaga arquivo e entrada de
// manifest na mesma operação, para não sobrar órfão de um lado só.
//
// Uso:
//   node tools/prune-netflix.mjs --drop-ncnd
//       remove tudo cujo licença seja NC e/ou ND (não serve para vídeo publicado)
//   node tools/prune-netflix.mjs <pasta> --manter=a.jpg,b.jpg [--descricao="..."]
//       mantém só os listados e documenta a pasta
//   node tools/prune-netflix.mjs --listar
//       imprime o estado atual de cada pasta

import { readdir, readFile, writeFile, unlink } from 'node:fs/promises';
import { join } from 'node:path';

const BASE = '/root/meusvideos/public/images/netflix';
const args = process.argv.slice(2);
const flag = (k) => args.find((a) => a.startsWith(`--${k}=`))?.split('=').slice(1).join('=');

const pastas = (await readdir(BASE, { withFileTypes: true }))
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort();

async function ler(p) {
  try {
    return JSON.parse(await readFile(join(BASE, p, 'manifest.json'), 'utf8'));
  } catch {
    return { pasta: p, imagens: [] };
  }
}

async function gravar(p, m) {
  await writeFile(join(BASE, p, 'manifest.json'), JSON.stringify(m, null, 2) + '\n');
}

function resumo(p, m) {
  const semLicenca = m.imagens.filter((i) => !i.licenca).length;
  console.log(`${p}: ${m.imagens.length} imagens, ${semLicenca} sem licença`);
  for (const i of m.imagens) {
    console.log(`  ${i.arquivo} — ${i.licenca ?? 'DESCONHECIDA'} — ${i.pagina_origem ?? ''}`);
  }
}

if (args.includes('--listar')) {
  for (const p of pastas) resumo(p, await ler(p));
  process.exit(0);
}

if (args.includes('--drop-ncnd')) {
  const ruim = /\bNC\b|\bND\b/;
  for (const p of pastas) {
    const m = await ler(p);
    const fora = m.imagens.filter((i) => ruim.test(i.licenca ?? '') || !i.licenca);
    if (!fora.length) continue;
    for (const i of fora) {
      try {
        await unlink(join(BASE, p, i.arquivo));
      } catch {}
    }
    m.imagens = m.imagens.filter((i) => !fora.includes(i));
    await gravar(p, m);
    console.log(`${p}: removidas ${fora.length} (NC/ND ou sem licença) → restam ${m.imagens.length}`);
  }
  process.exit(0);
}

const pasta = args[0];
const manter = (flag('manter') ?? '').split(',').map((s) => s.trim()).filter(Boolean);
if (!pasta || !manter.length) {
  console.error('uso: prune-netflix.mjs <pasta> --manter=a.jpg,b.jpg [--descricao="..."]');
  process.exit(1);
}

const m = await ler(pasta);
const fora = m.imagens.filter((i) => !manter.includes(i.arquivo));
for (const i of fora) {
  try {
    await unlink(join(BASE, pasta, i.arquivo));
  } catch {}
}
m.imagens = m.imagens.filter((i) => manter.includes(i.arquivo));
const desc = flag('descricao');
if (desc) m.descricao = desc;
await gravar(pasta, m);
console.log(`${pasta}: removidas ${fora.length}, mantidas ${m.imagens.length}`);
resumo(pasta, m);
