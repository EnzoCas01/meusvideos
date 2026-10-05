import React from "react";
import {
	AbsoluteFill,
	Easing,
	interpolate,
	spring,
	useCurrentFrame,
	useVideoConfig,
} from "remotion";
import {Impact} from "../../components/mq/Impact";
import {cueLocalMQ} from "../../utils/timeline-mq";
import {DISPLAY_MQ, MQ, SANS_MQ} from "../../utils/theme-mq";

const QUERO1 = cueLocalMQ(6, "11-quer", /^quero$/);
const CEM = cueLocalMQ(6, "12-teste", /^cem$/);
const FILL_END = cueLocalMQ(6, "12-teste", /^likes,$/) + 18; // a barra completa quando "likes" termina
const ZERO = cueLocalMQ(6, "13-zero", /^zero\.$/);
const AGENTES = cueLocalMQ(6, "14-mostro", /^agentes,$/);
const QUERO2 = cueLocalMQ(6, "15-cta2", /^quero,$/);
const SEGUE = cueLocalMQ(6, "15-cta2", /^segue$/);
const VAMOS = cueLocalMQ(6, "16-fim", /^Vamos$/);
const ROCKET_END = VAMOS + 72;
const ROCKET_X = 872;
const OUT_ROCKET = VAMOS - 8; // textos grandes saem antes do voo final

/** CTA: EU QUERO, a meta de 100 mil likes, DO ZERO e o foguete do fechamento. */
export const Scene7CTA: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();

	// pergunta da voz virou texto: entra no "montei", sai quando o EU QUERO pousa
	const askAt = cueLocalMQ(6, "11-quer", /^montei$/);
	const askIn = spring({frame: frame - askAt, fps, config: {damping: 15, mass: 0.9}, durationInFrames: 18});

	// barra/contador de likes — é META, não estatística
	const fill = interpolate(frame, [CEM, FILL_END], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});
	const likes = Math.round(fill * 100);
	const complete = frame >= FILL_END;
	const likesOut = interpolate(frame, [QUERO2 - 8, QUERO2], [1, 0], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	// re-ênfase do EU QUERO na segunda fala: stamp + anel
	const pulse = spring({frame: frame - QUERO2, fps, config: {damping: 12, mass: 0.6}, durationInFrames: 14});
	const ring = interpolate(pulse, [0, 1], [0.4, 1.5]);

	// foguete: sobe do nada atrás do texto
	const rise = interpolate(frame, [VAMOS, ROCKET_END], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.out(Easing.cubic),
	});
	const rocketY = interpolate(rise, [0, 1], [1780, 240]);
	const flame = 1 + 0.14 * Math.sin(frame * 1.35);

	// partículas de fundo subindo, discretas, o filme inteiro da cena
	const dust = Array.from({length: 10}, (_, i) => {
		const y = 2100 - ((frame * 1.4 + i * 210) % 2100);
		return {x: (i * 173) % 1040 + 20, y, o: 0.05 + (i % 3) * 0.03, r: 2 + (i % 2)};
	});

	return (
		<AbsoluteFill style={{backgroundColor: MQ.background}}>
			{/* brilho de fundo discreto + poeira subindo */}
			<div
				style={{
					position: "absolute",
					inset: 0,
					background: "radial-gradient(circle at 50% 42%, rgba(61,255,138,0.09) 0%, transparent 55%)",
				}}
			/>
			{dust.map((d, i) => (
				<div
					key={i}
					style={{
						position: "absolute",
						left: d.x,
						top: d.y,
						width: d.r * 2,
						height: d.r * 2,
						borderRadius: d.r,
						background: MQ.accent,
						opacity: d.o,
					}}
				/>
			))}

			{/* a pergunta, do jeito que a voz faz */}
			{frame >= askAt && frame < QUERO1 - 6 && (
				<div
					style={{
						position: "absolute",
						top: 820,
						left: 0,
						width: "100%",
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						fontFamily: DISPLAY_MQ,
						fontSize: 128,
						lineHeight: 0.98,
						color: MQ.white,
						textAlign: "center",
						opacity: Math.min(1, askIn * 2),
						transform: `translateY(-50%) scale(${interpolate(askIn, [0, 1], [1.15, 1])})`,
					}}
				>
					<div>COMO EU MONTEI</div>
					<div>ESSA MÁQUINA?</div>
				</div>
			)}

			{/* foguete (atrás do texto) + trilha */}
			{frame >= VAMOS && (
				<>
					{Array.from({length: 5}, (_, i) => {
						const tp = ((frame - VAMOS) * 0.05 + i * 0.2) % 1;
						return (
							<div
								key={i}
								style={{
									position: "absolute",
									left: ROCKET_X + Math.sin(i * 2.4) * 26,
									top: rocketY + 150 + tp * 320,
									width: 8,
									height: 8,
									borderRadius: 4,
									background: MQ.accent,
									opacity: (1 - tp) * 0.7,
								}}
							/>
						);
					})}
					<div style={{position: "absolute", left: ROCKET_X, top: rocketY, transform: "translate(-50%, -50%)"}}>
						<Rocket flame={flame} />
					</div>
				</>
			)}

			{/* re-ênfase: anel que expande do EU QUERO */}
			{frame >= QUERO2 && (
				<div
					style={{
						position: "absolute",
						left: 540,
						top: 780,
						width: 900,
						height: 380,
						transform: `translate(-50%, -50%) scale(${ring})`,
						border: `3px solid ${MQ.accent}`,
						borderRadius: 999,
						opacity: 1 - pulse,
					}}
				/>
			)}

			<Impact at={ZERO} lines={["DO ZERO"]} size={170} y={430} stamp rotate={-3} out={OUT_ROCKET} />
			<Impact at={QUERO1} lines={["EU QUERO"]} size={300} y={780} out={CEM + 10} />
			<Impact at={QUERO2} lines={["EU QUERO"]} size={300} y={780} stamp />
			<Impact at={VAMOS + 6} lines={["ATÉ ONDE CHEGA"]} size={110} y={340} color={MQ.white} />

			{/* o que o vídeo mostra, na fala "vou mostrar os agentes..." */}
			{frame >= AGENTES && frame < OUT_ROCKET && (
				<div
					style={{
						position: "absolute",
						top: 560,
						width: "100%",
						textAlign: "center",
						fontFamily: SANS_MQ,
						fontWeight: 700,
						fontSize: 40,
						letterSpacing: "0.08em",
						color: MQ.grey,
						opacity: interpolate(frame, [AGENTES, AGENTES + 10], [0, 1], {extrapolateRight: "clamp"}),
					}}
				>
					OS AGENTES · O PROCESSO · A MÁQUINA
				</div>
			)}

			{/* meta de likes: coração + barra + contador (sai quando o EU QUERO volta) */}
			{frame >= CEM && frame < QUERO2 && (
				<>
					<div style={{position: "absolute", left: 540, top: 960, transform: "translate(-50%, -50%)", opacity: likesOut}}>
						<Heart pop={spring({frame: frame - CEM, fps, config: {damping: 12, mass: 0.7}, durationInFrames: 12})} beat={1 + 0.06 * Math.sin(frame * 0.9)} />
					</div>
					<div style={{position: "absolute", left: 160, top: 1020, width: 760, height: 26, borderRadius: 13, background: "rgba(255,255,255,0.09)", opacity: likesOut}}>
						<div
							style={{
								width: 760 * fill,
								height: 26,
								borderRadius: 13,
								background: MQ.accent,
								boxShadow: complete ? "0 0 34px rgba(61,255,138,0.65)" : "none",
							}}
						/>
					</div>
					<div
						style={{
							position: "absolute",
							top: 1120,
							width: "100%",
							textAlign: "center",
							fontFamily: DISPLAY_MQ,
							fontSize: 88,
							color: complete ? MQ.accent : MQ.white,
							textShadow: complete ? "0 0 40px rgba(61,255,138,0.45)" : "none",
							opacity: likesOut,
						}}
					>
						{likes} MIL
					</div>
				</>
			)}

			{/* chamada final */}
			{frame >= SEGUE && (
				<div
					style={{
						position: "absolute",
						top: 1180,
						width: "100%",
						textAlign: "center",
						fontFamily: SANS_MQ,
						fontWeight: 800,
						fontSize: 40,
						color: MQ.white,
						opacity: interpolate(frame, [SEGUE, SEGUE + 8], [0, 1], {extrapolateRight: "clamp"}),
					}}
				>
					SEGUE O PERFIL · MANDA PRA ALGUÉM
				</div>
			)}
		</AbsoluteFill>
	);
};

