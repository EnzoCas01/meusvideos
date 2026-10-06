import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {SceneAM} from "../../components/alvomanage/SceneAM";
import {PhoneAM} from "../../components/alvomanage/FramesAM";
import {TextAM, LabelAM} from "../../components/alvomanage/TextAM";
import {BubbleIconAM, OsCardAM} from "../../components/alvomanage/OsCardAM";
import {kf, land, ramp} from "../../components/alvomanage/motion-am";
import {AM, FONT_AM} from "../../utils/theme-am";
import {SCENE_DURATIONS_AM, cueAM} from "../../utils/timing-am";

const I = 5;

/**
 * am06 — "E com o plano de WhatsApp, quando a OS fica pronta, o aviso chega
 * sozinho no celular do cliente."
 * DRAWING ONLY — no capture, no WhatsApp logo or app imitation.
 * 1: green generic "Plano WhatsApp" pill lands on the drawn OS card.
 * 2: status flips "Em aberto" -> "Pronta" (stamp).
 * 3: a message bubble leaves the card BY ITSELF (no cursor) and lands as a
 *    notification on the customer's drawn phone. Label: "aviso automático".
 */
export const Scene06Notify: React.FC = () => {
	const frame = useCurrentFrame();
	const D = SCENE_DURATIONS_AM[I];
	const c = cueAM(I, "am06");
	const tPlano = c.word("plano");
	const tQuando = c.word("quando");
	const tPronta = c.word("pronta");
	const tAviso = c.word("o aviso");
	const tCel = c.word("celular");

	// The card holds "Pronta" until the word "o aviso" (the stamp lands at
	// pronta+4; leaving earlier hid it after ~7 frames with the faster voice).
	const move = ramp(frame, tAviso - 1, 10);
	const cardX = 540 + (300 - 540) * move;
	const cardY = 980 + (560 - 980) * move;
	const cardS = 1 - 0.42 * move;
	const phoneIn = land(frame, tAviso - 2, 14);

	return (
		<SceneAM duration={D} entry="rise" glow={AM.greenSoft}>
			<OsCardAM x={cardX} y={cardY} scale={cardS} pillAt={tPlano} readyAt={tPronta} />

			<TextAM at={2} y={280} size={78} mode="rise" until={tQuando - 2}>
				com o plano de <span style={{color: AM.green}}>WhatsApp</span>
			</TextAM>
			<TextAM at={tQuando} y={280} size={84} mode="rise" until={tAviso - 1}>
				quando fica <span style={{color: AM.green}}>pronta</span>
			</TextAM>

			{frame >= tAviso - 4 && (
				<AbsoluteFill style={{opacity: phoneIn}}>
					<PhoneAM
						x={740}
						y={1300 + (1 - phoneIn) * 200}
						screenW={400}
						screenH={820}
						rotate={6}
					>
						<AbsoluteFill style={{background: "linear-gradient(180deg, #121A2E, #07080C)"}}>
							<div
								style={{
									marginTop: 150,
									textAlign: "center",
									fontFamily: FONT_AM,
									fontWeight: 800,
									fontSize: 90,
									color: AM.white,
									letterSpacing: -2,
								}}
							>
								9:41
							</div>
						</AbsoluteFill>
					</PhoneAM>
				</AbsoluteFill>
			)}
			<Message frame={frame} t0={tAviso + 2} t1={tCel} />
			<LabelAM at={tCel + 4} x={540} y={1780} color={AM.green}>
				aviso automático
			</LabelAM>
		</SceneAM>
	);
};

/** The bubble: leaves the card, travels on an arc, lands as a notification. */
const Message: React.FC<{frame: number; t0: number; t1: number}> = ({frame, t0, t1}) => {
	if (frame < t0) return null;
	const t = ramp(frame, t0, Math.max(10, t1 - t0));
	const landed = land(frame, t1, 10);
	// from the card (top-left) to the phone's notification slot (right)
	const x = kf(frame, [t0, t1], [300, 740]);
	const yLin = kf(frame, [t0, t1], [640, 1060]);
	const y = yLin - Math.sin(t * Math.PI) * 180;
	const flying = frame < t1;
	const w = flying ? 150 : 520;
	return (
		<div
			style={{
				position: "absolute",
				left: x - w / 2,
				top: y - 60,
				width: w,
				minHeight: 120,
				borderRadius: flying ? 60 : 30,
				background: flying ? AM.green : "rgba(250,250,250,0.96)",
				display: "flex",
				alignItems: "center",
				gap: 18,
				padding: flying ? "0 0 0 40px" : "22px 26px",
				boxSizing: "border-box",
				fontFamily: FONT_AM,
				transform: `scale(${flying ? 1 : 0.85 + 0.15 * landed}) rotate(${flying ? 0 : 6}deg)`,
				boxShadow: `0 20px 60px rgba(0,0,0,0.55), 0 0 60px ${AM.greenSoft}`,
				filter: flying && t > 0.1 && t < 0.9 ? "blur(1.5px)" : undefined,
			}}
		>
			<div
				style={{
					width: 70,
					height: 70,
					borderRadius: 18,
					background: flying ? "transparent" : AM.green,
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					flexShrink: 0,
				}}
			>
				<BubbleIconAM size={flying ? 70 : 50} color={flying ? "#06210F" : "#FFFFFF"} />
			</div>
			{!flying && (
				<div style={{color: "#15171C"}}>
					<div style={{fontSize: 24, fontWeight: 700, color: "#555B66"}}>Loja Exemplo · agora</div>
					<div style={{fontSize: 30, fontWeight: 800, lineHeight: 1.15}}>Seu aparelho está pronto! ✓</div>
				</div>
			)}
		</div>
	);
};
