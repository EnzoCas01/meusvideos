import React from "react";
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from "remotion";
import {CAPTIONS_DF} from "../../utils/captions-df";
import {accentAtDF, DF, SANS_DF, TYPE_DF} from "../../utils/theme-df";

/**
 * Subtitles with their own voice: a robust grotesque, low in the frame, no
 * heavy outline, no per-word karaoke. Keywords take the accent colour of the
 * story movement they belong to. Scenes keep y 1380-1720 free for this.
 */
export const CaptionsDF: React.FC = () => {
	const frame = useCurrentFrame();
	const chunk = CAPTIONS_DF.find((c) => frame >= c.from && frame < c.from + c.durationInFrames);
	if (!chunk) return null;

	const local = frame - chunk.from;
	const arrive = interpolate(local, [0, 6], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.out(Easing.cubic),
	});
	const leave = interpolate(local, [chunk.durationInFrames - 4, chunk.durationInFrames], [1, 0], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});
	const accent = accentAtDF(frame);

	return (
		<AbsoluteFill style={{pointerEvents: "none"}}>
			{/* Soft floor so the words hold up over any photo, without a hard placa. */}
			<div
				style={{
					position: "absolute",
					left: 0,
					right: 0,
					top: 1400,
					bottom: 0,
					background: "linear-gradient(to bottom, rgba(6,4,3,0), rgba(6,4,3,0.68) 55%, rgba(6,4,3,0.8))",
				}}
			/>
			<div
				style={{
					position: "absolute",
					top: 1530,
					left: 70,
					width: 940,
					display: "flex",
					flexWrap: "wrap",
					justifyContent: "center",
					alignItems: "baseline",
					gap: "0 14px",
					fontFamily: SANS_DF,
					fontWeight: 600,
					fontSize: TYPE_DF.caption,
					lineHeight: 1.24,
					letterSpacing: "0.004em",
					textAlign: "center",
					opacity: Math.min(arrive, leave),
					transform: `translateY(${(1 - arrive) * 9}px)`,
					textShadow: "0 2px 20px rgba(0,0,0,0.9), 0 0 6px rgba(0,0,0,0.55)",
				}}
			>
				{chunk.words.map((w, i) => (
					<span
						key={i}
						style={{
							color: w.key ? accent : DF.white,
							fontWeight: w.key ? 700 : 600,
						}}
					>
						{w.w}
					</span>
				))}
			</div>
		</AbsoluteFill>
	);
};
