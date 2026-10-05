import React from "react";
import {GradedPhoto, GRADES} from "../../components/anthropic/GradedPhoto";
import {SceneShell} from "../../components/anthropic/SceneShell";
import {RuleAT, TextAT} from "../../components/anthropic/TextAT";
import {cueForAT} from "../../utils/cue-at";
import {IMG} from "../../utils/imagens-at";
import {AT} from "../../utils/theme-at";
import {sceneDurationAT} from "../../utils/timeline-at";

const cueFor = cueForAT(3);

/**
 * 04 — THE MONEY. The office interiors stay blurred into an environmental
 * texture (the visit photos are from ~2025 — blurred they read as "the
 * place", not as a dated event, and no face is readable). They cross-fade as
 * the number arrives: "US$ 124 / MILHÕES" enters stacked, on the exact words
 * "quatro" and "milhões".
 */
export const Scene4: React.FC = () => {
	const startup = cueFor("06-startup");
	const raise = cueFor("07-124");
	const dur = sceneDurationAT(3);
	const swap = raise.start + 6; // as "Já no primeiro ano" begins

	return (
		<SceneShell index={3}>
			<GradedPhoto
				image={IMG.escritorioAnthropic}
				width={1700}
				centerY={860}
				grade={GRADES.warm}
				zoom={[1.08, 1.18]}
				range={[0, 132]}
				pan={[
					[0, 50],
					[-60, -30],
				]}
				showFrom={0}
				showTo={132}
				fadeIn={0}
				fadeOut={20}
				backdropDim={0.26}
				blur={14}
			/>
			<GradedPhoto
				image={IMG.visitaAnthropic}
				width={1750}
				centerY={880}
				grade={GRADES.warm}
				zoom={[1.02, 1.16]}
				range={[116, dur]}
				pan={[
					[70, 0],
					[-90, 0],
				]}
				showFrom={116}
				showTo={dur}
				fadeIn={20}
				fadeOut={16}
				backdropDim={0.26}
				blur={14}
			/>
			<TextAT start={startup.wordStart("startup.")} end={swap - 6} top={140} size={130} color={AT.grey}>
				STARTUP
			</TextAT>
			<TextAT
				start={raise.wordStart("primeiro")}
				top={300}
				size={40}
				font="sans"
				weight={600}
				spacing={0.26}
				color={AT.grey}
				scrim={false}
			>
				NO PRIMEIRO ANO
			</TextAT>
			<TextAT start={raise.wordStart(/^quatro$/)} top={470} size={230} spacing={0.04}>
				US$ 124
			</TextAT>
			<TextAT start={raise.wordStart(/^milhões$/)} top={690} size={230} spacing={0.04} scrimOpacity={0.9} arriveFrames={10}>
				MILHÕES
			</TextAT>
			<TextAT
				start={raise.wordStart("dólares")}
				top={960}
				size={34}
				font="sans"
				weight={600}
				spacing={0.3}
				color={AT.grey}
				scrim={false}
			>
				DE DÓLARES
			</TextAT>
			<RuleAT start={raise.wordStart("dólares")} top={1040} width={420} />
		</SceneShell>
	);
};
