import React from "react";
import {AbsoluteFill, interpolate, useCurrentFrame} from "remotion";
import {FilmOverlay} from "../netflix/GradedPhoto";
import {OVERLAP_DF} from "../../utils/timeline-df";
import {DF} from "../../utils/theme-df";

/**
 * Common scene wrapper: black ground, dissolve-in over the previous scene (the
 * previous one stays mounted for OVERLAP_DF frames), vignette and grain on top.
 */
export const SceneShellDF: React.FC<{index: number; children: React.ReactNode}> = ({index, children}) => {
	const frame = useCurrentFrame();
	const fade = index === 0 ? 1 : interpolate(frame, [0, OVERLAP_DF], [0, 1], {extrapolateRight: "clamp"});
	return (
		<AbsoluteFill style={{backgroundColor: DF.night, opacity: fade}}>
			{children}
			<FilmOverlay />
		</AbsoluteFill>
	);
};
