import React from "react";
import {AbsoluteFill, Sequence, interpolate, useCurrentFrame, Easing} from "remotion";
import {Background} from "../components/Background";
import {MoonPhase} from "../components/MoonPhase";
import {WordReveal} from "../components/WordReveal";
import {Particles} from "../components/Particles";
import {W, H} from "../utils/layout";
import {COLORS} from "../utils/theme";

const MOON = {cx: 540, cy: 1010, r: 215};
const TRACK_Y = 1480;

const PHRASES: {text: string; from: number; highlight: boolean}[] = [
	{text: "Há fases para começar.", from: 10, highlight: false},
	{text: "Fases para aprender.", from: 92, highlight: false},
	{text: "Fases para perder.", from: 174, highlight: false},
	{text: "E fases para recomeçar.", from: 252, highlight: true},
];

/** The six phases that accumulate along the track as the big moon passes them. */
const MARKS = [0.04, 0.2, 0.36, 0.5, 0.66, 0.84];

/**
 * Scene 4 — The phases.
 *
 * The moon is the argument. It is never early and never late; it is only ever
 * in the phase it is in, and it always comes back around. The large disc moves
 * continuously from new to full and back toward new, while each phase it has
 * already been through settles onto a track below.
 */
export const Scene4Phases: React.FC = () => {
	const frame = useCurrentFrame();

	const phase = interpolate(frame, [16, 312], [0.02, 0.96], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.inOut(Easing.quad),
	});

	const appear = interpolate(frame, [0, 40], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.out(Easing.cubic),
	});

	// The moon sits very slightly higher as it fills, like it is rising.
	const lift = interpolate(phase, [0, 0.5, 1], [16, -10, 12]);
	const glow = interpolate(phase, [0, 0.5, 1], [10, 62, 12]);

	return (
		<AbsoluteFill>
			<Background />

			<svg
				width={W}
				height={H}
				viewBox={`0 0 ${W} ${H}`}
				style={{position: "absolute", top: 0, left: 0}}
			>
				<Particles
					count={11}
					seedOffset={31}
					areaWidth={W}
					areaHeight={H}
					delay={0}
					durationInFrames={330}
					color={COLORS.dim}
				/>

				<g opacity={appear}>
					<MoonPhase
						cx={MOON.cx}
						cy={MOON.cy + lift}
						r={MOON.r}
						phase={phase}
						glow={glow}
					/>
				</g>

				{/* The track of phases already lived. */}
				<line
					x1={150}
					y1={TRACK_Y}
					x2={930}
					y2={TRACK_Y}
					stroke={COLORS.line}
					strokeWidth={1}
					opacity={interpolate(frame, [30, 70], [0, 0.45], {
						extrapolateLeft: "clamp",
						extrapolateRight: "clamp",
					})}
				/>

				{MARKS.map((mark, i) => {
					// A mark lights up once the big moon has passed through it.
					const reached = interpolate(phase, [mark - 0.03, mark + 0.02], [0, 1], {
						extrapolateLeft: "clamp",
						extrapolateRight: "clamp",
					});
					if (reached <= 0) return null;
					const x = 150 + (i / (MARKS.length - 1)) * 780;
					const isLast = i === MARKS.length - 1;
					return (
						<g key={i} transform={`translate(0 ${(1 - reached) * 14})`}>
							<MoonPhase
								cx={x}
								cy={TRACK_Y}
								r={30}
								phase={mark}
								opacity={reached * (isLast ? 1 : 0.75)}
								color={isLast ? COLORS.accent : COLORS.white}
								glow={isLast ? 16 * reached : 0}
							/>
						</g>
					);
				})}
			</svg>

			<AbsoluteFill
				style={{alignItems: "center", justifyContent: "flex-start", paddingTop: 300}}
			>
				{PHRASES.map((phrase, i) => (
					<Sequence key={i} from={phrase.from} durationInFrames={72} layout="none">
						<PhraseHolder>
							<WordReveal
								text={phrase.text}
								perWordFrames={8}
								fontSize={62}
								fontWeight={300}
								maxWidth={820}
								highlightLastWord={phrase.highlight}
							/>
						</PhraseHolder>
					</Sequence>
				))}
			</AbsoluteFill>
		</AbsoluteFill>
	);
};

/** Holds a phrase on screen, then lets it dissolve before the next one. */
const PhraseHolder: React.FC<{children: React.ReactNode}> = ({children}) => {
	const frame = useCurrentFrame();
	const out = interpolate(frame, [52, 70], [1, 0], {
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
				filter: `blur(${(1 - out) * 8}px)`,
			}}
		>
			{children}
		</div>
	);
};
