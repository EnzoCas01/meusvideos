import React from "react";
import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame} from "remotion";
import {MarketCap} from "../../components/gg/MarketCap";
import {cueLocalGG} from "../../utils/timeline-gg";
import {GG, MARKET_CAP_GG} from "../../utils/theme-gg";

const SCENE = 0;

/**
 * Abertura: split-screen garagem de 1998 x Googleplex hoje, ligados por um
 * feixe de luz que atravessa a costura central; embaixo, o valor sobe em
 * zeros. Uma ideia só, sem outro efeito por cima.
 */
export const Scene1Split: React.FC = () => {
	const frame = useCurrentFrame();
	const vale = cueLocalGG(SCENE, "01-gancho", /^vale$/);

	const zoomL = interpolate(frame, [0, 91], [1.08, 1.18], {easing: Easing.out(Easing.sin)});
	const zoomR = interpolate(frame, [0, 91], [1.05, 0.98], {easing: Easing.out(Easing.sin)});
	const beam = interpolate(frame, [vale - 12, vale + 6], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.out(Easing.cubic),
	});
	const seamPulse = 0.18 + 0.12 * (0.5 + 0.5 * Math.sin(frame * 0.35));
	const tipX = 200 + 680 * beam;

	return (
		<AbsoluteFill style={{backgroundColor: GG.background}}>
			<div style={{position: "absolute", left: 0, top: 0, width: 540, height: 1920, overflow: "hidden"}}>
				<Img
					src={staticFile("images/gg/garagem/01.jpg")}
					style={{
						width: "100%",
						height: "100%",
						objectFit: "cover",
						objectPosition: "60% 50%",
						transform: `scale(${zoomL})`,
						filter: "saturate(0.85) brightness(0.72)",
					}}
				/>
			</div>
			<div style={{position: "absolute", left: 540, top: 0, width: 540, height: 1920, overflow: "hidden"}}>
				<Img
					src={staticFile("images/gg/googleplex/04.jpg")}
					style={{
						width: "100%",
						height: "100%",
						objectFit: "cover",
						objectPosition: "30% 58%",
						transform: `scale(${zoomR})`,
						filter: "saturate(1.05) brightness(0.78)",
					}}
				/>
			</div>

			{/* scrim de baixo, só para o contador ficar legível sobre a foto */}
			<AbsoluteFill
				style={{background: "linear-gradient(to bottom, transparent 72%, rgba(7,8,12,0.85) 100%)"}}
			/>

			<svg width={1080} height={1920} style={{position: "absolute", left: 0, top: 0}}>
				<line x1={540} y1={0} x2={540} y2={1920} stroke={GG.accent} strokeOpacity={seamPulse} strokeWidth={3} />
				<line x1={200} y1={960} x2={tipX} y2={960} stroke={GG.white} strokeWidth={6} strokeLinecap="round" opacity={beam} />
				{beam > 0.05 && (
					<g transform={`translate(${tipX},960)`} opacity={beam}>
						<path d="M0,-18 L26,0 L0,18 Z" fill={GG.accent} />
					</g>
				)}
			</svg>

			<MarketCap value={MARKET_CAP_GG} at={44} size={50} y={1650} />
		</AbsoluteFill>
	);
};
