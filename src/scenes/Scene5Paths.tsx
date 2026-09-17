import React from "react";
import {AbsoluteFill, interpolate, useCurrentFrame, Easing} from "remotion";
import {Background} from "../components/Background";
import {Sprout} from "../components/Sprout";
import {AnimatedText} from "../components/AnimatedText";
import {Particles} from "../components/Particles";
import {W, H} from "../utils/layout";
import {COLORS} from "../utils/theme";

const GROUND = 1390;

/**
 * Five stems out of the same ground. One shoots up and opens early, one leans
 * far off to the side, one barely moves for most of the scene — and then opens
 * last, and widest. Same soil, same light, entirely different clocks.
 */
const SPROUTS = [
	{x: 165, height: 418, lean: -34, delay: 6, growFrames: 58, bloomAfter: 10, bloomSize: 22},
	{x: 350, height: 296, lean: 46, delay: 30, growFrames: 76, bloomAfter: 22, bloomSize: 19},
	{x: 730, height: 486, lean: 30, delay: 14, growFrames: 52, bloomAfter: 8, bloomSize: 24},
	{x: 915, height: 344, lean: -52, delay: 44, growFrames: 88, bloomAfter: 26, bloomSize: 20},
];

/** The slow one, in the middle — the one the scene is defending. */
const YOU = {
	x: 540,
	height: 580,
	lean: 16,
	delay: 10,
	growFrames: 168,
	bloomAfter: 12,
	bloomSize: 54,
};

/** Scene 5 — Different shapes, same ground. */
export const Scene5Paths: React.FC = () => {
	const frame = useCurrentFrame();

	const groundDraw = interpolate(frame, [0, 44], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.out(Easing.cubic),
	});

	// A barely perceptible rise, so the frame feels alive rather than staged.
	const drift = Math.sin(frame * 0.014) * 7;

	return (
		<AbsoluteFill>
			<Background />

			<svg
				width={W}
				height={H}
				viewBox={`0 0 ${W} ${H}`}
				style={{position: "absolute", top: 0, left: 0, transform: `translateY(${drift}px)`}}
			>
				<Particles
					count={10}
					seedOffset={41}
					areaWidth={W}
					areaHeight={H}
					delay={0}
					durationInFrames={240}
					color={COLORS.dim}
				/>

				<line
					x1={90}
					y1={GROUND}
					x2={990}
					y2={GROUND}
					stroke={COLORS.line}
					strokeWidth={1.2}
					pathLength={1}
					strokeDasharray={1}
					strokeDashoffset={1 - groundDraw}
				/>

				{SPROUTS.map((s, i) => (
					<Sprout key={i} groundY={GROUND} {...s} />
				))}

				<Sprout
					groundY={GROUND}
					{...YOU}
					color={COLORS.greyText}
					bloomColor={COLORS.accent}
				/>
			</svg>

			<AbsoluteFill
				style={{alignItems: "center", justifyContent: "flex-start", paddingTop: 340}}
			>
				<FadingLine start={46} end={140}>
					<AnimatedText delay={46} durationInFrames={54} fontSize={58} maxWidth={820}>
						Nem todo caminho precisa parecer igual.
					</AnimatedText>
				</FadingLine>

				<FadingLine start={146} end={240}>
					<AnimatedText
						delay={146}
						durationInFrames={50}
						fontSize={58}
						fontWeight={400}
						maxWidth={820}
					>
						O seu tempo também não.
					</AnimatedText>
				</FadingLine>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};

/** Keeps a line of text in place and dissolves it before the next arrives. */
const FadingLine: React.FC<{start: number; end: number; children: React.ReactNode}> = ({
	start,
	end,
	children,
}) => {
	const frame = useCurrentFrame();
	const opacity = interpolate(frame, [end - 22, end], [1, 0], {
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
				filter: `blur(${(1 - opacity) * 9}px)`,
			}}
		>
			{children}
		</div>
	);
};
