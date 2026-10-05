import {lineNF} from "./narration-nf";
import {SCENE_STARTS_NF} from "./timeline-nf";

/** A spoken line in the LOCAL frame space of one scene. */
export type CueNF = {
	id: string;
	/** Local frame where the voice starts. */
	start: number;
	/** Local frame where the voice stops. */
	end: number;
	length: number;
	/** Local frame at `t` (0 = first word, 1 = last word). */
	at: (t: number) => number;
	/** Local frame where `phrase` (as spoken in the narration text) starts. Estimated by character position, not measured. */
	atText: (phrase: string) => number;
	text: string;
};

/** Builds a cue reader bound to one scene index (closure: no import-cycle trap). */
export const cueForNF = (sceneIndex: number) => {
	return (id: string): CueNF => {
		const l = lineNF(id);
		const start = l.frame - SCENE_STARTS_NF[sceneIndex];
		return {
			id,
			start,
			end: start + l.durationInFrames,
			length: l.durationInFrames,
			at: (t: number) => Math.round(start + l.durationInFrames * t),
			atText: (phrase: string) => {
				const i = l.text.indexOf(phrase);
				return Math.round(start + l.durationInFrames * (i < 0 ? 0 : i / l.text.length));
			},
			text: l.text,
		};
	};
};
