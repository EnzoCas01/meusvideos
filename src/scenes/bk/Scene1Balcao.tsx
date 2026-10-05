import React from "react";
import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame} from "remotion";
import {ImpactBK} from "../../components/bk/ImpactBK";
import {cueLocalBK} from "../../utils/timeline-bk";
import {BK} from "../../utils/theme-bk";

const SCENE = 0;

/**
 * Abertura: o drive-in humilde dos anos 40-50 entra INTEIRO em tela cheia,
 * nítido, com zoom-in lento — e nada mais. O "1954" pousa na palavra falada,
 * embaixo sobre os carros escuros (longe do letreiro claro do prédio).
 */
export const Scene1Balcao: React.FC = () => {
	const frame = useCurrentFrame();
	const ano = cueLocalBK(SCENE, "01-gancho", /^1954/);

	// Ken Burns: a foto respira crescendo desde o primeiro frame
	const zoom = interpolate(frame, [0, 153], [1.04, 1.16], {easing: Easing.out(Easing.sin)});

	return (
		<AbsoluteFill style={{backgroundColor: BK.background}}>
			<Img
				src={staticFile("images/bk/cena1/06.jpg")}
				style={{
					width: "100%",
					height: "100%",
					objectFit: "cover",
					objectPosition: "50% 42%",
					transform: `scale(${zoom})`,
					filter: "contrast(1.08) brightness(0.94)",
				}}
			/>
			{/* scrim nas bordas: texto pousa legível sem borrar a foto */}
			<AbsoluteFill
				style={{background: "linear-gradient(to bottom, rgba(7,7,8,0.38) 0%, transparent 24%, transparent 58%, rgba(7,7,8,0.6) 100%)"}}
			/>
			<ImpactBK at={ano} lines={["1954"]} size={190} color={BK.gold} y={1096} stroke />
		</AbsoluteFill>
	);
};
