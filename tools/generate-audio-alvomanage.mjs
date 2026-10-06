/**
 * Score + sound design for "AlvoManage — vídeo de produto nº 1". Everything is
 * synthesised here from scratch: no samples, no stock.
 *
 *   node tools/generate-audio-alvomanage.mjs          # score + sfx
 *   node tools/generate-audio-alvomanage.mjs sfx      # only the effects
 *   node tools/generate-audio-alvomanage.mjs music    # only the score
 *
 * Writes to public/audio/alvomanage/. Standalone on purpose: it shares nothing
 * with tools/generate-audio.mjs, so it can never change a byte of LifePhases,
 * Comece Pequeno or iFood.
 *
 * Every effect answers to a visual event listed in src/utils/audio-am.ts
 * (glass cracking, phone buzzing, papers flying, the "Copiar" tick, the link
 * whoosh, stepper steps, the signature stroke, the "Pronta" stamp, the
 * notification landing, the cash drawer, the closing chord). The score is
 * light and sits under the voice; the director's ducking does the rest.
 */
import fs from "node:fs";
import path from "node:path";

const SR = 44100;
const OUT = path.join(process.cwd(), "public", "audio", "alvomanage");

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
	console.log("  alvomanage/" + name, (n / SR).toFixed(2) + "s");
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
 * 96 s bed (longer than the film; the composition cuts it and fades it out).
 * 100 BPM, light and forward: warm pad (Am - F - C - G), a soft plucked
 * 8th-note arpeggio and a muted pulse on the beat. It thins out under scene 7
 * via the composition's volume curve (the joke lives in near-silence).
 */
const buildScore = () => {
	const DUR = 96;
	const BEAT = 0.6;
	const BAR = BEAT * 4;
	const [L, R] = buf(DUR);
	const chords = [
		[N.A2, N.E3, N.A3, N.C4, N.E4],
		[N.F3 / 2, N.C3, N.F3, N.A3, N.C4],
		[N.C3, N.G3, N.C4, N.E4, N.G4],
		[N.G3 / 2, N.D3, N.G3, N.B3, N.D4],
	];
	const arps = [
		[N.A4, N.C5, N.E5, N.C5],
		[N.F4, N.A4, N.C5, N.A4],
		[N.E4, N.G4, N.C5, N.G4],
		[N.D4, N.G4, N.B4, N.G4],
	];
	const bars = Math.ceil(DUR / BAR);
	for (let b = 0; b < bars; b++) {
		const ci = Math.floor(b / 2) % 4;
		const start = b * BAR;
		if (b % 2 === 0) {
			// pad over two bars
			const dur = BAR * 2 + 0.4;
			const n = Math.round(dur * SR);
			for (let i = 0; i < n; i++) {
				const t = i / SR;
				const e = padEnv(t, dur, 0.8, 1.0);
				let l = 0;
				let r = 0;
				chords[ci].forEach((f, k) => {
					const a = 1 / (k + 2);
					l += a * Math.sin(2 * Math.PI * f * t * 1.001);
					r += a * Math.sin(2 * Math.PI * f * t * 0.999);
				});
				add(L, start, i, l * e * 0.16);
				add(R, start, i, r * e * 0.16);
			}
		}
		// arpeggio from bar 2 on
		if (b >= 1) {
			for (let k = 0; k < 8; k++) {
				const f = arps[ci][k % 4] * (k >= 4 ? 1 : 1);
				tone(L, R, start + k * (BEAT / 2), f, 0.5, 0.07, 0.004, 0.12, k % 2 ? 0.65 : 0.35, 0.3);
			}
		}
		// muted pulse on the beat from bar 2 on
		if (b >= 2) {
			for (let k = 0; k < 4; k++) {
				const n = Math.round(0.22 * SR);
				for (let i = 0; i < n; i++) {
					const t = i / SR;
					const f = 52 + 50 * Math.exp(-t / 0.03);
					const v = Math.sin(2 * Math.PI * f * t) * env(t, 0.003, 0.07) * (k === 0 ? 0.32 : 0.2);
					add(L, start + k * BEAT, i, v);
					add(R, start + k * BEAT, i, v);
				}
			}
		}
	}
	const Lw = reverb(lowpass(L, 5000), 0.22, 0.75);
	const Rw = reverb(lowpass(R, 5000), 0.22, 0.75);
	normalize([Lw, Rw], 0.6);
	edgeFade([Lw, Rw], 0.05);
	writeWav("score.wav", Lw, Rw);
};

