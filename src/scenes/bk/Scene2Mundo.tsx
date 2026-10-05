import React from "react";
import {Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from "remotion";
import {ImpactBK} from "../../components/bk/ImpactBK";
import {cueLocalBK} from "../../utils/timeline-bk";
import {seededRandom} from "../../utils/bezier";
import {BK} from "../../utils/theme-bk";

const SCENE = 1;

const DOTS = 30;
const DISC = 1010; // foto original tem 1041px — disco menor que ela, sem upscale
const BOX = 1500; // caixa do svg maior que as ondas (elas não podem ser cortadas)
const RINGS_AT = [20, 48, 76];

/**
 * O balcãozinho vira o mundo: o globo noturno da NASA enche o quadro e acende
 * ponto a ponto — cada luz é uma loja abrindo em um país diferente; ondas
 * douradas se espalham da borda enquanto a voz diz "cem países".
 */
export const Scene2Mundo: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const paises = cueLocalBK(SCENE, "02-paises", /^países/);

	const grow = interpolate(frame, [0, 105], [0.97, 1.05], {easing: Easing.out(Easing.sin)});
	const spin = interpolate(frame, [0, 105], [0, 5]);

	return (
		<div style={{position: "absolute", inset: 0, backgroundColor: "#040407"}}>
			{/* fundo: vinheta azul-noite com brilho atrás do globo */}
			<div
				style={{
					position: "absolute",
					inset: 0,
					background:
						"radial-gradient(circle at 50% 46%, #10141f 0%, #0a0c14 42%, #040407 72%)",
				}}
			/>

			{/* ondas de expansão — caixa bem maior que o disco para não cortar */}
			<svg
				width={BOX}
				height={BOX}
				viewBox={`0 0 ${BOX} ${BOX}`}
				style={{position: "absolute", left: (1080 - BOX) / 2, top: 835 - BOX / 2}}
			>
				{RINGS_AT.map((t, i) => {
					const p = interpolate(frame, [t, t + 34], [0, 1], {
						extrapolateLeft: "clamp",
						extrapolateRight: "clamp",
						easing: Easing.out(Easing.cubic),
					});
					if (p === 0 || p === 1) return null;
					return (
						<circle
							key={i}
							cx={BOX / 2}
							cy={BOX / 2}
							r={DISC / 2 + p * 190}
							fill="none"
							stroke={BK.gold}
							strokeWidth={interpolate(p, [0, 1], [4, 1])}
							opacity={0.45 * (1 - p)}
						/>
					);
				})}
			</svg>

			<div
				style={{
					position: "absolute",
					top: 835 - DISC / 2,
					left: (1080 - DISC) / 2,
					width: DISC,
					height: DISC,
					transform: `scale(${grow}) rotate(${spin}deg)`,
				}}
			>
				<Img
					src={staticFile("images/bk/cena2/02.jpg")}
					style={{
						width: "100%",
						height: "100%",
						borderRadius: "50%",
						objectFit: "cover",
						filter: "saturate(1.3) contrast(1.16) brightness(1.04)",
						boxShadow:
							"0 0 90px rgba(90,130,220,0.28), 0 0 170px rgba(255,174,0,0.14), 0 34px 90px rgba(0,0,0,0.85)",
					}}
				/>
				{/* aro fino de luz na borda do disco */}
				<div
					style={{
						position: "absolute",
						inset: 0,
						borderRadius: "50%",
						border: "2px solid rgba(255,200,110,0.35)",
					}}
				/>
				{/* recorte circular: as luzes-novas não vazam do disco */}
				<svg width={DISC} height={DISC} viewBox={`0 0 ${DISC} ${DISC}`} style={{position: "absolute", left: 0, top: 0}}>
					<defs>
						<clipPath id="globo-bk">
							<circle cx={DISC / 2} cy={DISC / 2} r={DISC / 2} />
						</clipPath>
					</defs>
					<g clipPath="url(#globo-bk)">
						{Array.from({length: DOTS}).map((_, i) => {
							// pontos determinísticos dentro do disco
							const a = seededRandom(i * 3 + 1) * Math.PI * 2;
							const r = Math.sqrt(seededRandom(i * 7 + 13)) * (DISC / 2 - 46);
							const cx = DISC / 2 + Math.cos(a) * r;
							const cy = DISC / 2 + Math.sin(a) * r;
							const t = 10 + i * 2.2;
							const s = spring({frame: frame - t, fps, config: {damping: 12, mass: 0.5}, durationInFrames: 14});
							const glow = interpolate(frame, [t, t + 40], [1, 0.55], {
								extrapolateLeft: "clamp",
								extrapolateRight: "clamp",
							});
							if (frame < t) return null;
							return (
								<g key={i} transform={`translate(${cx},${cy}) rotate(${-spin})`}>
									<circle r={6 + seededRandom(i + 40) * 6} fill={BK.gold} opacity={glow * s} />
									<circle r={16 + seededRandom(i + 90) * 9} fill={BK.gold} opacity={0.32 * glow * s} />
								</g>
							);
						})}
					</g>
				</svg>
			</div>

			<ImpactBK at={paises} lines={["100+ PAÍSES"]} size={150} color={BK.gold} y={168} />
		</div>
	);
};
