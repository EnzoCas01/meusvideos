import React from "react";
import {AbsoluteFill} from "remotion";
import {CardDF} from "../../components/disney/CardDF";
import {BeamDF, DustDF, FilmEdgeDF, TextureDF, WashDF} from "../../components/disney/GroundDF";
import {TextDF} from "../../components/disney/TextDF";
import {cueForDF} from "../../utils/cue-df";
import {IMG_DF} from "../../utils/imagens-df";
import {DF, GRADE_DF} from "../../utils/theme-df";

const cue = cueForDF(1);

/**
 * 1927 — Oswald is created and becomes a hit. Amber room; the debut poster
 * holds the left of the frame while the year sits beside it, then the trade
 * press page closes in on its Oswald ad as the count lands.
 */
export const Scene2: React.FC = () => {
	const year = cue("03-oswald").wordStart("novecentos");
	const posterOut = cue("03-oswald").wordEnd("Universal.") + 12;
	const count = cue("04-sucesso").wordStart("vinte");
	const countOut = cue("04-sucesso").wordEnd("ele.") + 10;
	const pressIn = posterOut + 6;

	return (
		<AbsoluteFill>
			<WashDF
				css={{
					background:
						"radial-gradient(ellipse 80% 50% at 68% 12%, #7A4210 0%, rgba(0,0,0,0) 62%), radial-gradient(ellipse 110% 70% at 20% 85%, #331804 0%, rgba(0,0,0,0) 72%), linear-gradient(180deg, #2E1704 0%, #1B0D03 58%, #120802 100%)",
				}}
			/>
			{/* Film cans glowing at the bottom of the room. */}
			<TextureDF image={IMG_DF.texReels} pos="bottom" blend="soft-light" opacity={0.38} drift={22} />
			<BeamDF color="rgba(240, 195, 119, 0.5)" from="right" opacity={0.13} />
			<DustDF count={20} seed={23} opacity={0.38} />
			<FilmEdgeDF side="left" opacity={0.4} />

			{/* The debut poster, 1927. */}
			<CardDF
				image={IMG_DF.posterTrolley}
				width={640}
				center={[318, 812]}
				tilt={-1.4}
				zoom={[1.0, 1.09]}
				range={[12, posterOut]}
				grade={GRADE_DF.photoBright}
				glow="0 0 90px rgba(240,195,119,0.15)"
				showFrom={12}
				showTo={posterOut}
				fadeIn={16}
				fadeOut={18}
			/>

			{/* The trade paper that carried him, closing in on the ad. */}
			<CardDF
				image={IMG_DF.filmDaily}
				width={730}
				center={[618, 762]}
				anchor={[0.7, 0.66]}
				zoom={[1.12, 1.5]}
				range={[pressIn, pressIn + 150]}
				pan={[
					[0, 10],
					[0, -14],
				]}
				grade={GRADE_DF.photoWarm}
				glow="0 0 80px rgba(240,195,119,0.1)"
				showFrom={pressIn}
				showTo={420}
				fadeIn={16}
				fadeOut={0}
			/>

			<TextDF start={year} end={year + 104} top={205} size={228} color={DF.goldText} x={795}>
				1927
			</TextDF>
			<TextDF start={count} end={countOut} top={1272} size={148} color={DF.goldText}>
				26 CURTAS
			</TextDF>
		</AbsoluteFill>
	);
};
