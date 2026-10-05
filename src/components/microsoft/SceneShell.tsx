import React from "react";
import {AbsoluteFill, interpolate, useCurrentFrame} from "remotion";
import {OVERLAP_MS} from "../../utils/timeline-ms";
import {MS} from "../../utils/theme-ms";
import {FilmOverlay} from "./GradedPhoto";

/**
 * Common scene wrapper: black ground, dissolve-in over the previous scene (the
 * previous one stays mounted for OVERLAP_MS frames), vignette and grain on top.
 */
export const SceneShell: React.FC<{index: number; children: React.ReactNode; overlay?: boolean}> = ({
	index,
	children,
	overlay = true,
}) => {
	const frame = useCurrentFrame();
	const fade = index === 0 ? 1 : interpolate(frame, [0, OVERLAP_MS], [0, 1], {extrapolateRight: "clamp"});
	return (
		<AbsoluteFill style={{backgroundColor: MS.background, opacity: fade}}>
			{children}
			{overlay ? <FilmOverlay /> : null}
		</AbsoluteFill>
	);
};
