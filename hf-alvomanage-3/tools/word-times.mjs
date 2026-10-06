// Estimates word start frames for every narration line of AlvoManage 3.
// No word timestamps exist (ElevenLabs mp3 only), so: real speech bounds and
// internal pauses come from ffmpeg silencedetect; each pause is snapped to the
// nearest punctuation boundary; inside a phrase words are spread by syllable-ish
// weight (letters). Output: hf-alvomanage-3/words.json  {id: [{w, f}]} where f is
// the ABSOLUTE frame (30 fps) the word starts.
//   node hf-alvomanage-3/tools/word-times.mjs
import fs from "node:fs";
import {spawnSync} from "node:child_process";
const N = JSON.parse(fs.readFileSync("src/narration-alvomanage-3.json", "utf8"));
const FPS = N.fps;
const out = {};
for (const l of N.lines) {
	const file = `${N.dir}/${l.file}`;
	const log = spawnSync("ffmpeg", ["-hide_banner", "-i", file, "-af", "silencedetect=noise=-38dB:d=0.07", "-f", "null", "-"], {encoding: "utf8"}).stderr;
	const sil = [];
	const re = /silence_start: ([\d.]+)[\s\S]*?silence_end: ([\d.]+)/g;
	let m;
	while ((m = re.exec(log))) sil.push([+m[1], +m[2]]);
	const D = l.duration_s;
	let a = 0, b = D;
	const inner = [];
	for (const [s, e] of sil) {
		if (s < 0.02) a = Math.max(a, e);
		else if (e > D - 0.03) b = Math.min(b, s);
		else inner.push([s, e]);
	}
	const words = l.text.split(/\s+/).filter(Boolean);
	const weight = (w) => w.replace(/[^\p{L}\p{N}]/gu, "").length + 1.2;
	const W = words.map(weight);
	const total = W.reduce((x, y) => x + y, 0);
	// boundaries after words ending in punctuation
	const punct = words.map((w, i) => (/[.,:?!]$/.test(w) && i < words.length - 1 ? i : -1)).filter((i) => i >= 0);
	// raw proportional time of each word start ignoring pauses
	const speech = b - a - inner.reduce((s, [x, y]) => s + (y - x), 0);
	// snap each inner pause to nearest punctuation boundary by proportional position
	const cum = [];
	let c = 0;
	for (const w of W) { cum.push(c); c += w; }
	const snapped = new Map();
	let shift = 0;
	for (const [s, e] of inner) {
		const pos = (s - a - shift) / speech * total; // weight units
		let best = -1, bd = 1e9;
		for (const i of punct) { const d = Math.abs(cum[i + 1] - pos); if (d < bd && !snapped.has(i)) { bd = d; best = i; } }
		if (best >= 0) snapped.set(best, e - s);
		shift += e - s;
	}
	const used = [...snapped.values()].reduce((x, y) => x + y, 0);
	const rate = (b - a - used) / total;
	let t = a;
	out[l.id] = words.map((w, i) => {
		const start = t;
		t += W[i] * rate + (snapped.get(i) ?? 0);
		return {w, f: Math.round(l.frame + start * FPS)};
	});
	out[l.id].end = Math.round(l.frame + b * FPS);
}
fs.writeFileSync("hf-alvomanage-3/words.json", JSON.stringify(out, null, 1));
for (const [id, ws] of Object.entries(out)) console.log(id, ws.map((x) => `${x.w}@${x.f}`).join(" "), "| end", ws.end);
