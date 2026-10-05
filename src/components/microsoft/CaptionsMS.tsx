import React from "react";
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from "remotion";
import {CAPTIONS_MS} from "../../utils/captions-ms";
import {MS, SANS_MS, TYPE_MS} from "../../utils/theme-ms";

/** Subtitles, low in the frame (top 1560): scenes compose their picture above ~1180-1450. */
export const CaptionsMS: React.FC = () => {
	const frame = useCurrentFrame();
	const chunk = CAPTIONS_MS.find((c) => frame >= c.from && frame < c.from + c.durationInFrames);
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
		<AbsoluteFill style={{pointerEvents: "none"}}>
			{/* Soft floor so the words hold up over a bright photo. */}
			<div
				style={{
					position: "absolute",
					left: 0,
					right: 0,
					top: 1380,
					bottom: 0,
					background: "linear-gradient(to bottom, rgba(5,5,5,0), rgba(5,5,5,0.72))",
				}}
			/>
			<div
				style={{
					position: "absolute",
					top: 1560,
					left: 80,
					width: 920,
					display: "flex",
					flexWrap: "wrap",
					justifyContent: "center",
					gap: "0 16px",
					fontFamily: SANS_MS,
					fontWeight: 600,
					fontSize: TYPE_MS.caption,
					lineHeight: 1.22,
					letterSpacing: 0.4,
					textAlign: "center",
					opacity: Math.min(arrive, leave),
					transform: `translateY(${(1 - arrive) * 12}px)`,
					textShadow: "0 3px 26px rgba(0,0,0,0.92), 0 0 8px rgba(0,0,0,0.8)",
				}}
			>
				{chunk.words.map((w, i) => (
					<span key={i} style={{color: w.key ? MS.accentText : MS.white}}>
						{w.w}
					</span>
				))}
			</div>
		</AbsoluteFill>
	);
};
