import React from "react";
import {MS} from "../../utils/theme-ms";

/**
 * The colour bed of the film: two soft blue pools so #050608 never reads as
 * flat black. Static and deterministic — the grade of the photos does the rest.
 */
export const AmbienceMS: React.FC<{intensity?: number}> = ({intensity = 1}) => (
	<div style={{position: "absolute", inset: 0, pointerEvents: "none", opacity: intensity}}>
		<div
			style={{
				position: "absolute",
				inset: 0,
				background: `radial-gradient(ellipse 72% 42% at 50% 10%, ${MS.accent}24, transparent 70%)`,
			}}
		/>
		<div
			style={{
				position: "absolute",
				inset: 0,
				background: `radial-gradient(ellipse 62% 40% at 84% 86%, ${MS.accent}12, transparent 72%)`,
			}}
		/>
	</div>
);
