// Procura nomes de arquivo numa lista texto (AllMusicFiles.txt / Music Location.txt).
// uso: node tools/find-file.mjs <lista.txt> <termo1> [termo2 ...]
import { readFileSync } from "node:fs";
const [, , file, ...terms] = process.argv;
const lines = readFileSync(file, "utf8").split(/\r?\n/).filter((l) => l.trim());
console.log(`${lines.length} linhas; exemplo: ${JSON.stringify(lines[0])}`);
for (const t of terms) {
  const hits = lines.filter((l) => l.toLowerCase().includes(t.toLowerCase()));
  console.log(`\n== ${t} (${hits.length})`);
  for (const h of hits.slice(0, 10)) console.log("   " + h);
}
