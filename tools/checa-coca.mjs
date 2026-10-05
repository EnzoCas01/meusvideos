#!/usr/bin/env node
// Confere o fontes.json da peça Coca-Cola: JSON válido, campos obrigatórios e
// existência real de cada arquivo (medindo com ffprobe).
//   node tools/checa-coca.mjs

import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

const BASE = '/root/meusvideos/public';
const j = JSON.parse(await readFile(join(BASE, 'images/cocacola/fontes.json'), 'utf8'));
const CAMPOS = ['path', 'width', 'height', 'author', 'license', 'source', 'epoca', 'title', 'note'];

let problemas = 0;
for (const i of j.imagens) {
  const faltando = CAMPOS.filter((c) => i[c] === undefined || i[c] === null || i[c] === '');
  const arquivo = join(BASE, i.path);
  if (!existsSync(arquivo)) {
    console.log(`AUSENTE  ${i.path}`);
    problemas++;
    continue;
  }
  const r = spawnSync(
    'ffprobe',
    ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', arquivo],
    { encoding: 'utf8' },
  );
  const [w, h] = (r.stdout ?? '').trim().split(',').map(Number);
  const ok = w === i.width && h === i.height;
  if (!ok) problemas++;
  if (faltando.length) problemas++;
  console.log(
    `${ok ? 'ok  ' : 'DIM '} ${String(w).padStart(4)}x${String(h).padStart(4)} ` +
      `(manifesto ${i.width}x${i.height}) | ${i.license.slice(0, 22).padEnd(22)} | ${i.path.slice(24)}` +
      (faltando.length ? `  FALTAM: ${faltando.join(',')}` : ''),
  );
}
console.log(`\n${j.imagens.length} imagens, ${problemas} problemas`);
