import React from "react";
import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame} from "remotion";
import {ImpactBK} from "../../components/bk/ImpactBK";
import {cueLocalBK} from "../../utils/timeline-bk";
import {BK} from "../../utils/theme-bk";

const SCENE = 4;

/**
 * O rival: o polo com os arcos gigantes entra subindo de baixo e assenta em
 * tela cheia — domina o quadro, como dominava o mundo. Zoom contido para a
 * ponta dos arcos nunca cortar; o impacto pousa entre o letreiro e a legenda.
 */
export const Scene5Rival: React.FC = () => {
	const frame = useCurrentFrame();
	const crescia = cueLocalBK(SCENE, "05-rival", /^crescia$/);

	// reveal: sobe de baixo e assenta em tela cheia
	const sobe = interpolate(frame, [0, 26], [190, 0], {easing: Easing.out(Easing.cubic)});
	// zoom contido: mais que isso corta a ponta dos arcos no topo
	const zoom = interpolate(frame, [0, 141], [1.05, 1.12], {easing: Easing.out(Easing.sin)});

	return (
		<AbsoluteFill style={{backgroundColor: BK.background, overflow: "hidden"}}>
			{/* o reveal (sobe de baixo) acontece no wrapper; a foto fica com cover
			    + objectPosition — transform na imagem desloca o recorte do cover */}
			<div style={{position: "absolute", inset: 0, transform: `translateY(${sobe}px) scale(${zoom})`}}>
				<Img
					src={staticFile("images/bk/cena5/09.jpg")}
					style={{
						width: "100%",
						height: "100%",
						objectFit: "cover",
						objectPosition: "90% 50%",
						filter: "saturate(1.06) contrast(1.08) brightness(0.94)",
					}}
				/>
			</div>
			<AbsoluteFill style={{background: "linear-gradient(to bottom, rgba(7,7,8,0.28) 0%, transparent 30%, transparent 58%, rgba(7,7,8,0.64) 100%)"}} />
			<ImpactBK at={crescia} lines={["O RIVAL"]} size={130} color={BK.gold} y={1120} stroke />
		</AbsoluteFill>
	);
};
