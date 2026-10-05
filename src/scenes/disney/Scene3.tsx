import React from "react";
import {AbsoluteFill} from "remotion";
import {CardDF} from "../../components/disney/CardDF";
import {BeamDF, DustDF, WashDF} from "../../components/disney/GroundDF";
import {TextDF} from "../../components/disney/TextDF";
import {cueForDF} from "../../utils/cue-df";
import {IMG_DF} from "../../utils/imagens-df";
import {DF, GRADE_DF} from "../../utils/theme-df";

const cue = cueForDF(2);

/**
 * The loss — the room goes cold. Oswald stands in a shaft of steel-blue light;
 * on "dono" he is carried out of the frame, and the distributor's own ad takes
 * his place: the paper trail of who really owned the rabbit.
 */
export const Scene3: React.FC = () => {
	const notHis = cue("05-negociar").wordStart("não");
	const dono = cue("05-negociar").wordStart("dono");
	const carriedOut = notHis + 58;
	const adIn = cue("06-distribuidor").start - 4;
	const owner = cue("06-distribuidor").wordStart("distribuidor");

	return (
		<AbsoluteFill>
			<WashDF
				css={{
					background:
						"radial-gradient(ellipse 78% 52% at 70% 12%, #24406B 0%, rgba(0,0,0,0) 60%), radial-gradient(ellipse 120% 80% at 28% 88%, #101E38 0%, rgba(0,0,0,0) 74%), linear-gradient(190deg, #16294A 0%, #0C1526 55%, #080E1B 100%)",
				}}
			/>
			<BeamDF color="rgba(140, 180, 225, 0.6)" from="right" opacity={0.13} />
			<DustDF count={18} seed={37} color="169, 199, 232" opacity={0.3} />

			{/* Oswald, waiting under the cold light — then carried out on "dono". */}
			<CardDF
				image={IMG_DF.oswaldCut}
				width={540}
				center={[560, 655]}
				zoom={[1.0, 1.04]}
				range={[8, carriedOut]}
				grade={{brightness: 1.06, saturate: 0.5, sepia: 0, contrast: 1.08}}
				glow="0 0 70px rgba(169,199,232,0.26)"
				flat
				showFrom={8}
				fadeIn={18}
				drift={{from: dono, to: carriedOut, dx: 980, dy: 240, rotate: 9, ease: "in"}}
			/>

			{/* The distributor's own advertisement — the document of ownership. */}
			<CardDF
				image={IMG_DF.adUniversal}
				width={620}
				center={[540, 645]}
				tilt={1.2}
				zoom={[1.0, 1.07]}
				range={[adIn, adIn + 110]}
				grade={GRADE_DF.photoWarm}
				glow="0 0 80px rgba(169,199,232,0.12)"
				showFrom={adIn}
				showTo={300}
				fadeIn={16}
				fadeOut={0}
			/>

			<TextDF start={notHis} end={carriedOut + 40} top={1288} size={122} color={DF.white}>
				NÃO ERA DONO
			</TextDF>
			<TextDF start={owner} end={owner + 44} top={1288} size={122} color={DF.ice}>
				DISTRIBUIDOR
			</TextDF>
		</AbsoluteFill>
	);
};
