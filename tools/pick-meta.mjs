// Extrai Genre/Feel/instrumentos/duração das faixas escolhidas do CSV do Incompetech.
// uso: node tools/pick-meta.mjs <csv> "Titulo 1" "Titulo 2" ...
import { readFileSync } from "node:fs";

const [, , csv, ...titulos] = process.argv;
const raw = readFileSync(csv, "utf8");
function parseLine(line) {
  const out = []; let cur = ""; let q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (q) { if (c === '"') { if (line[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; }
    else if (c === '"') q = true;
    else if (c === ",") { out.push(cur); cur = ""; }
    else cur += c;
  }
  out.push(cur); return out.map((s) => s.trim());
}
const rows = raw.split(/\r?\n/).filter((l) => l.trim()).map(parseLine);

for (const t of titulos) {
  const r = rows.find((x) => (x[0] ?? "").toLowerCase() === t.toLowerCase());
  if (!r) { console.log(`NAO ENCONTRADO: ${t}`); continue; }
  console.log(
    JSON.stringify({
      titulo: r[0],
      duracao: r[4],
      genero: r[2] || null,
      bpm: r[6] && r[6] !== "NULL" && r[6] !== "0" ? Number(r[6]) : null,
      instrumentos: r[5] || null,
      feel: r[8] || null,
      urlSite: r[9] && r[9] !== "NULL" ? r[9] : null,
    })
  );
}
