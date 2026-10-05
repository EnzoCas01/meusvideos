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
import {MQ} from "../../utils/theme-mq";

const NODES = 7;
const RING_R = 420;
const RING_BOX = 1000; // viewport maior que o maior estado do anel
const CARD_W = 700;
const CARD_H = 394;
const CENTER = {x: 540, y: 760};

/** Revelação: IA de verdade em tela cheia; no "time" o clipe recua para um cartão e a rede de 7 nós desenha em volta. */
export const Scene2Revelacao: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const calma = cueLocalMQ(1, "03-calma", /^calma\.$/);
	const verdade = cueLocalMQ(1, "03-calma", /^verdade\.$/);
	const time = cueLocalMQ(1, "04-time", /^time$/);
	const agentes = cueLocalMQ(1, "04-time", /^agentes$/);

	// Ken Burns da fase 1: zoom lento + pan, sempre nítido
	const zoom1 = interpolate(frame, [0, 90], [1.1, 1.26], {easing: Easing.inOut(Easing.sin)});
	const pan1 = interpolate(frame, [0, 90], ["44%", "56%"], {easing: Easing.inOut(Easing.sin)});

	// fase 2: a tela cheia recua para um cartão e pousa com leve overshoot
	const shrink = interpolate(frame, [time, time + 20], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.inOut(Easing.cubic),
	});
	const cardPop = spring({frame: frame - (time + 20), fps, config: {damping: 14, mass: 0.8}, durationInFrames: 14});
	const cardScale = interpolate(cardPop, [0, 1], [1.06, 1]);
	const cardW = interpolate(shrink, [0, 1], [1080, CARD_W]);
	const cardH = interpolate(shrink, [0, 1], [1920, CARD_H]);
	const radius = interpolate(shrink, [0, 1], [0, 26]);
	const cardTop = interpolate(shrink, [0, 1], [0, CENTER.y - CARD_H / 2]);
	const cardLeft = interpolate(shrink, [0, 1], [0, CENTER.x - CARD_W / 2]);
	// dentro do cartão o clipe continua vivo (zoom próprio + troca para o clipe 2)
	const zoomCard = interpolate(frame, [time + 20, 150], [1.12, 1.3], {easing: Easing.inOut(Easing.sin)});

	// rede: nós que pousam um a um durante "agentes de inteligência artificial"
	const nodes = Array.from({length: NODES}, (_, i) => {
		const a = -Math.PI / 2 + (i * 2 * Math.PI) / NODES;
		return {x: Math.cos(a) * RING_R, y: Math.sin(a) * RING_R};
	});
	const netIn = interpolate(frame, [time + 12, time + 22], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	return (
		<AbsoluteFill style={{backgroundColor: MQ.background}}>
			{/* o clipe: tela cheia na fase 1, cartão na fase 2 — sempre nítido */}
			<div
				style={{
					position: "absolute",
					left: cardLeft,
					top: cardTop,
					width: cardW,
					height: cardH,
					borderRadius: radius,
					overflow: "hidden",
					border: shrink > 0.5 ? `2px solid ${MQ.accentDim}` : "none",
					boxShadow: shrink > 0.5 ? "0 30px 80px rgba(0,0,0,0.55), 0 0 60px rgba(61,255,138,0.08)" : "none",
					transform: `scale(${cardScale})`,
				}}
			>
				<OffthreadVideo
					src={staticFile("videos/mq-ia/clip-01.mp4")}
					muted
					startFrom={frame < time + 18 ? undefined : 30}
					style={{
						width: "100%",
						height: "100%",
						objectFit: "cover",
						objectPosition: frame < time + 18 ? `${pan1} 50%` : "62% 50%",
						transform: `scale(${frame < time + 18 ? zoom1 : zoomCard})`,
						// no cartão o clipe fica rosado — +90° traz para a família verde da peça
						filter: frame < time + 18 ? undefined : "hue-rotate(90deg) saturate(0.95)",
					}}
				/>
			</div>

			{/* scrim da fase 1: só enquanto há texto grande sobre o vídeo */}
			{shrink < 0.3 && (
				<AbsoluteFill
					style={{
						background: "linear-gradient(to bottom, rgba(5,7,10,0.72) 0%, transparent 40%, transparent 65%, rgba(5,7,10,0.6) 100%)",
						opacity: 1 - shrink * 3,
					}}
				/>
			)}

			{/* rede de 7 nós em volta do cartão */}
			<div style={{position: "absolute", left: CENTER.x, top: CENTER.y, opacity: netIn}}>
				<svg width={RING_BOX} height={RING_BOX} viewBox={`-${RING_BOX / 2} -${RING_BOX / 2} ${RING_BOX} ${RING_BOX}`} style={{overflow: "visible"}}>
					{nodes.map((n, i) => {
						const next = nodes[(i + 1) % NODES];
						const pop = spring({
							frame: frame - (agentes + 4 + i * 5),
							fps,
							config: {damping: 12, mass: 0.6},
							durationInFrames: 12,
						});
						const link = interpolate(frame, [agentes + 12 + i * 5, agentes + 22 + i * 5], [270, 0], {
							extrapolateLeft: "clamp",
							extrapolateRight: "clamp",
						});
						return (
							<g key={i}>
								<line
									x1={n.x}
									y1={n.y}
									x2={next.x}
									y2={next.y}
									stroke={MQ.accent}
									strokeOpacity={0.45}
									strokeWidth={3}
									strokeDasharray={270}
									strokeDashoffset={link}
								/>
								<circle cx={n.x} cy={n.y} r={13 * pop} fill={MQ.accent} />
								<circle cx={n.x} cy={n.y} r={22 * pop} fill="none" stroke={MQ.accent} strokeOpacity={0.35} strokeWidth={2} />
							</g>
						);
					})}
					{/* anel externo girando devagar */}
					<circle
						cx={0}
						cy={0}
						r={RING_R + 40}
						fill="none"
						stroke={MQ.accent}
						strokeOpacity={0.16}
						strokeWidth={2}
						strokeDasharray="4 14"
						transform={`rotate(${frame * 0.4})`}
					/>
				</svg>
			</div>

			{/* impactos da fase 1, empilhados no topo */}
			<Impact at={calma} lines={["MAS CALMA."]} size={130} y={430} color={MQ.white} out={verdade - 4} />
			<Impact at={verdade} lines={["NÃO É MÁQUINA."]} size={130} y={430} color={MQ.accent} out={time - 6} />
			<Impact at={agentes} lines={["AGENTES DE IA"]} size={160} y={330} />
		</AbsoluteFill>
	);
};
