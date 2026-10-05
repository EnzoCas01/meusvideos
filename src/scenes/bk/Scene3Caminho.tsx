import React from "react";
import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame} from "remotion";
import {ImpactBK} from "../../components/bk/ImpactBK";
import {cueLocalBK} from "../../utils/timeline-bk";
import {BK} from "../../utils/theme-bk";

const SCENE = 2;

/**
 * "Mas o caminho até aqui quase não existiu": fechado na torre com os dois
 * logos e abre (zoom-out) revelando a fachada no azul do entardecer — clima
 * de dúvida, frio. Texto pousa sobre a entrada escura, longe dos letreiros.
 */
export const Scene3Caminho: React.FC = () => {
	const frame = useCurrentFrame();
	const quase = cueLocalBK(SCENE, "03-quase", /^quase$/);

	// fechado na loja → abre para o quadro inteiro
	const zoom = interpolate(frame, [0, 72], [1.22, 1.03], {easing: Easing.out(Easing.cubic)});

	return (
		<AbsoluteFill style={{backgroundColor: BK.background}}>
			<Img
				src={staticFile("images/bk/cena3/02.jpg")}
				style={{
					width: "100%",
					height: "100%",
					objectFit: "cover",
					objectPosition: "44% 50%",
					transform: `scale(${zoom})`,
					filter: "saturate(0.82) contrast(1.12) brightness(0.88)",
				}}
			/>
			{/* véu frio por cima da foto (cor, não blur) */}
			<AbsoluteFill style={{background: "linear-gradient(180deg, rgba(18,28,48,0.3) 0%, rgba(10,10,14,0.1) 45%, rgba(7,7,8,0.66) 100%)"}} />
			<ImpactBK at={quase} lines={["QUASE NÃO", "EXISTIU"]} size={124} color={BK.white} y={820} />
		</AbsoluteFill>
	);
};
