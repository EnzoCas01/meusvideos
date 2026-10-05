import {LAST_WORD_DF, NARRATION_DF, lineDF} from "./narration-df";

export const FPS_DF = 30;

/** The first spoken line of each scene, in story order (scene 7 has no line: it is the hold). */
const SCENE_LINES_DF = [
	"01-gancho", // 1 — the hook + a glimpse of what came after
	"03-oswald", // 2 — 1927, Oswald, the hit
	"05-negociar", // 3 — the contract, the owner, Oswald carried out
	"07-recomeco", // 4 — start over (dawn)
	"08-necessidade", // 5 — the need + Mickey is born
	"10-perdeu", // 6 — lost one, created another, Steamboat Willie
] as const;

/** Scenes change during the pause before their first line, not on the word. */
const LEAD_DF = 6;

/** Frames a scene stays mounted past the start of the next one, for the dissolve. */
export const OVERLAP_DF = 10;

/**
 * Scene i starts a few frames before its first line is spoken (scene 1 opens on
 * frame 0, already on the picture; the last scene starts when the voice stops).
 * Derived from the narration JSON, so a remeasure re-times the film.
 */
export const SCENE_STARTS_DF: number[] = SCENE_LINES_DF.map((id, i) =>
	i === 0 ? 0 : lineDF(id).frame - LEAD_DF,
);
SCENE_STARTS_DF.push(LAST_WORD_DF);

/** Frames held after the last word — from the JSON, never typed in. */
export const TAIL_DF = NARRATION_DF.tailFrames;

/** Absolute frame the film ends on. Derived, never typed in. */
export const END_DF = LAST_WORD_DF + TAIL_DF;

/** How long scene `i` stays mounted, overlap included. */
export const sceneDurationDF = (i: number): number => {
	const next = i + 1 < SCENE_STARTS_DF.length ? SCENE_STARTS_DF[i + 1] + OVERLAP_DF : END_DF;
	return next - SCENE_STARTS_DF[i];
};
