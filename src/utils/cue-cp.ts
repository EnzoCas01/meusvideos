import {SCENE_STARTS_CP} from "../ComecePequeno";
import {line} from "./narration-cp";

/**
 * A spoken line expressed in the LOCAL frame space of one scene.
 *
 * `start` / `end` are where the voice begins and stops inside that scene's
 * `<Sequence>`, so a component can say "appear when he says this" instead of
 * carrying a hardcoded frame that rots the moment the narration is remeasured.
 */
export type Cue = {
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
 * Deliberately a factory returning a function: `SCENE_STARTS_CP` lives in
 * ComecePequeno.tsx, which imports the scenes, which import this module — a
 * cycle. Reading the array inside the returned closure means it is only touched
 * at render time, long after every module has finished initialising. Reading it
 * at module top level here would hit the temporal dead zone and crash.
 */
export const cueFor = (sceneIndex: number) => {
	return (id: string): Cue => {
		const l = line(id);
		const start = l.frame - SCENE_STARTS_CP[sceneIndex];
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
