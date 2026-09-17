import React from "react";
import {AbsoluteFill, interpolate, useCurrentFrame, Easing} from "remotion";
import {Background} from "../components/Background";
import {ProgressColumns, type Column} from "../components/ProgressColumns";
import {AnimatedText} from "../components/AnimatedText";
import {W, H} from "../utils/layout";
import {COLORS} from "../utils/theme";
import {fontFamily} from "../utils/font";

const BASELINE = 1230;
const MAX_HEIGHT = 470;

/**
 * Seven people leaving the same floor. Six of them climb; the one in the
 * middle barely leaves the ground — and that is the one the camera cares
 * about. No words are needed for the comparison to land.
 */
const COLUMNS: Column[] = [
	{x: 150, reach: 0.72, delay: 8, climb: 54},
	{x: 280, reach: 0.95, delay: 20, climb: 46},
	{x: 410, reach: 0.58, delay: 32, climb: 62},
	{x: 540, reach: 0.17, delay: 12, climb: 150, isYou: true},
	{x: 670, reach: 0.86, delay: 26, climb: 50},
	{x: 800, reach: 0.64, delay: 40, climb: 58},
	{x: 930, reach: 1.0, delay: 16, climb: 44},
];

/** Scene 2 — Comparison. */
export const Scene2Comparison: React.FC = () => {
	const frame = useCurrentFrame();

	// Once the question arrives, the others recede into the dark.
	const focus = interpolate(frame, [104, 148], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.out(Easing.cubic),
	});

	const questionProgress = interpolate(frame, [116, 152], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.out(Easing.cubic),
	});

	// Dramatic pause: the question holds, breathing very slightly.
	const breathe = 1 + Math.sin(Math.max(0, frame - 152) * 0.03) * 0.006;

	return (
		<AbsoluteFill>
			<Background />

			<svg
				width={W}
				height={H}
				viewBox={`0 0 ${W} ${H}`}
				style={{position: "absolute", top: 0, left: 0}}
			>
				<ProgressColumns
					columns={COLUMNS}
					baselineY={BASELINE}
					maxHeight={MAX_HEIGHT}
					focus={focus}
				/>
			</svg>

			<AbsoluteFill
				style={{alignItems: "center", justifyContent: "flex-start", paddingTop: 300}}
			>
				<AnimatedText
					delay={54}
					durationInFrames={44}
					fontSize={46}
					fontWeight={300}
					color={COLORS.greyText}
				>
					E você começa a pensar...
				</AnimatedText>
			</AbsoluteFill>

			<AbsoluteFill
				style={{alignItems: "center", justifyContent: "flex-end", paddingBottom: 300}}
			>
				<div
					style={{
						fontFamily,
						textAlign: "center",
						color: COLORS.white,
						opacity: questionProgress,
						transform: `translateY(${(1 - questionProgress) * 34}px) scale(${breathe})`,
						filter: `blur(${(1 - questionProgress) * 18}px)`,
					}}
				>
					<div
						style={{
							fontSize: 54,
							fontWeight: 300,
							color: COLORS.greyText,
							marginBottom: 8,
						}}
					>
						Estou
					</div>
					<div
						style={{
							fontSize: 154,
							fontWeight: 500,
							letterSpacing: -4,
							lineHeight: 1.05,
							textShadow: "0 0 80px rgba(242,242,240,0.18)",
						}}
					>
						atrasado?
					</div>
				</div>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};
