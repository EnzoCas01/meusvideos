import React from "react";
import {Easing, interpolate, useCurrentFrame} from "remotion";
import {LandNF} from "../../components/netflix/WorldMapNF";
import {AmbienceCC} from "../../components/cocacola/AmbienceCC";
import {GradedPhoto} from "../../components/cocacola/GradedPhoto";
import {SceneShell} from "../../components/cocacola/SceneShell";
import {TextCC} from "../../components/cocacola/TextCC";
import {cueForCC} from "../../utils/cue-cc";
import {IMG_CC} from "../../utils/imagens-cc";
import {COUNTRIES_NF} from "../../utils/mapa-nf";
import {CC} from "../../utils/theme-cc";
import {sceneDurationCC} from "../../utils/timeline-cc";

const cueFor = cueForCC(5);

/** Atlanta, read off this Robinson map the same way Netflix's anchor point was. */
const ATLANTA = {x: -84, y: -34};
const MAP_CY = 1230;
const UNIT = 2.1;
const GRADE_TODAY = {brightness: 0.92, saturate: 0.95, sepia: 0, contrast: 1.08};

const DOTS = COUNTRIES_NF.filter((c) => c.area > 0.05).map((c, i) => ({
	id: c.id,
	x: c.cx,
	y: c.cy,
	d: Math.hypot(c.cx - ATLANTA.x, c.cy - ATLANTA.y),
	jitter: (i * 37) % 13,
}));
const MAXD = Math.max(...DOTS.map((d) => d.d));

/**
 * The reach graphic: a dim world with one red pulse on Atlanta while the voice
 * says "nove"; when "bilhões" lands (the film's loudest sound), light spreads
 * outward in a wave and the map holds the frame's lower third.
 */
const WorldReach: React.FC<{litAt: number; dur: number; outAt: number}> = ({litAt, dur, outAt}) => {
	const frame = useCurrentFrame();
	const lit = interpolate(frame, [litAt, litAt + 26], [0.55, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});
	const creep = interpolate(frame, [0, dur], [0, 0.045], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
	const k = UNIT * (1 + creep);
	const u = (px: number) => px / k;
	const pulse = frame < 24 ? 0.5 : ((frame - 24) % 50) / 50;
	// The real photograph takes over the lower half; the map hands the frame over.
	const gone = interpolate(frame, [outAt, outAt + 16], [1, 0], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	return (
		<div style={{position: "absolute", inset: 0, opacity: gone}}>
			<div
				style={{
					position: "absolute",
					inset: 0,
					opacity: lit - 0.55,
					background: `radial-gradient(ellipse 46% 22% at 50% ${MAP_CY / 19.2}%, ${CC.accent}26, transparent 72%)`,
				}}
			/>
			<svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: "absolute", inset: 0}}>
				<g transform={`translate(540 ${MAP_CY}) scale(${k})`} opacity={lit}>
					<LandNF />
					{[0, 1, 2].map((i) => {
						const t = (frame - litAt - i * 18) / 70;
						if (t < 0 || t > 1) return null;
						return (
							<circle
								key={i}
								cx={ATLANTA.x}
								cy={ATLANTA.y}
								r={t * 150}
								fill="none"
								stroke={CC.accentText}
								strokeWidth={1.4}
								vectorEffect="non-scaling-stroke"
								opacity={(1 - t) * 0.7}
							/>
						);
					})}
					{DOTS.map((d) => {
						const local = frame - (litAt + 6 + (d.d / MAXD) * 60 + d.jitter);
						if (local < 0) return null;
						const grow = interpolate(local, [0, 14], [0, 1], {
							extrapolateRight: "clamp",
							easing: Easing.out(Easing.cubic),
						});
						return (
							<g key={d.id} opacity={grow}>
								<circle cx={d.x} cy={d.y} r={u(9)} fill={CC.accentText} opacity={0.13} />
								<circle cx={d.x} cy={d.y} r={u(3.4)} fill={CC.white} opacity={0.9} />
							</g>
						);
					})}
					{/* 1886: nine drinks a day — one point. */}
					<circle
						cx={ATLANTA.x}
						cy={ATLANTA.y}
						r={u(8 + pulse * 26)}
						fill="none"
						stroke={CC.accentText}
						strokeWidth={2}
						vectorEffect="non-scaling-stroke"
						opacity={(1 - pulse) * 0.8}
					/>
					<circle cx={ATLANTA.x} cy={ATLANTA.y} r={u(10)} fill={CC.accent} opacity={0.3} />
					<circle cx={ATLANTA.x} cy={ATLANTA.y} r={u(4.5)} fill={CC.accentText} />
				</g>
			</svg>
		</div>
	);
};

