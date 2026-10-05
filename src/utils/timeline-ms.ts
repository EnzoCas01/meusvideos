import {LAST_WORD_MS, NARRATION_MS, lineMS as line} from "./narration-ms";
export const FPS_MS = 30;

/** First spoken line of each scene, in film order. */
const SCENE_LINES_MS = [
	"01-gancho",
	"02-1975",
	"05-primeiro",
	"06-virada",
	"08-1981",
	"09-final",
] as const;

/** Scenes change during the pause before their first line, not on the word. */
const LEAD_MS = 6;

/** Frames a scene stays mounted past the start of the next one, for the dissolve. */
export const OVERLAP_MS = 10;

/** Scene i starts just before its first line (scene 1 opens on frame 0). Derived from the narration JSON. */
export const SCENE_STARTS_MS: number[] = SCENE_LINES_MS.map((id, i) => (i === 0 ? 0 : line(id).frame - LEAD_MS));

/** Absolute frame the film ends on: last word plus the JSON tail. */
export const END_MS = LAST_WORD_MS + NARRATION_MS.tailFrames;

/** How long scene `i` stays mounted, overlap included. */
export const sceneDurationMS = (i: number): number => {
	const next = i + 1 < SCENE_STARTS_MS.length ? SCENE_STARTS_MS[i + 1] + OVERLAP_MS : END_MS;
	return next - SCENE_STARTS_MS[i];
};
