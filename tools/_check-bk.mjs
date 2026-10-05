import { readFileSync } from "node:fs";
const n = JSON.parse(readFileSync("src/narration-bk.json", "utf8"));
console.log("voice:", n.voice, "| falas:", n.lines.length);
for (const l of n.lines) console.log(l.id, "|", l.text.length, "chars |", l.text);
