// Inspeciona o CSV de metadados do Incompetech: cabeçalho, nº de linhas e busca por termos.
// uso: node tools/inspect-csv.mjs <csv> [termo1 termo2 ...]
import { readFileSync } from "node:fs";

const [, , file, ...terms] = process.argv;
const raw = readFileSync(file, "utf8");

// parser CSV simples com suporte a aspas
function parseLine(line) {
  const out = [];
  let cur = "";
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (q) {
      if (c === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++; } else q = false;
      } else cur += c;
    } else if (c === '"') q = true;
    else if (c === ",") { out.push(cur); cur = ""; }
    else cur += c;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

const lines = raw.split(/\r?\n/).filter((l) => l.trim().length);
const header = parseLine(lines[0]);
console.log("colunas:", header.map((h, i) => `${i}:${h}`).join(" | "));
console.log("linhas de dados:", lines.length - 1);

const rows = lines.slice(1).map(parseLine);
const lower = terms.map((t) => t.toLowerCase());

const hits = rows.filter((r) => {
  const s = r.join(" ").toLowerCase();
  return lower.some((t) => s.includes(t));
});

console.log(`--- ${hits.length} linhas casando com [${terms.join(", ")}]`);
for (const r of hits.slice(0, 100)) console.log(r.join(" ~ "));
