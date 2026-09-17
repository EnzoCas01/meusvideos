import React from "react";
import {AbsoluteFill, interpolate, useCurrentFrame, Easing, spring, useVideoConfig} from "remotion";
import {Background} from "../components/Background";
import {Horizon} from "../components/Horizon";
import {AnimatedText} from "../components/AnimatedText";
import {Particles} from "../components/Particles";
import {W, H} from "../utils/layout";
import {COLORS} from "../utils/theme";
import {fontFamily} from "../utils/font";

const HORIZON_Y = 1470;

/**
 * Scene 7 — Final.
 *
 * A horizon, and light coming up over it. A sunrise cannot be late: it arrives
 * when it arrives, and it always arrives. That is the closing argument, made
 * without saying it.
 */
export const Scene7Final: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();

	const continueSpring = spring({
		frame: frame - 208,
		fps,
		config: {damping: 200, mass: 2, stiffness: 70},
	});

	// Final dissolve to black.
	const blackout = interpolate(frame, [268, 300], [1, 0], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.in(Easing.cubic),
	});

	return (
		<AbsoluteFill style={{opacity: blackout}}>
			<Background />

			<svg
				width={W}
				height={H}
				viewBox={`0 0 ${W} ${H}`}
				style={{position: "absolute", top: 0, left: 0}}
			>
				<Particles
					count={10}
					seedOffset={77}
					areaWidth={W}
					areaHeight={H}
					delay={0}
					durationInFrames={300}
					color={COLORS.dim}
				/>

				<Horizon y={HORIZON_Y} width={W} delay={0} riseFrames={230} discR={118} riseHeight={165} />
			</svg>

			<AbsoluteFill
				style={{alignItems: "center", justifyContent: "flex-start", paddingTop: 320}}
			>
				<Held start={40} out={126}>
					<AnimatedText delay={40} durationInFrames={56} fontSize={72} fontWeight={400} maxWidth={860}>
						Você não está atrasado.
					</AnimatedText>
				</Held>

				<Held start={132} out={206}>
					<AnimatedText delay={132} durationInFrames={52} fontSize={72} fontWeight={300} maxWidth={860}>
						Você está a caminho.
					</AnimatedText>
				</Held>
			</AbsoluteFill>

			<AbsoluteFill style={{alignItems: "center", justifyContent: "center"}}>
				<div
					style={{
						fontFamily,
						fontSize: 116,
						fontWeight: 400,
						letterSpacing: -2,
						color: COLORS.white,
						opacity: continueSpring,
						transform: `translateY(${(1 - continueSpring) * 24}px)`,
						filter: `blur(${(1 - continueSpring) * 16}px)`,
						textShadow: "0 0 100px rgba(242,242,240,0.22)",
					}}
				>
					Continue.
				</div>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};

const Held: React.FC<{start: number; out: number; children: React.ReactNode}> = ({
	start,
	out,
	children,
}) => {
	const frame = useCurrentFrame();
	const opacity = interpolate(frame, [out - 22, out], [1, 0], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});
	if (frame < start) return null;
	return (
		<div
			style={{
				position: "absolute",
				width: "100%",
				display: "flex",
				justifyContent: "center",
				opacity,
				filter: `blur(${(1 - opacity) * 10}px)`,
			}}
		>
			{children}
		</div>
	);
};
