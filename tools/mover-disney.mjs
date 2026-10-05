#!/usr/bin/env node
// Move uma imagem (arquivo + entrada de manifest) entre pastas de
// public/images/ — o hook ds-guard nega `cp`/`mv`, e o manifest precisa
// acompanhar, senão a origem se perde.
//
//   node tools/mover-disney.mjs <pastaOrigem> <arquivo> <pastaDestino> [--renomear=novo-nome.jpg]
//   node tools/mover-disney.mjs teste/x 02.jpg disney/08-walt-1920s --renomear=01-walt.jpg
//
// Os caminhos são relativos a public/images/.

import { readdir, readFile, writeFile, rename } from 'node:fs/promises';
import { join } from 'node:path';

const BASE = '/root/meusvideos/public/images';
const args = process.argv.slice(2);
const [origem, arquivo, destino] = args;
const flag = (k) => args.find((a) => a.startsWith(`--${k}=`))?.split('=').slice(1).join('=');

if (!origem || !arquivo || !destino) {
  console.error('uso: mover-disney.mjs <pastaOrigem> <arquivo> <pastaDestino> [--renomear=...]');
  process.exit(1);
}

const ler = async (p) => JSON.parse(await readFile(join(BASE, p, 'manifest.json'), 'utf8'));
const gravar = async (p, m) =>
  writeFile(join(BASE, p, 'manifest.json'), JSON.stringify(m, null, 2) + '\n');

const mOrig = await ler(origem);
const item = mOrig.imagens.find((i) => i.arquivo === arquivo);
if (!item) {
  console.error(`não achei ${arquivo} em ${origem}`);
  process.exit(1);
}

const existentes = (await readdir(join(BASE, destino)).catch(() => [])).filter(
  (f) => /\.[a-z]+$/i.test(f) && f !== 'manifest.json',
);
const numeros = existentes.map((f) => Number(f.slice(0, 2))).filter((n) => !Number.isNaN(n));
const proximo = (numeros.length ? Math.max(...numeros) : 0) + 1;
const nomePadrao = `${String(proximo).padStart(2, '0')}-${arquivo.replace(/^\d+-/, '')}`;
const nomeNovo = flag('renomear') ?? nomePadrao;

await rename(join(BASE, origem, arquivo), join(BASE, destino, nomeNovo));
item.arquivo = nomeNovo;

mOrig.imagens = mOrig.imagens.filter((i) => i.arquivo !== arquivo);
await gravar(origem, mOrig);

const mDest = await ler(destino).catch(() => ({ pasta: destino, imagens: [] }));
mDest.imagens.push(item);
await gravar(destino, mDest);

console.log(`${origem}/${arquivo} → ${destino}/${nomeNovo}`);
