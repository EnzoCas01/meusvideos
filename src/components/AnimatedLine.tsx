import React from "react";
import {interpolate, useCurrentFrame, Easing} from "remotion";
import {sampleBezier, pointsToPathD, type Point} from "../utils/bezier";
import {COLORS} from "../utils/theme";

type Props = {
	p0: Point;
	p1: Point;
	p2: Point;
	p3: Point;
	delay?: number;
	durationInFrames?: number;
	color?: string;
	strokeWidth?: number;
	opacity?: number;
	glow?: boolean;
};

/**
 * Draws a bezier trajectory progressively, like a pen tracing a path.
 */
export const AnimatedLine: React.FC<Props> = ({
	p0,
	p1,
	p2,
	p3,
	delay = 0,
	durationInFrames = 60,
	color = COLORS.line,
	strokeWidth = 2,
	opacity = 1,
	glow = false,
}) => {
	const frame = useCurrentFrame();
	const local = frame - delay;
	const progress = interpolate(local, [0, durationInFrames], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.out(Easing.cubic),
	});

	if (progress <= 0) return null;

	const points = sampleBezier(p0, p1, p2, p3, progress, 100);
	const d = pointsToPathD(points);

	return (
		<path
			d={d}
			fill="none"
			stroke={color}
			strokeWidth={strokeWidth}
			strokeLinecap="round"
			opacity={opacity}
			style={glow ? {filter: `drop-shadow(0 0 6px ${color})`} : undefined}
		/>
	);
};
