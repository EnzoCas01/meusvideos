import {NarrationLineAT, lineAT} from "./narration-at";
import {SCENE_STARTS_AT} from "./timeline-at";

const bare = (w: string): string => w.toLowerCase().replace(/[.,:;!?¡¿"“”'’()]/g, "");

/** How to point at one spoken word: index, the word itself, or a regex over it. */
export type WordMatchAT = number | string | RegExp;

const indexOfWord = (l: NarrationLineAT, m: WordMatchAT): number => {
	const i =
		typeof m === "number"
			? m
			: m instanceof RegExp
				? l.words.findIndex((w) => m.test(bare(w.w)))
				: l.words.findIndex((w) => bare(w.w) === bare(m));
	if (i < 0 || i >= l.words.length) throw new Error(`word not found in ${l.id}: ${String(m)}`);
	return i;
};

/** A spoken line in the LOCAL frame space of one scene, with word-level timing. */
export type CueAT = {
	id: string;
	/** Local frame where the voice starts. */
	start: number;
	/** Local frame where the voice stops. */
	end: number;
	length: number;
	/** Local frame at `t` (0 = first word, 1 = last word). */
	at: (t: number) => number;
	/** Local frame the word begins — impact text enters exactly here. */
	wordStart: (m: WordMatchAT) => number;
	/** Local frame the word stops being spoken. */
	wordEnd: (m: WordMatchAT) => number;
	text: string;
};

/** Builds a cue reader bound to one scene index (closure: no import-cycle trap). */
export const cueForAT = (sceneIndex: number) => {
	return (id: string): CueAT => {
		const l = lineAT(id);
		const base = SCENE_STARTS_AT[sceneIndex];
		const start = l.frame - base;
		return {
			id,
			start,
			end: start + l.durationInFrames,
			length: l.durationInFrames,
			at: (t: number) => Math.round(start + l.durationInFrames * t),
			wordStart: (m) => l.frame + l.words[indexOfWord(l, m)].s - base,
			wordEnd: (m) => l.frame + l.words[indexOfWord(l, m)].e - base,
			text: l.text,
		};
	};
};
