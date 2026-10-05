import {WordMatchMS, cueForMS} from "./cue-ms";
import {NARRATION_MS} from "./narration-ms";
import {END_MS, SCENE_STARTS_MS} from "./timeline-ms";

export type SfxCueMS = {src: string; frame: number; durationInFrames: number; volume: number};

const MS_SFX = "audio/microsoft/";
const S = SCENE_STARTS_MS;

/** Width of each effect in frames at 30 fps — measured from the wav, rounded up. */
const LEN = {
	marker: 9, // 0.28 s
	whoosh: 21, // 0.70 s
	impactDate: 34, // 1.10 s
	impactClimax: 78, // 2.60 s
	reveal: 72, // 2.40 s
	horn: 19, // 0.62 s
} as const;

/**
 * Absolute frame a spoken word begins on: the line's own cue plus the start of
 * the scene that owns it. The scenes use the same matchers for their impact
 * text, so an effect lands on exactly the word that lights up on screen.
 */
const word = (scene: number, id: string, m: WordMatchMS): number =>
	Math.round(S[scene] + cueForMS(scene)(id).wordStart(m));

/** The frame the wordmark surfaces in the close — Scene6.tsx:35, `markAt = cE.wordEnd(/^ibm$/)`. */
const MARK_AT_MS = Math.round(S[5] + cueForMS(5)("10-fecho").wordEnd(/^ibm$/));

/**
 * Score and sound design for "Microsoft".
 *
 * Score: public/audio/microsoft/musica-cama.wav — "Limit 70" (Kevin MacLeod,
 * CC BY 4.0), the 234.0-293.2 s stretch, built and measured by
 * tools/music-bed-ms.py. The track is the retro-modern tone the film asks for
 * (electric piano and synths over a light pulse) and it carries its own step:
 * contained for the first ~22 s, then open from the turn on. The gain is baked
 * into the wav — measured so the bed sits 16 dB under the voice at its loudest —
 * and the arc in SoundtrackMS.tsx only ever multiplies that by 1 or less, so the
 * margin holds everywhere.
 *
 * Effects exist only where something happens on screen: a figure landing, a
 * photo rising, a name arriving, the wordmark. Every frame below comes from the
 * narration timing, never from a hand-typed number: change the voice and the
 * cues follow. None of them pauses the narration — they play under it.
 *
 * `sfx.cues` is a getter rather than a plain array, the same pattern as
 * audio-at.ts / audio-if.ts / audio-nf.ts: the cues are computed at render time,
 * after every module has finished initialising, and they always read the current
 * narration numbers. `durationInFrames` is the wav length rounded up, never
 * shorter: a Sequence that ends mid-file cuts the envelope and leaves a click.
 */
export const AUDIO_MS = {
	music: {
		enabled: true,
		src: "audio/microsoft/musica-cama.wav",
		peakVolume: 1,
		/** The bed comes up under the hook; every spoken line ducks it further. */
		fadeInFrames: 45,
		/** Scene 4 — the turn. From here the bed opens, over the track's own step. */
		riseStart: S[3],
		/** Scene 5 — US$ 17,3 milhões. The peak. */
		peakStart: S[4],
		/** Scene 6 — the close: the bed starts letting go. */
		easeStart: S[5],
		/** The wordmark surfacing; from here the bed leaves. */
		fadeOutStart: MARK_AT_MS,
		totalFrames: END_MS,
	},
	sfx: {
		enabled: true,
		get cues(): SfxCueMS[] {
			return computeSfxCuesMS();
		},
	},
};

