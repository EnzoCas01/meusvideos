// Resumo do CSV de peças do Incompetech: valores distintos de colunas categóricas,
// filtro por gênero e por instrumentos ausentes/presentes.
// uso: node tools/summarize-csv.mjs <csv> [--genre=X] [--nohas=termo] [--has=termo] [--min=mm:ss]
import { readFileSync } from "node:fs";

const args = process.argv.slice(3);
const get = (name) => {
  const a = args.find((x) => x.startsWith(`--${name}=`));
  return a ? a.slice(name.length + 3) : null;
};

const raw = readFileSync(process.argv[2], "utf8");
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

const toSec = (d) => {
  const p = d.split(":").map(Number);
  if (p.length === 3) return p[0] * 60 + p[1] + p[2] / 30;
  if (p.length === 2) return p[0] * 60 + p[1];
  return Number(d) || 0;
};

const counts = (idx) => {
  const m = new Map();
  for (const r of rows) { const v = r[idx] ?? ""; m.set(v, (m.get(v) ?? 0) + 1); }
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
};

const mode = get("mode") ?? "genres";
if (mode === "genres") {
  console.log("=== col2 ===");
  for (const [v, n] of counts(2)) console.log(`${n}\t${v}`);
  console.log("=== col8 ===");
  for (const [v, n] of counts(8)) console.log(`${n}\t${v}`);
} else {
  const genre = get("genre");
  const has = get("has")?.toLowerCase();
  const nohas = get("nohas")?.toLowerCase();
  const minSec = get("min") ? toSec(get("min")) : 0;
  const maxSec = get("max") ? toSec(get("max")) : Infinity;
  let out = rows;
  if (genre) out = out.filter((r) => (r[2] ?? "").toLowerCase() === genre.toLowerCase());
  if (has) out = out.filter((r) => (r[5] ?? "").toLowerCase().includes(has));
  if (nohas) out = out.filter((r) => !(r[5] ?? "").toLowerCase().includes(nohas));
  const withT = out.map((r) => [toSec(r[4] ?? "0"), r]).filter(([s]) => s >= minSec && s <= maxSec);
  console.log(`${withT.length} peças`);
  for (const [s, r] of withT.sort((a, b) => b[0] - a[0])) {
    console.log(`${Math.round(s)}s\t${r[2]}\t${r[0]}\t${r[6]}bpm\t${r[5]}`);
  }
}
