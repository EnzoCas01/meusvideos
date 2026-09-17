import React from "react";
import {interpolate, useCurrentFrame, Easing} from "remotion";
import {COLORS} from "../utils/theme";

export type PhaseKind =
	| "start"
	| "growth"
	| "fall"
	| "learning"
	| "restart"
	| "achievement";

type Props = {
	kind: PhaseKind;
	delay?: number;
	size?: number;
	color?: string;
};

/**
 * Minimalist single-stroke icon representing one abstract phase of life.
 * Drawn with SVG stroke-dashoffset so it feels sketched, not pasted in.
 */
export const PhaseIndicator: React.FC<Props> = ({
	kind,
	delay = 0,
	size = 64,
	color = COLORS.white,
}) => {
	const frame = useCurrentFrame();
	const local = frame - delay;
	const draw = interpolate(local, [0, 26], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.out(Easing.cubic),
	});
	const appear = interpolate(local, [0, 14], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	const common = {
		fill: "none" as const,
		stroke: color,
		strokeWidth: 2.2,
		strokeLinecap: "round" as const,
		strokeLinejoin: "round" as const,
		pathLength: 1,
		strokeDasharray: 1,
		strokeDashoffset: 1 - draw,
	};

	const shapes: Record<PhaseKind, React.ReactNode> = {
		start: <circle cx={32} cy={32} r={14} {...common} />,
		growth: <path d="M10 50 L32 16 L54 50" {...common} />,
		fall: <path d="M10 16 L32 50 L54 16" {...common} />,
		learning: <path d="M8 40 Q32 8 56 40" {...common} />,
		restart: (
			<path
				d="M46 20 A20 20 0 1 0 50 40"
				{...common}
			/>
		),
		achievement: <path d="M32 8 L38 26 L56 26 L41 37 L47 55 L32 44 L17 55 L23 37 L8 26 L26 26 Z" {...common} />,
	};

	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 64 64"
			style={{opacity: appear}}
		>
			{shapes[kind]}
		</svg>
	);
};
