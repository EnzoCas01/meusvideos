import React from "react";
import {AbsoluteFill, interpolate, useCurrentFrame} from "remotion";
import {CP} from "../../utils/theme-cp";

type Props = {
	/** 0 = no violet at all, 1 = the full bloom. Scenes dial this with the story. */
	glow?: number;
	/** Where the bloom sits, in percent of the frame. */
	glowX?: number;
	glowY?: number;
	/** Slow breathing of the bloom, so the canvas is never dead. */
	breathe?: boolean;
};

/** The canvas every "Comece Pequeno" scene sits on. */
export const BackgroundCP: React.FC<Props> = ({
	glow = 0.5,
	glowX = 50,
	glowY = 46,
	breathe = true,
}) => {
	const frame = useCurrentFrame();
	const pulse = breathe ? 1 + Math.sin(frame * 0.017) * 0.12 : 1;
	const g = Math.max(0, glow) * pulse;

	return (
		<AbsoluteFill style={{backgroundColor: CP.background}}>
			<AbsoluteFill
				style={{
					background: `radial-gradient(ellipse 62% 40% at ${glowX}% ${glowY}%, rgba(139,61,255,${0.17 * g}) 0%, rgba(7,6,11,0) 68%)`,
				}}
			/>
			<AbsoluteFill
				style={{
					background: `radial-gradient(ellipse 90% 55% at 50% 100%, rgba(83,32,168,${0.1 * g}) 0%, rgba(7,6,11,0) 60%)`,
				}}
			/>
			<AbsoluteFill style={{boxShadow: "inset 0 0 260px 80px rgba(0,0,0,0.9)"}} />
		</AbsoluteFill>
	);
};

/**
 * A hairline that draws itself in and holds. Used as ground, baseline, and the
 * divider under the lesson list — never as decoration for its own sake.
 */
export const DrawLine: React.FC<{
	x1: number;
	y1: number;
	x2: number;
	y2: number;
	start: number;
	durationInFrames?: number;
	color?: string;
	strokeWidth?: number;
}> = ({x1, y1, x2, y2, start, durationInFrames = 40, color = CP.line, strokeWidth = 1.2}) => {
	const frame = useCurrentFrame();
	const p = interpolate(frame - start, [0, durationInFrames], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});
	if (p <= 0) return null;
	return (
		<line
			x1={x1}
			y1={y1}
			x2={x2}
			y2={y2}
			stroke={color}
			strokeWidth={strokeWidth}
			pathLength={1}
			strokeDasharray={1}
			strokeDashoffset={1 - p}
		/>
	);
};
