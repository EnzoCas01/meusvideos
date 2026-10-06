/**
 * Score + sound design for "AlvoManage — vídeo 3" (HyperFrames project in
 * hf-alvomanage-3/). Everything synthesised here from scratch: no samples, no stock.
 *
 *   node tools/generate-audio-alvomanage-3.mjs
 *
 * Writes to hf-alvomanage-3/assets/audio/. Standalone: shares nothing with the
 * other generators, so it never changes a byte of the previous films.
 * Each effect answers to an on-screen event placed by hf-alvomanage-3/tools/build.mjs.
 */
import fs from "node:fs";
import path from "node:path";

const SR = 44100;
const OUT = path.join(process.cwd(), "hf-alvomanage-3", "assets", "audio");

/* ---------- primitives ---------- */

const buf = (seconds) => [new Float64Array(Math.ceil(seconds * SR)), new Float64Array(Math.ceil(seconds * SR))];

const add = (ch, startSec, i, v) => {
	const idx = Math.round(startSec * SR) + i;
	if (idx >= 0 && idx < ch.length) ch[idx] += v;
};

const env = (t, attack, tau) => {
	if (t < 0) return 0;
	const a = t < attack ? t / attack : 1;
	return a * Math.exp(-Math.max(0, t - attack) / tau);
};

const smooth = (x) => {
	const c = Math.max(0, Math.min(1, x));
	return c * c * (3 - 2 * c);
};
const padEnv = (t, dur, rise, fall) => (t < 0 || t > dur ? 0 : smooth(t / rise) * smooth((dur - t) / fall));

const noise = (n, seed) => {
	const out = new Float64Array(n);
	let s = seed;
	for (let i = 0; i < n; i++) {
		s = (s * 16807) % 2147483647;
		out[i] = s / 1073741823.5 - 1;
	}
	return out;
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
const bandpass = (x, lo, hi) => lowpass(highpass(x, lo), hi);

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

const writeWav = (name, L, R) => {
	fs.mkdirSync(OUT, {recursive: true});
	const n = L.length;
	const data = Buffer.alloc(n * 4);
	for (let i = 0; i < n; i++) {
		data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i])) * 32767), i * 4);
		data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i])) * 32767), i * 4 + 2);
	}
	const h = Buffer.alloc(44);
	h.write("RIFF", 0);
	h.writeUInt32LE(36 + data.length, 4);
	h.write("WAVE", 8);
	h.write("fmt ", 12);
	h.writeUInt32LE(16, 16);
	h.writeUInt16LE(1, 20);
	h.writeUInt16LE(2, 22);
	h.writeUInt32LE(SR, 24);
	h.writeUInt32LE(SR * 4, 28);
	h.writeUInt16LE(4, 32);
	h.writeUInt16LE(16, 34);
	h.write("data", 36);
	h.writeUInt32LE(data.length, 40);
	fs.writeFileSync(path.join(OUT, name), Buffer.concat([h, data]));
	console.log("  " + name, (n / SR).toFixed(2) + "s");
};

/** Mono -> stereo with a pan (0 = left, 1 = right). */
const stereo = (x, pan = 0.5) => {
	const L = new Float64Array(x.length);
	const R = new Float64Array(x.length);
	for (let i = 0; i < x.length; i++) {
		L[i] = x[i] * Math.cos((pan * Math.PI) / 2);
		R[i] = x[i] * Math.sin((pan * Math.PI) / 2);
	}
	return [L, R];
};

const tone = (L, R, start, freq, dur, gain, attack, tau, pan = 0.5, harm = 0.15) => {
	const n = Math.round(dur * SR);
	for (let i = 0; i < n; i++) {
		const t = i / SR;
		const e = env(t, attack, tau) * Math.min(1, (dur - t) * 30);
		const v = (Math.sin(2 * Math.PI * freq * t) + harm * Math.sin(4 * Math.PI * freq * t)) * e * gain;
		add(L, start, i, v * (1 - pan) * 2 * 0.5 + v * 0.5 * (1 - Math.abs(pan - 0.5)));
		add(R, start, i, v * pan * 2 * 0.5 + v * 0.5 * (1 - Math.abs(pan - 0.5)));
	}
};

const N = {
	A2: 110, C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196, A3: 220, B3: 246.94,
	C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392, A4: 440, B4: 493.88, C5: 523.25,
	D5: 587.33, E5: 659.25, G5: 783.99, A5: 880, C6: 1046.5, E6: 1318.5,
};

/* ---------- score ---------- */

