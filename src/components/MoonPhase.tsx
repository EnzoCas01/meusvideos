import React from "react";
import {COLORS} from "../utils/theme";

type Props = {
	cx: number;
	cy: number;
	r: number;
	/** 0 = new, 0.25 = first quarter, 0.5 = full, 0.75 = last quarter. */
	phase: number;
	color?: string;
	opacity?: number;
	/** Draw the faint outline of the unlit disc. */
	showDisc?: boolean;
	glow?: number;
};

/**
 * The lit part of a moon at a given phase, built as one path: the outer limb
 * plus the terminator, whose curvature flips as the moon waxes and wanes.
 *
 * The film's whole argument in one image — the moon is never late, it is just
 * in the phase it is in.
 */
export const MoonPhase: React.FC<Props> = ({
	cx,
	cy,
	r,
	phase,
	color = COLORS.white,
	opacity = 1,
	showDisc = true,
	glow = 0,
}) => {
	const f = ((phase % 1) + 1) % 1;
	const waxing = f < 0.5;
	// Half-width of the terminator ellipse: r at new moon, 0 at the quarters.
	const rx = r * Math.cos(2 * Math.PI * f);
	const absRx = Math.abs(rx);

	// Outer limb runs down the lit side; the terminator returns, bulging into
	// the disc for a crescent and away from it for a gibbous.
	const outerSweep = waxing ? 1 : 0;
	const innerSweep = waxing ? (rx > 0 ? 0 : 1) : rx > 0 ? 1 : 0;

	const d = [
		`M ${cx} ${cy - r}`,
		`A ${r} ${r} 0 0 ${outerSweep} ${cx} ${cy + r}`,
		`A ${absRx} ${r} 0 0 ${innerSweep} ${cx} ${cy - r}`,
		"Z",
	].join(" ");

	// Near the new moon there is almost nothing to light; show the disc instead.
	const litVisible = Math.min(1, Math.abs(f - 0) < 0.012 ? 0 : 1);

	return (
		<g opacity={opacity}>
			{showDisc && (
				<circle
					cx={cx}
					cy={cy}
					r={r}
					fill="none"
					stroke={COLORS.line}
					strokeWidth={1.1}
					opacity={0.55}
				/>
			)}
			{litVisible > 0 && (
				<path
					d={d}
					fill={color}
					opacity={0.92}
					style={glow > 0 ? {filter: `drop-shadow(0 0 ${glow}px ${color})`} : undefined}
				/>
			)}
		</g>
	);
};
