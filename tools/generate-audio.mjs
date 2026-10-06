/**
 * Generates every sound in the film from scratch — no samples, no stock.
 *
 *   node tools/generate-audio.mjs               # LifePhases: everything
 *   node tools/generate-audio.mjs sfx           # LifePhases: just the sound design
 *   node tools/generate-audio.mjs music         # LifePhases: just the score
 *   node tools/generate-audio.mjs comece-pequeno  # "Comece Pequeno": score + sfx
 *   node tools/generate-audio.mjs ifood          # "iFood — a virada": score + sfx
 *
 * Each effect is designed against a specific thing happening on screen (sand
 * running, a column climbing, a moon completing a phase, a bloom opening, the
 * light coming over the horizon). If a moment has no visual event, it gets no
 * sound. Same rule applies to the "Comece Pequeno" section further down —
 * every cue there traces back to something in src/scenes/comece-pequeno/.
 */
import fs from "node:fs";
import path from "node:path";

const SR = 44100;
const OUT = path.join(process.cwd(), "public", "audio");
const OUT_CP = path.join(process.cwd(), "public", "audio", "cp");

/* ---------- primitives ---------- */

const buf = (seconds) => [
	new Float64Array(Math.ceil(seconds * SR)),
	new Float64Array(Math.ceil(seconds * SR)),
];

const add = (ch, startSec, i, v) => {
	const idx = Math.round(startSec * SR) + i;
	if (idx >= 0 && idx < ch.length) ch[idx] += v;
};

/** Exponential decay with a short attack. */
const pluckEnv = (t, attack, tau) => {
	if (t < 0) return 0;
	const a = t < attack ? t / attack : 1;
	return a * Math.exp(-Math.max(0, t - attack) / tau);
};

/** Rise, hold, release — smoothstepped at both ends so nothing clicks. */
const padEnv = (t, dur, rise, fall) => {
	if (t < 0 || t > dur) return 0;
	const s = (x) => {
		const c = Math.max(0, Math.min(1, x));
		return c * c * (3 - 2 * c);
	};
	return s(t / rise) * s((dur - t) / fall);
};

/** Piano/bell-ish tone: inharmonic partials decaying at different rates. */
const bell = (L, R, start, freq, dur, gain, pan = 0.5) => {
	const parts = [
		{m: 1, a: 1, tau: dur * 0.55},
		{m: 2.01, a: 0.36, tau: dur * 0.3},
		{m: 3.02, a: 0.16, tau: dur * 0.18},
		{m: 4.04, a: 0.07, tau: dur * 0.12},
		{m: 5.9, a: 0.03, tau: dur * 0.08},
	];
	const n = Math.round(dur * SR);
	for (let i = 0; i < n; i++) {
		const t = i / SR;
		let v = 0;
		for (const p of parts) {
			v += p.a * Math.sin(2 * Math.PI * freq * p.m * t) * pluckEnv(t, 0.006, p.tau);
		}
		v *= gain;
		add(L, start, i, v * (1 - pan));
		add(R, start, i, v * pan);
	}
};

const pad = (L, R, start, freqs, dur, gain) => {
	const n = Math.round(dur * SR);
	for (let i = 0; i < n; i++) {
		const t = i / SR;
		const env = padEnv(t, dur, dur * 0.35, dur * 0.4);
		if (env <= 0) continue;
		let l = 0;
		let r = 0;
		freqs.forEach((f, k) => {
			const det = 1 + (k % 2 === 0 ? 0.0012 : -0.0015);
			const drift = Math.sin(2 * Math.PI * (0.05 + k * 0.013) * t) * 0.0008;
			const wob = 0.85 + 0.15 * Math.sin(2 * Math.PI * (0.07 + k * 0.02) * t);
			const a = (1 / (k + 1.6)) * wob;
			l += a * Math.sin(2 * Math.PI * f * (1 + drift) * t);
			r += a * Math.sin(2 * Math.PI * f * det * (1 - drift) * t);
			l += a * 0.12 * Math.sin(2 * Math.PI * f * 2 * t);
			r += a * 0.12 * Math.sin(2 * Math.PI * f * 2.003 * t);
		});
		add(L, start, i, l * env * gain);
		add(R, start, i, r * env * gain);
	}
};

const sub = (L, R, start, freq, dur, gain) => {
	const n = Math.round(dur * SR);
	for (let i = 0; i < n; i++) {
		const t = i / SR;
		const v = Math.sin(2 * Math.PI * freq * t) * padEnv(t, dur, dur * 0.3, dur * 0.35) * gain;
		add(L, start, i, v);
		add(R, start, i, v);
	}
};

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

/** Schroeder reverb: 4 parallel combs into 2 allpasses. */
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

const writeWav = (name, L, R, outDir = OUT) => {
	fs.mkdirSync(outDir, {recursive: true});
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
	fs.writeFileSync(path.join(outDir, name), Buffer.concat([header, data]));
	const duration = (n / SR).toFixed(2) + "s";
	console.log(" ", path.join(path.relative(OUT, outDir) || ".", name), (data.length / 1024 / 1024).toFixed(2) + " MB", duration);
};

const N = {
	C2: 65.41, F2: 87.31, G2: 98.0, A2: 110.0, C3: 130.81, E3: 164.81, F3: 174.61,
	G3: 196.0, A3: 220.0, B3: 246.94, C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23,
	G4: 392.0, A4: 440.0, C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99, A5: 880.0,
	C6: 1046.5, E6: 1318.5,
};

/* ---------- the score ---------- */

const buildMusic = () => {
	const DUR = 58.5;
	const [L, R] = buf(DUR);

	// Am - F - C - G - Am - F - C. Each chord overlaps the next, so the harmony
	// never actually stops moving.
	const CHORDS = [
		{at: 0.0, len: 12, pad: [N.A3, N.C4, N.E4], bass: N.A2, notes: [N.A4, N.E5, N.C5]},
		{at: 8.5, len: 12, pad: [N.F3, N.A3, N.C4], bass: N.F2, notes: [N.F4, N.C5, N.A4]},
		{at: 17.0, len: 12, pad: [N.C4, N.E4, N.G4], bass: N.C3, notes: [N.G4, N.E5, N.C5]},
		{at: 25.5, len: 12, pad: [N.G3, N.B3, N.D4], bass: N.G2, notes: [N.D5, N.G4, N.B3]},
		{at: 34.0, len: 12, pad: [N.A3, N.C4, N.E4], bass: N.A2, notes: [N.E5, N.A4, N.C5]},
		{at: 42.0, len: 12, pad: [N.F3, N.A3, N.C4], bass: N.F2, notes: [N.C5, N.A4, N.F4]},
		{at: 49.5, len: 9, pad: [N.C4, N.E4, N.G4], bass: N.C3, notes: [N.C5, N.G4, N.E5]},
	];

	for (const c of CHORDS) {
		pad(L, R, c.at, c.pad, c.len, 0.16);
		sub(L, R, c.at, c.bass, c.len, 0.1);
	}

	let noteTime = 1.6;
	let chordIndex = 0;
	let step = 0;
	while (noteTime < 55) {
		while (chordIndex < CHORDS.length - 1 && CHORDS[chordIndex + 1].at <= noteTime) chordIndex++;
		const c = CHORDS[chordIndex];
		const freq = c.notes[step % c.notes.length];
		const gain = noteTime < 18 ? 0.1 : noteTime < 38 ? 0.14 : 0.17;
		const pan = 0.5 + Math.sin(step * 1.1) * 0.18;
		bell(L, R, noteTime, freq, 5.5, gain, pan);
		if (step % 4 === 3) bell(L, R, noteTime + 0.28, freq * 2, 3.4, gain * 0.35, 1 - pan);
		noteTime += step % 3 === 2 ? 3.1 : 2.1;
		step++;
	}

	// A held resolution under "Continue."
	bell(L, R, 50.2, N.A4, 9, 0.16, 0.5);
	bell(L, R, 50.4, N.E5, 9, 0.09, 0.35);

	const wetL = reverb(lowpass(L, 5200), 0.42, 0.82);
	const wetR = reverb(lowpass(R, 5000), 0.42, 0.815);
	normalize([wetL, wetR], 0.72);
	edgeFade([wetL, wetR], 0.6);
	writeWav("ambient-piano.wav", wetL, wetR);
};

