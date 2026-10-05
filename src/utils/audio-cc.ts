import {WordMatchCC, cueForCC} from "./cue-cc";
import {NARRATION_CC} from "./narration-cc";
import {END_CC, SCENE_STARTS_CC} from "./timeline-cc";

export type SfxCueCC = {src: string; frame: number; durationInFrames: number; volume: number};

const CC_SFX = "audio/cocacola/";
const S = SCENE_STARTS_CC;

/** Width of each effect in frames at 30 fps — measured from the wav, rounded up. */
const LEN = {
	impactNine: 17, // 0,55 s
	impactBillion: 69, // 2,30 s
	impactDate: 30, // 1,00 s
	paperNews: 33, // 1,10 s
	paperCoupon: 14, // 0,45 s
	revealScale: 84, // 2,80 s
	closeBreath: 54, // 1,80 s
} as const;

/**
 * Absolute frame a spoken word begins on: the line's own cue plus the start of
 * the scene that owns it. Every cue below comes from the narration timing and
 * never from a hand-typed frame: change the voice and the effects follow.
 */
const word = (scene: number, id: string, m: WordMatchCC): number =>
	Math.round(S[scene] + cueForCC(scene)(id).wordStart(m));

/** "mundo." — the last word of the film. The bed starts leaving here. */
const LAST_WORD_AT = word(6, "14-fecho", /^mundo$/);

/**
 * Score and sound design for "Coca-Cola".
 *
 * Score: public/audio/cocacola/musica-cama.wav — "Tranquility" (Kevin MacLeod,
 * incompetech.com, CC BY 4.0), the 556,0-620,0 s stretch, chosen and measured by
 * tools/music-escolha-cc.py and built by tools/music-bed-cc.py. It is the only
 * candidate whose window has both a real arc and no hole in it: it climbs step
 * by step from the turn (28,7 s) to the two billion of today (48,8 s) and holds
 * to the close. The gain is baked into the wav — measured so the bed sits 16 dB
 * under the voice at its loudest — and the arc in SoundtrackCC.tsx only ever
 * multiplies that by 1 or less, so the margin holds everywhere. peakVolume is
 * 1 for the same reason: any factor here would contradict the measurement.
 *
 * Effects: seven cues in the whole film, and every one of them is a thing
 * happening on screen, not a scene change — the three numbers (nine drinks a
 * day in the hook, the two billion of today, the two billion at the close), the
 * date 1886, the two moments the drink had to be announced (the first ad and
 * the free-glass coupons), and one breath in the close. They are one family
 * growing: the same knock, deeper and longer each time, and the paper of the
 * newspaper carrying the two announcements. None of them (and nothing in
 * tools/generate-audio.mjs for this piece) has an inharmonic partial, which is
 * what would turn any of them into a bell — no bell, no piano, no drum anywhere.
 *
 * The voice commands. Every effect plays *under* the words, never instead of
 * them: nothing here pauses or shortens a line, and volumes stay in the 0,10-0,22
 * band, with the loudest cue of the film (the scale, "13-hoje") still about 6 dB
 * below the voice's own peak.
 *
 * `sfx.cues` is a getter rather than a plain array, the same pattern as
 * audio-ms.ts / audio-at.ts / audio-cp.ts: the cues are computed at render time,
 * after every module has finished initialising, and they always read the current
 * narration numbers. `durationInFrames` is the wav length rounded up, never
 * shorter: a Sequence that ends mid-file cuts the envelope and leaves a click.
 */
export const AUDIO_CC = {
	music: {
		enabled: true,
		src: "audio/cocacola/musica-cama.wav",
		peakVolume: 1,
		/** The bed comes up under the hook; every spoken line ducks it further. */
		fadeInFrames: 45,
		/** Scene 4 — Asa Candler buys the formula: the bed opens from here. */
		riseStart: S[3],
		/** Scene 6 — "mais de dois bilhões de doses por dia". The peak. */
		peakStart: S[5],
		/** Scene 7 — the close: the bed starts letting go. */
		easeStart: S[6],
		/** "mundo.", the last word of the film; the wav's own fade opens at 1845. */
		fadeOutStart: LAST_WORD_AT,
		totalFrames: END_CC,
	},
	sfx: {
		enabled: true,
		get cues(): SfxCueCC[] {
			return computeSfxCuesCC();
		},
	},
};

