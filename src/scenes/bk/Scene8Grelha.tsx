import React from "react";
import {AbsoluteFill, OffthreadVideo, interpolate, staticFile, useCurrentFrame} from "remotion";
import {ImpactBK} from "../../components/bk/ImpactBK";
import {cueLocalBK} from "../../utils/timeline-bk";
import {BK} from "../../utils/theme-bk";

const SCENE = 7;
// três ângulos do grelhado, cortes ágeis no ritmo da fala
const CUTS = [71, 143, 214];

/**
 * A virada (cena-chave sensorial): fogo, fumaça e carne na grelha em três
 * ângulos, cor quente — o corte da edição acompanha o ritmo da fala.
 */
export const Scene8Grelha: React.FC = () => {
	const frame = useCurrentFrame();
	const tudo = cueLocalBK(SCENE, "08-gestao", /^tudo/);

	const which = frame < CUTS[0] ? 0 : frame < CUTS[1] ? 1 : 2;
	const local = frame - (which === 0 ? 0 : CUTS[which - 1]);
	// zoom dentro de cada ângulo, para nenhum plano ficar parado
	const zoom = interpolate(local, [0, 72], [1.04, 1.16]);

	// clip-01 (chamas) nos trechos nítidos de 0-2s e ~11s; clip-02 (herói com fogo)
	const src = ["videos/bk/cena8/clip-01.mp4", "videos/bk/cena8/clip-02.mp4", "videos/bk/cena8/clip-01.mp4"][which];
	const startFrom = [50, 45, 330][which];
	const posicao = ["50% 55%", "50% 74%", "50% 55%"][which];

	return (
		<AbsoluteFill style={{backgroundColor: BK.background}}>
			<OffthreadVideo
				src={staticFile(src)}
				startFrom={startFrom}
				muted
				style={{width: "100%", height: "100%", objectFit: "cover", objectPosition: posicao, transform: `scale(${zoom})`, filter: "saturate(1.28) contrast(1.1) brightness(1.02)"}}
			/>
			{/* calor: véu âmbar por cima do fogo */}
			<AbsoluteFill style={{background: "linear-gradient(180deg, rgba(120,40,0,0.16) 0%, transparent 40%, rgba(7,7,8,0.55) 100%)"}} />
			<ImpactBK at={tudo} lines={["A", "VIRADA"]} size={158} color={BK.gold} y={820} out={150} />
		</AbsoluteFill>
	);
};