/* ---------- sound design, one per on-screen event ---------- */

/** SCENE 1 — sand running through the neck of the hourglass. */
const buildSand = () => {
	const DUR = 6.4;
	const n = Math.round(DUR * SR);
	// Grains: sparse impulses, not a continuous hiss.
	const grains = new Float64Array(n);
	let seed = 5;
	for (let i = 0; i < n; i++) {
		seed = (seed * 16807) % 2147483647;
		const r = seed / 2147483647;
		if (r > 0.986) grains[i] = (r - 0.986) * 70;
	}
	const band = highpass(lowpass(grains, 5200), 1800);
	const L = new Float64Array(n);
	const R = new Float64Array(n);
	for (let i = 0; i < n; i++) {
		const t = i / SR;
		const env = padEnv(t, DUR, DUR * 0.3, DUR * 0.35);
		L[i] = band[i] * env;
		R[i] = band[Math.max(0, i - 240)] * env;
	}
	const wl = reverb(L, 0.35, 0.74);
	const wr = reverb(R, 0.35, 0.73);
	normalize([wl, wr], 0.42);
	edgeFade([wl, wr], 0.12);
	writeWav("sand.wav", wl, wr);
};

/** SCENE 2 — the columns climbing away from the floor. */
const buildClimb = () => {
	const DUR = 3.4;
	const n = Math.round(DUR * SR);
	const [L, R] = buf(DUR);
	// Several voices sliding upward at different rates — the shape of the image.
	const voices = [
		{f0: N.A3, f1: N.E4, at: 0.0, g: 0.3},
		{f0: N.C4, f1: N.A4, at: 0.25, g: 0.24},
		{f0: N.E4, f1: N.C5, at: 0.5, g: 0.2},
		{f0: N.G3, f1: N.D4, at: 0.8, g: 0.18},
	];
	for (const v of voices) {
		const start = Math.round(v.at * SR);
		for (let i = start; i < n; i++) {
			const t = (i - start) / SR;
			const span = DUR - v.at;
			const k = Math.min(1, t / (span * 0.7));
			const f = v.f0 + (v.f1 - v.f0) * (k * k * (3 - 2 * k));
			const env = padEnv(t, span, span * 0.45, span * 0.5);
			const s = Math.sin(2 * Math.PI * f * t) * 0.7 + Math.sin(2 * Math.PI * f * 2 * t) * 0.18;
			L[i] += s * env * v.g;
			R[i] += s * env * v.g * 0.92;
		}
	}
	const wl = reverb(L, 0.42, 0.8);
	const wr = reverb(R, 0.42, 0.79);
	normalize([wl, wr], 0.5);
	edgeFade([wl, wr], 0.05);
	writeWav("climb.wav", wl, wr);
};

/** SCENE 2 — the question. Unsettled, slightly sharp against the harmony. */
const buildTension = () => {
	const DUR = 3.4;
	const n = Math.round(DUR * SR);
	const [L, R] = buf(DUR);
	for (let i = 0; i < n; i++) {
		const t = i / SR;
		const env = Math.pow(Math.min(1, t / (DUR * 0.7)), 2) * Math.min(1, (DUR - t) / 0.8);
		// A minor second under the root: the sound of a question that stings.
		const v =
			Math.sin(2 * Math.PI * N.A3 * t) * 0.5 +
			Math.sin(2 * Math.PI * (N.A3 * 1.06) * t) * 0.32 +
			Math.sin(2 * Math.PI * N.E4 * t) * 0.16;
		L[i] = v * env * 0.34;
		R[i] = v * env * 0.31;
	}
	const wl = reverb(L, 0.44, 0.84);
	const wr = reverb(R, 0.44, 0.83);
	normalize([wl, wr], 0.58);
	edgeFade([wl, wr], 0.03);
	writeWav("tension.wav", wl, wr);
};

/** SCENE 3 — the weight of "Não." and, later, of "Continue." */
const buildSettle = () => {
	const DUR = 3.8;
	const n = Math.round(DUR * SR);
	const [L, R] = buf(DUR);
	for (let i = 0; i < n; i++) {
		const t = i / SR;
		const f = 78 * Math.exp(-t * 1.6) + 46; // drops as it lands
		const v = Math.sin(2 * Math.PI * f * t) * pluckEnv(t, 0.02, 0.9) * 0.8;
		L[i] = v;
		R[i] = v;
	}
	bell(L, R, 0.01, N.A3, 3.2, 0.14, 0.5);
	bell(L, R, 0.03, N.E4, 2.8, 0.07, 0.6);
	const wl = reverb(L, 0.3, 0.85);
	const wr = reverb(R, 0.3, 0.84);
	normalize([wl, wr], 0.78);
	edgeFade([wl, wr], 0.02);
	writeWav("settle.wav", wl, wr);
};

/** SCENE 3 — the ring closing around the word. */
const buildRing = () => {
	const DUR = 2.6;
	const [L, R] = buf(DUR);
	bell(L, R, 0.01, N.E5, 2.2, 0.36, 0.5);
	bell(L, R, 0.06, N.C6, 1.7, 0.12, 0.62);
	const wl = reverb(L, 0.45, 0.8);
	const wr = reverb(R, 0.45, 0.79);
	normalize([wl, wr], 0.6);
	edgeFade([wl, wr], 0.01);
	writeWav("ring.wav", wl, wr);
};

/** SCENE 4 — one chime per moon phase completed, climbing the scale. */
const buildChimes = () => {
	const scale = [N.C5, N.D5, N.E5, N.G5, N.A5, N.C6];
	scale.forEach((f, i) => {
		const DUR = 3.0;
		const [L, R] = buf(DUR);
		bell(L, R, 0.01, f, 2.6, 0.4, 0.5);
		bell(L, R, 0.02, f * 1.5, 1.8, 0.09, 0.4);
		const wl = reverb(L, 0.48, 0.82);
		const wr = reverb(R, 0.48, 0.81);
		normalize([wl, wr], 0.55);
		edgeFade([wl, wr], 0.01);
		writeWav(`chime-${i + 1}.wav`, wl, wr);
	});
};

/** SCENE 5 — a bloom opening. */
const buildBloom = (name, freq, gain, dur, peak) => {
	const n = Math.round(dur * SR);
	const [L, R] = buf(dur);
	// A short breath of air opening outward, with a soft tone inside it.
	const air = highpass(lowpass(noise(n, 13), 4200), 900);
	for (let i = 0; i < n; i++) {
		const t = i / SR;
		const env = Math.pow(Math.min(1, t / 0.12), 2) * Math.exp(-t / (dur * 0.3));
		L[i] = air[i] * env * 0.5;
		R[i] = air[Math.max(0, i - 200)] * env * 0.5;
	}
	bell(L, R, 0.0, freq, dur * 0.8, gain, 0.5);
	bell(L, R, 0.05, freq * 1.5, dur * 0.5, gain * 0.3, 0.62);
	const wl = reverb(L, 0.46, 0.8);
	const wr = reverb(R, 0.46, 0.79);
	normalize([wl, wr], peak);
	edgeFade([wl, wr], 0.01);
	writeWav(name, wl, wr);
};

