import React from "react";
import {useCurrentFrame} from "remotion";
import {AM, FONT_AM} from "../../utils/theme-am";
import {land, ramp} from "./motion-am";

/**
 * Big on-screen words. Width rule (memória): Inter 800 is ~0.6em per
 * character — keep chars * size * 0.6 under ~940px, or break the line.
 *
 * `at` is the local frame the words land on (usually a cue word). `mode`
 * varies the motion so not every text simply fades: rise+blur, spring pop,
 * or a left-to-right mask reveal.
 */
export const TextAM: React.FC<{
	children: React.ReactNode;
	at: number;
	y: number;
	size?: number;
	color?: string;
	weight?: number;
	mode?: "rise" | "pop" | "reveal";
	/** Local frame where it leaves (fast fade + lift). */
	until?: number;
	align?: "center" | "left";
	x?: number;
	width?: number;
	lineHeight?: number;
	letterSpacing?: number;
}> = ({
	children,
	at,
	y,
	size = 76,
	color = AM.white,
	weight = 800,
	mode = "rise",
	until,
	align = "center",
	x = 70,
	width = 940,
	lineHeight = 1.08,
	letterSpacing = -1.5,
}) => {
	const frame = useCurrentFrame();
	if (frame < at - 1) return null;
	const p = ramp(frame, at, 10);
	const s = land(frame, at, 12);
	const out = until === undefined ? 0 : ramp(frame, until, 6);
	if (out >= 1) return null;

	let transform = "";
	let filter: string | undefined;
	let clipPath: string | undefined;
	let opacity = p * (1 - out);
	if (mode === "rise") {
		transform = `translateY(${(1 - p) * 40 - out * 30}px)`;
		filter = p < 1 ? `blur(${(1 - p) * 10}px)` : undefined;
	}
	if (mode === "pop") {
		transform = `scale(${0.6 + 0.4 * s})`;
		opacity = Math.min(1, s * 1.5) * (1 - out);
	}
	if (mode === "reveal") {
		clipPath = `inset(-20% ${(1 - p) * 100}% -20% 0)`;
		opacity = 1 - out;
	}

	return (
		<div
			style={{
				position: "absolute",
				left: x,
				top: y,
				width,
				textAlign: align,
				fontFamily: FONT_AM,
				fontWeight: weight,
				fontSize: size,
				lineHeight,
				letterSpacing,
				color,
				opacity,
				transform,
				transformOrigin: align === "center" ? "50% 50%" : "0% 50%",
				filter,
				clipPath,
				textShadow: "0 4px 30px rgba(0,0,0,0.55)",
			}}
		>
			{children}
		</div>
	);
};

/** Small uppercase label, e.g. "aviso automático". */
export const LabelAM: React.FC<{
	children: React.ReactNode;
	at: number;
	x: number;
	y: number;
	color?: string;
	until?: number;
	size?: number;
}> = ({children, at, x, y, color = AM.yellow, until, size = 34}) => {
	const frame = useCurrentFrame();
	const p = ramp(frame, at, 8);
	const out = until === undefined ? 0 : ramp(frame, until, 6);
	if (frame < at || out >= 1) return null;
	return (
		<div
			style={{
				position: "absolute",
				left: x,
				top: y,
				transform: `translateX(-50%) translateY(${(1 - p) * 16}px)`,
				opacity: p * (1 - out),
				fontFamily: FONT_AM,
				fontWeight: 700,
				fontSize: size,
				letterSpacing: 3,
				textTransform: "uppercase",
				color,
				whiteSpace: "nowrap",
				padding: "10px 22px",
				borderRadius: 999,
				border: `2px solid ${color}`,
				background: "rgba(12,13,16,0.75)",
			}}
		>
			{children}
		</div>
	);
};
