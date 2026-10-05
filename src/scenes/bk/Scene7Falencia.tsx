import React from "react";
import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame} from "remotion";
import {ImpactBK} from "../../components/bk/ImpactBK";
import {cueLocalBK} from "../../utils/timeline-bk";
import {BK} from "../../utils/theme-bk";

const SCENE = 6;

/**
 * Beira da falência: lanchonete fechada de dia nublado, dessaturada e fria,
 * pan lento — a cena inteira se move enquanto a voz aproxima a virada. O
 * texto pousa sobre o estacionamento morto, embaixo.
 */
export const Scene7Falencia: React.FC = () => {
	const frame = useCurrentFrame();
	const falencia = cueLocalBK(SCENE, "07-virada", /^falência$/);

	const pan = interpolate(frame, [0, 76], [44, 56]);
	const zoom = interpolate(frame, [0, 76], [1.08, 1.18]);

	return (
		<AbsoluteFill style={{backgroundColor: BK.background}}>
			<Img
				src={staticFile("images/bk/cena7/07.jpg")}
				style={{
					width: "100%",
					height: "100%",
					objectFit: "cover",
					objectPosition: `${pan}% 46%`,
					transform: `scale(${zoom})`,
					filter: "saturate(0.5) contrast(1.16) brightness(0.86)",
				}}
			/>
			<AbsoluteFill style={{background: "linear-gradient(180deg, rgba(10,16,30,0.36) 0%, rgba(7,7,8,0.12) 50%, rgba(7,7,8,0.66) 100%)"}} />
			<ImpactBK at={falencia} lines={["BEIRA DA", "FALÊNCIA"]} size={132} color={BK.white} y={1090} stroke />
		</AbsoluteFill>
	);
};
