import React from "react";
import {interpolate, useCurrentFrame, Easing} from "remotion";
import {COLORS} from "../utils/theme";
import {seededRandom} from "../utils/bezier";

type Props = {
	cx: number;
	cy: number;
	/** Half-height of the whole glass. */
	size: number;
	delay?: number;
	/** Frames for the sand to run from full to empty. */
	durationInFrames?: number;
	grainCount?: number;
};

/**
 * An hourglass drawn in light. Sand runs from the upper chamber through the
 * neck and piles below — time passing, which is the whole subject of the film.
 */
export const Hourglass: React.FC<Props> = ({
	cx,
	cy,
	size,
	delay = 0,
	durationInFrames = 170,
	grainCount = 26,
}) => {
	const frame = useCurrentFrame();
	const local = frame - delay;

	const w = size * 0.62; // half-width at the rim
	const neck = size * 0.045;

	const draw = interpolate(local, [0, 46], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.out(Easing.cubic),
	});

	const run = interpolate(local, [14, durationInFrames], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.inOut(Easing.quad),
	});

	// Upper chamber empties, lower chamber fills.
	const topFill = 1 - run;
	const bottomFill = run;

	// Outline of the glass: two triangles meeting at the neck.
	const outline = [
		`M ${cx - w} ${cy - size} L ${cx + w} ${cy - size}`,
		`L ${cx + neck} ${cy} L ${cx + w} ${cy + size}`,
		`L ${cx - w} ${cy + size} L ${cx - neck} ${cy} Z`,
	].join(" ");

	// The sand in the upper chamber is a triangle whose top edge drops.
	const topY = cy - size * topFill;
	const topHalfWidth = w * topFill;
	const topSand = `M ${cx - topHalfWidth} ${topY} L ${cx + topHalfWidth} ${topY} L ${cx + neck} ${cy} L ${cx - neck} ${cy} Z`;

	// The pile below grows as a cone.
	const pileH = size * 0.78 * bottomFill;
	const pileW = w * 0.95 * Math.sqrt(bottomFill);
	const pile = `M ${cx - pileW} ${cy + size} L ${cx + pileW} ${cy + size} L ${cx} ${cy + size - pileH} Z`;

	return (
		<g opacity={draw}>
			<path
				d={outline}
				fill="none"
				stroke={COLORS.line}
				strokeWidth={1.6}
				strokeLinejoin="round"
				pathLength={1}
				strokeDasharray={1}
				strokeDashoffset={1 - draw}
			/>

			{topFill > 0.01 && <path d={topSand} fill={COLORS.white} opacity={0.18} />}
			{bottomFill > 0.01 && <path d={pile} fill={COLORS.white} opacity={0.22} />}

			{/* Grains falling through the neck — each one on its own loop. */}
			{run > 0.01 &&
				run < 0.99 &&
				Array.from({length: grainCount}).map((_, i) => {
					const phase = seededRandom(i * 3.7);
					const speed = 0.045 + seededRandom(i * 5.1) * 0.03;
					const t = (phase + local * speed) % 1;
					const y = cy + t * size * 0.95;
					const spread = (seededRandom(i * 7.3) - 0.5) * neck * 2.6 * t;
					const fade = Math.sin(Math.PI * t);
					return (
						<circle
							key={i}
							cx={cx + spread}
							cy={y}
							r={1.5}
							fill={COLORS.white}
							opacity={fade * 0.75}
						/>
					);
				})}

			{/* The neck itself glows faintly while sand is running. */}
			{run > 0.01 && run < 0.99 && (
				<circle
					cx={cx}
					cy={cy}
					r={neck * 1.4}
					fill={COLORS.accent}
					opacity={0.5}
					style={{filter: `drop-shadow(0 0 10px ${COLORS.accent})`}}
				/>
			)}
		</g>
	);
};
