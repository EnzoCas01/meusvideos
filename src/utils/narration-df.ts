import data from "../narration-disney.json";

/** One spoken word, timed inside its own clip and not over the film. */
export type WordDF = {
	/** The word as written in the script, punctuation kept. */
	w: string;
	/** Frames from the start of this clip's wav (30 fps). */
	s: number;
	e: number;
};

export type NarrationLineDF = {
	id: string;
	/** Absolute frame where the clip starts (30 fps). */
	frame: number;
	text: string;
	/** Measured from the generated wav — never guessed. */
	durationInFrames: number;
	/** When each word is actually spoken — captions and impact text key off this. */
	words: WordDF[];
	/** How many words the timing engine matched, e.g. "13/13". */
	wordsMatched: string;
	/** Which engine produced the timing, so it is never mistaken for the other. */
	wordsEngine: string;
};

type NarrationFileDF = {
	enabled: boolean;
	voice: string;
	/** Voice level, and where the bed sits under it (for the sound agent). */
	volume: number;
	duckMusicTo: number;
	/** Silence held after the last word, in frames. */
	tailFrames: number;
	headFrames: number;
	lines: NarrationLineDF[];
};

/** Narration for "Disney". The JSON is the single source of truth for timing. */
export const NARRATION_DF = data as NarrationFileDF;

/** Where the generated clips live, relative to public/. */
export const VO_DIR_DF = "audio/vo-disney";

/** Looks a line up by id, so a scene can sync an image to the voice. */
export const lineDF = (id: string): NarrationLineDF => {
	const hit = NARRATION_DF.lines.find((l) => l.id === id);
	if (!hit) throw new Error(`narration line not found: ${id}`);
	return hit;
};

/** Absolute frame where the last spoken clip stops. */
export const LAST_WORD_DF = NARRATION_DF.lines.reduce(
	(acc, l) => Math.max(acc, l.frame + l.durationInFrames),
	0,
);
