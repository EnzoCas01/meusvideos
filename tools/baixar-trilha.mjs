// Baixa as faixas candidatas de trilha (Kevin MacLeod / incompetech.com, CC BY 4.0).
// uso: node tools/baixar-trilha.mjs
import { createWriteStream, mkdirSync, existsSync, statSync } from "node:fs";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { join } from "node:path";

const DEST = "public/audio/musica-candidatas";
const BASE = "https://incompetech.com/music/royalty-free/mp3-royaltyfree/";

const TRACKS = [
  { grupo: "A", titulo: "Fluidscape", arquivo: "Fluidscape.mp3" },
  { grupo: "A", titulo: "Tranquility", arquivo: "Tranquility.mp3" },
  { grupo: "A", titulo: "Soaring", arquivo: "Soaring.mp3" },
  { grupo: "A", titulo: "Light Awash", arquivo: "Light Awash.mp3" },
  { grupo: "A", titulo: "Ever Mindful", arquivo: "Ever Mindful.mp3" },
  // o CSV da coleção chama o arquivo de "Odyssey High Quality.mp3", mas no site ele é "Odyssey.mp3"
  { grupo: "B", titulo: "Odyssey", arquivo: "Odyssey.mp3" },
  { grupo: "B", titulo: "Airship Serenity", arquivo: "Airship Serenity.mp3" },
  { grupo: "B", titulo: "Numinous Shine", arquivo: "Numinous Shine.mp3" },
  { grupo: "B", titulo: "Eternal Hope", arquivo: "Eternal Hope.mp3" },
];

mkdirSync(DEST, { recursive: true });

for (const t of TRACKS) {
  const alvo = join(DEST, t.arquivo);
  if (existsSync(alvo) && statSync(alvo).size > 100_000) {
    console.log(`pulado (já existe) ${t.arquivo}`);
    continue;
  }
  const url = BASE + encodeURIComponent(t.arquivo).replace(/%20/g, "%20");
  process.stdout.write(`baixando ${t.arquivo} ... `);
  const res = await fetch(url);
  if (!res.ok) {
    console.log(`FALHOU ${res.status}`);
    continue;
  }
  await pipeline(Readable.fromWeb(res.body), createWriteStream(alvo));
  console.log(`${(statSync(alvo).size / 1048576).toFixed(1)} MB`);
}