/**
 * 06 — THE CONTRAST, the film's climax. 1886 is sparse type over a dark world
 * with a single red pulse; at "bilhões" the numbers swap and the world lights
 * up in a wave from Atlanta — the scale grows on screen, not on cards.
 */
export const Scene6: React.FC = () => {
	const nine = cueFor("12-nove");
	const hoje = cueFor("13-hoje");
	const dur = sceneDurationCC(5);

	const nineIn = nine.wordStart(/^nove$/);
	const bilhoes = hoje.wordStart(/^bilhões$/);
	const doses = hoje.wordStart(/^doses$/);
	const paises = hoje.wordStart(/^países$/);
	const out1 = bilhoes - 6;

	return (
		<SceneShell index={5}>
			<AmbienceCC />
			<WorldReach litAt={bilhoes} dur={dur} outAt={doses} />
			{/* The scale made real: a modern photograph (2012) takes the lower band
				right after the turn — no year of any kind is on screen with it. */}
			<GradedPhoto
				image={IMG_CC._02_WORKING_FOR_COKE_6868754014_JPG}
				width={840}
				centerY={1262}
				zoom={[1.05, 1.18]}
				pan={[
					[0, 10],
					[0, -10],
				]}
				range={[doses, dur]}
				showFrom={doses}
				showTo={dur}
				fadeIn={14}
				fadeOut={0}
				feather={0}
				shadow
				grade={GRADE_TODAY}
			/>

			{/* 1886: nine a day. */}
			<TextCC start={nineIn} end={out1} top={130} size={150} color={CC.amber} scrim={false}>
				1886
			</TextCC>
			<TextCC start={nineIn} end={out1} top={320} size={400} color={CC.white} scrim={false}>
				9
			</TextCC>
			<TextCC start={nineIn + 8} end={out1} top={782} size={52} font="sans" weight={600} spacing={0.32} color={CC.grey} scrim={false}>
				BEBIDAS POR DIA
			</TextCC>

			{/* HOJE: billions, on the lit world. */}
			<TextCC start={bilhoes} end={dur - 10} top={130} size={130} color={CC.white} scrim={false}>
				HOJE
			</TextCC>
			<TextCC start={bilhoes} end={dur - 10} top={300} size={280} color={CC.accent} scrim={false}>
				2,1+
			</TextCC>
			<TextCC start={bilhoes + 6} end={dur - 10} top={606} size={120} color={CC.white} scrim={false}>
				BILHÕES
			</TextCC>
			<TextCC start={bilhoes + 12} end={dur - 10} top={756} size={52} font="sans" weight={600} spacing={0.32} color={CC.grey} scrim={false}>
				POR DIA
			</TextCC>
			<TextCC start={doses} end={dur - 10} top={878} size={34} font="sans" weight={400} spacing={0.02} color="rgba(247,241,232,0.85)" scrim={false}>
				doses das bebidas da companhia,
			</TextCC>
			<TextCC start={paises} end={dur - 10} top={926} size={34} font="sans" weight={400} spacing={0.02} color="rgba(247,241,232,0.85)" scrim={false}>
				em mais de 200 países e territórios
			</TextCC>
		</SceneShell>
	);
};
