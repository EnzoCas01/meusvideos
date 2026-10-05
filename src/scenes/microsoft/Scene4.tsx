import React from "react";
import {AmbienceMS} from "../../components/microsoft/AmbienceMS";
import {GRADES, GradedPhoto} from "../../components/microsoft/GradedPhoto";
import {SceneShell} from "../../components/microsoft/SceneShell";
import {RuleMS, TextMS} from "../../components/microsoft/TextMS";
import {cueForMS} from "../../utils/cue-ms";
import {IMG} from "../../utils/imagens-ms";
import {MS} from "../../utils/theme-ms";
import {sceneDurationMS} from "../../utils/timeline-ms";

const cueFor = cueForMS(3);

const GRADE_MARK = {brightness: 1, saturate: 0, sepia: 0, contrast: 1};
const GRADE_REBUS = {brightness: 0.95, saturate: 1, sepia: 0, contrast: 1.05};
/** The turn of climate: brighter than the cold first half, still on the dark set. */
const GRADE_TURN = {brightness: 0.62, saturate: 0.95, sepia: 0, contrast: 1.15};

/**
 * 04 — THE CALL. "5 anos depois" over IBM's grey Armonk; at "gigantesco" the
 * grade turns bright and the 5150 fills the frame, the rebus spells the name,
 * and when "Microsoft" is said the two companies meet: the 1980 wordmark with
 * the DOS floppy that Microsoft actually shipped.
 */
export const Scene4: React.FC = () => {
	const cV = cueFor("06-virada");
	const cI = cueFor("07-ibm");
	const dur = sceneDurationMS(3);
	const five = cV.wordStart(/^cinco$/);
	const turn = cV.wordStart(/^gigantesco/);
	const ibm = cI.wordStart(/^ibm$/);
	const ms = cI.wordStart(/^microsoft$/);
	const system = cI.wordStart(/^sistema$/);

	return (
		<SceneShell index={3}>
			<AmbienceMS />
			<GradedPhoto
				image={IMG.ibmArmonk}
				width={1700}
				centerY={700}
				zoom={[1.02, 1.18]}
				range={[0, turn + 6]}
				showFrom={0}
				showTo={turn + 6}
				fadeIn={0}
				fadeOut={16}
				grade={GRADES.cold}
				backdropDim={0.28}
			/>
			<GradedPhoto
				image={IMG.ibmPc5150Dark}
				width={1600}
				centerY={720}
				zoom={[1.04, 1.2]}
				pan={[
					[0, -30],
					[0, 24],
				]}
				range={[turn, dur]}
				showFrom={turn}
				showTo={dur}
				fadeIn={18}
				fadeOut={0}
				grade={GRADE_TURN}
				backdropDim={0.35}
			/>
			<GradedPhoto
				image={IMG.ibmRebus}
				width={520}
				centerY={470}
				zoom={[1.06, 1]}
				ease="out"
				range={[ibm - 18, ms - 10]}
				showFrom={ibm - 18}
				showTo={ms - 10}
				fadeIn={14}
				fadeOut={12}
				backdrop={false}
				feather={0}
				shadow
				grade={GRADE_REBUS}
			/>
			<GradedPhoto
				image={IMG.msLogo1980}
				width={860}
				centerY={440}
				zoom={[1.14, 1]}
				ease="out"
				range={[ms, cI.end]}
				showFrom={ms}
				showTo={cI.end}
				fadeIn={12}
				fadeOut={12}
				backdrop={false}
				feather={30}
				grade={GRADE_MARK}
			/>
			<GradedPhoto
				image={IMG.floppyWithDos}
				width={460}
				centerX={300}
				centerY={1170}
				zoom={[1.05, 1.16]}
				range={[system, cI.end]}
				showFrom={system}
				showTo={cI.end}
				fadeIn={14}
				fadeOut={12}
				backdrop={false}
				feather={0}
				shadow
				grade={GRADES.screen}
			/>

			<TextMS start={five} end={turn} top={160} size={150} spacing={0.05}>
				5 ANOS DEPOIS
			</TextMS>
			<RuleMS start={cV.wordStart(/^anos$/)} end={turn} top={330} width={240} />
			<TextMS start={ibm} end={ms - 12} top={800} size={300} spacing={0.06} color={MS.accentText}>
				IBM
			</TextMS>
			<TextMS start={ms} end={system - 8} top={780} size={115} spacing={0.04}>
				MICROSOFT + IBM
			</TextMS>
			<TextMS start={system} end={cI.end - 8} top={780} size={96} spacing={0.05}>
				SISTEMA OPERACIONAL
			</TextMS>
		</SceneShell>
	);
};
