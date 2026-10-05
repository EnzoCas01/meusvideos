import React from "react";
import {
	AbsoluteFill,
	OffthreadVideo,
	interpolate,
	spring,
	staticFile,
	useCurrentFrame,
	useVideoConfig,
} from "remotion";
import {cueLocalMDD} from "../../utils/timeline-mdd";
import {DISPLAY_MDD, MDD, SANS_MDD} from "../../utils/theme-mdd";

/** Quatro telas, uma por plataforma citada — texto, nunca logo de marca. */
const PHONES = [
	{src: "videos/mdd-celular/clip-01.mp4", label: "TIKTOK", word: /^TikTok,$/},
	{src: "videos/mdd-celular2/clip-02.mp4", label: "YOUTUBE", word: /^YouTube,$/},
	{src: "videos/mdd-celular/clip-04.mp4", label: "PUBLICIDADE", word: /^publicidade,$/},
	{src: "videos/mdd-celular/clip-02.mp4", label: "AFILIADOS", word: /^afiliados$/},
];

/** Escala: o gráfico sobe (forma, sem número) e cada tela ganha sua plataforma. */
export const Scene5Escala: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const escala = cueLocalMDD(4, "07-escala", /^escala\.$/);
	const dias = cueLocalMDD(4, "07-escala", /^dias$/);

	// gráfico de crescimento: traço desenhado, seta no fim — sem número
	const draw = interpolate(frame, [escala, escala + 60], [1, 0], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});
	const head = 1 - draw;

	return (
		<AbsoluteFill style={{backgroundColor: MDD.background}}>
			<div
				style={{
					position: "absolute",
					top: 150,
					width: "100%",
					textAlign: "center",
					fontFamily: SANS_MDD,
					fontWeight: 700,
					fontSize: 38,
					letterSpacing: "0.14em",
					color: MDD.grey,
					opacity: interpolate(frame, [dias, dias + 8], [0, 1], {
						extrapolateLeft: "clamp",
						extrapolateRight: "clamp",
					}),
				}}
			>
				CONTEÚDO TODO DIA
			</div>

			<svg width={940} height={220} viewBox="0 0 940 220" style={{position: "absolute", left: 70, top: 210, overflow: "visible"}}>
				{/* eixos discretos */}
				<line x1={20} y1={200} x2={920} y2={200} stroke="rgba(255,255,255,0.12)" strokeWidth={2} />
				<line x1={20} y1={200} x2={20} y2={20} stroke="rgba(255,255,255,0.12)" strokeWidth={2} />
				{/* a curva */}
				<path
					d="M20 190 C 200 185, 320 160, 450 120 C 580 80, 700 60, 900 18"
					fill="none"
					stroke={MDD.accent}
					strokeWidth={7}
					strokeLinecap="round"
					strokeDasharray={1000}
					strokeDashoffset={1000 * draw}
					style={{filter: "drop-shadow(0 0 14px rgba(255,197,49,0.45))"}}
				/>
				{head > 0.98 && <circle cx={900} cy={18} r={11} fill={MDD.accent} />}
				{head > 0.98 && <path d="M880 34 L906 12 L918 40 Z" fill={MDD.accent} />}
			</svg>

			{/* grade 2x2 de telas */}
			{PHONES.map((p, i) => {
				const col = i % 2;
				const row = Math.floor(i / 2);
				const pop = spring({
					frame: frame - (12 + i * 5),
					fps,
					config: {damping: 200, mass: 0.8},
					durationInFrames: 16,
				});
				const labelPop = spring({frame: frame - cueLocalMDD(4, "07-escala", p.word), fps, config: {damping: 14, mass: 0.7}, durationInFrames: 12});
				return (
					<div
						key={p.label}
						style={{
							position: "absolute",
							left: col === 0 ? 205 : 585,
							top: row === 0 ? 470 : 850,
							width: 290,
							height: 360,
							borderRadius: 30,
							border: "5px solid #26262E",
							overflow: "hidden",
							background: MDD.panel,
							opacity: pop,
							transform: `scale(${interpolate(pop, [0, 1], [0.55, 1])})`,
						}}
					>
						<OffthreadVideo
							src={staticFile(p.src)}
							muted
							style={{width: "100%", height: "100%", objectFit: "cover", transform: "scale(1.12)"}}
						/>
						{/* base de leitura do rótulo */}
						<div style={{position: "absolute", left: 0, right: 0, bottom: 0, height: 84, background: "linear-gradient(to top, rgba(7,7,9,0.92), transparent)"}} />
						<div
							style={{
								position: "absolute",
								left: 0,
								right: 0,
								bottom: 22,
								textAlign: "center",
								fontFamily: DISPLAY_MDD,
								fontSize: 44,
								color: MDD.accent,
								opacity: frame >= cueLocalMDD(4, "07-escala", p.word) ? 1 : 0,
								transform: `scale(${interpolate(labelPop, [0, 1], [1.35, 1])})`,
								letterSpacing: "0.03em",
							}}
						>
							{p.label}
						</div>
					</div>
				);
			})}
		</AbsoluteFill>
	);
};
