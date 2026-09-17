import React from "react";
import {interpolate, useCurrentFrame, Easing} from "remotion";
import {COLORS} from "../utils/theme";

type Props = {
	/** Where the horizon line sits. */
	y: number;
	width: number;
	delay?: number;
	/** Frames for the disc to climb from below the line to its full height. */
	riseFrames?: number;
	discR?: number;
	/** How far above the line the disc ends up. */
	riseHeight?: number;
};

/**
 * A horizon with a disc of light climbing out of it. Nothing hurries it and
 * nothing can be late about it — it simply arrives, which is the last thing
 * the film has to say.
 */
export const Horizon: React.FC<Props> = ({
	y,
	width,
	delay = 0,
	riseFrames = 200,
	discR = 120,
	riseHeight = 210,
}) => {
	const frame = useCurrentFrame();
	const local = frame - delay;

	const lineDraw = interpolate(local, [0, 50], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.out(Easing.cubic),
	});

	const rise = interpolate(local, [10, riseFrames], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.out(Easing.quad),
	});

	const cy = y + discR * 0.7 - rise * (riseHeight + discR * 0.7);
	const glow = 30 + rise * 90;
	const cx = width / 2;

	return (
		<g>
			{/* The light that spills along the horizon as the disc comes up. */}
			<ellipse
				cx={cx}
				cy={y}
				rx={width * 0.52}
				ry={70 + rise * 150}
				fill={COLORS.accent}
				opacity={0.05 + rise * 0.09}
				style={{filter: "blur(44px)"}}
			/>

			{/* Everything below the horizon stays dark, so the disc emerges. */}
			<defs>
				<clipPath id="above-horizon">
					<rect x={0} y={0} width={width} height={y} />
				</clipPath>
			</defs>

			<g clipPath="url(#above-horizon)">
				<circle
					cx={cx}
					cy={cy}
					r={discR}
					fill="none"
					stroke={COLORS.white}
					strokeWidth={1.4}
					opacity={0.5 + rise * 0.4}
					style={{filter: `drop-shadow(0 0 ${glow}px rgba(242,242,240,0.5))`}}
				/>
				<circle cx={cx} cy={cy} r={discR} fill={COLORS.white} opacity={0.04 + rise * 0.06} />
			</g>

			<line
				x1={width * 0.06}
				y1={y}
				x2={width * 0.94}
				y2={y}
				stroke={COLORS.line}
				strokeWidth={1.3}
				pathLength={1}
				strokeDasharray={1}
				strokeDashoffset={1 - lineDraw}
				opacity={0.85}
			/>
		</g>
	);
};
