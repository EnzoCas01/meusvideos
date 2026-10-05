import React from "react";
import {GradedPhoto} from "../../components/anthropic/GradedPhoto";
import {SceneShell} from "../../components/anthropic/SceneShell";
import {RuleAT, TextAT} from "../../components/anthropic/TextAT";
import {GlowAT, WordmarkAT} from "../../components/anthropic/MarksAT";
import {cueForAT} from "../../utils/cue-at";
import {IMG} from "../../utils/imagens-at";
import {AT} from "../../utils/theme-at";
import {sceneDurationAT} from "../../utils/timeline-at";
import type {GradeAT} from "../../components/anthropic/GradedPhoto";

const cueFor = cueForAT(4);

/** The app's dark UI reads as a black rectangle on black at night grade — keep it bright. */
const SCREEN: GradeAT = {brightness: 1.12, saturate: 0.85, sepia: 0.06, contrast: 1.05};

/**
 * 05 — THE PRODUCT. The real Claude web app, cropped to the chat input strip
 * only: the model selector ("Claude 3.5 Sonnet", 2024/25) and the "NEW"
 * banner sit below the crop and never show, so the shot is honest under the
 * "2023" card. The mark pops just before the name and "CLAUDE" lands on the
 * word, with a coral rule drawing under it as competition starts.
 */
export const Scene5: React.FC = () => {
	const cue = cueFor("08-claude");
	const dur = sceneDurationAT(4);

	return (
		<SceneShell index={4}>
			<GradedPhoto
				image={IMG.claudeTela}
				width={2100}
				centerY={760}
				anchor={[0.5, 0.41]}
				grade={SCREEN}
				zoom={[1.06, 1.18]}
				range={[0, dur]}
				focus={[0.5, 0.41]}
				target={[540, 720]}
				lock={0.3}
				pan={[
					[0, 0],
					[0, -16],
				]}
				showFrom={0}
				showTo={dur}
				fadeIn={0}
				fadeOut={14}
				feather={20}
				cropTop={0.31}
				cropBottom={0.51}
				backdropDim={0.85}
			/>
			<GlowAT top={300} size={480} start={cue.start} breath={0.05} />
			<TextAT start={cue.wordStart("Dois")} top={120} size={110} color={AT.grey} spacing={0.08}>
				2023
			</TextAT>
			<WordmarkAT image={IMG.claudeIcone} width={120} top={240} start={cue.start + 22} spring />
			<TextAT start={cue.wordStart("Claude")} top={1140} size={180} spacing={0.05}>
				CLAUDE
			</TextAT>
			<RuleAT start={cue.wordStart("competir")} top={1340} width={340} />
		</SceneShell>
	);
};
