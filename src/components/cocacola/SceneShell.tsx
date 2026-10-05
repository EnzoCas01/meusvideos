import React from "react";
import {AbsoluteFill, interpolate, useCurrentFrame} from "remotion";
import {OVERLAP_CC} from "../../utils/timeline-cc";
import {CC} from "../../utils/theme-cc";
import {FilmOverlay} from "./GradedPhoto";

/**
 * Common scene wrapper: black ground, dissolve-in over the previous scene (the
 * previous one stays mounted for OVERLAP_CC frames), vignette and grain on top.
 */
export const SceneShell: React.FC<{index: number; children: React.ReactNode; overlay?: boolean}> = ({
	index,
	children,
	overlay = true,
}) => {
	const frame = useCurrentFrame();
	const fade = index === 0 ? 1 : interpolate(frame, [0, OVERLAP_CC], [0, 1], {extrapolateRight: "clamp"});
	return (
		<AbsoluteFill style={{backgroundColor: CC.background, opacity: fade}}>
			{children}
			{overlay ? <FilmOverlay /> : null}
		</AbsoluteFill>
	);
};
