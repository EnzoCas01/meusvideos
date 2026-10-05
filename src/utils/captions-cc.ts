import {NARRATION_CC} from "./narration-cc";

export type CaptionWordCC = {w: string; key: boolean};

export type CaptionChunkCC = {
	words: CaptionWordCC[];
	/** Absolute frame the chunk appears on. */
	from: number;
	durationInFrames: number;
};

/** Words that carry the story and take the accent of the moment. */
const KEYWORDS = new Set(
	[
		"coca-cola",
		"nove",
		"bilhões",
		"doses",
		"pemberton",
		"john",
		"atlanta",
		"farmácia",
		"anúncio",
		"cupons",
		"candler",
		"asa",
		"company",
		"identidade",
		"garrafa",
		"logotipo",
		"marcas",
	].map((w) => w.toLowerCase()),
);

const bare = (word: string): string => word.toLowerCase().replace(/[.,:?!"“”]/g, "");

export const isKeywordCC = (word: string): boolean => KEYWORDS.has(bare(word));

const CHUNK_MIN = 3;
const CHUNK_MAX = 5;
/** A chunk lingers a few frames past its last word, then the next one is already there. */
const HOLD_CC = 8;

/** Splits a line into caption-sized chunks at punctuation, keeping 3-6 words each. */
const chunkIndices = (count: number, words: {w: string}[]): number[][] => {
	const chunks: number[][] = [];
	let current: number[] = [];
	for (let i = 0; i < count; i++) {
		current.push(i);
		const breaks = /[,.:;?!]$/.test(words[i].w);
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

/**
 * Every caption of the film. Chunk boundaries are the MEASURED word times, so a
 * chunk appears when its first word is spoken and leaves after its last one.
 */
export const CAPTIONS_CC: CaptionChunkCC[] = NARRATION_CC.lines.flatMap((l) => {
	const chunks = chunkIndices(l.words.length, l.words);
	return chunks.map((idx) => {
		const from = l.frame + l.words[idx[0]].s;
		const end = l.frame + l.words[idx[idx.length - 1]].e + HOLD_CC;
		return {
			from,
			durationInFrames: Math.max(10, end - from),
			words: idx.map((i) => ({w: l.words[i].w, key: isKeywordCC(l.words[i].w)})),
		};
	});
});
