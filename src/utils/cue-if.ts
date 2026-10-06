import {SCENE_STARTS_IF} from "../Ifood";
import {lineIF} from "./narration-if";

/**
 * A spoken line of "iFood — a virada", expressed in the LOCAL frame space of
 * one scene.
 *
 * Every on-screen beat that has to agree with the voice derives from this
 * instead of carrying a literal frame number: the narration for this film has
 * NOT been synthesised yet, so every `durationInFrames` in the JSON is an
 * estimate and every `frame` will move once the director repositions the lines.
 * Derived beats re-sync for free; hardcoded ones would all have to be rebuilt.
 */
export type CueIF = {
	id: string;
	/** Local frame where the voice starts. */
	start: number;
	/** Local frame where the voice stops. */
	end: number;
	/** Length of the spoken clip, in frames. */
	length: number;
	/** Local frame at `t` (0 = start of the line, 1 = end of it). */
	at: (t: number) => number;
	text: string;
};

/**
 * Builds a cue reader bound to one scene index.
 *
 * Deliberately a factory returning a function: `SCENE_STARTS_IF` lives in
 * Ifood.tsx, which imports the scenes, which import this module — an ESM cycle.
 * Reading the array inside the returned closure means it is only touched at
 * render time, after every module has finished initialising. Reading it at
 * module top level would hit the temporal dead zone and crash the render.
 */
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
