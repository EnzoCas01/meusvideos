#!/usr/bin/env node
// Imprime as cues de áudio de uma peça lidas do próprio módulo — os frames vêm
// do código, não da cabeça de quem escreveu o relatório.
// uso: node tools/cues.mjs <sufixo>   (ms, at, nf, if, cp, comece-pequeno; vazio = LifePhases)
import {build} from "esbuild";

const suf = process.argv[2] ?? "";
const entry = `src/utils/audio${suf ? `-${suf}` : ""}.ts`;

const {outputFiles} = await build({
	entryPoints: [entry],
	bundle: true,
	write: false,
	format: "esm",
	platform: "node",
	logLevel: "warning",
});
const mod = await import(`data:text/javascript;base64,${Buffer.from(outputFiles[0].text).toString("base64")}`);

const config = Object.values(mod).find((v) => v && typeof v === "object" && (v.sfx ?? v.music));
if (!config) {
	console.error(`${entry}: nenhum objeto com música/sfx exportado`);
	process.exit(1);
}

const {music, sfx} = config;
console.log(`${entry}`);
if (music) {
	console.log(`  música: ${music.enabled ? "ligada" : "desligada"}  ${music.src ?? ""}`);
	const anchors = ["fadeInFrames", "riseStart", "peakStart", "easeStart", "fadeOutStart", "totalFrames"]
		.filter((k) => music[k] !== undefined)
		.map((k) => `${k}=${music[k]}`);
	if (anchors.length) console.log(`    ${anchors.join("  ")}`);
}
if (sfx?.cues) {
	const cues = [...sfx.cues].sort((a, b) => a.frame - b.frame);
	console.log(`  ${cues.length} efeitos`);
	for (const c of cues) {
		console.log(`    frame ${String(c.frame).padStart(5)}  ${String(c.durationInFrames).padStart(3)} f  vol ${c.volume}  ${c.src}`);
	}
}
