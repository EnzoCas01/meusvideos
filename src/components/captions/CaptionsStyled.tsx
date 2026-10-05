import React from "react";
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from "remotion";

export type CaptionStyle = "rapido" | "karaoke" | "simples";

/** One narration line: `frame` is where the line starts; each word's s/e are frames relative to it. */
export type CaptionLine = {frame: number; words: {w: string; s: number; e: number}[]};

type Word = {w: string; from: number; to: number};
type Chunk = {words: Word[]; from: number; to: number; cut?: boolean};

const HOLD = 8;

/** Groups a line's words: break at punctuation once `min` is reached, never beyond `max`. */
const chunkLines = (lines: CaptionLine[], min: number, max: number): Chunk[] =>
	lines.flatMap((l) => {
		const words: Word[] = l.words.map((x) => ({w: x.w, from: l.frame + x.s, to: l.frame + x.e}));
		const out: Word[][] = [];
		let cur: Word[] = [];
		for (const w of words) {
			cur.push(w);
			if ((/[,.:;?!]$/.test(w.w) && cur.length >= min) || cur.length >= max) {
				out.push(cur);
				cur = [];
			}
		}
		if (cur.length) {
			if (cur.length === 1 && out.length && out[out.length - 1].length < max) out[out.length - 1].push(cur[0]);
			else out.push(cur);
		}
		return out.map((ws) => ({words: ws, from: ws[0].from, to: ws[ws.length - 1].to + HOLD}));
	})
		// the hold never delays the next chunk: it ends where the next one starts
		.map((c, i, all) => {
			const next = i + 1 < all.length ? Math.max(all[i + 1].from, c.from + 1) : Infinity;
			return next < c.to ? {...c, to: next, cut: true} : c;
		});

const clean = (w: string) => w.replace(/[.,:;]$/, "");

type Props = {
	style: CaptionStyle;
	lines: CaptionLine[];
	/** Highlight / brand color. */
	accent?: string;
	/** Text on the accent box. */
	onAccent?: string;
	text?: string;
	fontFamily?: string;
	/** Top of the caption box for the bottom styles (karaoke, simples). 1080x1920 frame. */
	top?: number;
	/** Where the "rapido" style sits: middle (default), lower third or upper third. */
	posicao?: "meio" | "baixo" | "alto";
};

const RAPIDO_CENTER_Y = {meio: 960, baixo: 1400, alto: 500} as const;

export const CaptionsStyled: React.FC<Props> = ({
	style,
	lines,
	accent = "#FFD23F",
	onAccent = "#111111",
	text = "#FFFFFF",
	fontFamily = "Inter, system-ui, sans-serif",
	top = 1420,
	posicao = "meio",
}) => {
	const frame = useCurrentFrame();
	const chunks = React.useMemo(
		() => (style === "rapido" ? chunkLines(lines, 1, 2) : chunkLines(lines, 3, 5)),
		[lines, style],
	);
	const chunk = chunks.find((c) => frame >= c.from && frame < c.to);
	if (!chunk) return null;
	const local = frame - chunk.from;

	if (style === "rapido") {
		// shrink so the longest word fits the 940px box (Inter 900 uppercase ≈ 0.75em per letter)
		const longest = Math.max(...chunk.words.map((w) => clean(w.w).length));
		const fit = Math.min(1, 940 / (longest * 0.75 * 150));
		const pop = interpolate(local, [0, 5], [fit < 1 ? 1.12 : 1.3, 1], {
			extrapolateRight: "clamp",
			easing: Easing.out(Easing.back(2)),
		});
		const alpha = interpolate(local, [0, 2], [0, 1], {extrapolateRight: "clamp"});
		return (
			<AbsoluteFill style={{pointerEvents: "none"}}>
				<div style={{position: "absolute", top: RAPIDO_CENTER_Y[posicao], left: 70, width: 940, transform: "translateY(-50%)", display: "flex", justifyContent: "center"}}>
				<div
					style={{
						display: "flex",
						flexWrap: "wrap",
						justifyContent: "center",
						gap: "0 26px",
						width: 940,
						fontFamily,
						fontWeight: 900,
						fontSize: Math.floor(150 * fit),
						lineHeight: 1.05,
						textTransform: "uppercase",
						textAlign: "center",
						color: text,
						opacity: alpha,
						transform: `scale(${pop})`,
						WebkitTextStroke: "10px #000",
						paintOrder: "stroke fill",
						textShadow: "0 8px 30px rgba(0,0,0,0.7)",
					}}
				>
					{chunk.words.map((w, i) => (
						<span key={i} style={{color: i === chunk.words.length - 1 ? accent : text}}>
							{clean(w.w)}
						</span>
					))}
				</div>
				</div>
			</AbsoluteFill>
		);
	}

	const arrive = interpolate(local, [0, 6], [0, 1], {
		extrapolateRight: "clamp",
		easing: Easing.out(Easing.cubic),
	});
	const leave = chunk.cut ? 1 : interpolate(frame, [chunk.to - 5, chunk.to], [1, 0], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	return (
		<AbsoluteFill style={{pointerEvents: "none"}}>
			<div
				style={{
					position: "absolute",
					top,
					left: 70,
					width: 940,
					display: "flex",
					flexWrap: "wrap",
					justifyContent: "center",
					gap: "6px 8px",
					fontFamily,
					fontWeight: style === "karaoke" ? 800 : 600,
					fontSize: style === "karaoke" ? 78 : 56,
					lineHeight: 1.15,
					textAlign: "center",
					color: text,
					opacity: Math.min(arrive, leave),
					transform: `translateY(${(1 - arrive) * 14}px)`,
					textShadow: "0 4px 24px rgba(0,0,0,0.9), 0 0 8px rgba(0,0,0,0.8)",
				}}
			>
				{chunk.words.map((w, i) => {
					const active = style === "karaoke" && frame >= w.from && frame < w.to;
					const pop = active
						? interpolate(frame - w.from, [0, 5], [1.18, 1], {
								extrapolateRight: "clamp",
								easing: Easing.out(Easing.cubic),
							})
						: 1;
					return (
						<span
							key={i}
							style={{
								display: "inline-block",
								// same box always, so the line never jitters when the highlight moves
								padding: "2px 14px",
								borderRadius: 14,
								color: active ? onAccent : text,
								background: active ? accent : "transparent",
								textShadow: active ? "none" : undefined,
								transform: `scale(${pop})`,
							}}
						>
							{w.w}
						</span>
					);
				})}
			</div>
		</AbsoluteFill>
	);
};
