import React from "react";
import {AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from "remotion";
import {RoleIcon, type RoleKind} from "../../components/mq/Icons";
import {cueLocalMQ} from "../../utils/timeline-mq";
import {MQ, SANS_MQ, DISPLAY_MQ} from "../../utils/theme-mq";

/** Cada card entra exatamente na palavra falada. */
const CARDS: {kind: RoleKind; name: string; word: RegExp}[] = [
	{kind: "diretor", name: "Diretor", word: /^Diretor\.$/},
	{kind: "motion", name: "Motion", word: /^Motion\.$/},
	{kind: "revisor", name: "Revisor", word: /^Revisor\.$/},
	{kind: "narracao", name: "Narração", word: /^Narração\.$/},
	{kind: "som", name: "Som", word: /^Som\.$/},
	{kind: "imagem", name: "Imagem e Vídeo", word: /^Imagem$/},
	{kind: "render", name: "Render", word: /^Render\.$/},
];

const HEAD_AT = cueLocalMQ(2, "05-lista", /^Diretor\.$/);

/** Lista: os 7 agentes aparecem um a um, no ritmo da fala; o card nomeado acende. */
export const Scene3Lista: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();

	// o card ativo é o último cuja palavra já foi dita
	let active = -1;
	CARDS.forEach((c, i) => {
		if (frame >= cueLocalMQ(2, "05-lista", c.word)) active = i;
	});

	return (
		<AbsoluteFill style={{backgroundColor: MQ.background}}>
			{/* glow discreto no topo, atrás do header */}
			<div
				style={{
					position: "absolute",
					inset: 0,
					background: "radial-gradient(circle at 50% 12%, rgba(61,255,138,0.07) 0%, transparent 45%)",
				}}
			/>

			{/* header: o que esta lista é */}
			<div
				style={{
					position: "absolute",
					top: 190,
					width: "100%",
					textAlign: "center",
					opacity: interpolate(frame, [HEAD_AT, HEAD_AT + 8], [0, 1], {extrapolateRight: "clamp"}),
					transform: `translateY(${interpolate(frame, [HEAD_AT, HEAD_AT + 12], [24, 0], {
						extrapolateLeft: "clamp",
						extrapolateRight: "clamp",
						easing: Easing.out(Easing.cubic),
					})}px)`,
				}}
			>
				<div style={{fontFamily: DISPLAY_MQ, fontSize: 96, lineHeight: 1, color: MQ.white, letterSpacing: "0.03em"}}>
					O TIME
				</div>
				<div
					style={{
						marginTop: 10,
						fontFamily: SANS_MQ,
						fontWeight: 700,
						fontSize: 34,
						letterSpacing: "0.22em",
						color: MQ.accent,
					}}
				>
					7 AGENTES
				</div>
			</div>

			{CARDS.map((card, i) => {
				const at = cueLocalMQ(2, "05-lista", card.word);
				const pop = spring({frame: frame - at, fps, config: {damping: 15, mass: 0.9}, durationInFrames: 18});
				const isActive = i === active;
				const wasActive = active > i; // já foi nomeado: fica aceso, mais discreto
				const lit = isActive ? 1 : wasActive ? 0.55 : 0;
				const litIn = interpolate(frame, [at, at + 10], [0, 1], {
					extrapolateLeft: "clamp",
					extrapolateRight: "clamp",
				});

				return (
					<div
						key={card.kind}
						style={{
							position: "absolute",
							left: 70,
							top: 340 + i * 128,
							width: 940,
							height: 106,
							borderRadius: 20,
							background: MQ.panel,
							border: `1.5px solid ${isActive ? MQ.accent : MQ.panelBorder}`,
							boxShadow: isActive ? "0 0 44px rgba(61,255,138,0.16), 0 16px 40px rgba(0,0,0,0.45)" : "0 10px 30px rgba(0,0,0,0.35)",
							display: "flex",
							alignItems: "center",
							opacity: pop,
							transform: `translateX(${(1 - pop) * -70}px) scale(${isActive ? interpolate(litIn, [0, 1], [1, 1.035]) : 1})`,
						}}
					>
						<div
							style={{
								position: "absolute",
								left: 0,
								top: 14,
								bottom: 14,
								width: 5,
								borderRadius: 3,
								background: MQ.accent,
								transform: `scaleY(${litIn})`,
								opacity: lit,
							}}
						/>
						<div style={{marginLeft: 40, display: "flex", alignItems: "center", opacity: 0.4 + litIn * 0.6}}>
							<RoleIcon kind={card.kind} size={56} color={MQ.accent} />
						</div>
						<div
							style={{
								marginLeft: 36,
								fontFamily: SANS_MQ,
								fontWeight: 800,
								fontSize: 52,
								color: isActive ? MQ.white : wasActive ? MQ.white : MQ.grey,
								letterSpacing: "0.01em",
							}}
						>
							{card.name}
						</div>
						<div
							style={{
								marginLeft: "auto",
								marginRight: 44,
								fontFamily: SANS_MQ,
								fontWeight: 700,
								fontSize: 30,
								color: isActive ? MQ.accent : MQ.grey,
								opacity: litIn,
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
