/**
 * Sound design for "Agentes". No music bed by default (project rule): effects
 * only, and only where something actually happens on screen.
 *
 * The `som` agent fills `cues` and synthesises the WAVs with
 * tools/generate-audio.mjs. Frames are absolute in the film.
 */
export type CueAudioAG = {
	/** Absolute frame the effect starts on. */
	frame: number;
	/** Path relative to public/. */
	src: string;
	durationInFrames: number;
	volume: number;
	/** What happens on screen at this frame — an effect with no event is a defect. */
	why: string;
};

export const AUDIO_AG = {
	sfx: {
		enabled: true,
		cues: [] as CueAudioAG[],
	},
} as const;
