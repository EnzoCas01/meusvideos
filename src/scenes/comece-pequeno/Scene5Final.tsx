import React from "react";
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from "remotion";
import {BackgroundCP} from "../../components/comece-pequeno/BackgroundCP";
import {PhotoCard} from "../../components/comece-pequeno/PhotoCard";
import {TextCP} from "../../components/comece-pequeno/TextCP";
import {SCENE_STARTS_CP} from "../../ComecePequeno";
import {cueFor} from "../../utils/cue-cp";
import {fontFamily} from "../../utils/font";
import {imageAt} from "../../utils/images-cp";
import {W, H} from "../../utils/layout";
import {CP} from "../../utils/theme-cp";

const cue = cueFor(4);

/** Plot box for the curve. */
const X0 = 140;
const X1 = 940;
const BASE_Y = 1490;
const TOP_Y = 700;

/** Steepness of the compound curve: flat for a long time, then away. */
const K = 4.2;

/** Value shown next to the curve. A multiplier of itself — no unit, no claim. */
const MAX_MULT = 1024;

const curveY = (t: number) => BASE_Y - (BASE_Y - TOP_Y) * ((Math.exp(K * t) - 1) / (Math.exp(K) - 1));

/** How many "small repeated decisions" tick along the baseline. */
const TICKS = 36;

/**
 * Scene 5 — THE CLOSE.
 *
 * Compound interest as a picture: a number that barely moves for most of its
 * life and then runs away from you, over a curve that does the same thing, over
 * a baseline of small identical marks — the repetition the line is about.
 *
 * The figure is a bare multiplier with no unit and no currency. It is the shape
 * of the idea, never a statistic about anybody.
 */
