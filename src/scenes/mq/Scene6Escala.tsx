import React from "react";
import {
	AbsoluteFill,
	Easing,
	OffthreadVideo,
	interpolate,
	spring,
	staticFile,
	useCurrentFrame,
	useVideoConfig,
} from "remotion";
import {Impact} from "../../components/mq/Impact";
import {cueLocalMQ} from "../../utils/timeline-mq";
import {DISPLAY_MQ, MQ} from "../../utils/theme-mq";

type Cell = {x: number; y: number; video: number | null; zoom: number};

/** 3 células com o criador (cortes diferentes do clipe) + 5 telas estilizadas de vídeo publicado. */
const GRID: Cell[] = [
	{x: 61, y: 430, video: 0, zoom: 1.08},
	{x: 305, y: 430, video: null, zoom: 1},
	{x: 549, y: 430, video: 60, zoom: 1.16},
	{x: 793, y: 430, video: null, zoom: 1},
	{x: 61, y: 788, video: null, zoom: 1},
	{x: 305, y: 788, video: 130, zoom: 1.1},
	{x: 549, y: 788, video: null, zoom: 1},
	{x: 793, y: 788, video: null, zoom: 1},
];

const CHIPS = [
	{label: "TIKTOK", word: /^TikTok,$/},
	{label: "YOUTUBE", word: /^YouTube,$/},
	{label: "PUBLICIDADE", word: /^publicidade,$/},
	{label: "AFILIADOS", word: /^afiliados$/},
];

/** Escala: um criador vira uma grade de máquinas; todo dia, em cada plataforma. */
export const Scene6Escala: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const escala = cueLocalMQ(5, "09-escala", /^escala\.$/);
	const criar = cueLocalMQ(5, "09-escala", /^Criar$/);
	const dias = cueLocalMQ(5, "09-escala", /^dias$/);
	const monet = cueLocalMQ(5, "09-escala", /^monetização\.$/);

	// Ken Burns do cartão do criador, nítido
	const zoomCard = interpolate(frame, [0, 60], [1.08, 1.2], {easing: Easing.inOut(Easing.sin)});
	const panCard = interpolate(frame, [0, 60], ["46%", "54%"], {easing: Easing.inOut(Easing.sin)});

	// o cartão encolhe e vira a primeira célula da grade
	const shrink = interpolate(frame, [criar, criar + 22], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.inOut(Easing.cubic),
	});
	const full = {left: 540 - 290, top: 430, w: 580, h: 790}; // termina em 1220 — fora da faixa da legenda
	const cell0 = {left: GRID[0].x, top: GRID[0].y, w: 226, h: 340};

	// corações sobem da grade na monetização (audiência → oportunidade)
	const hearts =
		frame >= monet && frame < monet + 110
			? Array.from({length: 6}, (_, i) => {
					const p = ((frame - monet) * 0.016 + i * 0.21) % 1;
					return {x: GRID[(i * 3) % 8].x + 90, y: 1100 - p * 300, o: Math.sin(Math.PI * p) * 0.9, s: 0.7 + (i % 3) * 0.18};
				})
			: [];

	return (
		<AbsoluteFill style={{backgroundColor: MQ.background}}>
			<Impact at={escala} lines={["EM ESCALA"]} size={130} y={250} color={MQ.white} out={dias - 6} />
			<Impact at={dias} lines={["TODO DIA"]} size={130} y={250} color={MQ.white} />

			{/* cartão do criador, nítido, que vira a grade */}
			{shrink < 1 && (
				<div
					style={{
						position: "absolute",
						left: interpolate(shrink, [0, 1], [full.left, cell0.left]),
						top: interpolate(shrink, [0, 1], [full.top, cell0.top]),
						width: interpolate(shrink, [0, 1], [full.w, cell0.w]),
						height: interpolate(shrink, [0, 1], [full.h, cell0.h]),
						borderRadius: interpolate(shrink, [0, 1], [32, 26]),
						overflow: "hidden",
						border: `1.5px solid ${MQ.panelBorder}`,
					}}
				>
					<OffthreadVideo
						src={staticFile("videos/mq-monetizacao/clip-04.mp4")}
						muted
						style={{
							width: "100%",
							height: "100%",
							objectFit: "cover",
							objectPosition: `${panCard} 50%`,
							transform: `scale(${zoomCard})`,
						}}
					/>
				</div>
			)}

			{/* grade de celulares */}
			{GRID.map((cell, i) => {
				const at = criar + 14 + i * 4;
				const pop = spring({frame: frame - at, fps, config: {damping: 14, mass: 0.8}, durationInFrames: 16});
				if (i === 0) {
					// a célula 0 É o cartão encolhido — nada a mais enquanto ele desce
					if (shrink < 1) return null;
					return (
						<div key={i} style={{position: "absolute", left: cell.x, top: cell.y, width: 226, height: 340, borderRadius: 26, overflow: "hidden", border: `1.5px solid ${MQ.panelBorder}`}}>
							<OffthreadVideo
								src={staticFile("videos/mq-monetizacao/clip-04.mp4")}
								muted
								style={{width: "100%", height: "100%", objectFit: "cover", transform: `scale(${interpolate(frame, [criar + 20, 280], [1.05, 1.25], {easing: Easing.inOut(Easing.sin)})})`}}
							/>
						</div>
					);
				}
				return (
					<div
						key={i}
						style={{
							position: "absolute",
							left: cell.x,
							top: cell.y,
							width: 226,
							height: 340,
							borderRadius: 26,
							background: MQ.panel,
							border: `1.5px solid ${MQ.panelBorder}`,
							overflow: "hidden",
							opacity: pop,
							transform: `scale(${interpolate(pop, [0, 1], [0.55, 1])})`,
						}}
					>
						{cell.video !== null && (
							<OffthreadVideo
								src={staticFile("videos/mq-monetizacao/clip-04.mp4")}
								muted
								startFrom={cell.video}
								style={{
									width: "100%",
									height: "100%",
									objectFit: "cover",
									transform: `scale(${interpolate(frame, [at, at + 240], [cell.zoom, cell.zoom + 0.14], {easing: Easing.inOut(Easing.sin)})})`,
								}}
							/>
						)}
						{cell.video === null && <MiniScreen />}
					</div>
				);
			})}

			{/* corações: audiência virando oportunidade */}
			{hearts.map((h, i) => (
				<div key={i} style={{position: "absolute", left: h.x, top: h.y, opacity: h.o, transform: `translate(-50%, -50%) scale(${h.s})`}}>
					<Heart />
				</div>
			))}

			{/* plataformas — texto, nunca logo de marca */}
			<div
				style={{
					position: "absolute",
					top: 1150,
					left: 70,
					width: 940,
					display: "flex",
					justifyContent: "center",
					gap: 22,
				}}
			>
				{CHIPS.map((chip) => {
					const at = cueLocalMQ(5, "10-formas", chip.word);
					const pop = spring({frame: frame - at, fps, config: {damping: 14, mass: 0.7}, durationInFrames: 12});
					return (
						<div
							key={chip.label}
							style={{
								fontFamily: DISPLAY_MQ,
								fontSize: 44,
								color: MQ.white,
								padding: "12px 24px",
								border: `2px solid ${MQ.accentDim}`,
								borderRadius: 999,
								opacity: frame >= at ? 1 : 0,
								transform: `scale(${interpolate(pop, [0, 1], [1.35, 1])})`,
							}}
						>
							{chip.label}
						</div>
					);
				})}
			</div>
		</AbsoluteFill>
	);
};

