import React from "react";
import {AbsoluteFill} from "remotion";
import {COLORS} from "../utils/theme";

/**
 * Base black canvas with an extremely subtle radial vignette/glow to give
 * flat 2D scenes a sense of depth.
 */
export const Background: React.FC<{glow?: boolean}> = ({glow = true}) => {
	return (
		<AbsoluteFill style={{backgroundColor: COLORS.background}}>
			{glow && (
				<AbsoluteFill
					style={{
						background:
							"radial-gradient(ellipse 70% 50% at 50% 42%, rgba(255,255,255,0.05) 0%, rgba(5,5,5,0) 65%)",
					}}
				/>
			)}
			<AbsoluteFill
				style={{
					boxShadow: "inset 0 0 220px 60px rgba(0,0,0,0.85)",
				}}
			/>
		</AbsoluteFill>
	);
};
