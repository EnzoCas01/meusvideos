import React from "react";
import {AbsoluteFill, OffthreadVideo, staticFile, useCurrentFrame} from "remotion";
import {ImpactBK} from "../../components/bk/ImpactBK";
import {cueLocalBK} from "../../utils/timeline-bk";
import {BK} from "../../utils/theme-bk";

const SCENE = 8;
const CUT = 68; // corte seco em "loja por loja" — da multidão para a rua cheia

/**
 * As vendas voltam: multidão vista de cima e rua comercial cheia, corte seco
 * no meio da fala — movimento o tempo inteiro. O impacto fica no topo, longe
 * das pessoas.
 */
export const Scene9Vendas: React.FC = () => {
	const frame = useCurrentFrame();
	const subir = cueLocalBK(SCENE, "09-vendas", /^subir/);

	return (
		<AbsoluteFill style={{backgroundColor: BK.background}}>
			{frame < CUT ? (
				<OffthreadVideo
					src={staticFile("videos/bk/cena9/clip-06.mp4")}
					startFrom={30}
					muted
					style={{width: "100%", height: "100%", objectFit: "cover", filter: "saturate(1.1) contrast(1.08) brightness(0.98)"}}
				/>
			) : (
				<OffthreadVideo
					src={staticFile("videos/bk/cena9/clip-09.mp4")}
					startFrom={60}
					muted
					style={{width: "100%", height: "100%", objectFit: "cover", filter: "saturate(1.1) contrast(1.08) brightness(0.98)"}}
				/>
			)}
			<AbsoluteFill style={{background: "linear-gradient(180deg, rgba(7,7,8,0.4) 0%, transparent 34%, rgba(7,7,8,0.6) 100%)"}} />
			<ImpactBK at={subir} lines={["VENDAS", "SUBINDO"]} size={146} color={BK.gold} y={330} stroke />
		</AbsoluteFill>
	);
};
