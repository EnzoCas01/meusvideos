import data from "../narration-mdn.json";

export type NarrationLineMDN = {
	id: string;
	/** Absolute frame where the clip starts (30 fps). PROVISIONAL until measured. */
	frame: number;
	text: string;
	gapAfter?: number;
	/** Filled by tools/generate-narration-edge.py — never guessed. */
	durationInFrames?: number;
	/** Word timings measured from the generated wav — never guessed. */
	words?: {w: string; s: number; e: number}[];
};

export const NARRATION_MDN = data as unknown as {
	enabled: boolean;
	voice: string;
	engine: string;
	rate: string;
	language: string;
	volume: number;
	headFrames: number;
	tailFrames: number;
	note: string;
	lines: NarrationLineMDN[];
};

export const FPS_MDN = 30;

/**
 * While the voice is not measured yet, duration is estimated from text length
 * (~15 chars/s at +10% rate). The moment `durationInFrames` lands in the JSON,
 * every beat below re-times itself — no scene carries a hardcoded frame.
 */
const provisionalDur = (text: string): number =>
	Math.max(24, Math.round((text.replace(/\s/g, "").length / 15) * 30));

/** A line with a guaranteed duration (measured, or the provisional estimate). */
export const lineMDN = (id: string): NarrationLineMDN & {durationInFrames: number} => {
	const hit = NARRATION_MDN.lines.find((l) => l.id === id);
	if (!hit) throw new Error(`narration line not found: ${id}`);
	return {...hit, durationInFrames: hit.durationInFrames ?? provisionalDur(hit.text)};
};

/** Absolute frame where the last word of the film is spoken. */
export const LAST_WORD_MDN = NARRATION_MDN.lines.reduce((acc, l) => {
	const dur = l.durationInFrames ?? provisionalDur(l.text);
	return Math.max(acc, l.frame + dur);
}, 0);

/** Total length of the composition: the last line plus its tail. */
export const MDN_DURATION = LAST_WORD_MDN + NARRATION_MDN.tailFrames;

/**
 * Lines for CaptionsStyled — only real measured words, never estimates. Empty
 * until the narracao agent fills `words` in the JSON, so a preview render can
 * never show fake karaoke timing.
 */
export const captionLinesMDN = () =>
	NARRATION_MDN.lines
		.filter((l) => l.words && l.words.length > 0)
		.map((l) => ({frame: l.frame, words: l.words!}));
