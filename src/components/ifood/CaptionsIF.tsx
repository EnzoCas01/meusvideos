import React from "react";
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from "remotion";
import {CAPTIONS_IF, isKeywordIF} from "../../utils/captions-if";
import {fontFamily} from "../../utils/font";
import {IF, TYPE_IF} from "../../utils/theme-if";

/**
 * Subtitles for the whole film: three to five words at a time, timed across
 * the measured length of each spoken line.
 *
 * Placement is the point. They sit low — below the 1180px band every scene
 * composes its image in, and above the 1720px safe line — so they never fight
 * the display type or get cropped by a player's chrome. Only the words that
 * carry the story take the accent; if half the line were highlighted, none of
 * it would be.
 */
export const CaptionsIF: React.FC = () => {
	const frame = useCurrentFrame();
	const chunk = CAPTIONS_IF.find((c) => frame >= c.from && frame < c.from + c.durationInFrames);
	if (!chunk) return null;

	const local = frame - chunk.from;
	const arrive = interpolate(local, [0, 6], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.out(Easing.cubic),
	});
	const leave = interpolate(local, [chunk.durationInFrames - 5, chunk.durationInFrames], [1, 0], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	return (
		<AbsoluteFill style={{alignItems: "center", justifyContent: "flex-start", pointerEvents: "none"}}>
			<div
				style={{
					position: "absolute",
					top: 1560,
					width: 920,
					display: "flex",
					flexWrap: "wrap",
					justifyContent: "center",
					gap: "0 16px",
					fontFamily,
					fontWeight: 600,
					fontSize: TYPE_IF.caption,
					lineHeight: 1.22,
					letterSpacing: 0.4,
					textAlign: "center",
					opacity: Math.min(arrive, leave),
					transform: `translateY(${(1 - arrive) * 12}px)`,
					textShadow: "0 3px 26px rgba(0,0,0,0.92), 0 0 8px rgba(0,0,0,0.8)",
				}}
			>
				{chunk.words.map((w, i) => (
					<span key={i} style={{color: isKeywordIF(w) ? IF.accent : IF.white}}>
						{w}
					</span>
				))}
			</div>
		</AbsoluteFill>
	);
};