/** SCENE 7 — light coming over the horizon. */
const buildDawn = () => {
	const DUR = 6.5;
	const n = Math.round(DUR * SR);
	const [L, R] = buf(DUR);
	// A major chord that fills in one note at a time as the disc climbs.
	const voices = [
		{f: N.C4, at: 0.0},
		{f: N.E4, at: 1.4},
		{f: N.G4, at: 2.8},
		{f: N.C5, at: 4.0},
	];
	for (const v of voices) {
		const span = DUR - v.at;
		const start = Math.round(v.at * SR);
		for (let i = start; i < n; i++) {
			const t = (i - start) / SR;
			const env = padEnv(t, span, span * 0.5, span * 0.45);
			const s =
				Math.sin(2 * Math.PI * v.f * t) * 0.6 +
				Math.sin(2 * Math.PI * v.f * 2.001 * t) * 0.16 +
				Math.sin(2 * Math.PI * v.f * 3 * t) * 0.06;
			L[i] += s * env * 0.22;
			R[i] += s * env * 0.21;
		}
	}
	sub(L, R, 0.2, N.C3, DUR - 0.4, 0.14);
	const wl = reverb(lowpass(L, 4600), 0.5, 0.85);
	const wr = reverb(lowpass(R, 4500), 0.5, 0.845);
	normalize([wl, wr], 0.62);
	edgeFade([wl, wr], 0.2);
	writeWav("dawn.wav", wl, wr);
};

/* =====================================================================
 * "Comece Pequeno" — own score, own sound design. Separate namespace
 * (public/audio/cp/), separate story, same synthesis philosophy: nothing
 * here is a sample. Every function below maps to a specific frame range
 * described in src/utils/audio-cp.ts and the scenes it was built against.
 * ===================================================================== */

/** The 72s score: small & uncertain -> rhythmic accumulation -> clarity ->
 *  broad resolution, tapering toward the silent black card at the end. */
const buildScoreCP = () => {
	const DUR = 72.2;
	const [L, R] = buf(DUR);

	// Hook (0-11.5s): a single held, sparse chord. Almost nothing else.
	pad(L, R, 0.4, [N.A3, N.C4], 11.6, 0.09);
	sub(L, R, 0.6, N.A2, 11.2, 0.05);

	// Risk (11-22.5s): the chord thickens, weight arrives underneath.
	pad(L, R, 11.0, [N.F3, N.A3, N.C4], 11.5, 0.12);
	sub(L, R, 11.2, N.F2, 11.0, 0.07);

	// Turn (22-35s): rhythm arrives — bell pulses that get busier, the
	// "virada com ritmo".
	const turnStart = 22.0;
	const turnEnd = 35.0;
	pad(L, R, turnStart, [N.C4, N.E4, N.G4], turnEnd - turnStart + 1, 0.14);
	sub(L, R, turnStart, N.C3, turnEnd - turnStart, 0.09);
	const pulseNotes = [N.C5, N.E5, N.G5, N.C6];
	let pulseTime = turnStart + 0.3;
	let pStep = 0;
	while (pulseTime < turnEnd) {
		const dens = (pulseTime - turnStart) / (turnEnd - turnStart);
		bell(
			L, R, pulseTime,
			pulseNotes[pStep % pulseNotes.length],
			1.2, 0.07 + dens * 0.05,
			0.5 + Math.sin(pStep) * 0.2,
		);
		pulseTime += 1.1 - dens * 0.55;
		pStep++;
	}

	// Lesson (35-57.5s): clarity and purpose — a clean progression with a
	// real, sparse melody.
	const CHORDS_CP = [
		{at: 35.0, len: 8, pad: [N.A3, N.C4, N.E4], bass: N.A2},
		{at: 42.5, len: 8, pad: [N.F3, N.A3, N.C4], bass: N.F2},
		{at: 50.0, len: 8, pad: [N.C4, N.E4, N.G4], bass: N.C3},
	];
	for (const c of CHORDS_CP) {
		pad(L, R, c.at, c.pad, c.len, 0.15);
		sub(L, R, c.at, c.bass, c.len, 0.1);
	}
	const melody = [N.C5, N.E5, N.G5, N.A5, N.G5, N.E5];
	let noteTime = 35.6;
	let step = 0;
	while (noteTime < 57.5) {
		bell(L, R, noteTime, melody[step % melody.length], 3.2, 0.14, 0.5 + Math.sin(step * 1.3) * 0.22);
		noteTime += 1.9;
		step++;
	}

	// Broad resolution (57.5-66s): the harmony widens toward the curve's peak.
	pad(L, R, 57.5, [N.A3, N.C4, N.E4, N.A4], 9.0, 0.2);
	sub(L, R, 57.8, N.A2, 8.6, 0.13);
	bell(L, R, 58.2, N.E5, 7.5, 0.15, 0.4);
	bell(L, R, 60.0, N.A5, 6.0, 0.12, 0.6);
	bell(L, R, 62.5, N.C6, 5.0, 0.1, 0.5);

	// A last held note ringing into the near-silence under the black card —
	// the runtime envelope (fadeOutStart in audio-cp.ts) does the rest.
	bell(L, R, 65.6, N.A4, 6.0, 0.08, 0.5);

	const wetL = reverb(lowpass(L, 5200), 0.4, 0.82);
	const wetR = reverb(lowpass(R, 5000), 0.4, 0.815);
	normalize([wetL, wetR], 0.72);
	edgeFade([wetL, wetR], 0.6);
	writeWav("score.wav", wetL, wetR, OUT_CP);
};

/** SCENE 1 (hook) — the twelve cards landing one by one. Short, light taps,
 *  rising gently in pitch; the twelfth gets extra weight. */
const buildCardsCP = () => {
	for (let i = 0; i < 12; i++) {
		const DUR = 0.6;
		const n = Math.round(DUR * SR);
		const [L, R] = buf(DUR);
		const freq = 900 + i * 40;
		const tap = highpass(lowpass(noise(n, 101 + i), 5200), 2000);
		for (let s = 0; s < n; s++) {
			const t = s / SR;
			const env = pluckEnv(t, 0.002, 0.045);
			L[s] = tap[s] * env * 0.5;
			R[s] = tap[Math.max(0, s - 20)] * env * 0.5;
		}
		const isLast = i === 11;
		bell(L, R, 0.0, freq, isLast ? 0.5 : 0.28, isLast ? 0.34 : 0.22, 0.5);
		if (isLast) bell(L, R, 0.01, freq / 2, 0.6, 0.18, 0.5);
		const wl = reverb(L, 0.28, 0.7);
		const wr = reverb(R, 0.28, 0.69);
		normalize([wl, wr], isLast ? 0.6 : 0.46);
		edgeFade([wl, wr], 0.01);
		writeWav(`card-${String(i + 1).padStart(2, "0")}.wav`, wl, wr, OUT_CP);
	}
};

/** SCENE 1 — the grid receding to almost nothing. */
const buildGridMinCP = () => {
	const DUR = 1.0;
	const n = Math.round(DUR * SR);
	const [L, R] = buf(DUR);
	for (let i = 0; i < n; i++) {
		const t = i / SR;
		const f = 500 * Math.exp(-t * 2.6) + 120;
		const v = Math.sin(2 * Math.PI * f * t) * pluckEnv(t, 0.01, 0.35) * 0.5;
		L[i] = v;
		R[i] = v * 0.95;
	}
	const wl = reverb(L, 0.3, 0.7);
	const wr = reverb(R, 0.3, 0.69);
	normalize([wl, wr], 0.4);
	edgeFade([wl, wr], 0.01);
	writeWav("grid-min.wav", wl, wr, OUT_CP);
};