/* ---------- effects ---------- */

/** Glass cracking (sc1): sharp transient + crackle burst + short glassy ring. */
const buildCrack = () => {
	const dur = 0.7;
	const n = Math.round(dur * SR);
	const x = new Float64Array(n);
	const nz = highpass(noise(n, 17), 2500);
	const crackles = noise(64, 5);
	for (let i = 0; i < n; i++) {
		const t = i / SR;
		x[i] += nz[i] * env(t, 0.001, 0.025) * 1.0;
	}
	for (let k = 0; k < 40; k++) {
		const at = Math.round(((Math.abs(crackles[k]) * 0.28) ** 1.4 + 0.004) * SR);
		const g = 0.3 + 0.5 * Math.abs(crackles[k + 20]);
		for (let i = 0; i < 300 && at + i < n; i++) x[at + i] += nz[(at + i * 3) % n] * Math.exp(-i / 50) * g;
	}
	for (let i = 0; i < n; i++) {
		const t = i / SR;
		x[i] += (Math.sin(2 * Math.PI * 3200 * t) + 0.6 * Math.sin(2 * Math.PI * 4710 * t)) * env(t, 0.001, 0.12) * 0.08;
	}
	const [L, R] = stereo(reverb(x, 0.15, 0.6), 0.5);
	normalize([L, R], 0.8);
	edgeFade([L, R], 0.004);
	writeWav("crack.wav", L, R);
};

/** Phone vibrating on a counter (sc1): one 0.45 s buzz. */
const buildBuzz = (name, dur) => {
	const n = Math.round(dur * SR);
	const x = new Float64Array(n);
	for (let i = 0; i < n; i++) {
		const t = i / SR;
		const am = 0.6 + 0.4 * Math.sin(2 * Math.PI * 28 * t);
		const saw = ((t * 165) % 1) * 2 - 1;
		x[i] = (0.6 * saw + 0.4 * Math.sin(2 * Math.PI * 165 * t)) * am * padEnv(t, dur, 0.02, 0.05);
	}
	const y = lowpass(x, 900);
	const [L, R] = stereo(y, 0.5);
	normalize([L, R], 0.7);
	writeWav(name, L, R);
};

/** Soft balloon/pill pop (speech balloon, pills, stores landing). */
const buildPop = () => {
	const dur = 0.25;
	const n = Math.round(dur * SR);
	const x = new Float64Array(n);
	for (let i = 0; i < n; i++) {
		const t = i / SR;
		const f = 380 + 700 * Math.exp(-t / 0.03);
		x[i] = Math.sin(2 * Math.PI * f * t) * env(t, 0.002, 0.05);
	}
	const [L, R] = stereo(reverb(x, 0.12, 0.5));
	normalize([L, R], 0.6);
	edgeFade([L, R], 0.003);
	writeWav("pop.wav", L, R);
};

/** Papers flying (sc2): flutter of filtered noise, several sheets. */
const buildPapers = () => {
	const dur = 1.1;
	const n = Math.round(dur * SR);
	const nz = bandpass(noise(n, 99), 900, 6000);
	const [L, R] = buf(dur);
	for (let s = 0; s < 6; s++) {
		const start = s * 0.07;
		const pan = 0.2 + (s % 3) * 0.3;
		const rate = 11 + s * 3;
		for (let i = 0; i < n; i++) {
			const t = i / SR - start;
			if (t < 0) continue;
			const e = padEnv(t, 0.6, 0.03, 0.35) * (0.5 + 0.5 * Math.abs(Math.sin(2 * Math.PI * rate * t)));
			const v = nz[(i + s * 997) % n] * e * 0.4;
			L[i] += v * (1 - pan);
			R[i] += v * pan;
		}
	}
	normalize([L, R], 0.6);
	edgeFade([L, R], 0.01);
	writeWav("papers.wav", L, R);
};

