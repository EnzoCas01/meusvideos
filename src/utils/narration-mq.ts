import data from "../narration-mq.json";

/** One spoken word: `s`/`e` are frames relative to the start of its line. */
export type WordMQ = {w: string; s: number; e: number};

export type NarrationLineMQ = {
	id: string;
	/** Absolute frame where the clip starts (30 fps). */
	frame: number;
	/** Measured from the generated wav — never guessed. */
	durationInFrames: number;
	words: WordMQ[];
	text?: string;
};

type NarrationFileMQ = {
	enabled: boolean;
	volume: number;
	tailFrames: number;
	headFrames: number;
	lines: NarrationLineMQ[];
};

/** Narration for "MaquinaIA". The JSON is the single source of truth for timing. */
export const NARRATION_MQ = data as NarrationFileMQ;

/** Where the generated clips live, relative to public/. */
export const VO_DIR_MQ = "audio/vo-mq";

/** Looks a line up by id, so a scene can sync an image to the voice. */
export const lineMQ = (id: string): NarrationLineMQ => {
	const hit = NARRATION_MQ.lines.find((l) => l.id === id);
	if (!hit) throw new Error(`narration line not found: ${id}`);
	return hit;
};

/** Absolute frame where a spoken word begins — impact text and reveals key off this. */
export const wordMQ = (id: string, re: RegExp): number => {
	const line = lineMQ(id);
	const hit = line.words.find((w) => re.test(w.w));
	if (!hit) throw new Error(`word not found in ${id}: ${re}`);
	return line.frame + hit.s;
};
