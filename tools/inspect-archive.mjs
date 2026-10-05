// Lê metadados do Internet Archive e lista arquivos de áudio disponíveis.
// uso: node tools/inspect-archive.mjs [caminho-json] [--grep=termo]
import { readFileSync } from "node:fs";

const file = process.argv[2] ?? "/tmp/incomp-meta.json";
const grepArg = process.argv.find((a) => a.startsWith("--grep="));
const grep = grepArg ? grepArg.slice(7).toLowerCase() : null;

const data = JSON.parse(readFileSync(file, "utf8"));
const files = data.files ?? [];
const audio = files.filter((f) => /\.(mp3|flac|ogg|wav)$/i.test(f.name));

console.log("item:", data.metadata?.identifier);
console.log("total files:", files.length, "audio:", audio.length);
console.log("metadata keys:", Object.keys(data.metadata ?? {}).join(", "));

const list = grep ? audio.filter((f) => f.name.toLowerCase().includes(grep)) : audio;
console.log(`--- mostrando ${Math.min(list.length, 200)} de ${list.length}`);
for (const f of list.slice(0, 200)) {
  const mb = f.size ? (Number(f.size) / 1048576).toFixed(1) + "MB" : "?";
  console.log(`${mb}\t${f.name}`);
}
