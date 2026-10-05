import React from "react";
import {AbsoluteFill} from "remotion";
import {CardDF} from "../../components/disney/CardDF";
import {BeamDF, DustDF, WashDF} from "../../components/disney/GroundDF";
import {LabelDF, TextDF} from "../../components/disney/TextDF";
import {cueForDF} from "../../utils/cue-df";
import {IMG_DF} from "../../utils/imagens-df";
import {DF, GRADE_DF} from "../../utils/theme-df";

const cue = cueForDF(5);

/**
 * The reward, in one chain: the rabbit fades out like a memory, the drawing
 * that replaced him warms up, then the real Steamboat Willie frame under
 * projector light — with the year and the title landing on the peak.
 */
export const Scene6: React.FC = () => {
	const lost = cue("10-perdeu").wordStart("perdeu");
	const loss = cue("11-perda-criou").wordStart("perda");
	const year = cue("12-steamboat").wordStart("vinte");
	const title = cue("12-steamboat").wordStart("Steamboat");
	const frameIn = cue("12-steamboat").start - 2;

	return (
		<AbsoluteFill>
			<WashDF
				css={{
					background:
						"radial-gradient(ellipse 68% 44% at 26% 10%, #6E4A16 0%, rgba(0,0,0,0) 58%), radial-gradient(ellipse 90% 60% at 78% 86%, #0D3A42 0%, rgba(0,0,0,0) 68%), linear-gradient(185deg, #22303A 0%, #0D2A31 52%, #071E24 100%)",
				}}
			/>
			<BeamDF color="rgba(240, 195, 119, 0.55)" from="right" opacity={0.16} />
			<DustDF count={22} seed={83} opacity={0.4} />

			{/* The rabbit as a memory, drifting up and away. */}
			<CardDF
				image={IMG_DF.oswaldCut}
				width={460}
				center={[610, 640]}
				zoom={[1.0, 1.05]}
				range={[8, 104]}
				grade={GRADE_DF.ghost}
				glow="0 0 60px rgba(169,199,232,0.18)"
				flat
				showFrom={8}
				showTo={104}
				fadeIn={16}
				fadeOut={34}
				drift={{from: 8, to: 104, dx: 140, dy: -100, rotate: -3, ease: "linear"}}
			/>

			{/* The drawing that answered the loss, warming up. */}
			<CardDF
				image={IMG_DF.drawingPlane}
				width={950}
				center={[540, 755]}
				anchor={[0.42, 0.5]}
				zoom={[1.04, 1.12]}
				range={[loss, 212]}
				grade={GRADE_DF.photoBright}
				glow="0 0 90px rgba(240,195,119,0.14)"
				showFrom={loss}
				showTo={214}
				fadeIn={16}
				fadeOut={14}
			/>

			{/* The real frame, 1928 — projected. */}
			<CardDF
				image={IMG_DF.frameSteamboat}
				width={940}
				center={[540, 750]}
				crop={{left: 0.13, right: 0.13}}
				zoom={[1.0, 1.09]}
				range={[frameIn, 336]}
				grade={{brightness: 1.04, saturate: 0.85, sepia: 0.04, contrast: 1.06}}
				glow="0 0 110px rgba(240,195,119,0.2)"
				showFrom={frameIn}
				showTo={350}
				fadeIn={16}
				fadeOut={0}
			/>

			<TextDF start={lost} end={loss - 6} top={1298} size={162} color={DF.white}>
				PERDEU
			</TextDF>
			<TextDF start={year} end={316} top={168} size={238} color={DF.goldText}>
				1928
			</TextDF>
			<TextDF start={title} end={336} top={1128} size={138} color={DF.white} spacing={0.04}>
				STEAMBOAT
				<br />
				WILLIE
			</TextDF>
			<LabelDF start={title + 14} end={320} top={1450} size={34} spacing={0.18} color={DF.goldText}>
				ESTREIA — 18 DE NOVEMBRO DE 1928
			</LabelDF>
		</AbsoluteFill>
	);
};
