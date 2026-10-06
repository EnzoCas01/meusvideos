import data from "../narration-ifood.json";

export type NarrationLineIF = {
	id: string;
	frame: number;
	text: string;
	/** Measured when the audio is generated; see tools/generate-narration.py. */
	durationInFrames: number;
	/** Lines sharing a `grupo` are synthesised in ONE model call, then sliced. */
	grupo?: string;
};

/**
 * Narration for "iFood — a virada". Third script in the project, but the SAME
 * cloned voice reference as the other two films: one narrator across the whole
 * project, never an `instruct`-only generation (that invents a new timbre per
 * call).
 */
export const NARRATION_IF = data as {
	/** Flipped to true by the generator once the clips exist on disk. */
	enabled: boolean;
	voice: string;
	language: string;
	speed: number;
	referenceText: string;
	volume: number;
	/** How far the score drops while a line is being spoken. */
	duckMusicTo: number;
	note: string;
	lines: NarrationLineIF[];
};

/** Where the generated clips live, relative to public/. */
export const VO_DIR_IF = "audio/vo-ifood";

/** Extra frames of fade on either side of a spoken line, for the music duck. */
const DUCK_FADE = 8;

/**
 * Multiplier for the score at a given frame: 1 in the clear, `duckMusicTo`
 * under a spoken line, ramped so the dip is never audible as a jump.
 * The brief is explicit that the score always sits below the voice.
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

/** Looks a line up by id, so a scene can sync text to the voice. */
export const lineIF = (id: string): NarrationLineIF => {
	const hit = NARRATION_IF.lines.find((l) => l.id === id);
	if (!hit) throw new Error(`narration line not found: ${id}`);
	return hit;
};

/** True when the clip for a line has been generated and measured. */
export const hasLineIF = (id: string): boolean =>
	NARRATION_IF.enabled && NARRATION_IF.lines.some((l) => l.id === id);