/**
 * 62 s bed, 108 BPM in D major, brighter than video 1's (Am-F-C-G at 100):
 * D - Bm - G - A pad, a syncopated marimba-like pluck, round kick on 1 and 3,
 * soft shaker on the off-beats. Starts full at frame 0 (the film opens on the
 * counter gag, no slow intro).
 */
const buildScore = () => {
	const DUR = 62;
	const BEAT = 60 / 108;
	const BAR = BEAT * 4;
	const [L, R] = buf(DUR);
	const B2 = 123.47, Fs3 = 185, Fs4 = 369.99, Cs4 = 277.18, Cs5 = 554.37, Fs5 = 739.99;
	const chords = [
		[N.D3, N.A3, N.D4, Fs4, N.A4],
		[B2, Fs3, N.B3, N.D4, Fs4],
		[N.G3 / 2, N.D3, N.G3, N.B3, N.D4],
		[N.A2, N.E3, N.A3, Cs4, N.E4],
	];
	const pl = [
		[N.D5, N.A4, Fs5, N.A4, N.D5, N.E5, N.A4, Fs5],
		[N.D5, N.B4, Fs5, N.B4, N.D5, Cs5, N.B4, Fs5],
		[N.D5, N.B4, N.G5, N.B4, N.D5, N.B4, N.A4, N.G5],
		[Cs5, N.A4, N.E5, N.A4, Cs5, N.E5, N.A4, N.E5],
	];
	const shaker = highpass(noise(Math.round(0.08 * SR), 4242), 6000);
	const bars = Math.ceil(DUR / BAR);
	for (let b = 0; b < bars; b++) {
		const ci = b % 4;
		const start = b * BAR;
		const dur = BAR + 0.35;
		const n = Math.round(dur * SR);
		for (let i = 0; i < n; i++) {
			const t = i / SR;
			const e = padEnv(t, dur, 0.35, 0.5);
			let l = 0;
			let r = 0;
			chords[ci].forEach((f, k) => {
				const a = 1 / (k + 2.2);
				l += a * Math.sin(2 * Math.PI * f * t * 1.0012);
				r += a * Math.sin(2 * Math.PI * f * t * 0.9988);
			});
			add(L, start, i, l * e * 0.12);
			add(R, start, i, r * e * 0.12);
		}
		for (let k = 0; k < 8; k++) {
			if (k === 3 || k === 7) continue;
			const at = start + k * (BEAT / 2) + (k % 2 ? 0.018 : 0);
			tone(L, R, at, pl[ci][k], 0.35, 0.085, 0.002, 0.07, k % 2 ? 0.7 : 0.3, 0.5);
		}
		const root = chords[ci][0] > 140 ? chords[ci][0] / 2 : chords[ci][0];
		for (const [k, g] of [[0, 0.3], [1.5, 0.18], [2, 0.22]]) tone(L, R, start + k * BEAT, root, 0.5, g, 0.006, 0.18, 0.5, 0.25);
		for (let k = 0; k < 4; k++) {
			if (k % 2 === 0) {
				const n2 = Math.round(0.2 * SR);
				for (let i = 0; i < n2; i++) {
					const t = i / SR;
					const f = 50 + 60 * Math.exp(-t / 0.025);
					const v = Math.sin(2 * Math.PI * f * t) * env(t, 0.002, 0.06) * 0.3;
					add(L, start + k * BEAT, i, v);
					add(R, start + k * BEAT, i, v);
				}
			}
			for (let i = 0; i < shaker.length; i++) {
				const t = i / SR;
				const v = shaker[i] * env(t, 0.004, 0.02) * 0.07;
				add(L, start + k * BEAT + BEAT / 2, i, v * 0.8);
				add(R, start + k * BEAT + BEAT / 2, i, v);
			}
		}
	}
	const Lw = reverb(lowpass(L, 6000), 0.2, 0.7);
	const Rw = reverb(lowpass(R, 6000), 0.2, 0.7);
	normalize([Lw, Rw], 0.6);
	edgeFade([Lw, Rw], 0.02);
	writeWav("score.wav", Lw, Rw);
};

/* ---------- effects ---------- */

const mono = (dur, fn) => {
	const n = Math.round(dur * SR);
	const x = new Float64Array(n);
	for (let i = 0; i < n; i++) x[i] = fn(i / SR, i);
	return x;
};
const finish = (name, x, peak, wet = 0.12, pan = 0.5) => {
	const [L, R] = stereo(wet > 0 ? reverb(x, wet, 0.5) : x, pan);
	normalize([L, R], peak);
	edgeFade([L, R], 0.003);
	writeWav(name, L, R);
};

