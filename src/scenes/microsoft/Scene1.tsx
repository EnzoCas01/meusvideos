import React from "react";
import {AmbienceMS} from "../../components/microsoft/AmbienceMS";
import {GradedPhoto} from "../../components/microsoft/GradedPhoto";
import {SceneShell} from "../../components/microsoft/SceneShell";
import {RuleMS, TextMS} from "../../components/microsoft/TextMS";
import {cueForMS} from "../../utils/cue-ms";
import {IMG} from "../../utils/imagens-ms";
import {MS} from "../../utils/theme-ms";
import {sceneDurationMS} from "../../utils/timeline-ms";

const cueFor = cueForMS(0);

const GRADE_MARK = {brightness: 1, saturate: 0, sepia: 0, contrast: 1};
const GRADE_PC = {brightness: 0.95, saturate: 0.85, sepia: 0.05, contrast: 1.12};

/**
 * 01 — HOOK. The original 1975 wordmark pushes slowly on a blue-lit ground;
 * the first revenue lands with the spoken number, and the IBM PC rises out of
 * the bottom the moment the voice names the machine it ended up inside.
 */
export const Scene1: React.FC = () => {
	const cue = cueFor("01-gancho");
	const dur = sceneDurationMS(0);
	const number = cue.wordStart(/^dezesseis$/);
	const pcIn = cue.wordStart(/^computadores/);
	const ibm = cue.wordStart(/^ibm$/);

	return (
		<SceneShell index={0}>
			<AmbienceMS />
			<GradedPhoto
				image={IMG.msLogo1975White}
				width={800}
				centerY={640}
				zoom={[1, 1.16]}
				range={[0, dur]}
				showFrom={0}
				showTo={ibm}
				fadeIn={0}
				fadeOut={18}
				backdrop={false}
				feather={0}
				grade={GRADE_MARK}
			/>
			<GradedPhoto
				image={IMG.ibmPc5150Cut}
				width={880}
				centerY={1060}
				zoom={[1, 1.08]}
				pan={[
					[0, 300],
					[0, 0],
				]}
				range={[pcIn - 6, dur]}
				ease="out"
				showFrom={pcIn - 6}
				showTo={dur}
				fadeIn={14}
				fadeOut={0}
				backdrop={false}
				feather={0}
				shadow
				grade={GRADE_PC}
			/>

			<TextMS start={cue.start} end={cue.wordStart(/^microsoft$/) + 22} top={130} size={170}>
				VOCÊ SABIA<span style={{color: MS.accentText}}>?</span>
			</TextMS>
			<TextMS start={number} end={pcIn - 16} top={900} size={200} spacing={0.02}>
				US$ 16.005
			</TextMS>
			<RuleMS start={cue.wordStart(/^mil$/)} end={pcIn - 6} top={1115} width={240} />
			<TextMS start={ibm} end={cue.wordEnd(/^ibm$/) + 10} top={150} size={220} spacing={0.08} color={MS.accentText}>
				IBM
			</TextMS>
		</SceneShell>
	);
};