const Heart: React.FC<{pop: number; beat: number}> = ({pop, beat}) => (
	<svg width={104} height={94} viewBox="0 0 100 90" style={{transform: `scale(${pop * beat})`}}>
		<path
			d="M50 84 C18 60 6 44 6 29 A21 21 0 0 1 50 18 A21 21 0 0 1 94 29 C94 44 82 60 50 84 Z"
			fill={MQ.accent}
		/>
	</svg>
);

const Rocket: React.FC<{flame: number}> = ({flame}) => (
	<svg width={150} height={420} viewBox="0 0 100 280" fill="none">
		<g transform="translate(50 0)">
			<path d="M0 8 C0 8 -26 62 -26 150 L26 150 C26 62 0 8 0 8 Z" fill={MQ.white} />
			<circle cx={0} cy={86} r={13} fill="#0B0D12" stroke={MQ.accent} strokeWidth={4} />
			<path d="M-26 118 L-46 172 L-26 160 Z" fill={MQ.grey} />
			<path d="M26 118 L46 172 L26 160 Z" fill={MQ.grey} />
			<path
				d={`M-14 152 C-14 196 0 226 0 226 C0 226 14 196 14 152 Z`}
				fill={MQ.accent}
				transform={`translate(0 152) scale(1 ${flame}) translate(0 -152)`}
			/>
			<path d="M-7 152 C-7 180 0 198 0 198 C0 198 7 180 7 152 Z" fill="#FFD23F" opacity={0.85} transform={`translate(0 152) scale(1 ${flame * 1.1}) translate(0 -152)`} />
		</g>
	</svg>
);