const computeSfxCuesCC = (): SfxCueCC[] => {
	if (!NARRATION_CC.enabled) return [];

	const cues: SfxCueCC[] = [];

	/* ---- scene 0, "01-gancho" (the hook) — SCENE_STARTS_CC[0] ---- */

	// "nove bebidas por dia": the smallest number of the film. Scene1 is where
	// the 9 lands on frame; this is the knock at its driest and shortest, under
	// the word and gone before the next one.
	cues.push({
		src: `${CC_SFX}impact-nine.wav`,
		frame: word(0, "01-gancho", /^nove$/),
		durationInFrames: LEN.impactNine,
		volume: 0.16,
	});

	// "mais de dois bilhões de doses por dia": the hook's answer, and the first
	// time the film opens up. The same knock, deeper, with a fifth blooming
	// behind it — held back so the final reveal can still be bigger.
	cues.push({
		src: `${CC_SFX}impact-billion.wav`,
		frame: word(0, "02-hoje", /^bilhões$/),
		durationInFrames: LEN.impactBillion,
		volume: 0.16,
	});

	/* ---- scene 1, "04-1886" — SCENE_STARTS_CC[1] ---- */

	// "mil oitocentos e oitenta e seis" closes on "seis" — the date the film
	// hangs everything on. A stamp on a ledger: the knock with paper on top of
	// it, drier than the numbers.
	cues.push({
		src: `${CC_SFX}impact-date-1886.wav`,
		frame: word(1, "04-1886", /^seis$/),
		durationInFrames: LEN.impactDate,
		volume: 0.15,
	});

	/* ---- scene 2, "05-novidade" (making it known) — SCENE_STARTS_CC[2] ---- */

	// "O primeiro anúncio saiu em vinte e nove de maio, no Atlanta Journal": the
	// newsprint opening as the ad appears. Air and paper, no impact — nothing
	// has changed in the story yet, the drink is only being made known.
	cues.push({
		src: `${CC_SFX}paper-news.wav`,
		frame: word(2, "06-anuncio", /^anúncio$/),
		durationInFrames: LEN.paperNews,
		volume: 0.18,
	});

	// "vieram os cupons de copo grátis": the same paper, cut smaller — two
	// flicks between fingers, no room. The second half of the same idea.
	cues.push({
		src: `${CC_SFX}paper-coupon.wav`,
		frame: word(2, "07-cupons", /^cupons$/),
		durationInFrames: LEN.paperCoupon,
		volume: 0.16,
	});

	/* ---- scene 5, "12-nove" (the scale) — SCENE_STARTS_CC[5] ---- */

	// "são mais de dois bilhões de doses por dia, em mais de duzentos países":
	// the biggest number of the film and the only real revelation. The deepest
	// and longest of the family — a door opening, still under the voice.
	cues.push({
		src: `${CC_SFX}reveal-scale.wav`,
		frame: word(5, "13-hoje", /^bilhões$/),
		durationInFrames: LEN.revealScale,
		volume: 0.18,
	});

	/* ---- scene 6, "14-fecho" (the close) — SCENE_STARTS_CC[6] ---- */

	// "virou uma das marcas mais reconhecidas do mundo": no number, so no knock
	// — one low fifth breathing in and out under the last word, leaving with
	// the bed. The last sound of the film.
	cues.push({
		src: `${CC_SFX}close-breath.wav`,
		frame: LAST_WORD_AT,
		durationInFrames: LEN.closeBreath,
		volume: 0.16,
	});

	return cues.sort((a, b) => a.frame - b.frame);
};
