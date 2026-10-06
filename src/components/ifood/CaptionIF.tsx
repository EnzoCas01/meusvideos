import React from "react";
import {Easing, interpolate, useCurrentFrame} from "remotion";
import type {CueIF} from "../../utils/cue-if";
import {fontFamily} from "../../utils/font";
import {W} from "../../utils/layout";
import {IF} from "../../utils/theme-if";

type Props = {
	/** The spoken line, already in this scene's local frame space. */
	cue: CueIF;
	/** Words to lift in red. Compared case- and accent-insensitively. */
	emphasis?: string[];
	/** Distance from the bottom of the 1920 frame. Safe area starts around 150. */
	bottom?: number;
	fontSize?: number;
	/** Max characters per card. Four words / 24 chars keeps it off both edges. */
	maxChars?: number;
	maxWords?: number;
	/** Nudges the whole caption track earlier/later, in frames. */
	offset?: number;
	style?: React.CSSProperties;
};

type Card = {words: string[]; weight: number; from: number; to: number};

const normalise = (w: string): string =>
	w
		.toLowerCase()
		.normalize("NFD")
		.replace(/[̀-ͯ]/g, "")
		.replace(/[^a-z0-9]/g, "");

/**
 * Splits a spoken line into small cards and spreads them across the clip in
 * proportion to how long each card takes to say (character count is a decent
 * proxy). Pure and deterministic — same input, same cards, every render.
 */
const buildCards = (text: string, length: number, maxChars: number, maxWords: number): Card[] => {
	const words = text.split(/\s+/).filter(Boolean);
	const groups: string[][] = [];
	let cur: string[] = [];
	let chars = 0;
	for (const w of words) {
		if (cur.length > 0 && (chars + w.length + 1 > maxChars || cur.length >= maxWords)) {
			groups.push(cur);
			cur = [];
			chars = 0;
		}
		cur.push(w);
		chars += w.length + 1;
	}
	if (cur.length > 0) groups.push(cur);

	const weights = groups.map((g) => g.join(" ").length + 2);
	const total = weights.reduce((a, b) => a + b, 0) || 1;

	let acc = 0;
	return groups.map((g, i) => {
		const from = (acc / total) * length;
		acc += weights[i];
		const to = (acc / total) * length;
		return {words: g, weight: weights[i], from, to};
	});
};

/**
 * Narration subtitles for this film.
 *
 * The brief is explicit: synced to the voice, key words highlighted, NEVER a
 * big block. So this shows two to four words at a time, each card alive only
 * for the slice of the clip where those words are actually spoken, and each
 * word snapping up individually inside its card.
 *
 * Every frame comes from the cue, which comes from the narration JSON — nothing
 * here is a literal frame number, because the voice has not been synthesised
 * yet and all the timings will move.
 */
export const CaptionIF: React.FC<Props> = ({
	cue,
	emphasis = [],
	bottom = 232,
	fontSize = 58,
	maxChars = 24,
	maxWords = 4,
	offset = 0,
	style,
}) => {
	const frame = useCurrentFrame();
	const local = frame - cue.start - offset;

	const cards = buildCards(cue.text, Math.max(1, cue.length), maxChars, maxWords);
	const hot = new Set(emphasis.map(normalise));

	// Which card is speaking now. A short tail keeps the last card from
	// vanishing on the exact frame the voice stops.
	const TAIL = 10;
	if (local < -4 || local > cue.length + TAIL) return null;

	let index = -1;
	for (let i = 0; i < cards.length; i++) {
		const isLast = i === cards.length - 1;
		const end = isLast ? cards[i].to + TAIL : cards[i].to;
		if (local >= cards[i].from - (i === 0 ? 4 : 0) && local < end) {
			index = i;
			break;
		}
	}
	if (index < 0) return null;

	const card = cards[index];
	const into = local - card.from;
	const span = Math.max(1, card.to - card.from);

	const arrive = interpolate(into, [0, 7], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.out(Easing.cubic),
	});
	const isLast = index === cards.length - 1;
	const leave = interpolate(into, isLast ? [span, span + TAIL] : [span - 5, span], [1, 0], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});
	const alpha = Math.min(arrive, leave);
	if (alpha <= 0.002) return null;

	return (
		<div
			style={{
				position: "absolute",
				left: 0,
				bottom,
				width: W,
				display: "flex",
				justifyContent: "center",
				pointerEvents: "none",
				...style,
			}}
		>
			<div
				style={{
					display: "flex",
					flexWrap: "wrap",
					justifyContent: "center",
					gap: `0 ${Math.round(fontSize * 0.26)}px`,
					maxWidth: 940,
					padding: "0 70px",
					opacity: alpha,
				}}
			>
				{card.words.map((w, i) => {
					// Words inside a card snap up one after the other, fast: the caption
					// tracks the voice instead of arriving as a finished plate.
					const wordIn = interpolate(into, [i * 2.2, i * 2.2 + 6], [0, 1], {
						extrapolateLeft: "clamp",
						extrapolateRight: "clamp",
						easing: Easing.out(Easing.cubic),
					});
					const isHot = hot.has(normalise(w));
					return (
						<span
							key={`${index}-${i}`}
							style={{
								fontFamily,
								fontSize,
								fontWeight: isHot ? 600 : 400,
								letterSpacing: isHot ? 1.2 : 0.2,
								lineHeight: 1.22,
								color: isHot ? IF.white : IF.grey,
								textShadow: isHot
									? `0 0 34px rgba(234,29,44,0.55), 0 4px 26px rgba(0,0,0,0.9)`
									: "0 4px 26px rgba(0,0,0,0.9)",
								opacity: wordIn,
								transform: `translateY(${(1 - wordIn) * 16}px)`,
								display: "inline-block",
								whiteSpace: "nowrap",
							}}
						>
							{w}
						</span>
					);
				})}
			</div>
		</div>
	);
};
