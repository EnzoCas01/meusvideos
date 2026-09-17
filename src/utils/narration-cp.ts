import data from "../narration-comece-pequeno.json";

export type NarrationLine = {
	id: string;
	frame: number;
	text: string;
	/** Measured when the audio is generated; see tools/generate-narration.py. */
	durationInFrames: number;
};

/**
 * Narration for "Comece Pequeno". Kept separate from the LifePhases narration
 * on purpose: two films, two scripts, two clip folders — but the SAME cloned
 * voice, so the project sounds like one narrator.
 */
export const NARRATION_CP = data as {
	/** Flipped to true by the generator once the clips exist on disk. */
	enabled: boolean;
	voice: string;
	language: string;
	volume: number;
	/** How far the score drops while a line is being spoken. */
	duckMusicTo: number;
	note: string;
	lines: NarrationLine[];
};

/** Where the generated clips live, relative to public/. */
export const VO_DIR = "audio/vo-comece-pequeno";

/** Extra frames of fade on either side of a spoken line, for the music duck. */
const DUCK_FADE = 10;

/**
 * Multiplier for the score at a given frame: 1 in the clear, `duckMusicTo`
 * under a spoken line, ramped so the dip is never audible as a jump.
 */
export const musicDuckCP = (frame: number): number => {
	if (!NARRATION_CP.enabled) return 1;
	let lowest = 1;
	for (const line of NARRATION_CP.lines) {
		const start = line.frame - DUCK_FADE;
		const end = line.frame + line.durationInFrames + DUCK_FADE;
		if (frame < start || frame > end) continue;
		const intoStart = Math.min(1, (frame - start) / DUCK_FADE);
		const toEnd = Math.min(1, (end - frame) / DUCK_FADE);
		const depth = Math.min(intoStart, toEnd);
		lowest = Math.min(lowest, 1 - (1 - NARRATION_CP.duckMusicTo) * depth);
	}
	return lowest;
};

/** Looks a line up by id, so a scene can sync text to the voice. */
export const line = (id: string): NarrationLine => {
	const hit = NARRATION_CP.lines.find((l) => l.id === id);
	if (!hit) throw new Error(`narration line not found: ${id}`);
	return hit;
};
