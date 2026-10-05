import data from "../narration-ifood.json";

export type NarrationLineIF = {
	id: string;
	/** Absolute frame where the clip starts (30 fps). */
	frame: number;
	text: string;
	/** Measured from the generated wav — never guessed. */
	durationInFrames: number;
};

/**
 * Narration for "IFood". The JSON is the single source of truth for WHEN each
 * line is heard; every scene derives its own timings from it, so nothing has
 * to be touched by hand if a clip is ever remeasured.
 */
export const NARRATION_IF = data as {
	enabled: boolean;
	voice: string;
	language: string;
	volume: number;
	/** How far the score drops while a line is being spoken. */
	duckMusicTo: number;
	note: string;
	lines: NarrationLineIF[];
};

/** Where the generated clips live, relative to public/. */
export const VO_DIR_IF = "audio/vo-ifood";

/** Extra frames of fade on either side of a spoken line, for the music duck. */
const DUCK_FADE = 10;

/**
 * Multiplier for the score at a given frame: 1 in the clear, `duckMusicTo`
 * under a spoken line, ramped so the dip is never audible as a jump.
 * Exported now so the sound pass can plug a bed in without touching scenes.
 */
export const musicDuckIF = (frame: number): number => {
	if (!NARRATION_IF.enabled) return 1;
	let lowest = 1;
	for (const l of NARRATION_IF.lines) {
		const start = l.frame - DUCK_FADE;
		const end = l.frame + l.durationInFrames + DUCK_FADE;
		if (frame < start || frame > end) continue;
		const intoStart = Math.min(1, (frame - start) / DUCK_FADE);
		const toEnd = Math.min(1, (end - frame) / DUCK_FADE);
		const depth = Math.min(intoStart, toEnd);
		lowest = Math.min(lowest, 1 - (1 - NARRATION_IF.duckMusicTo) * depth);
	}
	return lowest;
};

/** Looks a line up by id, so a scene can sync an image to the voice. */
export const lineIF = (id: string): NarrationLineIF => {
	const hit = NARRATION_IF.lines.find((l) => l.id === id);
	if (!hit) throw new Error(`narration line not found: ${id}`);
	return hit;
};

/** Absolute frame where the last word of the film is spoken. */
export const LAST_WORD_IF = NARRATION_IF.lines.reduce(
	(acc, l) => Math.max(acc, l.frame + l.durationInFrames),
	0,
);