/** SCENE 2 (risk) — the seven towers rising, escalated, grave and massive. */
const buildTowersCP = () => {
	for (let i = 0; i < 7; i++) {
		const DUR = 2.2;
		const n = Math.round(DUR * SR);
		const [L, R] = buf(DUR);
		const base = 40 + i * 4;
		sub(L, R, 0, base, DUR * 0.9, 0.35);
		const rumble = lowpass(noise(n, 400 + i), 220);
		for (let s = 0; s < n; s++) {
			const t = s / SR;
			const env = padEnv(t, DUR, 0.25, DUR * 0.6);
			L[s] += rumble[s] * env * 0.18;
			R[s] += rumble[Math.max(0, s - 140)] * env * 0.18;
		}
		bell(L, R, 0.01, base * 2, 1.6, 0.1, 0.5);
		const wl = reverb(lowpass(L, 900), 0.4, 0.85);
		const wr = reverb(lowpass(R, 880), 0.4, 0.845);
		normalize([wl, wr], 0.55);
		edgeFade([wl, wr], 0.02);
		writeWav(`tower-${i + 1}.wav`, wl, wr, OUT_CP);
	}
};

/** SCENE 2 — the small thing entering with its halo. */
const buildSmallHaloCP = () => {
	const DUR = 3.2;
	const [L, R] = buf(DUR);
	bell(L, R, 0.02, N.E5, 2.6, 0.3, 0.5);
	bell(L, R, 0.08, N.A5, 1.8, 0.12, 0.42);
	const wl = reverb(L, 0.55, 0.86);
	const wr = reverb(R, 0.55, 0.855);
	normalize([wl, wr], 0.5);
	edgeFade([wl, wr], 0.02);
	writeWav("small-halo.wav", wl, wr, OUT_CP);
};

/** SCENE 2 — the doubt: minimal light and a tremor. */
const buildTremorCP = () => {
	const DUR = 2.4;
	const n = Math.round(DUR * SR);
	const [L, R] = buf(DUR);
	for (let i = 0; i < n; i++) {
		const t = i / SR;
		const f = 62 + Math.sin(2 * Math.PI * 7 * t) * 8;
		const env = Math.min(1, t / 0.15) * Math.exp(-t / 0.9);
		const v = (Math.sin(2 * Math.PI * f * t) * 0.6 + Math.sin(2 * Math.PI * (f * 1.045) * t) * 0.4) * env * 0.4;
		L[i] = v;
		R[i] = v * 0.9;
	}
	const wl = reverb(lowpass(L, 700), 0.4, 0.8);
	const wr = reverb(lowpass(R, 680), 0.4, 0.795);
	normalize([wl, wr], 0.42);
	edgeFade([wl, wr], 0.02);
	writeWav("tremor.wav", wl, wr, OUT_CP);
};

/** SCENE 2 — the light coming back. */
const buildLightReturnCP = () => {
	const DUR = 2.8;
	const [L, R] = buf(DUR);
	pad(L, R, 0, [N.A3, N.C4, N.E4], DUR, 0.28);
	bell(L, R, 0.3, N.E5, 2.0, 0.14, 0.5);
	const wl = reverb(L, 0.42, 0.8);
	const wr = reverb(R, 0.42, 0.795);
	normalize([wl, wr], 0.5);
	edgeFade([wl, wr], 0.02);
	writeWav("light-return.wav", wl, wr, OUT_CP);
};

/** SCENE 3 (turn) — a client landing, with its ring of impact. Reused ×3. */
const buildClientImpactCP = () => {
	const DUR = 2.4;
	const n = Math.round(DUR * SR);
	const [L, R] = buf(DUR);
	for (let i = 0; i < n; i++) {
		const t = i / SR;
		const v = Math.sin(2 * Math.PI * 90 * Math.exp(-t * 3) * t) * pluckEnv(t, 0.004, 0.18) * 0.5;
		L[i] = v;
		R[i] = v;
	}
	bell(L, R, 0.005, N.A5, 2.0, 0.3, 0.5);
	bell(L, R, 0.02, N.E6, 1.4, 0.1, 0.58);
	const wl = reverb(L, 0.4, 0.8);
	const wr = reverb(R, 0.4, 0.795);
	normalize([wl, wr], 0.55);
	edgeFade([wl, wr], 0.01);
	writeWav("client-impact.wav", wl, wr, OUT_CP);
};

/** SCENE 3 — the burst as the crowd begins and the camera pulls back. */
const buildBurstCP = () => {
	const DUR = 1.6;
	const n = Math.round(DUR * SR);
	const [L0, R0] = buf(DUR);
	const nz = noise(n, 777);
	for (let i = 0; i < n; i++) {
		L0[i] = nz[i];
		R0[i] = nz[Math.max(0, i - 90)];
	}
	const fl = highpass(lowpass(L0, 4000), 300);
	const fr = highpass(lowpass(R0, 4000), 300);
	const [L, R] = buf(DUR);
	for (let i = 0; i < n; i++) {
		const t = i / SR;
		const env = Math.pow(Math.min(1, t / 0.05), 2) * Math.exp(-t / 0.55);
		L[i] = fl[i] * env * 0.5;
		R[i] = fr[i] * env * 0.5;
	}
	bell(L, R, 0.0, N.A4, 1.2, 0.16, 0.5);
	const wl = reverb(L, 0.42, 0.78);
	const wr = reverb(R, 0.42, 0.775);
	normalize([wl, wr], 0.55);
	edgeFade([wl, wr], 0.01);
	writeWav("burst.wav", wl, wr, OUT_CP);
};

/** SCENE 3 — the crowd resolving into a rising city. */
const buildCityRiseCP = () => {
	const DUR = 3.0;
	const n = Math.round(DUR * SR);
	const [L, R] = buf(DUR);
	const voices = [
		{f0: N.C3, f1: N.G3, at: 0.0, g: 0.22},
		{f0: N.E3, f1: N.C4, at: 0.2, g: 0.2},
		{f0: N.G3, f1: N.E4, at: 0.45, g: 0.16},
		{f0: N.C4, f1: N.A4, at: 0.7, g: 0.13},
	];
	for (const v of voices) {
		const start = Math.round(v.at * SR);
		for (let i = start; i < n; i++) {
			const t = (i - start) / SR;
			const span = DUR - v.at;
			const k = Math.min(1, t / (span * 0.7));
			const f = v.f0 + (v.f1 - v.f0) * (k * k * (3 - 2 * k));
			const env = padEnv(t, span, span * 0.4, span * 0.5);
			const s = Math.sin(2 * Math.PI * f * t) * 0.7 + Math.sin(2 * Math.PI * f * 2 * t) * 0.15;
			L[i] += s * env * v.g;
			R[i] += s * env * v.g * 0.9;
		}
	}
	const wl = reverb(L, 0.4, 0.8);
	const wr = reverb(R, 0.4, 0.795);
	normalize([wl, wr], 0.5);
	edgeFade([wl, wr], 0.02);
	writeWav("city-rise.wav", wl, wr, OUT_CP);
};

