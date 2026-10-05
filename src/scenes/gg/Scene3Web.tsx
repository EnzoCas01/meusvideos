import React from "react";
import {AbsoluteFill, Easing, OffthreadVideo, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from "remotion";
import {Impact} from "../../components/gg/Impact";
import {seededRandom} from "../../utils/bezier";
import {cueLocalGG} from "../../utils/timeline-gg";
import {GG} from "../../utils/theme-gg";

const SCENE = 2;
const N = 10;
const CENTER = {x: 540, y: 820};
const R = 360;

const NODES = Array.from({length: N}, (_, i) => {
	const a = (i / N) * Math.PI * 2 + seededRandom(i * 3.1) * 0.5;
	const r = R * (0.55 + seededRandom(i * 5.7) * 0.45);
	return {x: Math.cos(a) * r, y: Math.sin(a) * r};
});
// cada nó liga ao próximo e a um mais distante, o bastante para ler como teia (não anel)
const LINKS = NODES.map((_, i) => [i, (i + 1) % N] as const).concat(
	NODES.map((_, i) => [i, (i + 4) % N] as const),
);

/** A internet, grande demais para acompanhar, virando uma teia organizada. */
export const Scene3Web: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const organizar = cueLocalGG(SCENE, "03-missao", /^organizar$/);

	const rotate = interpolate(frame, [0, 172], [0, 14], {easing: Easing.inOut(Easing.sin)});

	return (
		<AbsoluteFill style={{backgroundColor: GG.background}}>
			<OffthreadVideo
				src={staticFile("videos/gg/rede/clip-02.mp4")}
				muted
				style={{width: "100%", height: "100%", objectFit: "cover", opacity: 0.5}}
			/>
			<AbsoluteFill style={{background: "rgba(7,8,12,0.62)"}} />

			<svg width={1080} height={1920} style={{position: "absolute", left: 0, top: 0}}>
				<g transform={`translate(${CENTER.x},${CENTER.y}) rotate(${rotate})`}>
					{LINKS.map(([a, b], i) => {
						const na = NODES[a];
						const nb = NODES[b];
						const len = Math.hypot(nb.x - na.x, nb.y - na.y);
						const draw = interpolate(frame, [18 + i * 4, 40 + i * 4], [len, 0], {
							extrapolateLeft: "clamp",
							extrapolateRight: "clamp",
						});
						return (
							<line
								key={i}
								x1={na.x}
								y1={na.y}
								x2={nb.x}
								y2={nb.y}
								stroke={GG.blue}
								strokeOpacity={0.5}
								strokeWidth={2.5}
								strokeDasharray={len}
								strokeDashoffset={draw}
							/>
						);
					})}
					{NODES.map((n, i) => {
						const pop = spring({frame: frame - i * 4, fps, config: {damping: 13, mass: 0.6}, durationInFrames: 12});
						const color = i % 3 === 0 ? GG.yellow : i % 3 === 1 ? GG.red : GG.green;
						return (
							<g key={i} opacity={pop}>
								<circle cx={n.x} cy={n.y} r={11 * pop} fill={color} />
								<circle cx={n.x} cy={n.y} r={20 * pop} fill="none" stroke={color} strokeOpacity={0.35} strokeWidth={2} />
							</g>
						);
					})}
				</g>
			</svg>

			<Impact at={organizar} lines={["ORGANIZAR", "TUDO"]} size={120} y={260} color={GG.white} />
		</AbsoluteFill>
	);
};
