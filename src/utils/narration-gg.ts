import data from "../narration-gg.json";

/** One spoken word: `s`/`e` are frames relative to the start of its line. */
export type WordGG = {w: string; s: number; e: number};

export type NarrationLineGG = {
	id: string;
	/** Absolute frame where the clip starts (30 fps). */
	frame: number;
	/** Measured from the generated wav — never guessed. */
	durationInFrames: number;
	words: WordGG[];
	text?: string;
};

type NarrationFileGG = {
	voice: string;
	tailFrames: number;
	headFrames: number;
	lines: NarrationLineGG[];
};

/** Narration for "Google". The JSON is the single source of truth for timing. */
export const NARRATION_GG = data as unknown as NarrationFileGG;

/** Where the generated clips live, relative to public/. */
export const VO_DIR_GG = "audio/vo-gg";

/** Looks a line up by id, so a scene can sync an image to the voice. */
export const lineGG = (id: string): NarrationLineGG => {
	const hit = NARRATION_GG.lines.find((l) => l.id === id);
	if (!hit) throw new Error(`narration line not found: ${id}`);
	return hit;
};

/** Absolute frame where a spoken word begins — impact text and reveals key off this. */
export const wordGG = (id: string, re: RegExp): number => {
	const line = lineGG(id);
	const hit = line.words.find((w) => re.test(w.w));
	if (!hit) throw new Error(`word not found in ${id}: ${re}`);
	return line.frame + hit.s;
};
