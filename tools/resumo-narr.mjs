#!/usr/bin/env node
// Resumo de um narration-*.json: id, frame, duração, fim e silêncio até a próxima.
// Uso: node tools/resumo-narr.mjs src/narration-cocacola.json
import fs from "node:fs";

const doc = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
let last = 0;
for (const [i, l] of doc.lines.entries()) {
	const end = l.frame + l.durationInFrames;
	const next = doc.lines[i + 1];
	const gap = next ? next.frame - end : 0;
	console.log(
		`${l.id.padEnd(14)} frame=${String(l.frame).padStart(4)} dur=${String(l.durationInFrames).padStart(3)} fim=${String(end).padStart(4)} gap=${gap}`,
	);
	last = end;
}
console.log(`fim da fala=${last} tail=${doc.tailFrames} total=${last + doc.tailFrames} (${((last + doc.tailFrames) / 30).toFixed(2)}s)`);