/** SCENE 4 (lesson) — the five items landing, one bright ascending note each. */
const buildListItemsCP = () => {
	const scale = [N.C5, N.D5, N.E5, N.G5, N.A5];
	scale.forEach((f, i) => {
		const DUR = 1.8;
		const [L, R] = buf(DUR);
		bell(L, R, 0.01, f, 1.5, 0.3, 0.5);
		bell(L, R, 0.02, f * 2, 1.0, 0.08, 0.42);
		const wl = reverb(L, 0.4, 0.78);
		const wr = reverb(R, 0.4, 0.775);
		normalize([wl, wr], 0.48);
		edgeFade([wl, wr], 0.01);
		writeWav(`item-${i + 1}.wav`, wl, wr, OUT_CP);
	});
};

/** SCENE 4 — the five items equalising into one list. */
const buildListCloseCP = () => {
	const DUR = 3.4;
	const [L, R] = buf(DUR);
	pad(L, R, 0, [N.C4, N.E4, N.G4, N.C5], DUR, 0.22);
	bell(L, R, 0.02, N.C5, 2.8, 0.22, 0.5);
	bell(L, R, 0.05, N.G5, 2.0, 0.1, 0.4);
	const wl = reverb(L, 0.46, 0.82);
	const wr = reverb(R, 0.46, 0.815);
	normalize([wl, wr], 0.55);
	edgeFade([wl, wr], 0.02);
	writeWav("list-close.wav", wl, wr, OUT_CP);
};

/** SCENE 5 (final) — one "small repeated decision", deliberately near
 *  subliminal. Reused 36 times as texture, never as percussion. */
const buildTickCP = () => {
	const DUR = 0.18;
	const n = Math.round(DUR * SR);
	const [L, R] = buf(DUR);
	const tap = highpass(lowpass(noise(n, 909), 6000), 3000);
	for (let i = 0; i < n; i++) {
		const t = i / SR;
		const env = pluckEnv(t, 0.001, 0.02);
		L[i] = tap[i] * env * 0.3;
		R[i] = tap[i] * env * 0.3;
	}
	normalize([L, R], 0.18);
	edgeFade([L, R], 0.005);
	writeWav("tick.wav", L, R, OUT_CP);
};

/** SCENE 5 — the top of the curve. */
const buildPeakCP = () => {
	const DUR = 3.6;
	const [L, R] = buf(DUR);
	bell(L, R, 0.0, N.C6, 3.0, 0.32, 0.5);
	bell(L, R, 0.02, N.G5, 2.6, 0.16, 0.42);
	bell(L, R, 0.04, N.E5, 2.2, 0.1, 0.58);
	sub(L, R, 0.0, N.C3, 2.6, 0.1);
	const wl = reverb(L, 0.5, 0.84);
	const wr = reverb(R, 0.5, 0.835);
	normalize([wl, wr], 0.6);
	edgeFade([wl, wr], 0.02);
	writeWav("peak.wav", wl, wr, OUT_CP);
};

/** SCENE 5 — the cut to the black card. */
const buildCutBlackCP = () => {
	const DUR = 2.2;
	const n = Math.round(DUR * SR);
	const [L, R] = buf(DUR);
	for (let i = 0; i < n; i++) {
		const t = i / SR;
		const f = 52 * Math.exp(-t * 1.2) + 34;
		const v = Math.sin(2 * Math.PI * f * t) * pluckEnv(t, 0.02, 0.7) * 0.6;
		L[i] = v;
		R[i] = v;
	}
	const air = highpass(lowpass(noise(n, 55), 1800), 500);
	for (let i = 0; i < n; i++) {
		const t = i / SR;
		const env = Math.pow(Math.min(1, t / 0.3), 2) * Math.exp(-t / 0.9);
		L[i] += air[i] * env * 0.12;
		R[i] += air[Math.max(0, i - 160)] * env * 0.12;
	}
	const wl = reverb(L, 0.35, 0.82);
	const wr = reverb(R, 0.35, 0.815);
	normalize([wl, wr], 0.5);
	edgeFade([wl, wr], 0.02);
	writeWav("cut-black.wav", wl, wr, OUT_CP);
};

/* =====================================================================
 * "iFood — a virada" (public/audio/ifood/) — third film, third namespace.
 *
 * The brief here is different from the other two and the constraints are
 * hard, straight from the client:
 *
 *   - Modern cinematic / minimal / tech: discreet low end, light electronic
 *     texture, a CONSTANT pulse, tension rising gradually. No vocals, no
 *     emotional melody, always under the voice.
 *   - NO piano as a lead instrument and NO bell / chime ANYWHERE. That is
 *     why nothing in this section calls bell(): every struck sound below is
 *     a harmonic tone with a 30-60 ms decay (an electronic tick), or filtered
 *     noise. Nothing is left ringing.
 *   - Few effects, each one locked to a VISUAL EVENT, never to a cut.
 *
 * Intensity arc (see INTENSITY_IF): low in scenes 1-2, climbing through
 * 3-5, clear tension in scene 6 (the logistics problem), PEAK in scene 7
 * (the 2018 turn), sustained in 8, clean resolution in 9.
 * ===================================================================== */

const OUT_IF = path.join(process.cwd(), "public", "audio", "ifood");

/** Frame -> seconds at 30 fps. Scene starts mirror SCENE_STARTS_IF in src/Ifood.tsx. */
const secIF = (f) => f / 30;
const SCENE_IF = [0, 115, 290, 495, 700, 905, 1170, 1435, 1700].map(secIF);
const TOTAL_IF = secIF(1890); // 63.0s
const BEAT_IF = 0.6; // 100 BPM — the constant pulse the brief asks for

/** Bb3: the minor second against A3 that makes scene 6 uncomfortable. */
const BB3 = 233.08;

/** Piecewise-linear curve, read at an arbitrary time. */
const curveAt = (pts, t) => {
	if (t <= pts[0][0]) return pts[0][1];
	for (let i = 1; i < pts.length; i++) {
		if (t <= pts[i][0]) {
			const [t0, v0] = pts[i - 1];
			const [t1, v1] = pts[i];
			return v0 + ((v1 - v0) * (t - t0)) / (t1 - t0);
		}
	}
	return pts[pts.length - 1][1];
};

/**
 * The tension curve of the whole film, in seconds. Every level decision in
 * buildScoreIF() reads this, so reshaping the arc is a one-place edit.
 */
const INTENSITY_IF = [
	[0.0, 0.1], // sc1 hook — almost nothing
	[SCENE_IF[1], 0.16], // sc2 Disk Cook
	[SCENE_IF[2], 0.3], // sc3 paper -> digital: the pulse arrives
	[SCENE_IF[3], 0.44], // sc4 site + app
	[SCENE_IF[4], 0.56], // sc5 investment
	[SCENE_IF[5], 0.64], // sc6 logistics: tension starts
	[36.0, 0.84], // ...and keeps climbing inside scene 6
	[41.0, 1.0], // sc7 THE 2018 TURN — peak of the film
	[SCENE_IF[7], 0.92], // sc8 growth, sustained
	[53.0, 0.86],
	[SCENE_IF[8], 0.5], // sc9 close: everything clears out
	[61.0, 0.2],
	[TOTAL_IF, 0.0],
];

/** Soft detuned pad built from band-limited harmonics — a bed, never a melody. */
const epad = (L, R, start, freqs, dur, gain, nh = 5) => {
	const n = Math.round(dur * SR);
	const rise = Math.min(2.6, dur * 0.3);
	const fall = Math.min(3.2, dur * 0.36);
	for (let i = 0; i < n; i++) {
		const t = i / SR;
		const env = padEnv(t, dur, rise, fall);
		if (env <= 0) continue;
		let l = 0;
		let r = 0;
		for (let k = 0; k < freqs.length; k++) {
			const f = freqs[k];
			const amp = 1 / (k + 1.5);
			for (let h = 1; h <= nh; h++) {
				const ha = amp / (h * h * 0.55 + h * 0.45);
				const d = (k + h) % 2 === 0 ? 1 : -1;
				l += ha * Math.sin(2 * Math.PI * f * h * (1 + 0.0009 * d) * t);
				r += ha * Math.sin(2 * Math.PI * f * h * (1 - 0.0011 * d) * t);
			}
		}
		add(L, start, i, l * env * gain);
		add(R, start, i, r * env * gain);
	}
};

