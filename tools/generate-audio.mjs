/**
 * Generates every sound in the Google film (sx=gg) from scratch — no samples, no stock.
 *
 *   node tools/generate-audio.mjs google
 *
 * Every effect is designed against a specific thing happening on screen, and every cue
 * traces back to a frame in the scene files. The film has no music bed (by request).
 */

import fs from "node:fs";
import path from "node:path";

const SR = 44100;
const OUT = path.join(process.cwd(), "public", "audio", "gg");

/* ---------- primitives ---------- */

const buf = (seconds) => [
	new Float64Array(Math.ceil(seconds * SR)),
	new Float64Array(Math.ceil(seconds * SR)),
];

const add = (ch, startSec, i, v) => {
	const idx = Math.round(startSec * SR) + i;
	if (idx >= 0 && idx < ch.length) ch[idx] += v;
};

const pluckEnv = (t, attack, tau) => {
	if (t < 0) return 0;
	const a = t < attack ? t / attack : 1;
	return a * Math.exp(-Math.max(0, t - attack) / tau);
};

const noise = (n, seed) => {
	const out = new Float64Array(n);
	let s = seed;
	for (let i = 0; i < n; i++) {
		s = (s * 16807) % 2147483647;
		out[i] = s / 1073741823.5 - 1;
	}
	return out;
};

const normalize = (chans, peak) => {
	let max = 0;
	for (const c of chans) for (let i = 0; i < c.length; i++) max = Math.max(max, Math.abs(c[i]));
	if (max === 0) return;
	const g = peak / max;
	for (const c of chans) for (let i = 0; i < c.length; i++) c[i] *= g;
};

const edgeFade = (chans, seconds) => {
	const n = Math.max(1, Math.round(seconds * SR));
	for (const c of chans) {
		for (let i = 0; i < n && i < c.length; i++) {
			c[i] *= i / n;
			c[c.length - 1 - i] *= i / n;
		}
	}
};

const writeWav = (name, L, R, outDir = "") => {
	const target = outDir ? path.join(OUT, outDir) : OUT;
	fs.mkdirSync(target, {recursive: true});
	const n = L.length;
	const data = Buffer.alloc(n * 4);
	for (let i = 0; i < n; i++) {
		const l = Math.max(-1, Math.min(1, L[i]));
		const r = Math.max(-1, Math.min(1, R[i]));
		data.writeInt16LE(Math.round(l * 32767), i * 4);
		data.writeInt16LE(Math.round(r * 32767), i * 4 + 2);
	}
	const header = Buffer.alloc(44);
	header.write("RIFF", 0);
	header.writeUInt32LE(36 + data.length, 4);
	header.write("WAVE", 8);
	header.write("fmt ", 12);
	header.writeUInt32LE(16, 16);
	header.writeUInt16LE(1, 20);
	header.writeUInt16LE(2, 22);
	header.writeUInt32LE(SR, 24);
	header.writeUInt32LE(SR * 4, 28);
	header.writeUInt16LE(4, 32);
	header.writeUInt16LE(16, 34);
	header.write("data", 36);
	header.writeUInt32LE(data.length, 40);
	fs.writeFileSync(path.join(target, name), Buffer.concat([header, data]));
	const duration = (n / SR).toFixed(2) + "s";
	console.log(" ", path.join(target, name), (data.length / 1024 / 1024).toFixed(2) + " MB", duration);
};

const N = {
	C2: 65.41, F2: 87.31, G2: 98.0, A2: 110.0, C3: 130.81, E3: 164.81, F3: 174.61,
	G3: 196.0, A3: 220.0, B3: 246.94, C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23,
	G4: 392.0, A4: 440.0, C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99, A5: 880.0,
	C6: 1046.5, E6: 1318.5,
};

/* ---------- sound design ---------- */

/** SCENE 5 — the investment arriving (transition 4→5). A subtle ping that climbs
 *  like a financial chart: fast attack, gradual pitch rise, clean tail. */
