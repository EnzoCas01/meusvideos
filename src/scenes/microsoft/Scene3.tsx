import React from "react";
import {AmbienceMS} from "../../components/microsoft/AmbienceMS";
import {GRADES, GradedPhoto} from "../../components/microsoft/GradedPhoto";
import {SceneShell} from "../../components/microsoft/SceneShell";
import {RuleMS, TextMS} from "../../components/microsoft/TextMS";
import {cueForMS} from "../../utils/cue-ms";
import {IMG} from "../../utils/imagens-ms";
import {MS} from "../../utils/theme-ms";
import {sceneDurationMS} from "../../utils/timeline-ms";

const cueFor = cueForMS(2);

const GRADE_PANEL = {brightness: 0.42, saturate: 0.6, sepia: 0.05, contrast: 1.18};

/**
 * 03 — THE WHOLE FIRST YEAR. The MITS ad holds the question beat, cold; at
 * "Só" it gives way to a dark band of the Altair's front panel and the number
 * lands enormous. Contained on purpose: this is the "that's all?" moment.
 */
export const Scene3: React.FC = () => {
	const cue = cueFor("05-primeiro");
	const dur = sceneDurationMS(2);
	const beat = cue.wordStart(/^só$/);
	const number = cue.wordStart(/^dezesseis$/);
	// Everything is gone a few frames before the cut to scene 4 (no ghosting in the dissolve).
	const lineEnd = cue.end - 8;

	return (
		<SceneShell index={2}>
			<AmbienceMS intensity={0.5} />
			<GradedPhoto
				image={IMG.altairAd1975}
				width={720}
				centerX={400}
				centerY={660}
				zoom={[1, 1.16]}
				rotate={[-2, 1]}
				range={[0, beat + 14]}
				showFrom={0}
				showTo={beat + 14}
				fadeIn={0}
				fadeOut={14}
				grade={GRADES.cold}
				backdropDim={0.28}
			/>
			<GradedPhoto
				image={IMG.altairPanel}
				width={1520}
				centerY={600}
				zoom={[1.06, 1.18]}
				pan={[
					[0, -20],
					[0, 24],
				]}
				range={[beat, dur]}
				showFrom={beat}
				showTo={dur}
				fadeIn={16}
				fadeOut={0}
				grade={GRADE_PANEL}
				backdropDim={0.3}
			/>

			<TextMS start={number} end={lineEnd} top={950} size={240} spacing={0.01}>
				US$ 16.005
			</TextMS>
			<RuleMS start={cue.wordStart(/^mil$/)} end={lineEnd} top={1215} width={260} />
			<TextMS
				start={cue.wordStart(/^vendas/)}
				end={lineEnd}
				top={1270}
				size={40}
				font="sans"
				weight={600}
				spacing={0.3}
				color={MS.accentText}
				scrim={false}
			>
				VENDAS EM 1975
			</TextMS>
		</SceneShell>
	);
};
