import React from "react";
import {
	AbsoluteFill,
	Easing,
	interpolate,
	spring,
	useCurrentFrame,
	useVideoConfig,
} from "remotion";
import {RoleIcon, type RoleKind} from "../../components/mq/Icons";
import {cueLocalMQ} from "../../utils/timeline-mq";
import {MQ, SANS_MQ, DISPLAY_MQ} from "../../utils/theme-mq";

/** Cada papel acende na palavra falada; o verbo curto é o que ele faz. */
const STATIONS: {kind: RoleKind; name: string; verb: string; word: RegExp}[] = [
	{kind: "diretor", name: "DIRETOR", verb: "ORGANIZA", word: /^Diretor$/},
	{kind: "motion", name: "MOTION", verb: "CRIA E ANIMA", word: /^Motion$/},
	{kind: "narracao", name: "NARRAÇÃO", verb: "CONTA A HISTÓRIA", word: /^Narração$/},
	{kind: "som", name: "SOM", verb: "CRIA A ATMOSFERA", word: /^Som$/},
	{kind: "imagem", name: "IMAGEM E VÍDEO", verb: "CUIDA DO MATERIAL", word: /^Imagem$/},
	{kind: "revisor", name: "REVISOR", verb: "PROCURA PROBLEMAS", word: /^Revisor$/},
	{kind: "render", name: "RENDER", verb: "VÍDEO FINAL", word: /^Render$/},
];

const BAR_CUE = cueLocalMQ(3, "07-papeis", /^Render$/);
const BAR_LEN = 26; // a barra completa DENTRO da cena: Render em 410, cena acaba em 462
const ROLE_CUES = STATIONS.map((s) => cueLocalMQ(3, "07-papeis", s.word));

