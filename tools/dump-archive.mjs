// Despeja os campos de metadados e os nomes de arquivos de um JSON do Internet Archive.
// uso: node tools/dump-archive.mjs [caminho-json]
import { readFileSync } from "node:fs";

const file = process.argv[2] ?? "/tmp/incomp-meta.json";
const data = JSON.parse(readFileSync(file, "utf8"));

for (const [k, v] of Object.entries(data.metadata ?? {})) {
  const s = typeof v === "string" ? v : JSON.stringify(v);
  console.log(`## ${k}: ${s.length > 600 ? s.slice(0, 600) + "..." : s}`);
}
console.log("## files:");
for (const f of data.files ?? []) console.log(`  ${f.size ?? "?"}\t${f.format ?? "?"}\t${f.name}`);
