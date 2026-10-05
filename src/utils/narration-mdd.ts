import data from "../narration-mdd.json";

/** One spoken word: `s`/`e` are frames relative to the start of its line. */
export type WordMDD = {w: string; s: number; e: number};

export type NarrationLineMDD = {
	id: string;
	/** Absolute frame where the clip starts (30 fps). */
	frame: number;
	/** Measured from the generated wav — never guessed. */
	durationInFrames: number;
	words: WordMDD[];
	text?: string;
};

type NarrationFileMDD = {
	enabled: boolean;
	volume: number;
	tailFrames: number;
	headFrames: number;
	lines: NarrationLineMDD[];
};

/** Narration for "MaquinaDinheiro". The JSON is the single source of truth for timing. */
export const NARRATION_MDD = data as NarrationFileMDD;

/** Where the generated clips live, relative to public/. */
export const VO_DIR_MDD = "audio/vo-mdd";

/** Looks a line up by id, so a scene can sync an image to the voice. */
export const lineMDD = (id: string): NarrationLineMDD => {
	const hit = NARRATION_MDD.lines.find((l) => l.id === id);
	if (!hit) throw new Error(`narration line not found: ${id}`);
	return hit;
};

/** Absolute frame where a spoken word begins — impact text and reveals key off this. */
export const wordMDD = (id: string, re: RegExp): number => {
	const line = lineMDD(id);
	const hit = line.words.find((w) => re.test(w.w));
	if (!hit) throw new Error(`word not found in ${id}: ${re}`);
	return line.frame + hit.s;
};
