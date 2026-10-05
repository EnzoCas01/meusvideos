#!/usr/bin/env node
// Espera um MP4 aparecer e parar de crescer. Uso: node tools/espera-mp4.mjs out/cocacola.mp4
import fs from "node:fs";

const file = process.argv[2];
let last = -1;
const tick = () => {
	if (!fs.existsSync(file)) {
		console.log("ainda renderizando (sem arquivo)");
		return;
	}
	const size = fs.statSync(file).size;
	console.log(`${file}: ${(size / 1e6).toFixed(1)} MB`);
	if (size > 0 && size === last) process.exit(0);
	last = size;
};
tick();
setInterval(tick, 120000);
