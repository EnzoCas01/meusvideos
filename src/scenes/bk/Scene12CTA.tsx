import React from "react";
import {AbsoluteFill, Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from "remotion";
import {cueLocalBK} from "../../utils/timeline-bk";
import {BK, DISPLAY_BK, SANS_BK} from "../../utils/theme-bk";

const SCENE = 11;

/**
 * CTA: a mesma loja moderna, escura, com o balão de comentário entrando e
 * o pedido grande — COMENTE "BURGER".
 */
export const Scene12CTA: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const ia = cueLocalBK(SCENE, "12-cta", /^inteligência$/);
	const comenta = cueLocalBK(SCENE, "12-cta", /^Comenta$/);
	const burger = cueLocalBK(SCENE, "12-cta", /^"BURGER"$/);

	const zoom = interpolate(frame, [0, 280], [1.16, 1.05], {easing: Easing.out(Easing.sin)});

	const chip = interpolate(frame, [ia, ia + 12, 146, 158], [0, 1, 1, 0], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	const popBalao = spring({frame: frame - comenta, fps, config: {damping: 11, mass: 0.7}, durationInFrames: 18});
	const popBurger = spring({frame: frame - burger, fps, config: {damping: 10, mass: 0.6}, durationInFrames: 16});
	const pulso = frame >= burger ? 1 + 0.05 * Math.sin((frame - burger) * 0.16) : 1;

	return (
		<AbsoluteFill style={{backgroundColor: BK.background}}>
			<Img
				src={staticFile("images/bk/cena11/07.jpg")}
				style={{
					width: "100%",
					height: "100%",
					objectFit: "cover",
					objectPosition: "50% 55%",
					transform: `scale(${zoom})`,
					filter: "saturate(0.92) contrast(1.05) brightness(0.4)",
				}}
			/>
			<AbsoluteFill style={{background: "linear-gradient(180deg, rgba(7,7,8,0.72) 0%, rgba(7,7,8,0.4) 42%, rgba(7,7,8,0.82) 100%)"}} />

			{/* aviso honesto, aparece enquanto a fala cita a IA */}
			<div
				style={{
					position: "absolute",
					top: 330,
					left: 0,
					width: "100%",
					display: "flex",
					justifyContent: "center",
					opacity: chip,
				}}
			>
				<div
					style={{
						fontFamily: SANS_BK,
						fontWeight: 700,
						fontSize: 30,
						letterSpacing: "0.2em",
						color: BK.grey,
						border: "2px solid rgba(255,255,255,0.22)",
						borderRadius: 40,
						padding: "14px 34px",
					}}
				>
					GERADO POR INTELIGÊNCIA ARTIFICIAL
				</div>
			</div>

			{/* balão de comentário */}
			{frame >= comenta && (
				<svg
					width={230}
					height={206}
					viewBox="0 0 230 206"
					style={{
						position: "absolute",
						top: 470,
						left: 425,
						opacity: Math.min(1, popBalao * 1.5),
						transform: `scale(${interpolate(popBalao, [0, 1], [1.8, 1])})`,
						filter: "drop-shadow(0 18px 44px rgba(0,0,0,0.6))",
					}}
				>
					<path
						d="M38 12 H192 A30 30 0 0 1 222 42 V118 A30 30 0 0 1 192 148 H96 L52 192 V148 H38 A30 30 0 0 1 8 118 V42 A30 30 0 0 1 38 12 Z"
						fill="rgba(20,15,6,0.55)"
						stroke={BK.gold}
						strokeWidth={9}
					/>
					<circle cx={77} cy={80} r={13} fill={BK.gold} />
					<circle cx={115} cy={80} r={13} fill={BK.gold} opacity={frame % 30 < 15 ? 1 : 0.35} />
					<circle cx={153} cy={80} r={13} fill={BK.gold} opacity={frame % 30 < 15 ? 0.35 : 1} />
				</svg>
			)}

			<div
				style={{
					position: "absolute",
					top: 726,
					left: 0,
					width: "100%",
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
				}}
			>
				<div style={{fontFamily: DISPLAY_BK, fontSize: 128, lineHeight: 0.95, color: BK.white, textShadow: "0 10px 44px rgba(0,0,0,0.8)"}}>
					COMENTE
				</div>
				{frame >= burger && (
					<div
						style={{
							fontFamily: DISPLAY_BK,
							fontSize: 172,
							lineHeight: 1.04,
							color: BK.gold,
							textShadow: "0 12px 60px rgba(0,0,0,0.85), 0 0 60px rgba(255,174,0,0.4)",
							whiteSpace: "nowrap",
							transform: `scale(${interpolate(popBurger, [0, 1], [1.5, 1]) * pulso})`,
						}}
					>
						&quot;BURGER&quot;
					</div>
				)}
			</div>
		</AbsoluteFill>
	);
};
