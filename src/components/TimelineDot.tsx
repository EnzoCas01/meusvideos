import React from "react";
import {interpolate, useCurrentFrame, Easing} from "remotion";
import {cubicBezier, type Point} from "../utils/bezier";
import {COLORS} from "../utils/theme";

type Props = {
	p0: Point;
	p1: Point;
	p2: Point;
	p3: Point;
	delay?: number;
	durationInFrames?: number;
	radius?: number;
	color?: string;
	glow?: boolean;
};

/**
 * A single point traveling along a bezier trajectory — the visual heartbeat
 * of the film, representing "your own pace".
 */
export const TimelineDot: React.FC<Props> = ({
	p0,
	p1,
	p2,
	p3,
	delay = 0,
	durationInFrames = 60,
	radius = 6,
	color = COLORS.white,
	glow = true,
}) => {
	const frame = useCurrentFrame();
	const local = frame - delay;
	const t = interpolate(local, [0, durationInFrames], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.inOut(Easing.cubic),
	});
	const appear = interpolate(local, [0, 12], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	const {x, y} = cubicBezier(t, p0, p1, p2, p3);

	return (
		<circle
			cx={x}
			cy={y}
			r={radius * appear}
			fill={color}
			opacity={appear}
			style={glow ? {filter: `drop-shadow(0 0 ${radius * 1.8}px ${color})`} : undefined}
		/>
	);
};
