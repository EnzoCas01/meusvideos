import {NarrationLineCC, lineCC} from "./narration-cc";
import {SCENE_STARTS_CC} from "./timeline-cc";

const bare = (w: string): string => w.toLowerCase().replace(/[.,:;!?¡¿"“”'’()]/g, "");

/** How to point at one spoken word: index, the word itself, or a regex over it. */
export type WordMatchCC = number | string | RegExp;

const indexOfWord = (l: NarrationLineCC, m: WordMatchCC): number => {
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
export type CueCC = {
	id: string;
	/** Local frame where the voice starts. */
	start: number;
	/** Local frame where the voice stops. */
	end: number;
	length: number;
	/** Local frame at `t` (0 = first word, 1 = last word). */
	at: (t: number) => number;
	/** Local frame the word begins — impact text enters exactly here. */
	wordStart: (m: WordMatchCC) => number;
	/** Local frame the word stops being spoken. */
	wordEnd: (m: WordMatchCC) => number;
	text: string;
};

/** Builds a cue reader bound to one scene index (closure: no import-cycle trap). */
export const cueForCC = (sceneIndex: number) => {
	return (id: string): CueCC => {
		const l = lineCC(id);
		const base = SCENE_STARTS_CC[sceneIndex];
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
