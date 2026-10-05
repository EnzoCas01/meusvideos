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
import {RoleIcon, type RoleKind} from "../../components/mq/Icons";
import {cueLocalMDD} from "../../utils/timeline-mdd";
import {MDD, SANS_MDD} from "../../utils/theme-mdd";

/** Cada card acende exatamente na palavra falada; Imagem e Vídeo citados juntos viram um card. */
const CARDS: {kind: RoleKind; name: string; word: RegExp}[] = [
	{kind: "diretor", name: "Diretor", word: /^Diretor$/},
	{kind: "motion", name: "Motion", word: /^Motion$/},
	{kind: "narracao", name: "Narração", word: /^Narração$/},
	{kind: "som", name: "Som", word: /^Som$/},
	{kind: "imagem", name: "Imagem & Vídeo", word: /^Imagem$/},
	{kind: "revisor", name: "Revisor", word: /^Revisor$/},
	{kind: "render", name: "Render", word: /^Render$/},
];

const TOP = 280;
const STEP = 120;

/** Os agentes: a rede ao fundo (nítida, apagada) e os 7 cards acendendo um a um. */
export const Scene3Agentes: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const label = cueLocalMDD(2, "04-ideia", /^agente$/);

	return (
		<AbsoluteFill style={{backgroundColor: MDD.background}}>
			{/* textura da rede: nítida, bem apagada — nunca borrada */}
			<AbsoluteFill style={{opacity: 0.14}}>
				<OffthreadVideo
					src={staticFile("videos/mdd-rede/clip-02.mp4")}
					muted
					playbackRate={0.65}
					style={{width: "100%", height: "100%", objectFit: "cover"}}
				/>
			</AbsoluteFill>
			<AbsoluteFill style={{backgroundColor: "rgba(7,7,9,0.72)"}} />

			<div
				style={{
					position: "absolute",
					top: 190,
					width: "100%",
					textAlign: "center",
					fontFamily: SANS_MDD,
					fontWeight: 700,
					fontSize: 38,
					letterSpacing: "0.14em",
					color: MDD.grey,
					opacity: interpolate(frame, [label, label + 8], [0, 1], {
						extrapolateLeft: "clamp",
						extrapolateRight: "clamp",
					}),
				}}
			>
				CADA AGENTE ENTRA EM AÇÃO
			</div>

			{CARDS.map((card, i) => {
				const at = cueLocalMDD(2, "05-agentes", card.word);
				const pop = spring({frame: frame - at, fps, config: {damping: 200, mass: 0.9}, durationInFrames: 16});
				const ghost = interpolate(frame, [20 + i * 5, 34 + i * 5], [0, 1], {
					extrapolateLeft: "clamp",
					extrapolateRight: "clamp",
				});
				return (
					<div
						key={card.kind}
						style={{
							position: "absolute",
							left: 70,
							top: TOP + i * STEP,
							width: 940,
							height: 108,
							borderRadius: 20,
							background: "rgba(255,255,255,0.07)",
							border: `1.5px solid ${MDD.panelBorder}`,
							display: "flex",
							alignItems: "center",
							opacity: Math.max(pop, ghost),
							transform: `translateX(${(1 - Math.max(pop, ghost)) * -60}px)`,
						}}
					>
						<div
							style={{
								position: "absolute",
								left: 0,
								top: 12,
								bottom: 12,
								width: 5,
								borderRadius: 3,
								background: MDD.accent,
								opacity: pop,
							}}
						/>
						<div style={{marginLeft: 40, display: "flex", alignItems: "center", opacity: pop}}>
							<RoleIcon kind={card.kind} size={54} color={MDD.accent} />
						</div>
						<div
							style={{
								marginLeft: 34,
								fontFamily: SANS_MDD,
								fontWeight: 800,
								fontSize: 50,
								color: MDD.white,
								opacity: pop,
								letterSpacing: "0.01em",
							}}
						>
							{card.name}
						</div>
						<div
							style={{
								marginLeft: "auto",
								marginRight: 44,
								fontFamily: SANS_MDD,
								fontWeight: 700,
								fontSize: 30,
								color: MDD.grey,
							}}
						>
							{String(i + 1).padStart(2, "0")}
						</div>
					</div>
				);
			})}
		</AbsoluteFill>
	);
};
