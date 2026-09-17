import React from "react";
import {interpolate, useCurrentFrame, Easing} from "remotion";
import {COLORS} from "../utils/theme";
import {cubicBezier, sampleBezier, pointsToPathD} from "../utils/bezier";

type Props = {
	/** Where it breaks the ground. */
	x: number;
	groundY: number;
	/** How tall it gets. */
	height: number;
	/** How far it leans, in px. Negative leans left. */
	lean: number;
	delay: number;
	/** Frames it takes to grow. */
	growFrames: number;
	/** Frames after the growth finishes before it opens. */
	bloomAfter?: number;
	bloomSize?: number;
	color?: string;
	bloomColor?: string;
};

/**
 * A stem that grows out of a shared ground line and opens at its own moment.
 * Two sprouts side by side make the point the scene is arguing: the slow one
 * is not failing, it is simply on its own clock.
 */
export const Sprout: React.FC<Props> = ({
	x,
	groundY,
	height,
	lean,
	delay,
	growFrames,
	bloomAfter = 16,
	bloomSize = 26,
	color = COLORS.line,
	bloomColor = COLORS.white,
}) => {
	const frame = useCurrentFrame();
	const local = frame - delay;

	const grow = interpolate(local, [0, growFrames], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.out(Easing.quad),
	});

	if (grow <= 0) return null;

	const p0 = {x, y: groundY};
	const p1 = {x: x + lean * 0.2, y: groundY - height * 0.4};
	const p2 = {x: x + lean * 0.9, y: groundY - height * 0.75};
	const p3 = {x: x + lean, y: groundY - height};

	const stem = pointsToPathD(sampleBezier(p0, p1, p2, p3, grow, 60));
	const tip = cubicBezier(grow, p0, p1, p2, p3);

	// The bloom opens only once the stem has finished climbing.
	const bloom = interpolate(local, [growFrames + bloomAfter, growFrames + bloomAfter + 34], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.out(Easing.cubic),
	});

	// Petals: short strokes radiating from the tip.
	const petals = 6;

	return (
		<g>
			<path d={stem} fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" />

			{bloom <= 0.01 ? (
				<circle cx={tip.x} cy={tip.y} r={3} fill={COLORS.greyText} opacity={0.8} />
			) : (
				<g
					opacity={bloom}
					style={{filter: `drop-shadow(0 0 ${14 * bloom}px ${bloomColor})`}}
				>
					{Array.from({length: petals}).map((_, i) => {
						const angle = (i / petals) * Math.PI * 2 - Math.PI / 2;
						const len = bloomSize * bloom;
						return (
							<line
								key={i}
								x1={tip.x + Math.cos(angle) * len * 0.34}
								y1={tip.y + Math.sin(angle) * len * 0.34}
								x2={tip.x + Math.cos(angle) * len}
								y2={tip.y + Math.sin(angle) * len}
								stroke={bloomColor}
								strokeWidth={1.4}
								strokeLinecap="round"
								opacity={0.8}
							/>
						);
					})}
					<circle cx={tip.x} cy={tip.y} r={3.4} fill={bloomColor} />
				</g>
			)}
		</g>
	);
};
