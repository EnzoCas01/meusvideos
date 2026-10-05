import {NARRATION_NF} from "./narration-nf";

export type CaptionChunkNF = {
	words: string[];
	/** Absolute frame the chunk appears on. */
	from: number;
	durationInFrames: number;
};

/** Words that carry the story and take the accent (one word in a chunk at most reads as emphasis). */
const KEYWORDS = new Set(
	[
		"dvds",
		"correio",
		"vermelhos",
		"regras",
		"assinatura",
		"milhão",
		"internet",
		"streaming",
		"séries",
		"mundo",
		"reinventar",
	].map((w) => w.toLowerCase()),
);

const bare = (word: string): string => word.toLowerCase().replace(/[.,:?!"“”]/g, "");

export const isKeywordNF = (word: string): boolean => KEYWORDS.has(bare(word));

const CHUNK_MIN = 3;
const CHUNK_MAX = 5;

const chunkWords = (text: string): string[][] => {
	const words = text.split(/\s+/).filter(Boolean);
	const chunks: string[][] = [];
	let current: string[] = [];
	for (const word of words) {
		current.push(word);
		const breaks = /[,.:;?!]$/.test(word);
		if ((breaks && current.length >= CHUNK_MIN) || current.length >= CHUNK_MAX) {
			chunks.push(current);
			current = [];
		}
	}
	if (current.length > 0) {
		if (current.length === 1 && chunks.length > 0 && chunks[chunks.length - 1].length < CHUNK_MAX) {
			chunks[chunks.length - 1].push(current[0]);
		} else {
			chunks.push(current);
		}
	}
	return chunks;
};

/** Every caption of the film, spread over each measured line in proportion to its text. */
export const CAPTIONS_NF: CaptionChunkNF[] = NARRATION_NF.lines.flatMap((l) => {
	const chunks = chunkWords(l.text);
	const weights = chunks.map((c) => c.join(" ").length);
	const total = weights.reduce((a, b) => a + b, 0) || 1;
	let cursor = l.frame;
	return chunks.map((words, i) => {
		const isLast = i === chunks.length - 1;
		const span = isLast
			? l.frame + l.durationInFrames - cursor
			: Math.round((weights[i] / total) * l.durationInFrames);
		const chunk: CaptionChunkNF = {words, from: cursor, durationInFrames: Math.max(8, span)};
		cursor += span;
		return chunk;
	});
});
