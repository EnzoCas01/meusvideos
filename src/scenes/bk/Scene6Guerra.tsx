import React from "react";
import {AbsoluteFill, Easing, OffthreadVideo, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from "remotion";
import {ImpactBK} from "../../components/bk/ImpactBK";
import {cueLocalBK} from "../../utils/timeline-bk";
import {BK, DISPLAY_BK} from "../../utils/theme-bk";

const SCENE = 5;

// beats de fala (locais): guerra 17 · pública 40 · provocação 62 · provocação. 97
const BK_SHRINK = 62; // 1ª provocação: o outdoor encolhe
const MC_ENTER = 62; // ...e o próximo entra INTEIRO, de tela cheia
const MC_SHRINK = 97; // 2ª provocação: encolhe para o duelo
const VS_IN = 97;

type Box = {left: number; top: number; width: number; height: number; radius: number};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const toCard = (full: Box, card: Box, t: number): React.CSSProperties => ({
	position: "absolute",
	left: lerp(full.left, card.left, t),
	top: lerp(full.top, card.top, t),
	width: lerp(full.width, card.width, t),
	height: lerp(full.height, card.height, t),
	borderRadius: lerp(full.radius, card.radius, t),
	overflow: "hidden",
});

/**
 * Guerra de propaganda: o outdoor enche a tela, encolhe para a esquerda na
 * 1ª provocação; o outro entra INTEIRO em tela cheia e encolhe para a direita
 * na 2ª — ninguém aparece cortado do nada — e o "VS" fecha o duelo.
 */
export const Scene6Guerra: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const guerra = cueLocalBK(SCENE, "06-guerra", /^guerra$/);

	const bkShrink = spring({frame: frame - BK_SHRINK, fps, config: {damping: 17, mass: 0.85}, durationInFrames: 20});
	const mcShrink = spring({frame: frame - MC_SHRINK, fps, config: {damping: 17, mass: 0.85}, durationInFrames: 20});
	const mcEnter = interpolate(frame, [MC_ENTER, MC_ENTER + 17], [1080, 0], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.out(Easing.cubic),
	});

	const FULL: Box = {left: 0, top: 0, width: 1080, height: 1920, radius: 0};
	const CARD_L: Box = {left: 58, top: 300, width: 462, height: 920, radius: 28};
	const CARD_R: Box = {left: 560, top: 300, width: 462, height: 920, radius: 28};

	const vsPop = spring({frame: frame - VS_IN, fps, config: {damping: 11, mass: 0.6}, durationInFrames: 16});
	const vsPulse = 1 + 0.05 * Math.sin(Math.max(0, frame - VS_IN) * 0.18);

	return (
		<AbsoluteFill style={{backgroundColor: BK.background}}>
			{/* Burger King: tela cheia primeiro, DEPOIS encolhe para a esquerda */}
			<div style={{...toCard(FULL, CARD_L, bkShrink), boxShadow: "0 26px 80px rgba(0,0,0,0.75)"}}>
				<OffthreadVideo
					src={staticFile("videos/bk/cena6/clip-01.mp4")}
					startFrom={120}
					muted
					style={{width: "100%", height: "100%", objectFit: "cover", filter: "saturate(1.02) brightness(0.9) contrast(1.05)"}}
				/>
			</div>

			{/* McDonald's: entra INTEIRO pela borda em tela cheia, DEPOIS encolhe para a direita */}
			<div style={{...toCard(FULL, CARD_R, mcShrink), transform: `translateX(${mcEnter}px)`, boxShadow: "0 26px 80px rgba(0,0,0,0.75)"}}>
				<OffthreadVideo
					src={staticFile("videos/bk/cena6/clip-04.mp4")}
					startFrom={90}
					muted
					style={{width: "100%", height: "100%", objectFit: "cover", filter: "saturate(1.02) brightness(0.9) contrast(1.05)"}}
				/>
			</div>

			{/* o duelo */}
			{frame >= VS_IN && (
				<div
					style={{
						position: "absolute",
						left: 440,
						top: 660,
						width: 200,
						height: 200,
						borderRadius: "50%",
						background: BK.gold,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						boxShadow: "0 16px 60px rgba(0,0,0,0.65), 0 0 70px rgba(255,174,0,0.45)",
						opacity: Math.min(1, vsPop * 1.6),
						transform: `scale(${interpolate(vsPop, [0, 1], [1.7, 1]) * vsPulse})`,
					}}
				>
					<span style={{fontFamily: DISPLAY_BK, fontSize: 88, color: "#151005"}}>VS</span>
				</div>
			)}

			<ImpactBK at={guerra} lines={["GUERRA", "DE MARCA"]} size={128} color={BK.gold} y={860} out={BK_SHRINK - 7} />
			<ImpactBK at={MC_ENTER} lines={["PROVOCAÇÃO"]} size={120} color={BK.white} y={140} out={MC_SHRINK - 4} stroke />
		</AbsoluteFill>
	);
};
