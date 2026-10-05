import React from "react";
import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame} from "remotion";
import {MarketCap} from "../../components/gg/MarketCap";
import {GG, MARKET_CAP_GG} from "../../utils/theme-gg";

/** O fechamento: da garagem alugada a um dos maiores valores de mercado do mundo. */
export const Scene8Value: React.FC = () => {
	const frame = useCurrentFrame();
	const zoom = interpolate(frame, [0, 158], [1.05, 1.16], {easing: Easing.out(Easing.sin)});

	return (
		<AbsoluteFill style={{backgroundColor: GG.background}}>
			<Img
				src={staticFile("images/gg/googleplex/04.jpg")}
				style={{
					width: "100%",
					height: "100%",
					objectFit: "cover",
					objectPosition: "50% 60%",
					transform: `scale(${zoom})`,
					filter: "saturate(1.02) brightness(0.7)",
				}}
			/>
			{/* faixa escura só atrás do número — nunca a foto inteira borrada */}
			<AbsoluteFill
				style={{background: "linear-gradient(to bottom, rgba(7,8,12,0.15) 0%, rgba(7,8,12,0.82) 32%, rgba(7,8,12,0.82) 62%, rgba(7,8,12,0.2) 100%)"}}
			/>

			<MarketCap value={MARKET_CAP_GG} at={50} size={88} y={640} />
		</AbsoluteFill>
	);
};