/** Sub bass with an optional beat-synced pump — where "pulsação" lives low. */
const subIF = (L, R, start, freq, dur, gain, pump = 0) => {
	const n = Math.round(dur * SR);
	for (let i = 0; i < n; i++) {
		const t = i / SR;
		const env = padEnv(t, dur, Math.min(2.0, dur * 0.25), Math.min(2.4, dur * 0.3));
		if (env <= 0) continue;
		const p = (t / BEAT_IF) % 1;
		const duck = 1 - pump + pump * Math.min(1, p / 0.38);
		const v = (Math.sin(2 * Math.PI * freq * t) + 0.12 * Math.sin(2 * Math.PI * freq * 2 * t)) * env * gain * duck;
		add(L, start, i, v);
		add(R, start, i, v);
	}
};

/**
 * The pulse itself: harmonic partials with a 35 ms decay. Deliberately NOT
 * bell() — nothing inharmonic, nothing that rings. This is a tick, not a chime.
 */
const tickIF = (L, R, start, freq, gain, pan = 0.5, bright = 0.4) => {
	const n = Math.round(0.2 * SR);
	for (let i = 0; i < n; i++) {
		const t = i / SR;
		const env = pluckEnv(t, 0.003, 0.035);
		if (t > 0.01 && env < 0.0002) break; // the attack ramps from 0, so only cut after it
		const v =
			(Math.sin(2 * Math.PI * freq * t) +
				0.5 * Math.sin(2 * Math.PI * freq * 2 * t) +
				0.22 * bright * Math.sin(2 * Math.PI * freq * 3 * t)) *
			env *
			gain;
		add(L, start, i, v * (1 - pan));
		add(R, start, i, v * pan);
	}
};

/** Sine dropping in pitch: the body of every impact in this film. */
const boomIF = (L, R, start, f0, f1, dur, gain, tau) => {
	const n = Math.round(dur * SR);
	let phase = 0;
	for (let i = 0; i < n; i++) {
		const t = i / SR;
		const f = f1 + (f0 - f1) * Math.exp(-t * 3.2);
		phase += (2 * Math.PI * f) / SR;
		const v = Math.sin(phase) * pluckEnv(t, 0.004, tau ?? dur * 0.3) * gain;
		add(L, start, i, v);
		add(R, start, i, v);
	}
};

/** Noise moving from dark to bright (or back), panned across the stereo field. */
const whooshIF = (dur, seed, curve, panSweep) => {
	const n = Math.round(dur * SR);
	const nz = noise(n, seed);
	const dark = lowpass(nz, 480);
	const air = highpass(lowpass(nz, 7200), 900);
	const [L, R] = buf(dur);
	for (let i = 0; i < n; i++) {
		const k = i / n;
		const m = curve(k);
		const env = Math.pow(Math.sin(Math.PI * k), 1.4);
		const v = (dark[i] * (1 - m) * 1.6 + air[i] * m) * env;
		const pan = Math.max(0, Math.min(1, 0.5 + panSweep * (k - 0.5)));
		L[i] = v * (1 - pan);
		R[i] = v * pan;
	}
	return [L, R];
};

/** The 63s score. */
const buildScoreIF = () => {
	const DUR = TOTAL_IF + 0.25;
	const [L, R] = buf(DUR);

	// --- harmonic bed: one block per beat of the story, overlapping ---
	const CHORDS_IF = [
		{at: 0.0, len: 4.4, pad: [N.A3, N.E4], bass: N.A2, g: 0.1, pump: 0.0},
		{at: 3.4, len: 6.8, pad: [N.A3, N.C4, N.E4], bass: N.A2, g: 0.13, pump: 0.0},
		{at: 9.3, len: 7.6, pad: [N.A3, N.C4, N.E4], bass: N.A2, g: 0.16, pump: 0.25},
		{at: 16.2, len: 7.6, pad: [N.F3, N.A3, N.C4], bass: N.F2, g: 0.18, pump: 0.3},
		{at: 23.0, len: 7.6, pad: [N.A3, N.C4, N.E4, N.G4], bass: N.A2, g: 0.2, pump: 0.34},
		// scene 6: Bb3 rubbing against A3 — the logistics problem, harmonically
		{at: 29.8, len: 9.8, pad: [N.A3, BB3, N.C4, N.E4], bass: N.A2, g: 0.22, pump: 0.4},
		// scene 7: the lift to C major — the 2018 turn
		{at: 38.6, len: 9.8, pad: [N.C4, N.E4, N.G4, N.C5], bass: N.C3, g: 0.26, pump: 0.42},
		{at: 47.4, len: 9.6, pad: [N.F3, N.C4, N.F4, N.A4], bass: N.F2, g: 0.22, pump: 0.36},
		// scene 9: open fifth, no third — clean, unsentimental resolution
		{at: 56.2, len: 7.0, pad: [N.A3, N.E4, N.A4], bass: N.A2, g: 0.2, pump: 0.0},
	];
	for (const c of CHORDS_IF) {
		epad(L, R, c.at, c.pad, c.len, c.g);
		subIF(L, R, c.at, c.bass, c.len, 0.1 + c.g * 0.25, c.pump);
	}

	// --- the constant pulse, from scene 3 to the close ---
	const hatN = Math.round(0.1 * SR);
	const hatSrc = highpass(lowpass(noise(hatN, 4242), 9500), 3600);
	const hat = (start, gain) => {
		for (let i = 0; i < hatN; i++) {
			const t = i / SR;
			const env = pluckEnv(t, 0.0008, 0.012);
			add(L, start, i, hatSrc[i] * env * gain);
			add(R, start, i, hatSrc[Math.max(0, i - 24)] * env * gain);
		}
	};

	let t = SCENE_IF[2] + 0.07;
	let beat = 0;
	while (t < SCENE_IF[8]) {
		const v = curveAt(INTENSITY_IF, t);
		const accent = beat % 4 === 0;
		tickIF(L, R, t, accent ? 82.41 : 110.0, 0.1 + v * 0.16, accent ? 0.5 : beat % 8 < 4 ? 0.38 : 0.62, v);

		// light electronic texture: 16th hats once the product exists (scene 4)
		if (t >= SCENE_IF[3]) {
			for (let s = 0; s < 4; s++) hat(t + (s * BEAT_IF) / 4, (0.035 + v * 0.05) * (s % 2 ? 0.55 : 1));
		}
		// off-beat from scene 5: the machine gets busier
		if (t >= SCENE_IF[4] && beat % 2 === 0) tickIF(L, R, t + BEAT_IF / 2, N.E3, 0.04 + v * 0.07, 0.64, v);
		// scene 6 into scene 7: double time — pressure, not speed
		if (t >= 34.0 && t < SCENE_IF[7]) {
			tickIF(L, R, t + BEAT_IF / 2, 110.0, (0.05 + v * 0.09) * 0.8, 0.44, v);
		}
		t += BEAT_IF;
		beat++;
	}

	// --- scene 6: a noise floor rising for 8.8s straight into the 2018 reveal ---
	{
		const start = SCENE_IF[5];
		const span = SCENE_IF[6] + 0.6 - start;
		const n = Math.round(span * SR);
		const nz = noise(n, 31337);
		const band = highpass(lowpass(nz, 2600), 260);
		for (let i = 0; i < n; i++) {
			const k = i / n;
			const env = Math.pow(k, 2.1) * 0.5;
			add(L, start, i, band[i] * env * 0.3);
			add(R, start, i, band[Math.max(0, i - 130)] * env * 0.3);
		}
	}

	// --- scene 7: the low swell under the turn (the SFX impact sits on top) ---
	subIF(L, R, SCENE_IF[6] - 0.4, N.C2, 4.0, 0.16, 0.0);
	epad(L, R, SCENE_IF[6] + 0.2, [N.C5, N.G4], 6.0, 0.08, 3);

	// --- overall texture: an airy bed that tracks the intensity curve ---
	{
		const n = Math.round(DUR * SR);
		const nz = noise(n, 8081);
		const band = highpass(lowpass(nz, 5200), 1400);
		for (let i = 0; i < n; i++) {
			const ts = i / SR;
			const v = curveAt(INTENSITY_IF, ts);
			L[i] += band[i] * v * 0.05;
			R[i] += band[Math.max(0, i - 200)] * v * 0.05;
		}
	}

	const wetL = reverb(lowpass(L, 6200), 0.26, 0.8);
	const wetR = reverb(lowpass(R, 6000), 0.26, 0.795);
	normalize([wetL, wetR], 0.72);
	edgeFade([wetL, wetR], 0.5);
	writeWav("score.wav", wetL, wetR, OUT_IF);
};

