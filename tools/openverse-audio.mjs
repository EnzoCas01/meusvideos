// Lê um resultado JSON da API do Openverse (áudio) e imprime os campos úteis.
// uso: node tools/openverse-audio.mjs <json>
import { readFileSync } from "node:fs";
const data = JSON.parse(readFileSync(process.argv[2], "utf8"));
console.log(`total: ${data.result_count}`);
for (const r of data.results ?? []) {
  console.log(
    [
      r.title,
      `${Math.round((r.duration ?? 0) / 1000)}s`,
      r.license + (r.license_version ? " " + r.license_version : ""),
      r.provider,
      r.creator,
      r.genres?.join("/"),
      r.url,
    ].join(" | ")
  );
}
