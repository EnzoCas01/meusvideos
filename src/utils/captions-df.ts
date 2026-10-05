import {NARRATION_DF} from "./narration-df";

export type CaptionWordDF = {w: string; key: boolean};

export type CaptionChunkDF = {
	words: CaptionWordDF[];
	/** Absolute frame the chunk appears on. */
	from: number;
	durationInFrames: number;
};

/** Words that carry the story and take the accent of the moment. */
const KEYWORDS = new Set(
	[
		"oswald",
		"coelho",
		"sortudo",
		"universal",
		"sucesso",
		"contrato",
		"dono",
		"distribuidor",
		"recomeçar",
		"mickey",
		"mouse",
		"iwerks",
		"steamboat",
		"willie",
		"perdeu",
		"perda",
		"criação",
	].map((w) => w.toLowerCase()),
);

const bare = (word: string): string => word.toLowerCase().replace(/[.,:?!"“”]/g, "");

export const isKeywordDF = (word: string): boolean => KEYWORDS.has(bare(word));

const CHUNK_MIN = 3;
const CHUNK_MAX = 5;
/** A chunk lingers a few frames past its last word, then the next one is already there. */
const HOLD_DF = 8;

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
export const CAPTIONS_DF: CaptionChunkDF[] = NARRATION_DF.lines.flatMap((l) => {
	const chunks = chunkIndices(l.words.length, l.words);
	return chunks.map((idx) => {
		const from = l.frame + l.words[idx[0]].s;
		const end = l.frame + l.words[idx[idx.length - 1]].e + HOLD_DF;
		return {
			from,
			durationInFrames: Math.max(10, end - from),
			words: idx.map((i) => ({w: l.words[i].w, key: isKeywordDF(l.words[i].w)})),
		};
	});
});