const computeSfxCuesMS = (): SfxCueMS[] => {
	if (!NARRATION_MS.enabled) return [];

	const cues: SfxCueMS[] = [];

	/* ---- Scene 1 (the hook) — SCENE_STARTS_MS[0] ---- */

	// "US$ 16.005" lands enormous on the first spoken figure. Scene1.tsx:69-71 —
	// TextMS start={number}, `number = cue.wordStart(/^dezesseis$/)`.
	cues.push({
		src: `${MS_SFX}impact-date.wav`,
		frame: word(0, "01-gancho", /^dezesseis$/),
		durationInFrames: LEN.impactDate,
		volume: 0.14,
	});

	// The IBM PC rising out of the bottom of the frame, which is also where the
	// hook's question gets answered. Scene1.tsx:45-64 — the photo's `range` and
	// `showFrom` both open at `pcIn - 6`. The sweep runs 171-192 and the voice
	// says "IBM" at 192, so the name lands on its tail: the picture arriving and
	// the machine being named are one beat, and they get one effect.
	cues.push({
		src: `${MS_SFX}whoosh.wav`,
		frame: word(0, "01-gancho", /^computadores/) - 6,
		durationInFrames: LEN.whoosh,
		volume: 0.13,
	});

	/* ---- Scene 2 (the two founders) — SCENE_STARTS_MS[1] ---- */

	// The Lakeside photo dissolves with movement into the Altair and the tape
	// they wrote appears as a card. The riser opens 2.4 s early so its crest
	// lands on "Altair", the word the machine is named by — Scene2.tsx:110-127
	// (the Altair photo's range opens at `cAlt.start`) and :144-146 (the text).
	cues.push({
		src: `${MS_SFX}reveal.wav`,
		frame: word(1, "04-altair", /^altair$/) - LEN.reveal,
		durationInFrames: LEN.reveal,
		volume: 0.15,
	});

	/* ---- Scene 3 (the whole first year) — SCENE_STARTS_MS[2] ---- */

	// The same figure as the hook, now over the Altair's dark panel: the
	// "that's all?" beat. Scene3.tsx:62-64 — TextMS start={number}.
	cues.push({
		src: `${MS_SFX}impact-date.wav`,
		frame: word(2, "05-primeiro", /^dezesseis$/),
		durationInFrames: LEN.impactDate,
		volume: 0.14,
	});

	/* ---- Scene 4 (the turn) — SCENE_STARTS_MS[3] ---- */

	// The rebus that spells IBM appears, with the word following 18 frames
	// later. Scene4.tsx:67-82 — `range={[ibm - 18, ms - 10]}`; the cue marks the
	// picture arriving, which is the event.
	cues.push({
		src: `${MS_SFX}marker.wav`,
		frame: word(3, "07-ibm", /^ibm$/) - 18,
		durationInFrames: LEN.marker,
		volume: 0.12,
	});

	// "MICROSOFT + IBM": the 1980 wordmark takes the place of the rebus as the
	// two companies meet. The riser starts on the word "para" and crests on
	// "Microsoft", so the name arrives on the crest — Scene4.tsx:83-97 (the
	// wordmark's range opens at `ms`) and :122-124 (the text).
	cues.push({
		src: `${MS_SFX}reveal.wav`,
		frame: word(3, "07-ibm", /^microsoft$/) - LEN.reveal,
		durationInFrames: LEN.reveal,
		volume: 0.16,
	});

	/* ---- Scene 5 (the peak) — SCENE_STARTS_MS[4] ---- */

	// "US$ 17,3" — the figure the whole film was building toward, at the
	// brightest grade of the piece. Scene5.tsx:52-54 — TextMS start={millions}.
	cues.push({
		src: `${MS_SFX}impact-climax.wav`,
		frame: word(4, "08-1981", /^dezessete$/),
		durationInFrames: LEN.impactClimax,
		volume: 0.17,
	});

	/* ---- Scene 6 (the close) — SCENE_STARTS_MS[5] ---- */

	// The 1975 wordmark surfacing over the veil, breathing once before the fade:
	// the last sound of the film. Scene6.tsx:35 and :121-146.
	cues.push({
		src: `${MS_SFX}horn.wav`,
		frame: MARK_AT_MS,
		durationInFrames: LEN.horn,
		volume: 0.17,
	});

	return cues.sort((a, b) => a.frame - b.frame);
};
