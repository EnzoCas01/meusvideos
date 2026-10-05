import {NARRATION_IF} from "./narration-if";

export type CaptionChunk = {
	words: string[];
	/** Absolute frame the chunk appears on. */
	from: number;
	/** How long it stays up. */
	durationInFrames: number;
};

/**
 * Words that carry the story and get the accent colour. Matched without
 * punctuation and case-insensitively, so "papel." and "Papel" both hit.
 * Everything else stays off-white: if half the line is highlighted, nothing is.
 */
const KEYWORDS = new Set(
	[
		"papel",
		"onze",
		"telefone",
		"doze",
		"movile",
		"porta",
		"dezoito",
		"digital",
		"entregadores",
		"virada",
	].map((w) => w.toLowerCase()),
);

const bare = (word: string): string =>
	word
		.toLowerCase()
		.replace(/[.,:?!"“”]/g, "")
		.replace(/\.\.\./g, "");

export const isKeywordIF = (word: string): boolean => KEYWORDS.has(bare(word));

/** Words per caption chunk. Four reads in a glance; five is the ceiling. */
const CHUNK_MIN = 3;
const CHUNK_MAX = 5;

/**
 * Splits a sentence into short chunks, preferring to break after a word that
 * ends in punctuation so a pause never lands in the middle of a chunk.
 */
const chunkWords = (text: string): string[][] => {
	const words = text.split(/\s+/).filter(Boolean);
	const chunks: string[][] = [];
	let current: string[] = [];

	for (const word of words) {
		current.push(word);
		const breaks = /[,.:;?!]$/.test(word) || word.endsWith("...");
		if ((breaks && current.length >= CHUNK_MIN) || current.length >= CHUNK_MAX) {
			chunks.push(current);
			current = [];
		}
	}
	if (current.length > 0) {
		// A one-word tail reads as a mistake: fold it back into the last chunk.
		if (current.length === 1 && chunks.length > 0 && chunks[chunks.length - 1].length < CHUNK_MAX) {
			chunks[chunks.length - 1].push(current[0]);
		} else {
			chunks.push(current);
		}
	}
	return chunks;
};

/**
 * Every caption of the film, laid out across the measured length of each
 * spoken line in proportion to how much text each chunk carries. It is not
 * word-level alignment — we have no phoneme timings — but it tracks the voice
 * closely enough to read as subtitles rather than as slides.
 */
export const CAPTIONS_IF: CaptionChunk[] = NARRATION_IF.lines.flatMap((l) => {
	const chunks = chunkWords(l.text);
	const weights = chunks.map((c) => c.join(" ").length);
	const total = weights.reduce((a, b) => a + b, 0) || 1;

	let cursor = l.frame;
	return chunks.map((words, i) => {
		const isLast = i === chunks.length - 1;
		const span = isLast
			? l.frame + l.durationInFrames - cursor
			: Math.round((weights[i] / total) * l.durationInFrames);
		const chunk: CaptionChunk = {words, from: cursor, durationInFrames: Math.max(8, span)};
		cursor += span;
		return chunk;
	});
});
