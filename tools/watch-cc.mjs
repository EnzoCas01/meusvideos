#!/usr/bin/env node
// Espera os WAVs da narração e as imagens da peça Coca-Cola aparecerem; uma linha por checagem.
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const count = (dir, exts) => {
	let n = 0;
	const walk = (d) => {
		if (!fs.existsSync(d)) return;
		for (const e of fs.readdirSync(d, {withFileTypes: true})) {
			if (e.isDirectory()) walk(path.join(d, e.name));
			else if (exts.some((x) => e.name.toLowerCase().endsWith(x))) n++;
		}
	};
	walk(dir);
	return n;
};

const tick = () => {
	const vo = count(path.join(root, "public/audio/vo-cocacola"), [".wav"]);
	const img = count(path.join(root, "public/images/cocacola"), [".jpg", ".jpeg", ".png", ".webp"]);
	const fontes = fs.existsSync(path.join(root, "public/images/cocacola/fontes.json"));
	const doc = JSON.parse(fs.readFileSync(path.join(root, "src/narration-cocacola.json"), "utf8"));
	const ready = doc.lines.filter((l) => l.durationInFrames > 0 && (l.words ?? []).length > 0).length;
	console.log(`vo=${vo} img=${img} fontes=${fontes} falas_medidas=${ready}/${doc.lines.length}`);
	if (fontes && ready === doc.lines.length) process.exit(0);
};

tick();
setInterval(tick, 60000);
