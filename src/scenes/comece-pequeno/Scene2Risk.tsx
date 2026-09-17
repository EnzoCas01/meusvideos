import React from "react";
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from "remotion";
import {BackgroundCP, DrawLine} from "../../components/comece-pequeno/BackgroundCP";
import {PhotoCard} from "../../components/comece-pequeno/PhotoCard";
import {TextCP} from "../../components/comece-pequeno/TextCP";
import {seededRandom} from "../../utils/bezier";
import {cueFor} from "../../utils/cue-cp";
import {imageAt} from "../../utils/images-cp";
import {W, H} from "../../utils/layout";
import {CP} from "../../utils/theme-cp";

const cue = cueFor(1);

const GROUND = 1560;

/** The incumbents: seven grey monoliths, wall to wall, no gaps to escape through. */
const TOWERS = [
	{x: 0, w: 150, h: 640},
	{x: 158, w: 120, h: 880},
	{x: 286, w: 185, h: 1000},
	{x: 479, w: 140, h: 760},
	{x: 627, w: 205, h: 940},
	{x: 840, w: 130, h: 820},
	{x: 978, w: 102, h: 600},
];

/** The small thing, at the foot of them. */
const SMALL = {x: 402, y: 1364, w: 276, h: 196};

/**
 * Scene 2 — THE RISK.
 *
 * Pure scale. The towers grow while he describes a market owned by big banks;
 * the one lit object in the frame is a photograph the size of a postcard,
 * standing at their feet. Under "a lot of people thought it wouldn't work" the
 * towers throw shadow across the ground and the small thing's light nearly
 * goes out — and then comes back.
 */
export const Scene2Risk: React.FC = () => {
	const frame = useCurrentFrame();

	const l3 = cue("03-mercado"); // "...um mercado dominado por grandes bancos."
	const l4 = cue("04-nao-daria-certo"); // "...muita gente achou que aquilo não daria certo."

	const photo = imageAt(2, 0);

	const riseSpan = Math.max(30, l3.end - l3.start);
	const riseStep = riseSpan / (TOWERS.length + 2);

	// Doubt: the light on the small thing dips hard, then recovers before the line ends.
	const doubt = interpolate(
		frame,
		[l4.start, l4.at(0.55), l4.at(0.85), l4.end + 18],
		[0, 1, 0.9, 0.05],
		{extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.ease)},
	);
	// A tiny deterministic tremor while the doubt is on it — never Math.random.
	const tremor = doubt * Math.sin(frame * 0.9) * 0.06;
	const smallGlow = Math.max(0, 1 - doubt * 0.85 + tremor);

	const closeStart = Math.round(l4.end - 18);

	return (
		<AbsoluteFill>
			<BackgroundCP glow={0.28} glowY={72} />

			<svg
				width={W}
				height={H}
				viewBox={`0 0 ${W} ${H}`}
				style={{position: "absolute", top: 0, left: 0}}
			>
				<defs>
					<linearGradient id="cp-tower" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0%" stopColor="#23202C" />
						<stop offset="100%" stopColor="#0C0A12" />
					</linearGradient>
					<linearGradient id="cp-shadow" x1="0" y1="0" x2="1" y2="0">
						<stop offset="0%" stopColor="rgba(0,0,0,0.0)" />
						<stop offset="50%" stopColor="rgba(0,0,0,0.75)" />
						<stop offset="100%" stopColor="rgba(0,0,0,0.0)" />
					</linearGradient>
				</defs>

				{TOWERS.map((t, i) => {
					const grow = interpolate(
						frame,
						[l3.start + i * riseStep, l3.start + i * riseStep + riseSpan * 0.62],
						[0, 1],
						{
							extrapolateLeft: "clamp",
							extrapolateRight: "clamp",
							easing: Easing.out(Easing.cubic),
						},
					);
					if (grow <= 0) return null;
					const h = t.h * grow;
					const top = GROUND - h;
					// Faint floor lines, so the blocks read as buildings not bars.
					const floors = Math.floor(h / 96);
					return (
						<g key={i}>
							<rect x={t.x} y={top} width={t.w} height={h} fill="url(#cp-tower)" />
							<rect x={t.x} y={top} width={1.4} height={h} fill="rgba(244,242,247,0.10)" />
							{Array.from({length: floors}).map((_, f) => (
								<line
									key={f}
									x1={t.x + 8}
									y1={top + (f + 1) * 96}
									x2={t.x + t.w - 8}
									y2={top + (f + 1) * 96}
									stroke="rgba(244,242,247,0.045)"
									strokeWidth={1}
								/>
							))}
						</g>
					);
				})}

				{/* Shadow the towers cast toward the small thing. */}
				<rect
					x={0}
					y={GROUND - 6}
					width={W}
					height={230}
					fill="url(#cp-shadow)"
					opacity={doubt * 0.85}
				/>

				<DrawLine x1={40} y1={GROUND} x2={1040} y2={GROUND} start={4} durationInFrames={46} />

				{/* The violet halo that survives the doubt. */}
				<ellipse
					cx={SMALL.x + SMALL.w / 2}
					cy={SMALL.y + SMALL.h / 2}
					rx={SMALL.w * 1.5}
					ry={SMALL.h * 1.5}
					fill={CP.violet}
					opacity={0.16 * smallGlow * interpolate(frame, [l3.end - 20, l3.end + 16], [0, 1], {
						extrapolateLeft: "clamp",
						extrapolateRight: "clamp",
					})}
					style={{filter: "blur(46px)"}}
				/>

				{/* Dust in the shadow — deterministic, and only while the doubt is on. */}
				{Array.from({length: 14}).map((_, i) => (
					<circle
						key={i}
						cx={80 + seededRandom(i * 3 + 1) * 920}
						cy={GROUND - 40 - seededRandom(i * 7 + 5) * 300}
						r={1.6 + seededRandom(i * 11 + 2) * 1.8}
						fill={CP.dim}
						opacity={doubt * 0.5}
					/>
				))}
			</svg>

			{/* The small thing itself: a postcard of a room, at the foot of the towers. */}
			<PhotoCard
				image={photo}
				start={Math.round(l3.end - 22)}
				durationInFrames={Math.max(40, 330 - Math.round(l3.end - 22))}
				x={SMALL.x}
				y={SMALL.y}
				width={SMALL.w}
				height={SMALL.h}
				zoomFrom={1.05}
				zoomTo={1.24}
				panX={30}
				panY={-18}
				fadeIn={24}
				fadeOut={24}
				opacity={0.55 + 0.45 * smallGlow}
				borderRadius={8}
				grade="record"
				tint={0.3}
			/>

			<AbsoluteFill style={{alignItems: "center", justifyContent: "flex-start"}}>
				<div
					style={{
						position: "absolute",
						top: 320,
						width: "100%",
						display: "flex",
						justifyContent: "center",
					}}
				>
					<TextCP start={closeStart} fontSize={56} fontWeight={300} maxWidth={900} inFrames={36}>
						Começar pequeno
						<br />
						<span style={{color: CP.white}}>não significa pensar pequeno.</span>
					</TextCP>
				</div>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};
