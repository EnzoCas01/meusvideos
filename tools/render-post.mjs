#!/usr/bin/env node
// Renders every scene of a spec as a JPG (post/carousel), sequentially:
//   node tools/render-post.mjs src/specs/<sx>.json [pasta-de-saida]
// Runs spec-composicao first (guarantees the composition exists), then one
// `remotion still` per scene — one heavy process at a time, RAM-checked.
import fs from "node:fs";
import path from "node:path";
import {execFileSync, spawnSync} from "node:child_process";
import {fileURLToPath} from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const specPath = path.resolve(process.argv[2] ?? "");
const spec = JSON.parse(fs.readFileSync(specPath, "utf8"));
const peca = spec.peca;
const outDir = path.resolve(process.argv[3] ?? path.join(RAIZ, "out", peca.toLowerCase()));

execFileSync("node", [path.join(RAIZ, "tools/spec-composicao.mjs"), specPath], {stdio: "inherit"});
fs.mkdirSync(outDir, {recursive: true});

const padrao = spec.formato === "video" ? 90 : 60;
let t = 0;
const arquivos = [];
for (const c of spec.cenas) {
	const from = c.from ?? t;
	const dur = c.durationInFrames ?? padrao;
	t = from + dur;
	const frame = from + Math.max(1, Math.floor(dur * 0.2));
	const alvo = path.join(outDir, `slide-${String(c.n).padStart(2, "0")}.jpg`);

	const livre = Number(/MemAvailable:\s*(\d+)/.exec(fs.readFileSync("/proc/meminfo", "utf8"))?.[1] ?? 0);
	if (livre < 1200 * 1024) {
		console.error(`só ${Math.round(livre / 1024)} MB livres (mínimo 1200): não renderizei para não derrubar a máquina`);
		process.exit(1);
	}
	console.log(`cena ${c.n}: still no frame ${frame} → ${path.relative(RAIZ, alvo)}`);
	const r = spawnSync(
		"npx",
		["remotion", "still", "src/index.ts", peca, alvo, `--frame=${frame}`, "--image-format=jpeg", "--log=error"],
		{cwd: RAIZ, stdio: "inherit", timeout: 20 * 60_000},
	);
	if (r.status !== 0) {
		console.error(`still da cena ${c.n} falhou (código ${r.status})`);
		process.exit(1);
	}
	arquivos.push(path.relative(RAIZ, alvo));
}

console.log(JSON.stringify({ok: true, pasta: path.relative(RAIZ, outDir), arquivos}, null, 1));
