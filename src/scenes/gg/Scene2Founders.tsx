import React from "react";
import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame} from "remotion";
import {Impact} from "../../components/gg/Impact";
import {cueLocalGG} from "../../utils/timeline-gg";
import {GG} from "../../utils/theme-gg";

const SCENE = 1;
const CARD_W = 760;
const CARD_H = Math.round((CARD_W * 1600) / 2400);

/**
 * Larry Page e Sergey Brin, jovens, retrato preto e branco de época — como
 * camada com sombra sobre um fundo colorido (a foto NUNCA é colorizada).
 */
export const Scene2Founders: React.FC = () => {
	const frame = useCurrentFrame();
	const dur1998 = cueLocalGG(SCENE, "02-menlo", /^1998,$/);

	const zoom = interpolate(frame, [0, 288], [1, 1.13], {easing: Easing.out(Easing.sin)});
	const pan = interpolate(frame, [0, 288], ["50%", "42%"], {easing: Easing.out(Easing.sin)});
	const drift = interpolate(frame, [0, 288], [0, -26], {easing: Easing.inOut(Easing.sin)});

	return (
		<AbsoluteFill style={{backgroundColor: GG.background}}>
			{/* fundo com cor: blobs suaves, não é a foto */}
			<AbsoluteFill
				style={{
					background:
						"radial-gradient(760px 760px at 14% 12%, rgba(66,133,244,0.30), rgba(7,8,12,0) 70%)," +
						"radial-gradient(700px 700px at 88% 86%, rgba(251,188,5,0.14), rgba(7,8,12,0) 70%)",
				}}
			/>

			<div
				style={{
					position: "absolute",
					left: 540 - CARD_W / 2,
					top: 650 + drift,
					width: CARD_W,
					height: CARD_H,
					borderRadius: 22,
					overflow: "hidden",
					boxShadow: "0 40px 90px rgba(0,0,0,0.6), 0 0 70px rgba(66,133,244,0.12)",
					border: "1px solid rgba(255,255,255,0.14)",
				}}
			>
				<Img
					src={staticFile("images/gg/garagem-foto/06.jpg")}
					style={{
						width: "100%",
						height: "100%",
						objectFit: "cover",
						objectPosition: `${pan} 42%`,
						transform: `scale(${zoom})`,
						filter: "grayscale(1) contrast(1.1) brightness(1.03)",
					}}
				/>
			</div>

			<Impact at={dur1998} lines={["1998"]} size={190} y={340} color={GG.blue} />
		</AbsoluteFill>
	);
};
