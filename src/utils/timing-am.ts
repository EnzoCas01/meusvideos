import raw from "../narration-alvomanage.json";
import {TRANSITION_AM} from "./theme-am";

export const FPS_AM = 30;

/**
 * Timing of "AlvoManage", derived from src/narration-alvomanage.json.
 *
 * The JSON is written by the `narracao` agent. Until the voice is generated its
 * `frame` / `durationInFrames` are null; every line then falls back to the
 * estimate from docs/alvomanage-roteiro.md (2.7 words/s). Once the voice is
 * measured, scene lengths, scene starts and every on-screen beat re-time
 * themselves — no scene carries a literal frame number.
 *
 * Deliberately free of scene imports: scenes and AlvoManage.tsx both read this
 * module, so there is no ESM cycle (the trap documented for cue-cp / cue-if).
 */

type RawLine = {
	id: string;
	file?: string;
	text: string;
	alt?: string;
	useAlt?: boolean;
	frame?: number | null;
	durationInFrames?: number | null;
	duration_s?: number | null;
};

type RawNarration = {
	enabled?: boolean;
	dir?: string;
	volume?: number;
	duckMusicTo?: number;
	lines: RawLine[];
};

const DATA = raw as unknown as RawNarration;

/** Estimated seconds per line (roteiro, section 1). Used only while unmeasured. */
const ESTIMATE_S: Record<string, number> = {
	am01: 7.4,
	am02: 5.9,
	am03: 6.3,
	am04: 7.8,
	am05: 7.8,
	am06: 7.0,
	am07: 2.2,
	am08: 4.8,
	am09: 8.1,
	am10: 5.6,
	am11: 4.4,
	am12: 4.1,
	am13: 3.7,
};

/** Air before the line inside its scene, in frames. am07 has the planned 0.6 s pause. */
const LEAD: Record<string, number> = {am01: 6, am07: 18};
/**
 * Air after the line (only used while the voice is unmeasured, except am13).
 * Rule "nunca sem SOM": pauses are allowed if score/effects cover them; the
 * logo holds ~1 s after the last word while the chord rings.
 */
const TAIL: Record<string, number> = {am07: 10, am13: 30};
const DEFAULT_LEAD = 5;
const DEFAULT_TAIL = 8;

export type LineAM = {
	id: string;
	/** Text actually spoken (am04 honours `useAlt`). */
	text: string;
	file: string;
	durationInFrames: number;
	/** Global frame where the voice starts. */
	frame: number;
	/** True once the clip has been measured (not an estimate). */
	measured: boolean;
	useAlt: boolean;
};

const ORDER = [
	"am01", "am02", "am03", "am04", "am05", "am06", "am07",
	"am08", "am09", "am10", "am11", "am12", "am13",
] as const;

const rawById = (id: string): RawLine | undefined => DATA.lines.find((l) => l.id === id);

const lineLength = (id: string): number => {
	const r = rawById(id);
	if (r && typeof r.durationInFrames === "number" && r.durationInFrames > 0) return r.durationInFrames;
	if (r && typeof r.duration_s === "number" && r.duration_s > 0) return Math.round(r.duration_s * FPS_AM);
	return Math.round((ESTIMATE_S[id] ?? 4) * FPS_AM);
};

/** Frames the incoming scene overlaps the outgoing one (the transition). */
export const OVERLAP_AM = TRANSITION_AM;

/**
 * Global frame where each line starts. Measured frames from the JSON win;
 * while they are null, lines are laid end to end with the planned air
 * (lead + line + tail per scene, minus the transition overlap).
 */
const LINE_FRAMES: number[] = (() => {
	const out: number[] = [];
	let sceneStart = 0;
	ORDER.forEach((id, i) => {
		const r = rawById(id);
		if (i > 0) {
			const prev = ORDER[i - 1];
			sceneStart += (LEAD[prev] ?? DEFAULT_LEAD) + lineLength(prev) + (TAIL[prev] ?? DEFAULT_TAIL) - OVERLAP_AM;
		}
		out.push(r && typeof r.frame === "number" ? r.frame : sceneStart + (LEAD[id] ?? DEFAULT_LEAD));
	});
	return out;
})();

/**
 * Scene i starts `LEAD` frames before its line — but never before the previous
 * line has finished, so every scene fully covers its own line and the cut
 * lands in the breath between two lines. Scene i lasts until the next scene
 * has finished its entry transition; the last one holds TAIL after the voice.
 */
