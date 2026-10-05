// Filtra o CSV do Incompetech por gênero, feel (col 8) e instrumentos (col 5), listando no máximo N linhas.
// uso: node tools/filter-csv.mjs <csv> [--genre=g1,g2] [--feel=f1+f2] [--nofeel=x] [--has=i1,i2] [--nohas=i1,i2] [--min=seg] [--max=seg] [--limit=40]
import { readFileSync } from "node:fs";

const args = process.argv.slice(3);
const get = (n) => {
  const a = args.find((x) => x.startsWith(`--${n}=`));
  return a ? a.slice(n.length + 3).toLowerCase() : null;
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
// coluna 4 vem como HH:MM:SS (ex. "00:03:36" = 3min36s)
const toSec = (d) => {
  const p = d.split(":").map(Number);
  return p.length === 3 ? p[0] * 3600 + p[1] * 60 + p[2] : p.length === 2 ? p[0] * 60 + p[1] : Number(d) || 0;
};

const genres = get("genre")?.split(",");
const feel = get("feel")?.split("+");
const nofeel = get("nofeel")?.split(",");
const has = get("has")?.split(",");
const nohas = get("nohas")?.split(",");
const minS = get("min") ? Number(get("min")) : 0;
const maxS = get("max") ? Number(get("max")) : Infinity;
const limit = get("limit") ? Number(get("limit")) : 40;

let out = rows.filter((r) => {
  const g = (r[2] ?? "").toLowerCase();
  const f = (r[8] ?? "").toLowerCase();
  const ins = (r[5] ?? "").toLowerCase();
  const sec = toSec(r[4] ?? "0");
  if (genres && !genres.includes(g)) return false;
  if (feel && !feel.every((x) => f.includes(x))) return false;
  if (nofeel && nofeel.some((x) => f.includes(x))) return false;
  if (has && !has.every((x) => ins.includes(x))) return false;
  if (nohas && nohas.some((x) => ins.includes(x))) return false;
  if (sec < minS || sec > maxS) return false;
  return true;
});

console.log(`${out.length} resultados`);
out = out.sort((a, b) => toSec(b[4] ?? "0") - toSec(a[4] ?? "0"));
for (const r of out.slice(0, limit)) {
  console.log(`\n${r[0]} | ${Math.round(toSec(r[4] ?? "0"))}s | ${r[2]} | ${r[6]}bpm | feel: ${r[8]}\n   instr: ${r[5]}\n   ${r[9]}`);
}
