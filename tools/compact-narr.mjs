#!/usr/bin/env node
// Reescreve um narration-*.json no formato compacto do projeto: uma fala por linha.
// Uso: node tools/compact-narr.mjs src/narration-cocacola.json
import fs from "node:fs";

const file = process.argv[2];
if (!file) {
	console.error("uso: node tools/compact-narr.mjs <narration.json>");
	process.exit(1);
}
const doc = JSON.parse(fs.readFileSync(file, "utf8"));
const {lines, ...head} = doc;
const headJson = JSON.stringify(head, null, 2).replace(/\n}$/, "");
const body = lines.map((l) => "    " + JSON.stringify(l)).join(",\n");
fs.writeFileSync(file, `${headJson},\n  "lines": [\n${body}\n  ]\n}\n`);
console.log(`${lines.length} falas compactadas em ${file}`);