/**
 * SCENE 1 — the word "PAPEL" landing. Cinematic, discreet, and explicitly
 * NOT a bell: a low sine drop plus a dry paper-ish transient.
 */
const buildPaperImpactIF = () => {
	const DUR = 2.0;
	const n = Math.round(DUR * SR);
	const [L, R] = buf(DUR);
	boomIF(L, R, 0.0, 78, 44, DUR, 0.55, 0.42);
	const rustle = highpass(lowpass(noise(n, 1201), 5200), 1100);
	for (let i = 0; i < n; i++) {
		const t = i / SR;
		const env = pluckEnv(t, 0.002, 0.06);
		L[i] += rustle[i] * env * 0.3;
		R[i] += rustle[Math.max(0, i - 70)] * env * 0.3;
	}
	const wl = reverb(lowpass(L, 3800), 0.3, 0.8);
	const wr = reverb(lowpass(R, 3700), 0.3, 0.795);
	normalize([wl, wr], 0.62);
	edgeFade([wl, wr], 0.02);
	writeWav("paper-impact.wav", wl, wr, OUT_IF);
};

/** SCENES 2/4/5 — a soft impact for a date appearing (2011, 2012, 2013). */
const buildDateImpactIF = () => {
	const DUR = 1.6;
	const n = Math.round(DUR * SR);
	const [L, R] = buf(DUR);
	boomIF(L, R, 0.0, 96, 52, DUR, 0.5, 0.3);
	const air = highpass(lowpass(noise(n, 1301), 6400), 1800);
	for (let i = 0; i < n; i++) {
		const t = i / SR;
		const env = pluckEnv(t, 0.0015, 0.03);
		L[i] += air[i] * env * 0.2;
		R[i] += air[Math.max(0, i - 50)] * env * 0.2;
	}
	const wl = reverb(lowpass(L, 4200), 0.28, 0.78);
	const wr = reverb(lowpass(R, 4100), 0.28, 0.775);
	normalize([wl, wr], 0.55);
	edgeFade([wl, wr], 0.02);
	writeWav("date-impact.wav", wl, wr, OUT_IF);
};

/**
 * SCENE 7 — the 2018 reveal. The single strongest sound in the film: a short
 * rising swell, then a deep drop with a wide burst and a long sub tail.
 */
const buildReveal2018IF = () => {
	const DUR = 3.4;
	const n = Math.round(DUR * SR);
	const [L, R] = buf(DUR);
	const HIT = 0.9;

	// pre-swell into the hit
	const sw = Math.round(HIT * SR);
	const swn = highpass(lowpass(noise(sw, 1401), 4200), 400);
	for (let i = 0; i < sw; i++) {
		const k = i / sw;
		const env = Math.pow(k, 2.4);
		L[i] += swn[i] * env * 0.34;
		R[i] += swn[Math.max(0, i - 110)] * env * 0.34;
	}

	// the hit
	boomIF(L, R, HIT, 128, 36, DUR - HIT, 0.85, 0.75);
	const burstN = Math.round(1.4 * SR);
	const burst = highpass(lowpass(noise(burstN, 1402), 5200), 220);
	for (let i = 0; i < burstN; i++) {
		const t = i / SR;
		const env = Math.pow(Math.min(1, t / 0.012), 2) * Math.exp(-t / 0.38);
		add(L, HIT, i, burst[i] * env * 0.34);
		add(R, HIT, i, burst[Math.max(0, i - 150)] * env * 0.34);
	}
	// the tail: the network is alive after the hit
	subIF(L, R, HIT, N.C2, DUR - HIT - 0.15, 0.3, 0.0);
	epad(L, R, HIT + 0.05, [N.C4, N.G4], DUR - HIT - 0.2, 0.09, 4);

	const wl = reverb(lowpass(L, 5000), 0.4, 0.85);
	const wr = reverb(lowpass(R, 4900), 0.4, 0.845);
	normalize([wl, wr], 0.78); // loudest file of the set, on purpose
	edgeFade([wl, wr], 0.02);
	writeWav("reveal-2018.wav", wl, wr, OUT_IF);
};

/** Motivated transitions only — a pass-by (dark -> bright -> dark), L to R. */
const buildWhooshIF = () => {
	const [L, R] = whooshIF(1.0, 2201, (k) => Math.sin(Math.PI * k), 0.9);
	const wl = reverb(L, 0.24, 0.7);
	const wr = reverb(R, 0.24, 0.695);
	normalize([wl, wr], 0.45);
	edgeFade([wl, wr], 0.02);
	writeWav("whoosh.wav", wl, wr, OUT_IF);
};

/** A rising whoosh, for a transition that climbs into something (sc3, sc7). */
const buildWhooshUpIF = () => {
	const [L, R] = whooshIF(1.3, 2202, (k) => Math.pow(k, 1.6), -0.5);
	const wl = reverb(L, 0.3, 0.76);
	const wr = reverb(R, 0.3, 0.755);
	normalize([wl, wr], 0.48);
	edgeFade([wl, wr], 0.02);
	writeWav("whoosh-up.wav", wl, wr, OUT_IF);
};

/**
 * SCENE 4 — interface clicks. Three near-identical variants so a burst of
 * taps never machine-guns. 120 ms, nothing rings.
 */
const buildUiClicksIF = () => {
	[880, 1040, 1220].forEach((f, i) => {
		const DUR = 0.14;
		const n = Math.round(DUR * SR);
		const [L, R] = buf(DUR);
		const tap = highpass(lowpass(noise(n, 1501 + i), 8200), 2600);
		for (let s = 0; s < n; s++) {
			const t = s / SR;
			const env = pluckEnv(t, 0.0008, 0.011);
			const tone = Math.sin(2 * Math.PI * f * t) * pluckEnv(t, 0.001, 0.014) * 0.35;
			L[s] = tap[s] * env * 0.4 + tone;
			R[s] = tap[Math.max(0, s - 12)] * env * 0.4 + tone;
		}
		normalize([L, R], 0.34);
		edgeFade([L, R], 0.004);
		writeWav(`ui-click-${i + 1}.wav`, L, R, OUT_IF);
	});
};

