import {LAST_WORD_AT, NARRATION_AT, lineAT as line} from "./narration-at";
export const FPS_AT = 30;

/** First spoken line of each scene, in film order. */
const SCENE_LINES_AT = [
	"01-gancho",
	"02-dario",
	"04-saida",
	"06-startup",
	"08-claude",
	"09-183",
	"11-final",
] as const;

/** Scenes change during the pause before their first line, not on the word. */
const LEAD_AT = 6;

/** Frames a scene stays mounted past the start of the next one, for the dissolve. */
export const OVERLAP_AT = 10;

/** Scene i starts just before its first line (scene 1 opens on frame 0). Derived from the narration JSON. */
export const SCENE_STARTS_AT: number[] = SCENE_LINES_AT.map((id, i) => (i === 0 ? 0 : line(id).frame - LEAD_AT));

/** Absolute frame the film ends on: last word plus the JSON tail. */
export const END_AT = LAST_WORD_AT + NARRATION_AT.tailFrames;

/** How long scene `i` stays mounted, overlap included. */
export const sceneDurationAT = (i: number): number => {
	const next = i + 1 < SCENE_STARTS_AT.length ? SCENE_STARTS_AT[i + 1] + OVERLAP_AT : END_AT;
	return next - SCENE_STARTS_AT[i];
};
