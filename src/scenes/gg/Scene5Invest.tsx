import React from "react";
import {AbsoluteFill, Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from "remotion";
import {Impact} from "../../components/gg/Impact";
import {cueLocalGG} from "../../utils/timeline-gg";
import {GG} from "../../utils/theme-gg";

const SCENE = 4;
const PATH = "M140,1150 C 420,1150 420,900 620,900 S 900,780 940,700";
const PATH_LEN = 1500; // generoso — a curva real é mais curta, o excesso só termina de desenhar cedo
const MARKERS = [
	{t: 0, x: 140, y: 1150},
	{t: 0.55, x: 620, y: 900},
	{t: 1, x: 940, y: 700},
];

/** O investimento chega: a curva sobe, o projeto de faculdade vira empresa. */
export const Scene5Invest: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const investimento = cueLocalGG(SCENE, "05-investimento", /^investimento$/);

	const draw = interpolate(frame, [8, 95], [PATH_LEN, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
	const zoom = interpolate(frame, [0, 159], [1.06, 1.16], {easing: Easing.out(Easing.sin)});

	return (
		<AbsoluteFill style={{backgroundColor: GG.background}}>
			<Img
				src={staticFile("images/gg/primeiro-escritorio/02.jpg")}
				style={{
					width: "100%",
					height: "100%",
					objectFit: "cover",
					objectPosition: "50% 22%",
					transform: `scale(${zoom})`,
					filter: "saturate(1.05) brightness(0.88)",
				}}
			/>
			<AbsoluteFill style={{background: "linear-gradient(to bottom, rgba(7,8,12,0.55) 0%, rgba(7,8,12,0.2) 38%, rgba(7,8,12,0.75) 100%)"}} />

			<svg width={1080} height={1920} style={{position: "absolute", left: 0, top: 0}}>
				<path d={PATH} fill="none" stroke={GG.green} strokeWidth={7} strokeLinecap="round" strokeDasharray={PATH_LEN} strokeDashoffset={draw} />
				{MARKERS.map((m, i) => {
					const at = 8 + m.t * 85;
					const pop = spring({frame: frame - at, fps, config: {damping: 13, mass: 0.55}, durationInFrames: 10});
					return <circle key={i} cx={m.x} cy={m.y} r={10 * pop} fill={GG.green} />;
				})}
			</svg>

			<Impact at={investimento} lines={["O GIRO", "COMEÇA"]} size={116} y={340} color={GG.green} />
		</AbsoluteFill>
	);
};