export const Scene5Final: React.FC = () => {
	const frame = useCurrentFrame();

	const l17 = cue("17-dinheiro-assim"); // "Porque o dinheiro também funciona assim."
	const l18 = cue("18-grandes-result"); // "Grandes resultados..."

	// The growth runs from the first line to just before the last one ends.
	const growStart = l17.start;
	const growEnd = Math.round(l18.at(0.88));
	// Linear in time on purpose: the acceleration must come from the compound
	// curve itself, not from an easing curve laid on top of it.
	const t = interpolate(frame, [growStart, growEnd], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	const mult = Math.max(1, Math.round(Math.exp(t * Math.log(MAX_MULT))));

	// Path up to the current head.
	const steps = 96;
	const upto = Math.max(1, Math.round(steps * t));
	let d = "";
	for (let i = 0; i <= upto; i++) {
		const p = (i / steps) * 1;
		const x = X0 + (X1 - X0) * p;
		const y = curveY(p);
		d += `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)} `;
	}
	const headX = X0 + (X1 - X0) * t;
	const headY = curveY(t);

	// The black card. Its frame is derived, not typed: last ~2.5s of the film.
	const sceneStart = SCENE_STARTS_CP[4];
	const blackStart = Math.max(Math.round(l18.end + 6), 2085 - sceneStart);

	const chartFade = interpolate(frame, [blackStart - 8, blackStart + 16], [1, 0], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	const axisIn = interpolate(frame, [growStart - 24, growStart + 10], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.out(Easing.cubic),
	});

	return (
		<AbsoluteFill>
			<div style={{opacity: chartFade}}>
				<BackgroundCP glow={0.28 + 0.5 * t} glowY={52} />

				{/* Illustrative support only — soft, far back, no archival treatment. */}
				<PhotoCard
					image={imageAt(5, 0)}
					start={0}
					durationInFrames={blackStart + 20}
					x={0}
					y={0}
					width={W}
					height={H}
					zoomFrom={1.1}
					zoomTo={1.3}
					panX={-40}
					panY={30}
					fadeIn={34}
					fadeOut={30}
					opacity={0.2}
					blur={7}
					borderRadius={0}
					tint={0.3}
				/>

				{/* The number. Tabular figures so it grows without the digits dancing. */}
				<AbsoluteFill style={{alignItems: "center", justifyContent: "flex-start"}}>
					<div
						style={{
							marginTop: 380,
							fontFamily,
							fontSize: 150,
							fontWeight: 300,
							letterSpacing: -2,
							fontVariantNumeric: "tabular-nums",
							color: CP.white,
							opacity: axisIn,
							textShadow: `0 0 ${40 * t}px rgba(139,61,255,${0.5 * t})`,
						}}
					>
						<span style={{color: CP.violet, fontWeight: 200}}>×</span>
						{mult}
					</div>
				</AbsoluteFill>

				<svg
					width={W}
					height={H}
					viewBox={`0 0 ${W} ${H}`}
					style={{position: "absolute", top: 0, left: 0}}
				>
					<defs>
						<linearGradient id="cp-curve" x1="0" y1="1" x2="1" y2="0">
							<stop offset="0%" stopColor={CP.violetDeep} />
							<stop offset="70%" stopColor={CP.violet} />
							<stop offset="100%" stopColor={CP.warm} />
						</linearGradient>
					</defs>

					{/* Baseline: time. */}
					<line
						x1={X0}
						y1={BASE_Y}
						x2={X1}
						y2={BASE_Y}
						stroke={CP.line}
						strokeWidth={1.4}
						opacity={axisIn}
						pathLength={1}
						strokeDasharray={1}
						strokeDashoffset={1 - axisIn}
					/>

					{/* The small repeated decisions, one mark at a time. */}
					{Array.from({length: TICKS}).map((_, i) => {
						const p = i / (TICKS - 1);
						const on = t >= p - 0.01 ? 1 : 0;
						if (!on) return null;
						return (
							<line
								key={i}
								x1={X0 + (X1 - X0) * p}
								y1={BASE_Y}
								x2={X0 + (X1 - X0) * p}
								y2={BASE_Y + 18}
								stroke={CP.violet}
								strokeWidth={2}
								opacity={0.55}
							/>
						);
					})}

					{d.length > 0 && (
						<>
							<path d={d} fill="none" stroke="url(#cp-curve)" strokeWidth={5} strokeLinecap="round" />
							<path
								d={d}
								fill="none"
								stroke={CP.violet}
								strokeWidth={16}
								strokeLinecap="round"
								opacity={0.18}
								style={{filter: "blur(12px)"}}
							/>
						</>
					)}

					{/* The head of the curve, riding it. */}
					<circle cx={headX} cy={headY} r={26} fill={CP.warm} opacity={0.16} />
					<circle cx={headX} cy={headY} r={9} fill={CP.white} />

					<text
						x={X1}
						y={BASE_Y + 62}
						textAnchor="end"
						fontFamily={fontFamily}
						fontSize={30}
						fill={CP.dim}
						letterSpacing={6}
						opacity={axisIn}
					>
						TEMPO
					</text>
				</svg>
			</div>

			{/* Black card: no narration over it, nothing else on screen. */}
			<BlackCard start={blackStart} />
		</AbsoluteFill>
	);
};

const BlackCard: React.FC<{start: number}> = ({start}) => {
	const frame = useCurrentFrame();
	if (frame < start - 10) return null;

	const cover = interpolate(frame, [start - 10, start + 12], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.inOut(Easing.ease),
	});

	return (
		<AbsoluteFill style={{backgroundColor: "#000000", opacity: cover}}>
			<AbsoluteFill style={{alignItems: "center", justifyContent: "center"}}>
				<TextCP
					start={start + 14}
					fontSize={76}
					fontWeight={300}
					maxWidth={900}
					inFrames={44}
					rise={18}
					blurAmount={16}
					lineHeight={1.34}
				>
					Comece pequeno.
					<br />
					<span style={{color: CP.violet}}>Mas comece.</span>
				</TextCP>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};