/** Tela estilizada de vídeo publicado — sem foto, sem blur. */
const MiniScreen: React.FC = () => (
	<div style={{position: "absolute", inset: 0, background: "linear-gradient(180deg, #141926 0%, #0B0D12 100%)"}}>
		<div
			style={{
				position: "absolute",
				top: "42%",
				left: "50%",
				transform: "translate(-50%, -50%)",
				width: 0,
				height: 0,
				borderLeft: "22px solid rgba(61,255,138,0.85)",
				borderTop: "14px solid transparent",
				borderBottom: "14px solid transparent",
			}}
		/>
		<div style={{position: "absolute", left: 22, right: 22, bottom: 54, height: 12, borderRadius: 6, background: "rgba(255,255,255,0.16)"}} />
		<div style={{position: "absolute", left: 22, right: 70, bottom: 54, height: 12, borderRadius: 6, background: MQ.accent}} />
		<div style={{position: "absolute", left: 22, right: 60, bottom: 82, height: 9, borderRadius: 5, background: "rgba(255,255,255,0.24)"}} />
		<div style={{position: "absolute", left: 22, right: 110, bottom: 98, height: 9, borderRadius: 5, background: "rgba(255,255,255,0.14)"}} />
	</div>
);

const Heart: React.FC = () => (
	<svg width={44} height={40} viewBox="0 0 100 90">
		<path d="M50 84 C18 60 6 44 6 29 A21 21 0 0 1 50 18 A21 21 0 0 1 94 29 C94 44 82 60 50 84 Z" fill={MQ.accent} />
	</svg>
);
