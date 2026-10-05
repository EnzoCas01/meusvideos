import React from "react";
import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame} from "remotion";
import {ImpactBK} from "../../components/bk/ImpactBK";
import {cueLocalBK} from "../../utils/timeline-bk";
import {BK} from "../../utils/theme-bk";

const SCENE = 3;
// corte no respiro antes de "chegou a valer quase nada" — o gráfico em queda
const CUT = 93;

/**
 * Quase quebrou: dois ângulos financeiros (candles com seta de queda, linha
 * de preço desabando), vermelho quente, com um pulso na palavra "quebrou".
 */
export const Scene4Queda: React.FC = () => {
	const frame = useCurrentFrame();
	const quebrou = cueLocalBK(SCENE, "04-donos", /^quebrou/);

	const zoomA = interpolate(frame, [0, CUT], [1.05, 1.17], {easing: Easing.inOut(Easing.sin)});
	const zoomB = interpolate(frame, [CUT, 172], [1.17, 1.06], {easing: Easing.out(Easing.sin)});
	const zoom = frame < CUT ? zoomA : zoomB;
	// pan lento dentro de cada ângulo — nenhum plano parado
	const panA = interpolate(frame, [0, CUT], [64, 60], {easing: Easing.inOut(Easing.sin)});
	const panB = interpolate(frame, [CUT, 172], [52, 47], {easing: Easing.out(Easing.sin)});

	const pulso = interpolate(frame, [quebrou, quebrou + 10, quebrou + 46], [0, 0.4, 0.16], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	return (
		<AbsoluteFill style={{backgroundColor: BK.background}}>
			{frame < CUT ? (
				<Img
					src={staticFile("images/bk/cena4/01.jpg")}
					style={{
						width: "100%",
						height: "100%",
						objectFit: "cover",
						objectPosition: `${panA}% 50%`,
						transform: `scale(${zoom})`,
						filter: "saturate(0.95) contrast(1.1) brightness(0.9)",
					}}
				/>
			) : (
				<Img
					src={staticFile("images/bk/cena4/02.jpg")}
					style={{
						width: "100%",
						height: "100%",
						objectFit: "cover",
						objectPosition: `${panB}% 50%`,
						transform: `scale(${zoom})`,
						filter: "saturate(0.95) contrast(1.1) brightness(0.9)",
					}}
				/>
			)}
			{/* véu leve afunda as bordas (cor, não blur) */}
			<AbsoluteFill style={{background: "linear-gradient(180deg, rgba(10,14,28,0.34) 0%, rgba(8,10,16,0.14) 55%, rgba(7,7,8,0.62) 100%)"}} />
			{/* pulso vermelho do prejuízo */}
			<AbsoluteFill style={{background: "radial-gradient(circle at 50% 46%, transparent 34%, rgba(214,35,0,0.55) 100%)", opacity: pulso}} />
			<ImpactBK at={quebrou} lines={["QUASE", "QUEBROU"]} size={136} color={BK.white} y={820} stroke out={CUT - 2} />
		</AbsoluteFill>
	);
};
