import React from "react";
import {AmbienceMS} from "../../components/microsoft/AmbienceMS";
import {GradedPhoto} from "../../components/microsoft/GradedPhoto";
import {SceneShell} from "../../components/microsoft/SceneShell";
import {RuleMS, TextMS} from "../../components/microsoft/TextMS";
import {cueForMS} from "../../utils/cue-ms";
import {IMG} from "../../utils/imagens-ms";
import {MS} from "../../utils/theme-ms";
import {sceneDurationMS} from "../../utils/timeline-ms";

const cueFor = cueForMS(4);

/** The brightest grade of the film — the blue cloth of the shot meets the blue accent. */
const GRADE_PEAK = {brightness: 0.78, saturate: 1.05, sepia: 0.04, contrast: 1.1};

/**
 * 05 — THE PEAK. The 5150 on its blue cloth pushes in at its brightest grade;
 * the year lands, then the number the whole film was building toward enters on
 * the exact spoken words.
 */
export const Scene5: React.FC = () => {
	const cue = cueFor("08-1981");
	const dur = sceneDurationMS(4);
	const year = cue.wordStart(/^um$/);
	const millions = cue.wordStart(/^dezessete$/);
	// Everything leaves before the cut to the closing scene (no ghosting in the dissolve).
	const lineEnd = cue.end - 8;

	return (
		<SceneShell index={4}>
			<AmbienceMS />
			<GradedPhoto
				image={IMG.ibmPc5150Desk}
				width={1700}
				centerY={740}
				zoom={[1.06, 1.24]}
				pan={[
					[0, 30],
					[0, -30],
				]}
				range={[0, dur]}
				showFrom={0}
				showTo={dur}
				fadeIn={0}
				fadeOut={0}
				grade={GRADE_PEAK}
				backdropDim={0.4}
			/>

			<TextMS start={year} end={lineEnd} top={150} size={260} spacing={0.06}>
				1981
			</TextMS>
			<RuleMS start={cue.wordEnd(/^um$/)} end={lineEnd} top={430} width={240} />
			<TextMS start={millions} end={lineEnd} top={860} size={250} spacing={0.01}>
				US$ 17,3
			</TextMS>
			<TextMS start={cue.wordStart(/^milhões$/)} end={lineEnd} top={1100} size={210} spacing={0.04} color={MS.accentText}>
				MILHÕES
			</TextMS>
			<TextMS
				start={cue.wordEnd(/^milhões$/)}
				end={lineEnd}
				top={1310}
				size={38}
				font="sans"
				weight={600}
				spacing={0.3}
				color={MS.grey}
				scrim={false}
			>
				EM VENDAS ANUAIS
			</TextMS>
		</SceneShell>
	);
};