/** Charger hitting the counter: dry knock with a hollow body. */
const buildToc = () => {
	const nz = bandpass(noise(Math.round(0.4 * SR), 808), 400, 3500);
	finish("toc.wav", mono(0.4, (t, i) =>
		Math.sin(2 * Math.PI * (180 + 120 * Math.exp(-t / 0.01)) * t) * env(t, 0.0008, 0.035) +
		0.5 * Math.sin(2 * Math.PI * 410 * t) * env(t, 0.0008, 0.02) +
		nz[i] * env(t, 0.0003, 0.008) * 0.9), 0.85, 0.1);
};

/** LED dying: a tiny electronic blip that slides down and chokes. */
const buildLedOff = () => {
	let ph = 0;
	finish("led-off.wav", mono(0.45, (t) => {
		const f = 1800 * Math.pow(0.18, Math.min(1, t / 0.3));
		ph += (2 * Math.PI * f) / SR;
		const gate = t < 0.3 ? 1 : Math.max(0, 1 - (t - 0.3) / 0.05);
		return (Math.sin(ph) > 0 ? 0.2 : -0.2) * gate * env(t, 0.003, 0.25) + Math.sin(ph) * 0.4 * gate * env(t, 0.003, 0.2);
	}), 0.45, 0.15);
};

/** Mouse click (two tiny transients). */
const buildClick = () => {
	const nz = highpass(noise(Math.round(0.1 * SR), 91), 2000);
	finish("click.wav", mono(0.1, (t, i) =>
		nz[i] * (env(t, 0.0003, 0.0025) + (t > 0.045 ? 0.6 * env(t - 0.045, 0.0003, 0.002) : 0)) +
		Math.sin(2 * Math.PI * 1700 * t) * env(t, 0.0005, 0.008) * 0.4), 0.6, 0);
};

/** UI tick (checkbox, highlights, list rows). */
const buildTick = () => {
	const nz = highpass(noise(Math.round(0.12 * SR), 7), 3000);
	finish("tick.wav", mono(0.12, (t, i) => nz[i] * env(t, 0.0005, 0.004) * 0.8 + Math.sin(2 * Math.PI * 2600 * t) * env(t, 0.0005, 0.016) * 0.5), 0.55, 0);
};

/** Key press (typing). */
const buildKey = () => {
	const nz = bandpass(noise(Math.round(0.08 * SR), 313), 1200, 6000);
	finish("key.wav", mono(0.08, (t, i) => nz[i] * env(t, 0.0004, 0.006) + Math.sin(2 * Math.PI * 900 * t) * env(t, 0.0004, 0.01) * 0.3), 0.45, 0);
};

/** Soft pop (speech balloon, "?" appearing, badge). */
const buildPop = () => finish("pop.wav", mono(0.25, (t) => Math.sin(2 * Math.PI * (420 + 650 * Math.exp(-t / 0.03)) * t) * env(t, 0.002, 0.05)), 0.6);

/** Counter digit rolling: two short blips, up (+1) or down (-1). */
const buildCount = (name, up) => {
	const [L, R] = buf(0.35);
	tone(L, R, 0, up ? N.E5 * 2 : N.A5 * 1.5, 0.3, 0.4, 0.002, 0.06, 0.5, 0.1);
	tone(L, R, 0.07, up ? N.A5 * 1.5 : N.E5 * 2, 0.28, 0.4, 0.002, 0.09, 0.5, 0.1);
	normalize([L, R], 0.5);
	edgeFade([L, R], 0.003);
	writeWav(name, L, R);
};

/** Whoosh (sliding, cuts). */
const buildWhoosh = (name, dur, seed, up) => {
	const n = Math.round(dur * SR);
	const nz = noise(n, seed);
	const L = new Float64Array(n);
	const R = new Float64Array(n);
	let y = 0;
	for (let i = 0; i < n; i++) {
		const t = i / SR;
		const p = t / dur;
		const cutoff = up ? 300 + 5000 * p * p : 700 + 3200 * Math.sin(Math.PI * p);
		const a = Math.exp((-2 * Math.PI * cutoff) / SR);
		y = (1 - a) * nz[i] + a * y;
		const e = Math.sin(Math.PI * Math.min(1, p)) ** 1.5;
		L[i] = y * e * (1 - p * 0.8);
		R[i] = y * e * (0.2 + p * 0.8);
	}
	normalize([L, R], 0.55);
	edgeFade([L, R], 0.01);
	writeWav(name, L, R);
};

/** Calendar page flick. */
const buildFlip = () => {
	const nz = bandpass(noise(Math.round(0.3 * SR), 31), 1500, 7000);
	finish("flip.wav", mono(0.3, (t, i) => nz[i] * env(t, 0.008, 0.05)), 0.5, 0, 0.6);
};

