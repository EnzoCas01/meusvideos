import {WordMatchAT, cueForAT} from "./cue-at";
import {END_AT, SCENE_STARTS_AT} from "./timeline-at";

export type SfxCueAT = {src: string; frame: number; durationInFrames: number; volume: number};

const DIR = "audio/anthropic";

/** Length of each effect, in frames at 30 fps — measured from the wav, rounded up. */
const LEN = {
	marker: 9, // 0.28 s
	whoosh: 21, // 0.70 s
	impactDate: 33, // 1.10 s
	impactClimax: 78, // 2.60 s
	reveal: 72, // 2.40 s
	horn: 19, // 0.62 s
} as const;

/**
 * Points at a spoken line from the scene that owns it and hands back absolute
 * film frames. The scenes already use the same matchers for their impact text,
 * so an effect lands on exactly the word that lights up on screen.
 */
const at = (scene: number, id: string) => {
	const cue = cueForAT(scene)(id);
	const base = SCENE_STARTS_AT[scene];
	return {
		/** Absolute frame the line starts on. */
		start: base + cue.start,
		/** Absolute frame one spoken word begins on. */
		word: (m: WordMatchAT) => base + cue.wordStart(m),
	};
};

/**
 * Score and sound design for "Anthropic".
 *
 * Score: public/audio/anthropic/musica-cama.wav — "Airship Serenity" (Kevin
 * MacLeod, CC BY 4.0), the 156.0-227.2 s stretch, built and measured by
 * tools/music-bed-at.py. The gain is baked into the wav (measured so the bed
 * sits 16 dB under the voice at its loudest), which is why `peakVolume` is 1 and
 * the arc inside the file is the arc you hear: contained through the hook,
 * opening right after "A Anthropic.", fullest under the US$ 380 billions.
 *
 * Effects exist only where something happens on screen. Every frame below comes
 * from the narration timing, never from a hand-typed number: change the voice
 * and the cues follow. None of them pauses the narration — they play under it.
 */
export const AUDIO_AT = {
	music: {
		enabled: true,
		src: "audio/anthropic/musica-cama.wav",
		fadeInFrames: 45,
		peakVolume: 1,
		totalFrames: END_AT,
	},
	sfx: {
		enabled: true,
		// A getter, not a frozen array: the cues are read at render time, from the
		// narration file as it currently is.
		get cues(): SfxCueAT[] {
			return [
				// 01 — the OpenAI wordmark lands on the word "OpenAI". Scene 1.
				{
					src: `${DIR}/marker.wav`,
					frame: at(0, "01-gancho").word(/^openai$/),
					durationInFrames: LEN.marker,
					volume: 0.2,
				},

				// 03 — the turn. The riser starts with the line and peaks on the word
				// "Anthropic", so the name arrives on the crest, not after it. Scene 3.
				{
					src: `${DIR}/reveal.wav`,
					frame: at(2, "05-nova").word("Anthropic") - LEN.reveal,
					durationInFrames: LEN.reveal,
					volume: 0.2,
				},

				// 04 — "MILHÕES" completes US$ 124, the first money figure. Scene 4.
				{
					src: `${DIR}/impact-date.wav`,
					frame: at(3, "07-124").word(/^milhões$/),
					durationInFrames: LEN.impactDate,
					volume: 0.13,
				},

				// 05 — "CLAUDE" lands under the mark coming up over the app. Scene 5.
				{
					src: `${DIR}/marker.wav`,
					frame: at(4, "08-claude").word("Claude"),
					durationInFrames: LEN.marker,
					volume: 0.2,
				},

				// 06 — the 2025 figure: "US$ 183" lands. Scene 6.
				{
					src: `${DIR}/impact-date.wav`,
					frame: at(5, "09-183").word(/^três$/),
					durationInFrames: LEN.impactDate,
					volume: 0.13,
				},

				// 06 — the photo swaps to the February 2026 skyline; the whoosh rises
				// into the date. Scene 6.
				{
					src: `${DIR}/whoosh.wav`,
					frame: at(5, "10-380").start,
					durationInFrames: LEN.whoosh,
					volume: 0.16,
				},

				// 06 — the peak: "US$ 380" lands and the bar completes itself. Scene 6.
				{
					src: `${DIR}/impact-climax.wav`,
					frame: at(5, "10-380").word(/^trezentos$/),
					durationInFrames: LEN.impactClimax,
					volume: 0.16,
				},

				// 07 — the card: the mark and the wordmark come up as the film sinks to
				// black, 8 frames into "E essa história...", exactly where Scene7 does.
				{
					src: `${DIR}/horn.wav`,
					frame: at(6, "12-fecho").start + 8,
					durationInFrames: LEN.horn,
					volume: 0.18,
				},
			];
		},
	},
};