const buildInvestmentPing = () => {
	const DUR = 0.8;
	const n = Math.round(DUR * SR);
	const [L, R] = buf(DUR);

	// A clean digital ping: two partials, fast decay
	for (let i = 0; i < n; i++) {
		const t = i / SR;
		const env = pluckEnv(t, 0.003, 0.4);
		const v = (Math.sin(2 * Math.PI * N.A4 * t) * 0.7 + Math.sin(2 * Math.PI * N.C5 * t) * 0.25) * env;
		L[i] = v;
		R[i] = v * 0.92;
	}

	// A short click underneath: air band-limited to 1200 Hz for a "digital" feel
	const click = highpass(lowpass(noise(n, 1234), 6000), 1200);
	for (let i = 0; i < n; i++) {
		const t = i / SR;
		const env = pluckEnv(t, 0.001, 0.008);
		L[i] += click[i] * env * 0.3;
		R[i] += click[Math.max(0, i - 60)] * env * 0.3;
	}

	const wl = reverb(L, 0.28, 0.72);
	const wr = reverb(R, 0.28, 0.71);
	normalize([wl, wr], 0.42);
	edgeFade([wl, wr], 0.015);
	writeWav("investment-ping.wav", wl, wr);
};

/** SCENE 8 — the market value number appearing. A short blip per digit: the
 *  first zero gets a clean click, then each successive digit adds a higher,
 *  brief tone. The effect lasts through the phrase "maiores valores de mercado". */
const buildMarketValueCount = () => {
	const DUR = 1.2;
	const n = Math.round(DUR * SR);
	const [L, R] = buf(DUR);

	// One per digit: 0, 0, 0 (the number has three leading zeros)
	const digitOffsets = [0, 0.08, 0.16]; // first two zeros faster, third slower
	const digitFreqs = [N.G4, N.A4, N.C5];
	const digitDurs = [0.12, 0.10, 0.15];

	digitOffsets.forEach((offset, i) => {
		const start = Math.round(offset * SR);
		for (let j = start; j < Math.min(start + Math.round(digitDurs[i] * SR), n); j++) {
			const t = (j - start) / SR;
			const env = pluckEnv(t, 0.002, 0.08);
			const v = Math.sin(2 * Math.PI * digitFreqs[i] * t) * env * 0.4;
			L[j] += v;
			R[j] += v * 0.95;
		}
	});

	// A low sub under the number to give it weight
	for (let i = 0; i < n; i++) {
		const t = i / SR;
		const env = Math.pow(Math.min(1, t / 0.06), 2) * Math.exp(-t / 0.5);
		const v = Math.sin(2 * Math.PI * N.G2 * t) * env * 0.12;
		L[i] += v;
		R[i] += v * 0.9;
	}

	const wl = reverb(L, 0.22, 0.78);
	const wr = reverb(R, 0.22, 0.775);
	normalize([wl, wr], 0.5);
	edgeFade([wl, wr], 0.01);
	writeWav("market-value-count.wav", wl, wr);
};

/** SCENE 9 — the "COMENTA EU QUERO" text appearing. A soft pop: air through a
 *  fast attack filter, with a low sub giving it a gentle push. Short, gentle,
 *  never overpowering. */
const buildCtaPop = () => {
	const DUR = 0.6;
	const n = Math.round(DUR * SR);
	const [L, R] = buf(DUR);

	// A soft air pop: air band-limited to 1500 Hz for warmth
	const air = highpass(lowpass(noise(n, 5678), 4000), 1500);
	for (let i = 0; i < n; i++) {
		const t = i / SR;
		const env = Math.pow(Math.min(1, t / 0.03), 2) * Math.exp(-t / 0.35);
		L[i] = air[i] * env * 0.4;
		R[i] = air[Math.max(0, i - 180)] * env * 0.4;
	}

	// A low sub for gentle push: sine dropping fast
	for (let i = 0; i < n; i++) {
		const t = i / SR;
		const f = 80 * Math.exp(-t * 6) + 28;
		const env = pluckEnv(t, 0.002, 0.2);
		L[i] += Math.sin(2 * Math.PI * f * t) * env * 0.3;
		R[i] += Math.sin(2 * Math.PI * f * t) * env * 0.3;
	}

	const wl = reverb(L, 0.18, 0.68);
	const wr = reverb(R, 0.18, 0.675);
	normalize([wl, wr], 0.55);
	edgeFade([wl, wr], 0.01);
	writeWav("cta-pop.wav", wl, wr);
};

