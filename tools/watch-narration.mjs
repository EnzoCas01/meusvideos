/**
 * Live progress bar for the narration render.
 *
 *   node tools/watch-narration.mjs
 *
 * Redraws in place every second until all the clips exist, then exits. Safe to
 * start, stop and restart at any time — it only reads from disk and never
 * touches the generation itself.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
// Which film to watch. Defaults to LifePhases; another piece points these at
// its own files the same way tools/generate-narration.py does, e.g.:
//   NARRATION_JSON=src/narration-comece-pequeno.json VO_DIR=public/audio/vo-comece-pequeno
const NARRATION_JSON = path.resolve(ROOT, process.env.NARRATION_JSON || path.join("src", "narration.json"));
const VO_DIR = path.resolve(ROOT, process.env.VO_DIR || path.join("public", "audio", "vo"));

const BAR_WIDTH = 34;
const TICK_MS = 1000;

const config = JSON.parse(fs.readFileSync(NARRATION_JSON, "utf8"));
const lines = config.lines;

/** Which clips are on disk, and when each one landed. */
const scan = () =>
	lines.map((line) => {
		const file = path.join(VO_DIR, `${line.id}.wav`);
		try {
			return {id: line.id, done: true, at: fs.statSync(file).mtimeMs};
		} catch {
			return {id: line.id, done: false, at: 0};
		}
	});

/**
 * Seconds per clip, averaged over the most recent finishes. Using the file
 * timestamps means the estimate is right even if the watcher started late.
 */
const secondsPerClip = (state) => {
	const stamps = state
		.filter((s) => s.done)
		.map((s) => s.at)
		.sort((a, b) => a - b);
	const recent = stamps.slice(-6);
	if (recent.length < 2) return null;
	const gaps = [];
	for (let i = 1; i < recent.length; i++) {
		const gap = (recent[i] - recent[i - 1]) / 1000;
		// Ignore the long idle gaps left by an interrupted run.
		if (gap > 0 && gap < 900) gaps.push(gap);
	}
	if (!gaps.length) return null;
	return gaps.reduce((a, b) => a + b, 0) / gaps.length;
};

const humanise = (seconds) => {
	if (seconds == null) return "calculando...";
	if (seconds < 60) return `${Math.ceil(seconds)}s`;
	const m = Math.floor(seconds / 60);
	const s = Math.round(seconds % 60);
	return s ? `${m}min ${s}s` : `${m}min`;
};

let lastWidth = 0;

const draw = (text) => {
	const padded = text.padEnd(lastWidth, " ");
	lastWidth = text.length;
	process.stdout.write(`\r${padded}`);
};

const render = () => {
	const state = scan();
	const done = state.filter((s) => s.done).length;
	const total = state.length;
	const pct = done / total;

	const filled = Math.round(pct * BAR_WIDTH);
	const bar = "█".repeat(filled) + "░".repeat(BAR_WIDTH - filled);

	if (done === total) {
		draw(`Narração  [${bar}]  ${done}/${total}  100%  concluído.`);
		process.stdout.write("\n");
		const totalSeconds = lines.reduce((sum, l) => sum + (l.durationInFrames ?? 0), 0) / 30;
		console.log(`${total} falas, ${totalSeconds.toFixed(1)}s de narração no total.`);
		console.log(config.enabled ? "narration.json: ativada." : "narration.json: ainda não ativada.");
		process.exit(0);
	}

	const current = state.find((s) => !s.done);
	const rate = secondsPerClip(state);
	const eta = rate == null ? null : rate * (total - done);
	const label = `${done}/${total}`.padStart(5);

	draw(
		`Narração  [${bar}]  ${label}  ${String(Math.round(pct * 100)).padStart(3)}%  ` +
			`gerando: ${current.id.padEnd(16)} faltam ~${humanise(eta)}`,
	);
};

console.log("Acompanhando a geração da narração. Ctrl+C para sair (não interrompe a geração).\n");
render();
const timer = setInterval(render, TICK_MS);

process.on("SIGINT", () => {
	clearInterval(timer);
	process.stdout.write("\n");
	process.exit(0);
});
