import data from "../narration.json";

export type NarrationLine = {
	id: string;
	frame: number;
	text: string;
	/** Measured when the audio is generated; see tools/generate-narration.mjs. */
	durationInFrames: number;
};

export const NARRATION = data as {
	/** Flipped to true by the generator once the clips exist in public/audio/vo. */
	enabled: boolean;
	voice: string;
	language: string;
	volume: number;
	/** How far the score drops while a line is being spoken. */
	duckMusicTo: number;
	note: string;
	lines: NarrationLine[];
};

/** Extra frames of fade on either side of a spoken line, for the music duck. */
const DUCK_FADE = 10;

/**
 * Multiplier for the score at a given frame: 1 in the clear, `duckMusicTo`
 * under a spoken line, ramped so the dip is never audible as a jump.
 */
export const musicDuck = (frame: number): number => {
	if (!NARRATION.enabled) return 1;
	let lowest = 1;
	for (const line of NARRATION.lines) {
		const start = line.frame - DUCK_FADE;
		const end = line.frame + line.durationInFrames + DUCK_FADE;
		if (frame < start || frame > end) continue;
		const intoStart = Math.min(1, (frame - start) / DUCK_FADE);
		const toEnd = Math.min(1, (end - frame) / DUCK_FADE);
		const depth = Math.min(intoStart, toEnd);
		lowest = Math.min(lowest, 1 - (1 - NARRATION.duckMusicTo) * depth);
	}
	return lowest;
};
