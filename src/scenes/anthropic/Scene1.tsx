import React from "react";
import {GradedPhoto} from "../../components/anthropic/GradedPhoto";
import {SceneShell} from "../../components/anthropic/SceneShell";
import {TextAT} from "../../components/anthropic/TextAT";
import {WordmarkAT} from "../../components/anthropic/MarksAT";
import {cueForAT} from "../../utils/cue-at";
import {IMG} from "../../utils/imagens-at";
import {AT} from "../../utils/theme-at";
import {sceneDurationAT} from "../../utils/timeline-at";

const cueFor = cueForAT(0);

/**
 * 01 — HOOK. Opens already on the real Pioneer Building (OpenAI's first home),
 * pushing slowly in; the OpenAI wordmark lands exactly on "OpenAI", and
 * "SAÍRAM" turns coral on the word that carries the whole premise.
 */
export const Scene1: React.FC = () => {
	const cue = cueFor("01-gancho");
	const dur = sceneDurationAT(0);
	const atOpenai = cue.wordStart(/^openai$/);
	const atSairam = cue.wordStart(/^saíram$/);

	return (
		<SceneShell index={0}>
			<GradedPhoto
				image={IMG.sedeOpenAI}
				width={1400}
				centerY={840}
				zoom={[1, 1.2]}
				range={[0, dur]}
				focus={[0.45, 0.4]}
				target={[540, 760]}
				lock={0.5}
				showFrom={0}
				showTo={dur}
				fadeIn={0}
				fadeOut={14}
				backdropDim={0.3}
			/>
			<TextAT start={cue.start} end={atOpenai - 4} top={120} size={200}>
				VOCÊ SABIA<span style={{color: AT.accentText}}>?</span>
			</TextAT>
			<WordmarkAT image={IMG.marcaOpenAI} width={620} top={350} start={atOpenai} backing />
			<TextAT start={atSairam} top={850} size={200} color={AT.accentText} spacing={0.05}>
				SAÍRAM
			</TextAT>
		</SceneShell>
	);
};