/** Sistema: a ideia cai na esteira, passa por cada agente na palavra exata; o Render devolve o vídeo final. */
export const Scene4Sistema: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const idea = cueLocalMQ(3, "06-ideia", /^ideia\.$/);

	// lâmpada: pousa com bounce, corre pela esteira e PARA no dock; some quando o primeiro papel acende
	const lampPop = spring({frame: frame - idea, fps, config: {damping: 10, mass: 0.8}, durationInFrames: 18});
	const lampRun = interpolate(frame, [idea + 52, idea + 88], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.inOut(Easing.cubic),
	});
	const lampX = 300 + lampRun * 240;
	const lampY = 300 + lampRun * 650;
	const lampScale = interpolate(lampRun, [0.7, 1], [1, 0.72], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
	const lampOpacity = interpolate(frame, [ROLE_CUES[0], ROLE_CUES[0] + 10], [1, 0], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	// dock: contorno vazio que aparece junto com a corrida da lâmpada e acende no primeiro papel
	const dockIn = interpolate(frame, [idea + 56, idea + 72], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	// estação: o papel ativo é o último cuja palavra já foi dita
	let active = -1;
	ROLE_CUES.forEach((c, i) => {
		if (frame >= c) active = i;
	});
	const role = active >= 0 ? STATIONS[active] : null;
	const roleAt = active >= 0 ? ROLE_CUES[active] : 0;
	const swap = spring({frame: frame - roleAt, fps, config: {damping: 15, mass: 0.9}, durationInFrames: 16});
	const verbReveal = interpolate(frame, [roleAt + 6, roleAt + 20], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.out(Easing.cubic),
	});

	// partículas do acento subindo da estação (posições determinísticas)
	const particles = Array.from({length: 6}, (_, i) => {
		const speed = 0.010 + (i % 3) * 0.004;
		const p = ((frame - ROLE_CUES[0]) * speed + i * 0.19) % 1;
		const x = 220 + ((i * 137) % 640);
		return {x, y: 1120 - p * 480, o: Math.sin(Math.PI * p) * 0.5, r: 3 + (i % 3)};
	});

	// barra de render → 100% → vira celular
	const fill = interpolate(frame, [BAR_CUE, BAR_CUE + BAR_LEN], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});
	const done = frame >= BAR_CUE + BAR_LEN;
	const phonePop = spring({frame: frame - (BAR_CUE + BAR_LEN + 4), fps, config: {damping: 12, mass: 0.8}, durationInFrames: 16});
	const phoneScale = interpolate(phonePop, [0, 1], [0.55, 1]);
	const stationOut = interpolate(frame, [BAR_CUE + BAR_LEN + 4, BAR_CUE + BAR_LEN + 14], [1, 0], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});
	const barOut = interpolate(frame, [BAR_CUE + BAR_LEN + 26, BAR_CUE + BAR_LEN + 34], [1, 0], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	return (
		<AbsoluteFill style={{backgroundColor: MQ.background}}>
			{/* progresso dos 7 papéis no topo */}
			<div
				style={{
					position: "absolute",
					top: 212,
					left: 540 - 354,
					width: 708,
					height: 40,
					opacity: dockIn,
				}}
			>
				<div style={{position: "absolute", top: 18, left: 20, right: 20, height: 3, borderRadius: 2, background: "rgba(255,255,255,0.10)"}} />
				{ROLE_CUES.map((c, i) => {
					const lit = interpolate(frame, [c, c + 8], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
					return (
						<div
							key={i}
							style={{
								position: "absolute",
								left: i * 114,
								top: 8,
								width: 24,
								height: 24,
								borderRadius: 12,
								background: lit > 0 ? MQ.accent : "transparent",
								border: `2px solid ${lit > 0 ? MQ.accent : "rgba(255,255,255,0.25)"}`,
								boxShadow: lit > 0 ? "0 0 18px rgba(61,255,138,0.5)" : "none",
								opacity: lit > 0 ? lit : 1,
								transform: `scale(${interpolate(lit, [0, 1], [0.6, 1])})`,
							}}
						/>
					);
				})}
			</div>

			{/* esteira */}
			<div style={{position: "absolute", left: 120, right: 120, top: 452, height: 8, borderRadius: 4, background: MQ.panel}}>
				{Array.from({length: 14}, (_, i) => {
					const x = ((i * 76 + frame * 2.2) % 840) + 0;
					return (
						<div
							key={i}
							style={{
								position: "absolute",
								left: x,
								top: 2,
								width: 26,
								height: 4,
								borderRadius: 2,
								background: MQ.accentDim,
							}}
						/>
					);
				})}
			</div>

			{/* lâmpada da ideia */}
			{frame >= idea && lampOpacity > 0 && (
				<div
					style={{
						position: "absolute",
						left: lampX,
						top: lampY,
						transform: `translate(-50%, -50%) scale(${lampScale * lampPop})`,
						opacity: lampOpacity,
						filter: "drop-shadow(0 0 26px rgba(61,255,138,0.4))",
					}}
				>
					<Lamp />
				</div>
			)}

			{/* dock vazio → estação da linha de montagem */}
			<svg
				width={904}
				height={424}
				viewBox="0 0 904 424"
				style={{
					position: "absolute",
					left: 88,
					top: 738,
					opacity: role ? 0 : dockIn,
				}}
			>
				<rect x={3} y={3} width={898} height={418} rx={28} fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth={2} strokeDasharray="10 12" />
			</svg>
			{role && (
				<div
					style={{
						position: "absolute",
						left: 100,
						top: 740,
						width: 880,
						height: 420,
						borderRadius: 28,
						background: MQ.panel,
						border: `2px solid ${MQ.accentDim}`,
						boxShadow: "0 30px 90px rgba(0,0,0,0.5), 0 0 60px rgba(61,255,138,0.07)",
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						justifyContent: "center",
						opacity: stationOut,
						transform: `translateY(${(1 - swap) * 26}px) scale(${interpolate(swap, [0, 1], [0.92, 1])})`,
					}}
				>
					<div style={{transform: `scale(${interpolate(swap, [0, 1], [0.6, 1])})`, filter: "drop-shadow(0 0 30px rgba(61,255,138,0.35))"}}>
						<RoleIcon kind={role.kind} size={96} color={MQ.accent} />
					</div>
					<div
						style={{
							marginTop: 22,
							fontFamily: DISPLAY_MQ,
							fontSize: 96,
							lineHeight: 1,
							color: MQ.white,
							letterSpacing: "0.02em",
						}}
					>
						{role.name}
					</div>
					<div
						style={{
							marginTop: 14,
							fontFamily: SANS_MQ,
							fontWeight: 800,
							fontSize: 44,
							color: MQ.accent,
							letterSpacing: "0.06em",
							clipPath: `inset(0 ${(1 - verbReveal) * 100}% 0 0)`,
						}}
					>
						{role.verb}
					</div>
				</div>
			)}

			{/* partículas do acento: o sistema trabalhando */}
			{active >= 0 &&
				stationOut > 0 &&
				particles.map((pt, i) => (
					<div
						key={i}
						style={{
							position: "absolute",
							left: pt.x,
							top: pt.y,
							width: pt.r * 2,
							height: pt.r * 2,
							borderRadius: pt.r,
							background: MQ.accent,
							opacity: pt.o * stationOut,
						}}
					/>
				))}

			{/* barra de render → 100% (acima da faixa da legenda) */}
			{frame >= BAR_CUE && barOut > 0 && (
				<div style={{position: "absolute", left: 100, top: 1195, width: 880, height: 20, borderRadius: 10, background: "rgba(255,255,255,0.08)", opacity: barOut}}>
					<div
						style={{
							width: 880 * fill,
							height: 20,
							borderRadius: 10,
							background: MQ.accent,
							boxShadow: done ? "0 0 30px rgba(61,255,138,0.6)" : "0 0 24px rgba(61,255,138,0.5)",
						}}
					/>
					{done && (
						<div
							style={{
								position: "absolute",
								right: 16,
								top: -52,
								fontFamily: SANS_MQ,
								fontWeight: 800,
								fontSize: 36,
								color: MQ.accent,
							}}
						>
							100%
						</div>
					)}
				</div>
			)}

			{/* o produto da máquina: o celular */}
			{phonePop > 0 && (
				<div
					style={{
						position: "absolute",
						left: 540,
						top: 810,
						width: 380,
						height: 760,
						transform: `translate(-50%, -50%) scale(${phoneScale})`,
						borderRadius: 50,
						border: `6px solid ${MQ.accent}`,
						boxShadow: "0 0 70px rgba(61,255,138,0.25)",
						opacity: phonePop,
						overflow: "hidden",
					}}
				>
					{/* linha de varredura: o vídeo "sendo gerado" */}
					<div
						style={{
							position: "absolute",
							left: 0,
							right: 0,
							height: 4,
							background: MQ.accent,
							opacity: 0.7,
							top: ((frame - (BAR_CUE + BAR_LEN + 4)) * 26) % 760,
							boxShadow: "0 0 22px rgba(61,255,138,0.8)",
						}}
					/>
				</div>
			)}
		</AbsoluteFill>
	);
};

const Lamp: React.FC = () => (
	<svg width={150} height={190} viewBox="0 0 100 128" fill="none">
		<g stroke={MQ.accent} strokeWidth={4} strokeLinecap="round">
			<circle cx={50} cy={48} r={28} fill="rgba(61,255,138,0.12)" />
			<path d="M40 76 L40 88 L60 88 L60 76" />
			<path d="M42 96 L58 96" />
			<path d="M50 6 L50 12 M14 20 L20 26 M86 20 L80 26 M8 52 L14 52 M92 52 L86 52" />
			<path d="M44 52 C44 42 56 42 56 52 C56 58 50 58 50 64" strokeWidth={3} />
		</g>
	</svg>
);
