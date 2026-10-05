import {lineIF} from "./narration-if";
import {SCENE_STARTS_IF} from "./timeline-if";

/**
 * A spoken line expressed in the LOCAL frame space of one scene, so a scene
 * can say "hit this when he says the word" instead of carrying a hardcoded
 * frame that rots the moment the narration is remeasured.
 */
export type CueIF = {
	id: string;
	/** Local frame where the voice starts. */
	start: number;
	/** Local frame where the voice stops. */
	end: number;
	length: number;
	/** Local frame at `t` (0 = first word, 1 = last word). */
	at: (t: number) => number;
	text: string;
};

/** Builds a cue reader bound to one scene index. */
export const cueForIF = (sceneIndex: number) => {
	return (id: string): CueIF => {
		const l = lineIF(id);
		const start = l.frame - SCENE_STARTS_IF[sceneIndex];
		const end = start + l.durationInFrames;
		return {
			id,
			start,
			end,
			length: l.durationInFrames,
			at: (t: number) => start + l.durationInFrames * t,
			text: l.text,
		};
	};
};
