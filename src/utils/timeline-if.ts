import {LAST_WORD_IF, lineIF} from "./narration-if";

export const FPS_IF = 30;

/**
 * Where each scene starts, in absolute frames.
 *
 * These are not taste: the voice was recorded first and measured, so every cut
 * is pinned to the frame where the next line begins. The array is derived from
 * the narration JSON — the first line of each scene — so remeasuring the audio
 * re-times the edit instead of breaking it.
 */
const FIRST_LINE_OF_SCENE = [
	"01-gancho", //         1 HOOK
	"02-2011", //           2 THE BEGINNING
	"03-mudando", //        3 THE SHIFT
	"04-2012", //           4 SITE + APPS
	"05-2013", //           5 INVESTMENT
	"06-desafio", //        6 THE CHALLENGE
	"07-2018", //           7 THE TURN
	"08-transformacao", //  8 TRANSFORMATION
	"09-final-a", //        9 CLOSE
] as const;

/**
 * Scene 1 opens on black a beat before the first word, so the film does not
 * start mid-sentence.
 */
const HEAD_IF = 12;

/** Frames held after the last word, for the close to breathe and fade. */
const TAIL_IF = 53;

export const SCENE_STARTS_IF: number[] = FIRST_LINE_OF_SCENE.map((id, i) =>
	i === 0 ? lineIF(id).frame - HEAD_IF : lineIF(id).frame,
);

/** Frames a scene runs past the start of the next one, for the dissolve. */
export const OVERLAP_IF = 10;

/** Absolute frame the film ends on. Derived, never typed in. */
export const END_IF = LAST_WORD_IF + TAIL_IF;

/** How long scene `i` stays mounted, overlap included. */
export const sceneDurationIF = (i: number): number => {
	const next = i + 1 < SCENE_STARTS_IF.length ? SCENE_STARTS_IF[i + 1] + OVERLAP_IF : END_IF;
	return next - SCENE_STARTS_IF[i];
};
