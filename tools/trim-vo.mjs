#!/usr/bin/env node
// Apara o silêncio do FIM de cada WAV de narração (o edge-tts deixa ~0,75 s mudo),
// deixando apenas `keep` segundos de respiro. Não toca no começo.
// Uso: node tools/trim-vo.mjs public/audio/vo-cocacola [keep=0.12]
import {execFileSync} from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const dir = process.argv[2];
const keep = Number(process.argv[3] ?? 0.12);
if (!dir) {
	console.error("uso: node tools/trim-vo.mjs <vo_dir> [keep_segundos]");
	process.exit(1);
}

const secs = (f) =>
	Number(
		execFileSync("ffprobe", [
			"-v",
			"error",
			"-show_entries",
			"format=duration",
			"-of",
			"default=nw=1:nk=1",
			f,
		]).toString().trim(),
	);

for (const name of fs.readdirSync(dir).filter((n) => n.endsWith(".wav")).sort()) {
	const src = path.join(dir, name);
	const tmp = path.join(dir, `.trim-${name}`);
	const before = secs(src);
	execFileSync("ffmpeg", [
		"-y",
		"-v",
		"error",
		"-i",
		src,
		"-af",
		`areverse,silenceremove=start_periods=1:start_silence=${keep}:start_threshold=-50dB:detection=peak,areverse`,
		tmp,
	]);
	const after = secs(tmp);
	// Segurança: nunca aceitar um corte que comeu mais de 1,2 s (sinal de que pegou fala).
	if (before - after > 1.2 || after < 0.4) {
		fs.unlinkSync(tmp);
		console.log(`${name}: MANTIDO (corte suspeito ${before.toFixed(2)} -> ${after.toFixed(2)})`);
		continue;
	}
	fs.renameSync(tmp, src);
	console.log(`${name}: ${before.toFixed(2)}s -> ${after.toFixed(2)}s (-${(before - after).toFixed(2)}s)`);
}
