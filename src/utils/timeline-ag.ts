import {LAST_WORD_AG, NARRATION_AG, lineAG as line} from "./narration-ag";
export const FPS_AG = 30;

/** First spoken line of each scene, in film order. */
const SCENE_LINES_AG = [
	"01-hook", // 1. the hook, over money in motion
	"02-calma", // 2. "calma" — the beat before the answer
	"03-time", // 3. the team appears as a diagram
	"04-diretor", // 4. the seven agents, one per line (04 through 10)
	"11-prompt", // 5. one prompt goes in
	"12-juntos", // 6. the machine works: everything at once
	"14-esse", // 7. "this video was made by them"
	"15-pensando", // 8. the ask: 100k views, follow and share
] as const;

/** Scenes change during the pause before their first line, not on the word. */
const LEAD_AG = 6;

/** Frames a scene stays mounted past the start of the next one, for the dissolve. */
export const OVERLAP_AG = 10;

/** Scene i starts just before its first line (scene 1 opens on frame 0). Derived from the narration JSON. */
export const SCENE_STARTS_AG: number[] = SCENE_LINES_AG.map((id, i) =>
	i === 0 ? 0 : line(id).frame - LEAD_AG,
);

/** Absolute frame the film ends on: last word plus the JSON tail. */
export const END_AG = LAST_WORD_AG + NARRATION_AG.tailFrames;

/** How long scene `i` stays mounted, overlap included. */
export const sceneDurationAG = (i: number): number => {
	const next = i + 1 < SCENE_STARTS_AG.length ? SCENE_STARTS_AG[i + 1] + OVERLAP_AG : END_AG;
	return next - SCENE_STARTS_AG[i];
};
