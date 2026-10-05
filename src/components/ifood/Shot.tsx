import React from "react";
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from "remotion";
import {H, W} from "../../utils/layout";

/** A full-frame SVG canvas in composition coordinates, for the drawn props. */
export const Stage: React.FC<{children: React.ReactNode}> = ({children}) => (
	<svg
		width={W}
		height={H}
		viewBox={`0 0 ${W} ${H}`}
		style={{position: "absolute", top: 0, left: 0}}
	>
		{children}
	</svg>
);

type Props = {
	children: React.ReactNode;
	/** Local frame the shot cuts in on. */
	from: number;
	durationInFrames: number;
	/** Frames of cross-fade at each end. Keep it short: this film cuts, it does not dissolve. */
	fade?: number;
	zoomFrom?: number;
	zoomTo?: number;
	/** Travel across the shot, in px. */
	panX?: number;
	panY?: number;
	origin?: string;
};

/**
 * One shot inside a scene: cuts in, moves the whole time, cuts out.
 *
 * Scenes here are built from three to five of these. Nothing in the film is
 * ever static — every shot is on a slow push or a drift, which is what
 * separates a documentary cut from a slideshow.
 */
export const Shot: React.FC<Props> = ({
	children,
	from,
	durationInFrames,
	fade = 5,
	zoomFrom = 1,
	zoomTo = 1.08,
	panX = 0,
	panY = 0,
	origin = "50% 50%",
}) => {
	const frame = useCurrentFrame();
	const local = frame - from;
	if (local < -fade || local > durationInFrames + fade) return null;

	const opacity = Math.min(
		interpolate(local, [0, fade], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"}),
		interpolate(local, [durationInFrames - fade, durationInFrames], [1, 0], {
			extrapolateLeft: "clamp",
			extrapolateRight: "clamp",
		}),
	);
	if (opacity <= 0.002) return null;

	const t = interpolate(local, [0, durationInFrames], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.inOut(Easing.quad),
	});
	const scale = zoomFrom + (zoomTo - zoomFrom) * t;

	return (
		<AbsoluteFill
			style={{
				opacity,
				transform: `translate(${panX * t}px, ${panY * t}px) scale(${scale})`,
				transformOrigin: origin,
			}}
		>
			{children}
		</AbsoluteFill>
	);
};
