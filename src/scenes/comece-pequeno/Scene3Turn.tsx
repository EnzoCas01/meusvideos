import React from "react";
import {AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from "remotion";
import {BackgroundCP} from "../../components/comece-pequeno/BackgroundCP";
import {PhotoCard} from "../../components/comece-pequeno/PhotoCard";
import {seededRandom} from "../../utils/bezier";
import {cueFor} from "../../utils/cue-cp";
import {imageAt} from "../../utils/images-cp";
import {W, H} from "../../utils/layout";
import {CP} from "../../utils/theme-cp";

const cue = cueFor(2);

/** Where the field is pinned while the camera pulls back from it. */
const ORIGIN = {x: 540, y: 1175};

/** The three the script actually counts: one, then another, then another. */
const FIRST_THREE = [
	{x: 540, y: 1175, r: 26},
	{x: 404, y: 1252, r: 22},
	{x: 664, y: 1092, r: 22},
];

/**
 * The crowd that arrives under "began to grow". Spread far wider than the frame
 * on purpose: the group scales DOWN, so the pull-back reveals more rather than
 * shrinking what is already there.
 */
const CROWD = Array.from({length: 190}).map((_, i) => {
	const a = seededRandom(i * 2 + 13);
	const b = seededRandom(i * 5 + 29);
	const c = seededRandom(i * 9 + 41);
	return {
		x: -1000 + a * 3080,
		y: 150 + b * 2050,
		r: 9 + c * 9,
		order: seededRandom(i * 13 + 7),
	};
});

/** Skyline of light the field finally resolves into. */
const CITY = Array.from({length: 30}).map((_, i) => {
	const w = 18 + seededRandom(i * 3 + 2) * 20;
	return {
		x: 24 + i * 35,
		w,
		h: 60 + seededRandom(i * 7 + 11) * 200,
		warm: seededRandom(i * 17 + 5) > 0.72,
	};
});

const CITY_BASE = 1770;

/**
 * Scene 3 — THE TURN.
 *
 * Accumulation, cut fast. One client lands exactly on "primeiro veio um
 * cliente", the second on "depois, outro", the third on "e outro" — the frames
 * come straight from the narration JSON, so remeasuring the voice re-times the
 * landings for free. Then the camera pulls back and the three become a city.
 */
export const Scene3Turn: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();

	const l5 = cue("05-continuaram"); // "Mas eles continuaram."
	const l6 = cue("06-um-cliente");
	const l7 = cue("07-depois-outro");
	const l8 = cue("08-e-outro");
	const l9 = cue("09-comecar-crescer"); // "Até aquilo que parecia pequeno começar a crescer."

	const landings = [l6.start, l7.start, l8.start];

	// The pull-back. Everything in the group moves together, so the sense is of
	// the camera receding, not of dots getting smaller.
	const pullBack = interpolate(frame, [l9.start, l9.at(0.82)], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.inOut(Easing.cubic),
	});
	const fieldScale = 1 - 0.68 * pullBack;

	const crowdSpan = Math.max(40, l9.at(0.78) - l9.start);
	const cityRise = interpolate(frame, [l9.at(0.5), l9.end], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.out(Easing.cubic),
	});

	return (
		<AbsoluteFill>
			<BackgroundCP glow={0.3 + 0.55 * pullBack} glowY={64} />

			{/* Fast cuts. Each one is pinned to a line, each one lands in a different
			    part of the upper third so the rhythm reads as cutting, not fading. */}
			<PhotoCard
				image={imageAt(3, 0)}
				start={l5.start}
				durationInFrames={Math.max(30, l6.start - l5.start + 18)}
				x={250}
				y={420}
				width={580}
				height={392}
				zoomFrom={1.08}
				zoomTo={1.26}
				panX={-30}
				fadeIn={12}
				fadeOut={12}
				opacity={0.95}
			/>
			<PhotoCard
				image={imageAt(3, 1)}
				start={l6.start}
				durationInFrames={Math.max(28, l7.start - l6.start + 10)}
				x={140}
				y={356}
				width={470}
				height={330}
				zoomFrom={1.1}
				zoomTo={1.3}
				panY={26}
				fadeIn={9}
				fadeOut={10}
				rotate={-1.2}
			/>
			<PhotoCard
				image={imageAt(3, 2)}
				start={l7.start}
				durationInFrames={Math.max(26, l8.start - l7.start + 10)}
				x={512}
				y={470}
				width={440}
				height={310}
				zoomFrom={1.12}
				zoomTo={1.3}
				panX={34}
				fadeIn={9}
				fadeOut={10}
				rotate={1.4}
			/>
			<PhotoCard
				image={imageAt(3, 3)}
				start={l8.start}
				durationInFrames={Math.max(26, l9.start - l8.start + 10)}
				x={232}
				y={320}
				width={520}
				height={368}
				zoomFrom={1.1}
				zoomTo={1.32}
				panY={-28}
				fadeIn={9}
				fadeOut={12}
			/>
			{/* The wide one, held while the city assembles underneath it. */}
			<PhotoCard
				image={imageAt(3, 4)}
				start={Math.round(l9.at(0.18))}
				durationInFrames={Math.max(60, 390 - Math.round(l9.at(0.18)))}
				x={90}
				y={300}
				width={900}
				height={520}
				zoomFrom={1.04}
				zoomTo={1.2}
				panX={-44}
				fadeIn={22}
				fadeOut={26}
				opacity={0.62}
				blur={1.5}
			/>

			<svg
				width={W}
				height={H}
				viewBox={`0 0 ${W} ${H}`}
				style={{position: "absolute", top: 0, left: 0}}
			>
				<g
					transform={`translate(${ORIGIN.x} ${ORIGIN.y}) scale(${fieldScale}) translate(${-ORIGIN.x} ${-ORIGIN.y})`}
				>
					{/* "Mas eles continuaram." — a line that keeps advancing across the
					    empty frame and arrives at the origin exactly as the first client
					    is named. Carries the beat on its own when no photo has landed. */}
					{(() => {
						const adv = interpolate(frame, [l5.start, l6.start], [0, 1], {
							extrapolateLeft: "clamp",
							extrapolateRight: "clamp",
							easing: Easing.out(Easing.quad),
						});
						const gone = interpolate(frame, [l7.start, l7.start + 30], [1, 0], {
							extrapolateLeft: "clamp",
							extrapolateRight: "clamp",
						});
						if (adv <= 0 || gone <= 0) return null;
						return (
							<line
								x1={120}
								y1={ORIGIN.y}
								x2={120 + (ORIGIN.x - 120) * adv}
								y2={ORIGIN.y}
								stroke={CP.violet}
								strokeWidth={3}
								opacity={0.5 * gone}
							/>
						);
					})()}

					{CROWD.map((d, i) => {
						const at = l9.start + d.order * crowdSpan;
						const a = interpolate(frame, [at, at + 12], [0, 1], {
							extrapolateLeft: "clamp",
							extrapolateRight: "clamp",
						});
						if (a <= 0) return null;
						return (
							<circle
								key={`c${i}`}
								cx={d.x}
								cy={d.y}
								r={d.r * (0.5 + 0.5 * a)}
								fill={CP.violet}
								opacity={a * 0.72}
							/>
						);
					})}

					{FIRST_THREE.map((d, i) => (
						<ClientDot key={`f${i}`} {...d} start={landings[i]} fps={fps} frame={frame} />
					))}
				</g>

				{/* The city it turns into. */}
				<g opacity={cityRise}>
					{CITY.map((b, i) => {
						const h = b.h * cityRise;
						return (
							<rect
								key={i}
								x={b.x}
								y={CITY_BASE - h}
								width={b.w}
								height={h}
								fill={b.warm ? CP.warm : CP.violet}
								opacity={b.warm ? 0.45 : 0.6}
							/>
						);
					})}
					<rect
						x={0}
						y={CITY_BASE - 300}
						width={W}
						height={300}
						fill="url(#cp-city-fade)"
					/>
				</g>

				<defs>
					<linearGradient id="cp-city-fade" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0%" stopColor="rgba(7,6,11,0.85)" />
						<stop offset="70%" stopColor="rgba(7,6,11,0)" />
					</linearGradient>
				</defs>
			</svg>
		</AbsoluteFill>
	);
};

/**
 * One client. Lands with a spring and throws a single expanding ring — the ring
 * lives in the full-frame svg, so it never gets clipped by a tight viewBox.
 */
const ClientDot: React.FC<{
	x: number;
	y: number;
	r: number;
	start: number;
	fps: number;
	frame: number;
}> = ({x, y, r, start, fps, frame}) => {
	const local = frame - start;
	if (local < 0) return null;

	const land = spring({frame: local, fps, config: {damping: 12, mass: 0.5, stiffness: 140}});
	const ring = interpolate(local, [0, 34], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.out(Easing.cubic),
	});

	return (
		<g>
			<circle
				cx={x}
				cy={y}
				r={r * (1 + ring * 4.2)}
				fill="none"
				stroke={CP.violet}
				strokeWidth={3}
				opacity={(1 - ring) * 0.7}
			/>
			<circle cx={x} cy={y} r={r * 2.6} fill={CP.violet} opacity={land * 0.18} />
			<circle cx={x} cy={y} r={r * land} fill={CP.white} />
			<circle cx={x} cy={y} r={r * land * 0.82} fill={CP.violet} />
		</g>
	);
};