/* ---------- reverb helper (reuse from LifePhases) ---------- */

const lowpass = (x, cutoff) => {
	const a = Math.exp((-2 * Math.PI * cutoff) / SR);
	const out = new Float64Array(x.length);
	let y = 0;
	for (let i = 0; i < x.length; i++) {
		y = (1 - a) * x[i] + a * y;
		out[i] = y;
	}
	return out;
};

const highpass = (x, cutoff) => {
	const lp = lowpass(x, cutoff);
	const out = new Float64Array(x.length);
	for (let i = 0; i < x.length; i++) out[i] = x[i] - lp[i];
	return out;
};

const reverb = (x, wet, decay) => {
	const combs = [1557, 1617, 1491, 1422].map((d) => ({d, b: new Float64Array(d), i: 0}));
	const allpass = [225, 556].map((d) => ({d, b: new Float64Array(d), i: 0}));
	const out = new Float64Array(x.length);
	for (let i = 0; i < x.length; i++) {
		let acc = 0;
		for (const c of combs) {
			const v = c.b[c.i];
			acc += v;
			c.b[c.i] = x[i] + v * decay;
			c.i = (c.i + 1) % c.d;
		}
		acc /= combs.length;
		for (const a of allpass) {
			const v = a.b[a.i];
			const y = -acc + v;
			a.b[a.i] = acc + v * 0.5;
			a.i = (a.i + 1) % a.d;
			acc = y;
		}
		out[i] = x[i] * (1 - wet) + acc * wet;
	}
	return out;
};

/** Scene 1 (rc) — whoosh sutil no instante da queda. Air passando por filtro fino para suavidade. */
const buildFallWhoosh = () => {
	const DUR = 0.8;
	const n = Math.round(DUR * SR);
	const [L, R] = buf(DUR);

	// Air band-limited a 1500 Hz para suavidade
	const air = highpass(lowpass(noise(n, 1111), 4000), 1500);
	for (let i = 0; i < n; i++) {
		const t = i / SR;
		const env = Math.pow(Math.min(1, t / 0.04), 2) * Math.exp(-t / 0.3);
		L[i] = air[i] * env * 0.35;
		R[i] = air[Math.max(0, i - 240)] * env * 0.35;
	}

	normalize([L, R], 0.55);
	edgeFade([L, R], 0.01);
	writeWav("fall-whoosh.wav", L, R, "audio/rc");
};

/** Scene 3 (rc) — som suave ao terminar de se levantar. Um sopro delicado com eco curto. */
const buildBreathLand = () => {
	const DUR = 0.7;
	const n = Math.round(DUR * SR);
	const [L, R] = buf(DUR);

	// Sopro delicado: mistura de bandpass e noise
	for (let i = 0; i < n; i++) {
		const t = i / SR;
		const env = Math.pow(Math.min(1, t / 0.02), 2) * Math.exp(-t / 0.4);
		const wind = highpass(noise(n, 2222), 300) * Math.sin(2 * Math.PI * 40 * t);
		L[i] = (wind + noise(n, 2222)[i] * 0.3) * env * 0.28;
		R[i] = (wind + noise(n, 2222)[Math.max(0, i - 300)] * 0.3) * env * 0.28;
	}

	const wl = reverb(L, 0.15, 0.7);
	const wr = reverb(R, 0.15, 0.68);
	normalize([wl, wr], 0.55);
	edgeFade([wl, wr], 0.01);
	writeWav("breath-land.wav", wl, wr, "audio/rc");
};

/* ---------- entry ---------- */

if (process.argv[2] === "google") {
	console.log("Google (sx=gg) sound design:");
	buildInvestmentPing();
	buildMarketValueCount();
	buildCtaPop();
	console.log("done ->", OUT);
}

if (process.argv[2] === "rc") {
	console.log("Recomeçar (sx=rc) sound design:");
	buildFallWhoosh();
	buildBreathLand();
	console.log("done ->", path.join(OUT, "audio/rc"));
}
