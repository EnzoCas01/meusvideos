import React from "react";
import {AbsoluteFill, interpolate, useCurrentFrame, Easing} from "remotion";

type Props = {
	children: React.ReactNode;
	durationInFrames: number;
	fadeInFrames?: number;
	fadeOutFrames?: number;
	zoom?: boolean; // extremely slow zoom for depth
	zoomFrom?: number;
	zoomTo?: number;
};

/**
 * Wraps a scene with a soft blur+opacity fade at its edges, so cuts feel
 * like dissolves rather than hard scene changes, plus an optional slow
 * zoom to create depth from flat 2D elements.
 */
export const CinematicTransition: React.FC<Props> = ({
	children,
	durationInFrames,
	fadeInFrames = 24,
	fadeOutFrames = 24,
	zoom = false,
	zoomFrom = 1,
	zoomTo = 1.04,
}) => {
	const frame = useCurrentFrame();

	const opacity = interpolate(
		frame,
		[0, fadeInFrames, durationInFrames - fadeOutFrames, durationInFrames],
		[0, 1, 1, 0],
		{extrapolateLeft: "clamp", extrapolateRight: "clamp"},
	);

	const blur = interpolate(
		frame,
		[0, fadeInFrames, durationInFrames - fadeOutFrames, durationInFrames],
		[10, 0, 0, 10],
		{extrapolateLeft: "clamp", extrapolateRight: "clamp"},
	);

	const scale = zoom
		? interpolate(frame, [0, durationInFrames], [zoomFrom, zoomTo], {
				extrapolateLeft: "clamp",
				extrapolateRight: "clamp",
				easing: Easing.inOut(Easing.sin),
			})
		: 1;

	return (
		<AbsoluteFill
			style={{
				opacity,
				filter: `blur(${blur}px)`,
				transform: `scale(${scale})`,
			}}
		>
			{children}
		</AbsoluteFill>
	);
};
