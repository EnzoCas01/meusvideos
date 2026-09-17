import React from "react";
import {interpolate, useCurrentFrame, Easing} from "remotion";
import {seededRandom} from "../utils/bezier";
import {COLORS} from "../utils/theme";

type Props = {
	seed: number;
	areaWidth: number;
	areaHeight: number;
	delay?: number;
	durationInFrames?: number;
	color?: string;
	maxRadius?: number;
};

/**
 * A single discreet drifting particle of light, used in small groups to
 * suggest depth and atmosphere without becoming visual noise.
 */
export const Particle: React.FC<Props> = ({
	seed,
	areaWidth,
	areaHeight,
	delay = 0,
	durationInFrames = 200,
	color = COLORS.white,
	maxRadius = 2.4,
}) => {
	const frame = useCurrentFrame();
	const local = frame - delay;

	const baseX = seededRandom(seed) * areaWidth;
	const baseY = seededRandom(seed + 100) * areaHeight;
	const drift = 30 + seededRandom(seed + 200) * 40;
	const dirX = seededRandom(seed + 300) - 0.5;
	const dirY = seededRandom(seed + 400) - 0.5;
	const radius = 0.6 + seededRandom(seed + 500) * maxRadius;
	const speedPhase = seededRandom(seed + 600) * Math.PI * 2;

	const progress = interpolate(local, [0, durationInFrames], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.inOut(Easing.sin),
	});

	const fade = interpolate(
		local,
		[0, durationInFrames * 0.2, durationInFrames * 0.8, durationInFrames],
		[0, 1, 1, 0],
		{extrapolateLeft: "clamp", extrapolateRight: "clamp"},
	);

	const wobble = Math.sin(local * 0.02 + speedPhase) * 6;
	const x = baseX + dirX * drift * progress + wobble;
	const y = baseY + dirY * drift * progress;

	return (
		<circle
			cx={x}
			cy={y}
			r={radius}
			fill={color}
			opacity={fade * 0.55}
		/>
	);
};
