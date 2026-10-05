import React from "react";
import {AbsoluteFill} from "remotion";
import {fontFamily} from "../../utils/font";
import {IF} from "../../utils/theme-if";

/**
 * Stand-in for a scene that has not been shot yet: dark frame, the scene name.
 * Exists only so the composition has its full length and its real timing while
 * the remaining scenes are built. Every one of these is replaced.
 */
export const ScenePlaceholderIF: React.FC<{name: string}> = ({name}) => (
	<AbsoluteFill
		style={{
			backgroundColor: IF.background,
			alignItems: "center",
			justifyContent: "center",
			fontFamily,
			color: IF.dim,
			fontSize: 44,
			fontWeight: 600,
			letterSpacing: 8,
		}}
	>
		{name.toUpperCase()}
	</AbsoluteFill>
);
