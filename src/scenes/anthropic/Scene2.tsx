import React from "react";
import {GradedPhoto} from "../../components/anthropic/GradedPhoto";
import {SceneShell} from "../../components/anthropic/SceneShell";
import {TextAT} from "../../components/anthropic/TextAT";
import {cueForAT} from "../../utils/cue-at";
import {IMG} from "../../utils/imagens-at";
import {AT} from "../../utils/theme-at";
import {sceneDurationAT} from "../../utils/timeline-at";

const cueFor = cueForAT(1);

/**
 * 02 — DARIO. The stage shot pushes in (its right edge slides out of frame)
 * and hands over to the close portrait as the voice starts the second line.
 * The resumé lands word by word: name, employer, what he led.
 */
export const Scene2: React.FC = () => {
	const dario = cueFor("02-dario");
	const pesquisa = cueFor("03-pesquisa");
	const dur = sceneDurationAT(1);

	return (
		<SceneShell index={1}>
			<GradedPhoto
				image={IMG.darioPalco}
				width={1350}
				centerY={1080}
				anchor={[0.5, 0.42]}
				zoom={[1.08, 1.22]}
				range={[0, 96]}
				showFrom={0}
				showTo={96}
				fadeIn={0}
				fadeOut={22}
				backdropDim={0.32}
			/>
			<GradedPhoto
				image={IMG.darioRetrato}
				width={1100}
				centerY={840}
				zoom={[1.04, 1.14]}
				range={[78, dur]}
				showFrom={78}
				showTo={dur}
				fadeIn={20}
				fadeOut={16}
			/>
			<TextAT start={dario.wordStart("Dario")} end={100} top={130} size={200} spacing={0.05}>
				DARIO
			</TextAT>
			<TextAT start={dario.wordStart("Amodei")} end={100} top={322} size={200} spacing={0.05}>
				AMODEI
			</TextAT>
			<TextAT start={pesquisa.wordStart("OpenAI")} top={1030} size={38} font="sans" weight={600} spacing={0.28} color={AT.grey}>
				NA OPENAI
			</TextAT>
			<TextAT start={pesquisa.wordStart("pesquisas")} top={1110} size={105} spacing={0.05}>
				PESQUISA
			</TextAT>
			<TextAT start={pesquisa.wordStart("segurança")} top={1225} size={105} color={AT.accentText} spacing={0.05}>
				SEGURANÇA
			</TextAT>
		</SceneShell>
	);
};
