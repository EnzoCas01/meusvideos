import React from "react";
import {AbsoluteFill, Sequence, interpolate, useCurrentFrame, Easing} from "remotion";
import {Background} from "../components/Background";
import {BreathingRing} from "../components/BreathingRing";
import {AnimatedText} from "../components/AnimatedText";
import {W, H} from "../utils/layout";

type Line = {text: string; from: number; hold: number; size: number; weight: number};

/** Each phrase gets room to be felt before the next one is allowed in. */
const LINES: Line[] = [
	{text: "Tenha calma.", from: 14, hold: 82, size: 96, weight: 400},
	{text: "Continue fazendo o que você precisa fazer.", from: 104, hold: 92, size: 58, weight: 300},
	{text: "Continue construindo.", from: 202, hold: 62, size: 68, weight: 300},
	{text: "Continue aprendendo.", from: 268, hold: 62, size: 68, weight: 300},
];

/**
 * Scene 6 — The message.
 *
 * Nothing on screen but the words and a ring expanding and contracting at the
 * pace of a calm breath. Viewers fall into step with it without being told to,
 * which is the only instruction "tenha calma" can really give.
 */
export const Scene6Message: React.FC = () => {
	const frame = useCurrentFrame();

	// The ring recedes slightly once the last lines arrive, leaving the words.
	const recede = interpolate(frame, [250, 310], [1, 0.45], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.inOut(Easing.sin),
	});

	return (
		<AbsoluteFill>
			<Background glow={false} />

			<svg
				width={W}
				height={H}
				viewBox={`0 0 ${W} ${H}`}
				style={{position: "absolute", top: 0, left: 0}}
				opacity={recede}
			>
				<BreathingRing cx={540} cy={1290} minR={95} maxR={205} delay={6} cycleFrames={240} />
			</svg>

			<AbsoluteFill style={{alignItems: "center", justifyContent: "center"}}>
				{LINES.map((line, i) => (
					<Sequence
						key={i}
						from={line.from}
						durationInFrames={line.hold + 24}
						layout="none"
					>
						<Held hold={line.hold}>
							<AnimatedText
								delay={0}
								durationInFrames={46}
								fontSize={line.size}
								fontWeight={line.weight}
								maxWidth={840}
								rise={30}
							>
								{line.text}
							</AnimatedText>
						</Held>
					</Sequence>
				))}
			</AbsoluteFill>
		</AbsoluteFill>
	);
};

const Held: React.FC<{hold: number; children: React.ReactNode}> = ({hold, children}) => {
	const frame = useCurrentFrame();
	const out = interpolate(frame, [hold, hold + 22], [1, 0], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.in(Easing.cubic),
	});
	return (
		<div
			style={{
				position: "absolute",
				width: "100%",
				display: "flex",
				justifyContent: "center",
				opacity: out,
				filter: `blur(${(1 - out) * 10}px)`,
				transform: `translateY(${(1 - out) * -14}px)`,
			}}
		>
			{children}
		</div>
	);
};