/**
 * SCENES 1-2 — the room the whole thing started in: a phone-order operation.
 * Room tone, mains hum, two distant landline rings (a buzzy 425 Hz tone pair,
 * heavily filtered — a telephone, never a bell) and a few keypad clicks.
 * 9.84s = exactly 295 frames, the length of scenes 1+2.
 */
const buildPhoneRoomIF = () => {
	const DUR = 9.84;
	const n = Math.round(DUR * SR);
	const [L, R] = buf(DUR);

	const room = lowpass(noise(n, 1601), 420);
	for (let i = 0; i < n; i++) {
		const t = i / SR;
		const drift = 0.8 + 0.2 * Math.sin(2 * Math.PI * 0.07 * t);
		L[i] += room[i] * drift * 0.5;
		R[i] += room[Math.max(0, i - 400)] * drift * 0.5;
		L[i] += Math.sin(2 * Math.PI * 60 * t) * 0.012;
		R[i] += Math.sin(2 * Math.PI * 60 * t) * 0.012;
	}

	// two distant rings, off to one side
	for (const at of [2.1, 6.3]) {
		const rn = Math.round(1.05 * SR);
		for (let i = 0; i < rn; i++) {
			const t = i / SR;
			const buzz = 0.6 + 0.4 * Math.sin(2 * Math.PI * 25 * t);
			const gate = padEnv(t, 1.05, 0.05, 0.12) * (t < 0.45 || t > 0.6 ? 1 : 0.15);
			const v = (Math.sin(2 * Math.PI * 425 * t) + 0.3 * Math.sin(2 * Math.PI * 850 * t)) * buzz * gate * 0.09;
			add(L, at, i, v * 0.7);
			add(R, at, i, v * 0.3);
		}
	}

	// keypad / handset clicks
	[1.2, 4.6, 5.1, 5.35, 8.4].forEach((at, k) => {
		const cn = Math.round(0.08 * SR);
		const tap = highpass(lowpass(noise(cn, 1650 + k), 5200), 1500);
		for (let i = 0; i < cn; i++) {
			const t = i / SR;
			const env = pluckEnv(t, 0.001, 0.008);
			add(L, at, i, tap[i] * env * 0.16);
			add(R, at, i, tap[i] * env * 0.14);
		}
	});

	const wl = reverb(lowpass(L, 2600), 0.34, 0.8);
	const wr = reverb(lowpass(R, 2500), 0.34, 0.795);
	normalize([wl, wr], 0.4);
	edgeFade([wl, wr], 0.5);
	writeWav("phone-room.wav", wl, wr, OUT_IF);
};

/**
 * SCENES 6-7 — subtle map / technology texture: filtered air sweeping slowly,
 * sparse data clicks, and a faint high drone that beats against itself.
 * 9.0s = 270 frames, the length of scene 6 and of scene 7.
 */
const buildMapTextureIF = () => {
	const DUR = 9.0;
	const n = Math.round(DUR * SR);
	const [L, R] = buf(DUR);

	const nz = noise(n, 1701);
	const lo = lowpass(nz, 900);
	const hi = highpass(lowpass(nz, 7800), 2400);
	for (let i = 0; i < n; i++) {
		const t = i / SR;
		const m = 0.5 + 0.5 * Math.sin(2 * Math.PI * 0.11 * t);
		const v = lo[i] * (1 - m) * 1.3 + hi[i] * m;
		L[i] += v * 0.26;
		R[i] += (lo[Math.max(0, i - 300)] * (1 - m) * 1.3 + hi[Math.max(0, i - 90)] * m) * 0.26;
	}

	// a faint pair of high sines beating slowly — data, not melody
	for (let i = 0; i < n; i++) {
		const t = i / SR;
		const env = padEnv(t, DUR, 2.0, 2.4);
		L[i] += Math.sin(2 * Math.PI * 1318.5 * t) * env * 0.022;
		R[i] += Math.sin(2 * Math.PI * 1321.7 * t) * env * 0.022;
	}

	// sparse data clicks, seeded so the texture is reproducible
	let s = 12345;
	for (let k = 0; k < 22; k++) {
		s = (s * 16807) % 2147483647;
		const at = (s / 2147483647) * (DUR - 0.4);
		const cn = Math.round(0.05 * SR);
		const tap = highpass(lowpass(noise(cn, 1750 + k), 9000), 4200);
		for (let i = 0; i < cn; i++) {
			const t = i / SR;
			const env = pluckEnv(t, 0.0006, 0.006);
			add(L, at, i, tap[i] * env * 0.1 * (k % 2 ? 1 : 0.5));
			add(R, at, i, tap[i] * env * 0.1 * (k % 2 ? 0.5 : 1));
		}
	}

	const wl = reverb(L, 0.34, 0.82);
	const wr = reverb(R, 0.34, 0.815);
	normalize([wl, wr], 0.38);
	edgeFade([wl, wr], 0.6);
	writeWav("map-texture.wav", wl, wr, OUT_IF);
};

/** SCENE 7 — one node joining the network. Short, electronic, reusable. */
const buildNetPulseIF = () => {
	const DUR = 0.55;
	const n = Math.round(DUR * SR);
	const [L, R] = buf(DUR);
	const tap = highpass(lowpass(noise(n, 1801), 7200), 2200);
	for (let i = 0; i < n; i++) {
		const t = i / SR;
		const env = pluckEnv(t, 0.001, 0.014);
		L[i] += tap[i] * env * 0.3;
		R[i] += tap[Math.max(0, i - 30)] * env * 0.3;
		// a short upward blip: 220 -> 330 Hz in 60 ms, then gone
		const k = Math.min(1, t / 0.06);
		const f = 220 + 110 * k;
		L[i] += Math.sin(2 * Math.PI * f * t) * pluckEnv(t, 0.002, 0.05) * 0.3;
		R[i] += Math.sin(2 * Math.PI * f * t) * pluckEnv(t, 0.002, 0.05) * 0.28;
	}
	const wl = reverb(L, 0.3, 0.76);
	const wr = reverb(R, 0.3, 0.755);
	normalize([wl, wr], 0.42);
	edgeFade([wl, wr], 0.01);
	writeWav("net-pulse.wav", wl, wr, OUT_IF);
};

/* ---------- entry ---------- */

const what = process.argv[2] ?? "all";

if (what === "all" || what === "music") {
	console.log("score:");
	buildMusic();
}

if (what === "all" || what === "sfx") {
	console.log("sound design:");
	buildSand();
	buildClimb();
	buildTension();
	buildSettle();
	buildRing();
	buildChimes();
	buildBloom("bloom.wav", N.G5, 0.3, 2.4, 0.5);
	buildBloom("bloom-big.wav", N.C5, 0.42, 3.6, 0.62);
	buildDawn();
}

if (what === "comece-pequeno") {
	console.log("comece-pequeno score:");
	buildScoreCP();
	console.log("comece-pequeno sound design:");
	buildCardsCP();
	buildGridMinCP();
	buildTowersCP();
	buildSmallHaloCP();
	buildTremorCP();
	buildLightReturnCP();
	buildClientImpactCP();
	buildBurstCP();
	buildCityRiseCP();
	buildListItemsCP();
	buildListCloseCP();
	buildTickCP();
	buildPeakCP();
	buildCutBlackCP();
}

if (what === "ifood") {
	console.log("ifood score:");
	buildScoreIF();
	console.log("ifood sound design:");
	buildPaperImpactIF();
	buildDateImpactIF();
	buildReveal2018IF();
	buildWhooshIF();
	buildWhooshUpIF();
	buildUiClicksIF();
	buildPhoneRoomIF();
	buildMapTextureIF();
	buildNetPulseIF();
}

console.log("done ->", OUT);
