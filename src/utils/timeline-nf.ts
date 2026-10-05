import {LAST_WORD_NF, lineNF} from "./narration-nf";

export const FPS_NF = 30;

/** One spoken line = one scene, in film order. */
export const SCENE_LINES_NF = [
	"01-gancho",
	"02-comeco",
	"03-problema",
	"04-assinatura",
	"05-pergunta",
	"06-streaming",
	"07-originais",
	"08-mundo",
	"09-transformacao",
	"10-final",
] as const;

/**
 * Scene i starts on the frame its line is spoken (scene 1 opens at 0, already
 * on the picture). Derived from the narration JSON, so remeasuring re-times it.
 */
export const SCENE_STARTS_NF: number[] = SCENE_LINES_NF.map((id, i) => (i === 0 ? 0 : lineNF(id).frame));

/** Frames a scene runs past the start of the next one, for the dissolve. */
export const OVERLAP_NF = 10;

/** Frames held after the last word. */
const TAIL_NF = 60;

/** Absolute frame the film ends on. Derived, never typed in. */
export const END_NF = LAST_WORD_NF + TAIL_NF;

/** How long scene `i` stays mounted, overlap included. */
export const sceneDurationNF = (i: number): number => {
	const next = i + 1 < SCENE_STARTS_NF.length ? SCENE_STARTS_NF[i + 1] + OVERLAP_NF : END_NF;
	return next - SCENE_STARTS_NF[i];
};
