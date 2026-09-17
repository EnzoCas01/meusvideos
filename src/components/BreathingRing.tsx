import React from "react";
import {interpolate, useCurrentFrame, Easing} from "remotion";
import {COLORS} from "../utils/theme";

type Props = {
	cx: number;
	cy: number;
	/** Radius at the bottom of the breath. */
	minR: number;
	/** Radius at the top of the breath. */
	maxR: number;
	delay?: number;
	/** Frames for one full in-and-out. 4 s in, 4 s out at 30 fps = 240. */
	cycleFrames?: number;
	fadeInFrames?: number;
};

/**
 * A ring that expands and contracts at the pace of a calm breath. It is the
 * only element on screen while the film says "tenha calma", and it quietly
 * gives the viewer something to breathe along with.
 */
export const BreathingRing: React.FC<Props> = ({
	cx,
	cy,
	minR,
	maxR,
	delay = 0,
	cycleFrames = 240,
	fadeInFrames = 40,
}) => {
	const frame = useCurrentFrame();
	const local = frame - delay;

	const appear = interpolate(local, [0, fadeInFrames], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.out(Easing.cubic),
	});

	// A cosine breath: slowest at the turns, like a real one.
	const t = (local / cycleFrames) * Math.PI * 2;
	const breath = (1 - Math.cos(t)) / 2;
	const r = minR + (maxR - minR) * breath;

	return (
		<g opacity={appear}>
			{/* The halo swells with the breath. */}
			<circle cx={cx} cy={cy} r={r} fill="none" stroke={COLORS.white} strokeWidth={1.2} opacity={0.28} />
			<circle
				cx={cx}
				cy={cy}
				r={r * 0.62}
				fill="none"
				stroke={COLORS.white}
				strokeWidth={0.9}
				opacity={0.13 + breath * 0.1}
			/>
			<circle
				cx={cx}
				cy={cy}
				r={r}
				fill="none"
				stroke={COLORS.accent}
				strokeWidth={0.9}
				opacity={0.1 + breath * 0.22}
				style={{filter: `drop-shadow(0 0 ${10 + breath * 24}px ${COLORS.accent})`}}
			/>
		</g>
	);
};
