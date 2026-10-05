#!/usr/bin/env node
// Apaga os WAVs das falas indicadas para que o gerador as refaça (texto mudou).
// Uso: node tools/refaz-vo.mjs public/audio/vo-cocacola 04-1886 08-candler
// Sem ids: apaga os WAVs que não correspondem a nenhuma fala do JSON informado em --json.
import fs from "node:fs";
import path from "node:path";

const [dir, ...rest] = process.argv.slice(2);
if (!dir) {
	console.error("uso: node tools/refaz-vo.mjs <vo_dir> <id> [id...]");
	process.exit(1);
}
for (const id of rest) {
	const f = path.join(dir, `${id}.wav`);
	if (fs.existsSync(f)) {
		fs.unlinkSync(f);
		console.log(`apagado ${f}`);
	} else {
		console.log(`não existia ${f}`);
	}
}
