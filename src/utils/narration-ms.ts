import data from "../narration-microsoft.json";

/** One spoken word, timed inside its own clip and not over the film. */
export type WordMS = {
	/** The word as written in the script, punctuation kept. */
	w: string;
	/** Frames from the start of this clip's wav (30 fps). */
	s: number;
	e: number;
};

export type NarrationLineMS = {
	id: string;
	/** Absolute frame where the clip starts (30 fps). */
	frame: number;
	text: string;
	/** Measured from the generated wav — never guessed. */
	durationInFrames: number;
	/** When each word is actually spoken — captions and impact text key off this. */
	words: WordMS[];
	/** How many words the timing engine matched, e.g. "13/13". */
	wordsMatched: string;
	/** Which engine produced the timing, so it is never mistaken for the other. */
	wordsEngine: string;
};

type NarrationFileMS = {
	enabled: boolean;
	voice: string;
	/** Voice level, and where the bed sits under it (for the sound agent). */
	volume: number;
	duckMusicTo: number;
	/** Silence held after the last word, in frames. */
	tailFrames: number;
	headFrames: number;
	lines: NarrationLineMS[];
};

/** Narration for "Disney". The JSON is the single source of truth for timing. */
export const NARRATION_MS = data as NarrationFileMS;

/** Where the generated clips live, relative to public/. */
export const VO_DIR_MS = "audio/vo-microsoft";

/** Looks a line up by id, so a scene can sync an image to the voice. */
export const lineMS = (id: string): NarrationLineMS => {
	const hit = NARRATION_MS.lines.find((l) => l.id === id);
	if (!hit) throw new Error(`narration line not found: ${id}`);
	return hit;
};

/** Absolute frame where the last spoken clip stops. */
export const LAST_WORD_MS = NARRATION_MS.lines.reduce(
	(acc, l) => Math.max(acc, l.frame + l.durationInFrames),
	0,
);

/** Extra frames of fade on either side of a spoken line, for the music duck. */
const DUCK_FADE = 10;

/** Score multiplier at a frame: 1 in the clear, `duckMusicTo` under a spoken line, ramped. */
export const musicDuckMS = (frame: number): number => {
	if (!NARRATION_MS.enabled) return 1;
	let lowest = 1;
	for (const l of NARRATION_MS.lines) {
		const start = l.frame - DUCK_FADE;
		const end = l.frame + l.durationInFrames + DUCK_FADE;
		if (frame < start || frame > end) continue;
		const depth = Math.min(1, (frame - start) / DUCK_FADE, (end - frame) / DUCK_FADE);
		lowest = Math.min(lowest, 1 - (1 - NARRATION_MS.duckMusicTo) * depth);
	}
	return lowest;
};
