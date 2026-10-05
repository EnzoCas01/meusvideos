// Mostra os valores crus de colunas escolhidas do CSV do Incompetech.
// uso: node tools/rawcol.mjs <csv> <indice> [limite]
import { readFileSync } from "node:fs";
const raw = readFileSync(process.argv[2], "utf8");
const idx = Number(process.argv[3] ?? 4);
const limit = Number(process.argv[4] ?? 15);
const lines = raw.split(/\r?\n/).filter((l) => l.trim());
for (const l of lines.slice(0, limit)) {
  const parts = l.split(",");
  console.log(JSON.stringify(parts[idx]));
}