/** Paper bag rustle. */
const buildBag = () => {
	const nz = bandpass(noise(Math.round(0.5 * SR), 77), 700, 5000);
	finish("bag.wav", mono(0.5, (t, i) => nz[i] * padEnv(t, 0.5, 0.02, 0.25) * (0.4 + 0.6 * Math.abs(Math.sin(2 * Math.PI * 17 * t)))), 0.45, 0.05);
};

/** Small register "ding" for the sale. */
const buildSale = () => {
	const [L, R] = buf(0.8);
	tone(L, R, 0, 2093, 0.7, 0.4, 0.001, 0.2, 0.55, 0.05);
	tone(L, R, 0.06, 2637, 0.7, 0.3, 0.001, 0.25, 0.55, 0.05);
	normalize([L, R], 0.45);
	edgeFade([L, R], 0.003);
	writeWav("sale.wav", L, R);
};

/** Head scratch: short dry scratchy bursts. */
const buildScratch = () => {
	const nz = bandpass(noise(Math.round(0.6 * SR), 555), 1500, 6000);
	finish("scratch.wav", mono(0.6, (t, i) => nz[i] * padEnv(t, 0.6, 0.03, 0.2) * Math.max(0, Math.sin(2 * Math.PI * 7 * t)) ** 2), 0.35, 0);
};

/** Pen stroke (underline being drawn). */
const buildPen = () => {
	const nz = bandpass(noise(Math.round(0.5 * SR), 123), 2000, 8000);
	finish("pen.wav", mono(0.5, (t, i) => nz[i] * padEnv(t, 0.5, 0.03, 0.12) * (0.5 + 0.5 * Math.abs(Math.sin(2 * Math.PI * 5 * t)))), 0.35, 0);
};

/** Box landing: muffled cardboard thud. */
const buildThud = () => {
	const nz = lowpass(noise(Math.round(0.45 * SR), 99), 900);
	finish("thud.wav", mono(0.45, (t, i) => Math.sin(2 * Math.PI * (75 + 90 * Math.exp(-t / 0.02)) * t) * env(t, 0.001, 0.07) + nz[i] * env(t, 0.001, 0.03) * 0.8), 0.75, 0.1);
};

/** Confirmation chime (two rising notes). */
const buildConfirm = () => {
	const [L, R] = buf(1.0);
	tone(L, R, 0, N.A5, 0.9, 0.35, 0.003, 0.2, 0.5, 0.1);
	tone(L, R, 0.09, N.D5 * 2, 0.9, 0.35, 0.003, 0.32, 0.5, 0.1);
	const Lw = reverb(L, 0.25, 0.6);
	const Rw = reverb(R, 0.25, 0.6);
	normalize([Lw, Rw], 0.5);
	edgeFade([Lw, Rw], 0.01);
	writeWav("confirm.wav", Lw, Rw);
};

/** Closing chord on the logo: D major add9, soft attack, long tail. */
const buildChord = () => {
	const dur = 4.0;
	const [L, R] = buf(dur);
	const freqs = [N.D3, N.A3, N.D4, 369.99, N.A4, N.E5];
	const n = Math.round(dur * SR);
	for (let i = 0; i < n; i++) {
		const t = i / SR;
		const e = env(t, 0.03, 1.4) * Math.min(1, (dur - t) * 2);
		let l = 0;
		let r = 0;
		freqs.forEach((f, k) => {
			const a = 1 / (k + 1.5);
			l += a * Math.sin(2 * Math.PI * f * 1.001 * t);
			r += a * Math.sin(2 * Math.PI * f * 0.999 * t);
		});
		L[i] = l * e;
		R[i] = r * e;
	}
	tone(L, R, 0, N.D5 * 2, dur, 0.15, 0.003, 0.6, 0.5, 0);
	const Lw = reverb(L, 0.3, 0.75);
	const Rw = reverb(R, 0.3, 0.75);
	normalize([Lw, Rw], 0.7);
	edgeFade([Lw, Rw], 0.01);
	writeWav("chord.wav", Lw, Rw);
};

console.log("AlvoManage 3 audio ->", OUT);
buildScore();
buildToc();
buildLedOff();
buildClick();
buildTick();
buildKey();
buildPop();
buildCount("count-up.wav", true);
buildCount("count-down.wav", false);
buildWhoosh("whoosh.wav", 0.5, 3, false);
buildWhoosh("whoosh-soft.wav", 0.35, 21, false);
buildWhoosh("whoosh-up.wav", 0.8, 11, true);
buildFlip();
buildBag();
buildSale();
buildScratch();
buildPen();
buildThud();
buildConfirm();
buildChord();
