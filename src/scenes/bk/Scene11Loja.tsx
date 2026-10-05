import React from "react";
import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame} from "remotion";
import {ImpactBK} from "../../components/bk/ImpactBK";
import {cueLocalBK} from "../../utils/timeline-bk";
import {BK} from "../../utils/theme-bk";

const SCENE = 10;

/**
 * Fecho da história: a loja cheia, luzes acesas, câmera afastando devagar
 * com uma respiração sutil — do aperto do balcão ao salão cheio.
 */
export const Scene11Loja: React.FC = () => {
	const frame = useCurrentFrame();
	const global = cueLocalBK(SCENE, "11-fecho", /^global$/);

	// zoom-out que "respira": afasta e oscila de leve, nunca para
	const afasta = interpolate(frame, [0, 152], [1.2, 1.08]);
	const respira = 0.014 * Math.sin(frame * 0.11);
	const luz = interpolate(frame, [0, 60], [0.78, 0.98], {extrapolateRight: "clamp"});

	return (
		<AbsoluteFill style={{backgroundColor: BK.background}}>
			<Img
				src={staticFile("images/bk/cena11/07.jpg")}
				style={{
					width: "100%",
					height: "100%",
					objectFit: "cover",
					objectPosition: "50% 55%",
					transform: `scale(${afasta + respira})`,
					filter: `saturate(1.1) contrast(1.06) brightness(${luz})`,
				}}
			/>
			<AbsoluteFill style={{background: "linear-gradient(180deg, rgba(7,7,8,0.4) 0%, transparent 34%, rgba(7,7,8,0.58) 100%)"}} />
			<ImpactBK at={global} lines={["GIGANTE", "GLOBAL"]} size={150} color={BK.gold} y={300} />
		</AbsoluteFill>
	);
};
