#!/usr/bin/env node
// Folha de contato para triagem: junta as imagens de uma pasta num único PNG
// em grade, para olhar tudo de uma vez antes de abrir uma por uma. A ordem
// impressa no stdout é a ordem da grade (esquerda→direita, de cima→baixo).
// Uso: node tools/ms-sheet.mjs <pasta> <saida.png> [--cols=4] [--tile=420]
import { execFileSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const [pasta, saida] = process.argv.slice(2);
const opt = (k, d) => {
  const hit = process.argv.find((a) => a.startsWith(`--${k}=`));
  return hit ? hit.split('=')[1] : d;
};
const COLS = Number(opt('cols', 4));
const TILE = Number(opt('tile', 420));

const dir = resolve(pasta);
const arquivos = readdirSync(dir)
  .filter((f) => /\.(jpe?g|png|webp)$/i.test(f))
  .sort();
if (!arquivos.length) throw new Error('pasta sem imagens');

const entradas = arquivos.flatMap((f) => ['-i', join(dir, f)]);
const filtros = arquivos.map(
  (_, i) =>
    `[${i}:v]scale=${TILE}:${TILE}:force_original_aspect_ratio=decrease,` +
    `pad=${TILE}:${TILE}:(ow-iw)/2:(oh-ih)/2:color=0x202020,setsar=1[t${i}]`,
);
const fila = arquivos.map((_, i) => `[t${i}]`).join('');
const linhas = Math.ceil(arquivos.length / COLS);
const grade =
  `${fila}concat=n=${arquivos.length}:v=1:a=0[seq];` +
  `[seq]tile=${COLS}x${linhas}:margin=6:padding=6:color=0x000000`;

execFileSync(
  'ffmpeg',
  ['-y', '-loglevel', 'error', ...entradas, '-filter_complex', [...filtros, grade].join(';'), '-frames:v', '1', resolve(saida)],
  { stdio: 'inherit' },
);

arquivos.forEach((f, i) => console.log(`${String(i + 1).padStart(2, '0')} ${f}`));
console.log(`→ ${saida} (${COLS}x${linhas})`);