export const SCENE_STARTS_AM: number[] = ORDER.map((id, i) => {
	if (i === 0) return 0;
	const prevEnd = LINE_FRAMES[i - 1] + lineLength(ORDER[i - 1]);
	return Math.min(LINE_FRAMES[i], Math.max(prevEnd, LINE_FRAMES[i] - (LEAD[id] ?? DEFAULT_LEAD)));
});

export const SCENE_DURATIONS_AM: number[] = ORDER.map((id, i) =>
	i < ORDER.length - 1
		? SCENE_STARTS_AM[i + 1] + OVERLAP_AM - SCENE_STARTS_AM[i]
		: LINE_FRAMES[i] + lineLength(id) + (TAIL[id] ?? DEFAULT_TAIL) - SCENE_STARTS_AM[i],
);

export const TOTAL_FRAMES_AM =
	SCENE_STARTS_AM[ORDER.length - 1] + SCENE_DURATIONS_AM[ORDER.length - 1];

export const LINES_AM: LineAM[] = ORDER.map((id, i) => {
	const r = rawById(id);
	const useAlt = Boolean(r?.useAlt && r?.alt);
	return {
		id,
		text: (useAlt ? r?.alt : r?.text) ?? "",
		file: r?.file ?? `${id}.mp3`,
		durationInFrames: lineLength(id),
		frame: LINE_FRAMES[i],
		measured: Boolean(r && typeof r.durationInFrames === "number" && typeof r.frame === "number"),
		useAlt,
	};
});

export const NARRATION_AM = {
	/**
	 * Clips mount when the JSON says `enabled`, or as soon as every line has a
	 * measured frame + duration (the mp3s exist once those are written).
	 */
	enabled: DATA.enabled === true || LINES_AM.every((l) => l.measured),
	/** Relative to public/, ready for staticFile(). */
	dir: (DATA.dir ?? "public/audio/vo-alvomanage").replace(/^public\//, ""),
	volume: DATA.volume ?? 1,
	duckMusicTo: DATA.duckMusicTo ?? 0.3,
};

export const lineAM = (id: string): LineAM => {
	const hit = LINES_AM.find((l) => l.id === id);
	if (!hit) throw new Error(`narration line not found: ${id}`);
	return hit;
};

/** True when the spoken line is the alternative text (am04: "a hora que quiser"). */
export const usesAltAM = (id: string): boolean => lineAM(id).useAlt;

export type CueAM = {
	id: string;
	/** Local (scene) frame where the voice starts / stops. */
	start: number;
	end: number;
	length: number;
	text: string;
	/** Local frame at fraction t of the line (0 = first syllable, 1 = last). */
	at: (t: number) => number;
	/**
	 * Local frame where a word/phrase of the line is spoken, estimated by its
	 * character position (punctuation counted as a little extra time). Lets a
	 * scene say `c.word("trincada")` instead of a number; re-syncs when the
	 * voice is re-measured. Falls back to `fallbackT` if the phrase is absent.
	 */
	word: (phrase: string, fallbackT?: number) => number;
};

/** Weighted length: commas/periods/ellipses take extra time in speech. */
const weight = (s: string): number => {
	let w = 0;
	for (const ch of s) {
		if (ch === "," || ch === ":") w += 4;
		else if (ch === "." || ch === "?" || ch === "!") w += 7;
		else w += 1;
	}
	return w;
};

/** Cue for a line, in the local frame space of scene `sceneIndex` (0-based). */
export const cueAM = (sceneIndex: number, id: string): CueAM => {
	const l = lineAM(id);
	const start = l.frame - SCENE_STARTS_AM[sceneIndex];
	const total = Math.max(1, weight(l.text));
	const at = (t: number) => start + l.durationInFrames * t;
	return {
		id,
		start,
		end: start + l.durationInFrames,
		length: l.durationInFrames,
		text: l.text,
		at,
		word: (phrase, fallbackT = 0.5) => {
			const idx = l.text.toLowerCase().indexOf(phrase.toLowerCase());
			if (idx < 0) return Math.round(at(fallbackT));
			return Math.round(at(weight(l.text.slice(0, idx)) / total));
		},
	};
};

/** Global frame of a word in a line — for sound cues (audio-am.ts). */
export const globalWordAM = (sceneIndex: number, id: string, phrase: string): number =>
	SCENE_STARTS_AM[sceneIndex] + cueAM(sceneIndex, id).word(phrase);