/** Calendar page torn (sc1): short paper flick. */
const buildFlip = () => {
	const dur = 0.3;
	const n = Math.round(dur * SR);
	const nz = bandpass(noise(n, 31), 1500, 7000);
	const x = new Float64Array(n);
	for (let i = 0; i < n; i++) {
		const t = i / SR;
		x[i] = nz[i] * env(t, 0.01, 0.06);
	}
	const [L, R] = stereo(x, 0.6);
	normalize([L, R], 0.55);
	edgeFade([L, R], 0.003);
	writeWav("flip.wav", L, R);
};

/** UI tick (Copiar, PDV "+", highlights). */
const buildTick = () => {
	const dur = 0.12;
	const n = Math.round(dur * SR);
	const x = new Float64Array(n);
	const nz = highpass(noise(n, 7), 3000);
	for (let i = 0; i < n; i++) {
		const t = i / SR;
		x[i] = nz[i] * env(t, 0.0005, 0.004) * 0.8 + Math.sin(2 * Math.PI * 2400 * t) * env(t, 0.0005, 0.015) * 0.5;
	}
	const [L, R] = stereo(x);
	normalize([L, R], 0.55);
	edgeFade([L, R], 0.002);
	writeWav("tick.wav", L, R);
};

/** Whoosh (link flying, message leaving the card). */
const buildWhoosh = (name, dur, seed, up) => {
	const n = Math.round(dur * SR);
	const nz = noise(n, seed);
	const L = new Float64Array(n);
	const R = new Float64Array(n);
	let y = 0;
	for (let i = 0; i < n; i++) {
		const t = i / SR;
		const p = t / dur;
		const cutoff = up ? 300 + 5000 * p * p : 800 + 3500 * Math.sin(Math.PI * p);
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

/** Stepper steps (sc5): three soft blips rising. */
const buildStep = (name, freq) => {
	const [L, R] = buf(0.5);
	tone(L, R, 0, freq, 0.5, 0.5, 0.004, 0.09, 0.5, 0.2);
	tone(L, R, 0, freq * 2, 0.5, 0.12, 0.004, 0.05, 0.5, 0);
	const Lw = reverb(L, 0.2, 0.55);
	const Rw = reverb(R, 0.2, 0.55);
	normalize([Lw, Rw], 0.5);
	edgeFade([Lw, Rw], 0.004);
	writeWav(name, Lw, Rw);
};

/** Signature stroke (sc5): pen on glass/paper, wavy scratches. */
const buildPen = () => {
	const dur = 1.0;
	const n = Math.round(dur * SR);
	const nz = bandpass(noise(n, 123), 2000, 8000);
	const x = new Float64Array(n);
	for (let i = 0; i < n; i++) {
		const t = i / SR;
		const strokes = 0.35 + 0.65 * Math.abs(Math.sin(2 * Math.PI * 4.2 * t + Math.sin(2 * Math.PI * 1.3 * t)));
		x[i] = nz[i] * strokes * padEnv(t, dur, 0.04, 0.15);
	}
	const [L, R] = stereo(x, 0.55);
	normalize([L, R], 0.4);
	writeWav("pen.wav", L, R);
};

/** "Pronta" stamp (sc6): low thump + short body. */
const buildStamp = () => {
	const dur = 0.45;
	const n = Math.round(dur * SR);
	const x = new Float64Array(n);
	const nz = lowpass(noise(n, 77), 1800);
	for (let i = 0; i < n; i++) {
		const t = i / SR;
		const f = 70 + 120 * Math.exp(-t / 0.02);
		x[i] = Math.sin(2 * Math.PI * f * t) * env(t, 0.001, 0.08) + nz[i] * env(t, 0.0005, 0.012) * 0.8;
	}
	const [L, R] = stereo(reverb(x, 0.12, 0.5));
	normalize([L, R], 0.8);
	edgeFade([L, R], 0.003);
	writeWav("stamp.wav", L, R);
};

/** Notification landing on the customer's phone (sc6): two-note "plim". */
const buildNotif = () => {
	const [L, R] = buf(1.2);
	tone(L, R, 0, N.E5 * 2, 1.0, 0.35, 0.003, 0.18, 0.5, 0.1);
	tone(L, R, 0.11, N.A5 * 1.5, 1.0, 0.35, 0.003, 0.3, 0.5, 0.1);
	const Lw = reverb(L, 0.25, 0.65);
	const Rw = reverb(R, 0.25, 0.65);
	normalize([Lw, Rw], 0.55);
	edgeFade([Lw, Rw], 0.01);
	writeWav("notif.wav", Lw, Rw);
};

/** Cash drawer (sc11): slide + latch click + a little coin shimmer. */
const buildDrawer = () => {
	const dur = 0.9;
	const n = Math.round(dur * SR);
	const slide = bandpass(noise(n, 55), 300, 2500);
	const x = new Float64Array(n);
	for (let i = 0; i < n; i++) {
		const t = i / SR;
		x[i] += slide[i] * padEnv(t, 0.28, 0.02, 0.06) * 0.5;
		x[i] += Math.sin(2 * Math.PI * 140 * t) * env(t - 0.27, 0.001, 0.04) * (t > 0.27 ? 0.9 : 0);
		for (const [f, d] of [[4200, 0.3], [5300, 0.34], [6100, 0.38]]) {
			if (t > d) x[i] += Math.sin(2 * Math.PI * f * (t - d)) * env(t - d, 0.001, 0.08) * 0.12;
		}
	}
	const [L, R] = stereo(reverb(x, 0.12, 0.5));
	normalize([L, R], 0.7);
	edgeFade([L, R], 0.004);
	writeWav("drawer.wav", L, R);
};

/** Coin dropping in (sc11 "a receber"). */
const buildCoin = () => {
	const [L, R] = buf(0.7);
	tone(L, R, 0, 2637, 0.6, 0.4, 0.001, 0.12, 0.6, 0);
	tone(L, R, 0.004, 3951, 0.6, 0.25, 0.001, 0.08, 0.6, 0);
	tone(L, R, 0.09, 2637, 0.5, 0.18, 0.001, 0.08, 0.6, 0);
	normalize([L, R], 0.45);
	edgeFade([L, R], 0.003);
	writeWav("coin.wav", L, R);
};

/** Rising line on the flow chart (sc11) / lines to the panel (sc12). */
const buildRise = () => {
	const dur = 1.0;
	const [L, R] = buf(dur);
	const n = Math.round(dur * SR);
	let ph = 0;
	for (let i = 0; i < n; i++) {
		const t = i / SR;
		const f = 330 * Math.pow(2, t * 1.2);
		ph += (2 * Math.PI * f) / SR;
		const v = (Math.sin(ph) + 0.3 * Math.sin(ph * 2)) * padEnv(t, dur, 0.15, 0.3) * 0.4;
		L[i] += v;
		R[i] += v;
	}
	const Lw = reverb(L, 0.25, 0.6);
	const Rw = reverb(R, 0.25, 0.6);
	normalize([Lw, Rw], 0.4);
	writeWav("rise.wav", Lw, Rw);
};

/** Closing chord on the logo (sc13): C major add9, soft attack, long tail. */
const buildChord = () => {
	const dur = 4.0;
	const [L, R] = buf(dur);
	const freqs = [N.C3, N.G3, N.C4, N.E4, N.G4, N.D5];
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
	tone(L, R, 0, N.C6, dur, 0.15, 0.003, 0.6, 0.5, 0);
	const Lw = reverb(L, 0.3, 0.75);
	const Rw = reverb(R, 0.3, 0.75);
	normalize([Lw, Rw], 0.7);
	edgeFade([Lw, Rw], 0.01);
	writeWav("chord.wav", Lw, Rw);
};

const what = process.argv[2] ?? "all";
console.log("AlvoManage audio ->", OUT);
if (what === "all" || what === "music") buildScore();
if (what === "all" || what === "sfx") {
	buildCrack();
	buildBuzz("buzz.wav", 0.45);
	buildBuzz("buzz-short.wav", 0.16);
	buildPop();
	buildPapers();
	buildFlip();
	buildTick();
	buildWhoosh("whoosh.wav", 0.6, 3, false);
	buildWhoosh("whoosh-up.wav", 0.9, 11, true);
	buildStep("step-1.wav", N.E5);
	buildStep("step-2.wav", N.G5);
	buildStep("step-3.wav", N.C6);
	buildPen();
	buildStamp();
	buildNotif();
	buildDrawer();
	buildCoin();
	buildRise();
	buildChord();
}
