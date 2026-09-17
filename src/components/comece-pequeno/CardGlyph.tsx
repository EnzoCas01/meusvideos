import React from "react";
import {interpolate, spring, useCurrentFrame, useVideoConfig} from "remotion";
import {CP} from "../../utils/theme-cp";

type Props = {
	/** Centre of the card, in SVG units. */
	cx: number;
	cy: number;
	/** Card width; height follows the 1.586 payment-card ratio. */
	width: number;
	/** Local frame the card lands on. */
	start: number;
	rotate?: number;
	/** Multiplies the landed size — scenes use it to shrink the twelve away. */
	scale?: number;
	opacity?: number;
	/** Brighter treatment for the one hero card. */
	hero?: boolean;
};

const RATIO = 1 / 1.586;

/**
 * An abstract violet payment card. Deliberately blank — no mark, no wordmark,
 * no name, no number. It stands for "a card", which is the only thing the
 * script claims: in 2013 there were twelve of them.
 */
export const CardGlyph: React.FC<Props> = ({
	cx,
	cy,
	width,
	start,
	rotate = 0,
	scale = 1,
	opacity = 1,
	hero = false,
}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const local = frame - start;
	if (local < 0) return null;

	// Spring landing: the card arrives and settles, it does not fade in.
	const land = spring({
		frame: local,
		fps,
		config: {damping: 14, mass: 0.6, stiffness: 110},
	});

	const appear = interpolate(local, [0, 8], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	const h = width * RATIO;
	const s = (0.72 + 0.28 * land) * scale;
	const lift = (1 - land) * -26;

	const id = `cardgrad-${Math.round(cx)}-${Math.round(cy)}-${Math.round(width)}`;
	const sheenId = `${id}-sheen`;

	return (
		<g
			transform={`translate(${cx} ${cy + lift}) rotate(${rotate}) scale(${s})`}
			opacity={appear * opacity}
		>
			<defs>
				<linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
					<stop offset="0%" stopColor={hero ? "#A45BFF" : CP.violet} />
					<stop offset="100%" stopColor={CP.violetDeep} />
				</linearGradient>
				<linearGradient id={sheenId} x1="0" y1="0" x2="1" y2="1">
					<stop offset="0%" stopColor="rgba(255,255,255,0.30)" />
					<stop offset="55%" stopColor="rgba(255,255,255,0.02)" />
				</linearGradient>
			</defs>

			<rect
				x={-width / 2}
				y={-h / 2}
				width={width}
				height={h}
				rx={h * 0.14}
				fill={`url(#${id})`}
			/>
			{/* Top-left sheen: gives the flat rectangle a surface. */}
			<rect
				x={-width / 2}
				y={-h / 2}
				width={width}
				height={h}
				rx={h * 0.14}
				fill={`url(#${sheenId})`}
			/>
			{/* Chip — the only detail, and a generic one. */}
			<rect
				x={-width * 0.32}
				y={-h * 0.08}
				width={width * 0.16}
				height={width * 0.16 * 0.78}
				rx={width * 0.03}
				fill="rgba(255,255,255,0.4)"
			/>
			<rect
				x={-width / 2}
				y={-h / 2}
				width={width}
				height={h}
				rx={h * 0.14}
				fill="none"
				stroke="rgba(255,255,255,0.22)"
				strokeWidth={Math.max(0.6, width * 0.006)}
			/>
		</g>
	);
};
