import React from "react";
import {interpolate, useCurrentFrame, useVideoConfig, spring, Easing} from "remotion";
import {PhaseIndicator, type PhaseKind} from "./PhaseIndicator";
import {COLORS} from "../utils/theme";

/** The impact ring needs room to expand past the icon box. */
const RING_BOX = 2.6;

type Props = {
	kind: PhaseKind;
	x: number;
	y: number;
	delay: number;
	size: number;
	color?: string;
	/** Brightness boost while the travelling dot is passing through. */
	activation?: number;
};

/**
 * A phase icon that flies in, lands on the trajectory and settles — with a
 * ring of light spreading from the point of impact, then a very slow float
 * so it never looks pasted onto the frame.
 */
export const LandingIcon: React.FC<Props> = ({
	kind,
	x,
	y,
	delay,
	size,
	color = COLORS.greyText,
	activation = 0,
}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const local = frame - delay;

	// The landing itself: overshoots slightly, then settles.
	const land = spring({
		frame: local,
		fps,
		config: {damping: 14, mass: 0.9, stiffness: 110},
	});

	const appear = interpolate(local, [0, 10], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	// Comes down from above, slightly rotated and oversized, like it is
	// descending through space rather than fading in.
	const drop = (1 - land) * -110;
	const scale = interpolate(land, [0, 1], [1.7, 1]);
	const tilt = (1 - land) * -14;

	// Impact ring.
	const ring = interpolate(local, [8, 46], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.out(Easing.cubic),
	});
	const ringRadius = size * (0.28 + ring * 0.75);
	const ringOpacity = interpolate(ring, [0, 0.2, 1], [0, 0.5, 0]);

	// Slow breathing once it has landed.
	const float = Math.sin((local - 40) * 0.028) * 5 * land;

	const glow = 8 + activation * 22;

	return (
		<div
			style={{
				position: "absolute",
				left: x - size / 2,
				top: y - size / 2,
				width: size,
				height: size,
				opacity: appear,
				transform: `translateY(${drop + float}px) scale(${scale}) rotate(${tilt}deg)`,
			}}
		>
			{ringOpacity > 0.01 && (
				<svg
					width={RING_BOX * size}
					height={RING_BOX * size}
					viewBox={`0 0 ${RING_BOX * size} ${RING_BOX * size}`}
					style={{
						position: "absolute",
						top: (-(RING_BOX - 1) * size) / 2,
						left: (-(RING_BOX - 1) * size) / 2,
						overflow: "visible",
					}}
				>
					<circle
						cx={(RING_BOX * size) / 2}
						cy={(RING_BOX * size) / 2}
						r={ringRadius}
						fill="none"
						stroke={COLORS.white}
						strokeWidth={1.2}
						opacity={ringOpacity}
					/>
				</svg>
			)}

			<div style={{filter: `drop-shadow(0 0 ${glow}px rgba(242,242,240,${0.18 + activation * 0.5}))`}}>
				<PhaseIndicator kind={kind} delay={delay + 4} size={size} color={color} />
			</div>
		</div>
	);
};
