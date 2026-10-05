#!/usr/bin/env node
// Remove da pasta da peça Coca-Cola os arquivos que não servem, renumera os que
// ficam (01..N) e limpa o manifest.json — o registro nunca aponta para imagem
// que não existe mais.
//
//   node tools/prune-coca.mjs <subpasta> "<trecho,trecho,...>"
//   node tools/prune-coca.mjs <subpasta> --todos       (a lista vem de quem chama)
//
// O nome pode ser parcial (ex.: "04-16-fl-oz"), mas cada trecho precisa casar
// com um único arquivo — se casar com dois, o script para e não mexe em nada.

import { readFile, writeFile, unlink, rename } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const BASE = '/root/meusvideos/public/images/cocacola';
const [folder, alvos] = process.argv.slice(2);
if (!folder || !alvos) {
  console.error('uso: node tools/prune-coca.mjs <subpasta> "<trecho,trecho>"');
  process.exit(1);
}

const dir = join(BASE, folder);
const manifest = JSON.parse(await readFile(join(dir, 'manifest.json'), 'utf8'));
const antes = manifest.imagens.length;

for (const alvo of alvos.split(',').map((s) => s.trim()).filter(Boolean)) {
  const casam = manifest.imagens.filter((i) => i.arquivo.includes(alvo));
  if (casam.length !== 1) {
    console.log(`  "${alvo}": ${casam.length} arquivos casam — nada feito`);
    continue;
  }
  const arquivo = join(dir, casam[0].arquivo);
  if (existsSync(arquivo)) await unlink(arquivo);
  manifest.imagens = manifest.imagens.filter((i) => i.arquivo !== casam[0].arquivo);
  console.log(`  removido ${casam[0].arquivo}`);
}

// renumera 01..N: o manifesto guarda o nome antigo em `nome_original`
for (const [i, img] of manifest.imagens.entries()) {
  const novo = img.arquivo.replace(/^\d+/, String(i + 1).padStart(2, '0'));
  if (novo !== img.arquivo) {
    await rename(join(dir, img.arquivo), join(dir, novo));
    img.nome_original = img.arquivo;
    img.arquivo = novo;
  }
}

await writeFile(join(dir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(`${folder}: ${antes} -> ${manifest.imagens.length} imagens`);
