import data from "../narration-bk.json";

/** One spoken word: `s`/`e` are frames relative to the start of its line. */
export type WordBK = {w: string; s: number; e: number};

export type NarrationLineBK = {
	id: string;
	/** Absolute frame where the clip starts (30 fps). */
	frame: number;
	/** Measured from the generated wav — never guessed. */
	durationInFrames: number;
	words: WordBK[];
	text?: string;
};

type NarrationFileBK = {
	voice: string;
	tailFrames: number;
	headFrames: number;
	lines: NarrationLineBK[];
};

/** Narration for "BurgerKing". The JSON is the single source of truth for timing. */
export const NARRATION_BK = data as unknown as NarrationFileBK;

/** Where the generated clips live, relative to public/. */
export const VO_DIR_BK = "audio/vo-bk";

/** Looks a line up by id, so a scene can sync an image to the voice. */
export const lineBK = (id: string): NarrationLineBK => {
	const hit = NARRATION_BK.lines.find((l) => l.id === id);
	if (!hit) throw new Error(`narration line not found: ${id}`);
	return hit;
};

/** Absolute frame where a spoken word begins — impact text and reveals key off this. */
export const wordBK = (id: string, re: RegExp): number => {
	const line = lineBK(id);
	const hit = line.words.find((w) => re.test(w.w));
	if (!hit) throw new Error(`word not found in ${id}: ${re}`);
	return line.frame + hit.s;
};
