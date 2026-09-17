import React from "react";
import {AbsoluteFill, interpolate, useCurrentFrame, Easing, spring, useVideoConfig} from "remotion";
import {Background} from "../components/Background";
import {AnimatedText} from "../components/AnimatedText";
import {COLORS} from "../utils/theme";
import {fontFamily} from "../utils/font";

const RING_W = 720;
const RING_H = 200;

/**
 * Scene 3 — The answer. Everything stops. One quiet word, then the reframe:
 * you are not behind, you are inside a phase of your own.
 */
export const Scene3Answer: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();

	// "Não." arrives softly, with weight rather than speed.
	const naoIn = interpolate(frame, [18, 56], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.out(Easing.cubic),
	});
	const naoOut = interpolate(frame, [92, 118], [1, 0], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});
	const naoOpacity = naoIn * naoOut;

	// "fase" settles in with a spring, then a ring is drawn around it.
	const faseSpring = spring({
		frame: frame - 132,
		fps,
		config: {damping: 200, mass: 1.6, stiffness: 90},
	});
	const ringDraw = interpolate(frame, [150, 186], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.inOut(Easing.cubic),
	});

	// The point keeps circling the word long after the ring is closed.
	const orbit = -Math.PI / 2 + ringDraw * Math.PI * 2 + Math.max(0, frame - 186) * 0.022;

	return (
		<AbsoluteFill>
			<Background />

			<AbsoluteFill style={{alignItems: "center", justifyContent: "center"}}>
				<div
					style={{
						fontFamily,
						fontSize: 148,
						fontWeight: 400,
						letterSpacing: -4,
						color: COLORS.white,
						opacity: naoOpacity,
						transform: `translateY(${(1 - naoIn) * 22}px) scale(${0.97 + naoIn * 0.03})`,
						filter: `blur(${(1 - naoIn) * 16 + (1 - naoOut) * 10}px)`,
						textShadow: "0 0 90px rgba(242,242,240,0.2)",
					}}
				>
					Não.
				</div>
			</AbsoluteFill>

			<AbsoluteFill
				style={{
					alignItems: "center",
					justifyContent: "center",
					flexDirection: "column",
					gap: 34,
				}}
			>
				<AnimatedText
					delay={120}
					durationInFrames={52}
					fontSize={52}
					fontWeight={300}
					color={COLORS.greyText}
					maxWidth={800}
				>
					Você está vivendo
				</AnimatedText>

				<div
					style={{
						position: "relative",
						width: RING_W,
						height: RING_H,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
					}}
				>
					<svg
						width={RING_W}
						height={RING_H}
						viewBox={`0 0 ${RING_W} ${RING_H}`}
						style={{position: "absolute", top: 0, left: 0}}
					>
						<ellipse
							cx={RING_W / 2}
							cy={RING_H / 2}
							rx={RING_W / 2 - 8}
							ry={RING_H / 2 - 8}
							fill="none"
							stroke={COLORS.accent}
							strokeWidth={1.4}
							strokeLinecap="round"
							pathLength={1}
							strokeDasharray={1}
							strokeDashoffset={1 - ringDraw}
							opacity={0.75}
							transform={`rotate(-4 ${RING_W / 2} ${RING_H / 2})`}
						/>
						{ringDraw > 0.02 && (
							<circle
								cx={RING_W / 2 + Math.cos(orbit) * (RING_W / 2 - 8)}
								cy={RING_H / 2 + Math.sin(orbit) * (RING_H / 2 - 8)}
								r={4.5}
								fill={COLORS.accent}
								opacity={ringDraw}
								style={{filter: `drop-shadow(0 0 10px ${COLORS.accent})`}}
							/>
						)}
					</svg>
					<div
						style={{
							fontFamily,
							fontSize: 96,
							fontWeight: 500,
							letterSpacing: -2,
							color: COLORS.white,
							opacity: faseSpring,
							transform: `translateY(${(1 - faseSpring) * 26}px) scale(${0.92 + faseSpring * 0.08})`,
							filter: `blur(${(1 - faseSpring) * 14}px)`,
						}}
					>
						a sua fase.
					</div>
				</div>
			</AbsoluteFill>

		</AbsoluteFill>
	);
};
