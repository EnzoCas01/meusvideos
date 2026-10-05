import React from "react";
import {AbsoluteFill} from "remotion";
import {CardDF} from "../../components/disney/CardDF";
import {BeamDF, DustDF, TextureDF, WashDF} from "../../components/disney/GroundDF";
import {RuleDF, TextDF} from "../../components/disney/TextDF";
import {cueForDF} from "../../utils/cue-df";
import {IMG_DF} from "../../utils/imagens-df";
import {DF, GRADE_DF} from "../../utils/theme-df";

const cue = cueForDF(0);

/**
 * Hook — curtain wine and projector light. A real Oswald title card answers
 * "you knew he lost a hit character?"; when the voice says what came after, a
 * fragment of the earliest Mickey sketches surfaces out of the dark — a glimpse,
 * not a reveal.
 */
export const Scene1: React.FC = () => {
	const youKnew = cue("01-gancho").wordStart("Você");
	const glimpse = cue("02-mickey").wordStart("nasceu");
	const questionOut = glimpse - 22;

	return (
		<AbsoluteFill>
			<WashDF
				css={{
					background:
						"radial-gradient(ellipse 85% 58% at 30% 16%, #4A1420 0%, rgba(0,0,0,0) 62%), radial-gradient(ellipse 120% 80% at 72% 92%, #24090F 0%, rgba(0,0,0,0) 70%), linear-gradient(175deg, #2A0B12 0%, #170609 55%, #0D0406 100%)",
				}}
			/>
			{/* Curtain velvet on the right, the room's colour source. */}
			<TextureDF image={IMG_DF.texCurtain} pos="right" blend="soft-light" opacity={0.5} drift={18} />
			<BeamDF color="rgba(240, 195, 119, 0.55)" from="left" opacity={0.15} />
			<DustDF count={22} seed={11} opacity={0.4} />

			{/* The real thing: a 1928 Oswald title card, lit like a print on a desk. */}
			<CardDF
				image={IMG_DF.intertitleOswald}
				width={940}
				center={[540, 790]}
				zoom={[1.0, 1.07]}
				range={[6, 216]}
				grade={GRADE_DF.photoBright}
				glow="0 0 90px rgba(240,195,119,0.13)"
				showFrom={6}
				showTo={216}
				fadeIn={16}
				fadeOut={26}
			/>

			{/* What came after — only a fragment, deep in shadow. */}
			<CardDF
				image={IMG_DF.mickeyConcept}
				width={1150}
				center={[880, 750]}
				anchor={[0.22, 0.3]}
				zoom={[1.7, 2.1]}
				range={[glimpse, 300]}
				grade={GRADE_DF.photoDim}
				flat
				reveal={false}
				showFrom={glimpse}
				showTo={400}
				fadeIn={26}
				fadeOut={0}
			/>

			<TextDF start={youKnew} end={questionOut} top={235} size={150} color={DF.white}>
				VOCÊ SABIA?
			</TextDF>
			<RuleDF start={youKnew + 16} end={questionOut} top={420} width={200} />
		</AbsoluteFill>
	);
};
