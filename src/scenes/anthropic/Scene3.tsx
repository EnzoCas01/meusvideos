import React from "react";
import {GradedPhoto} from "../../components/anthropic/GradedPhoto";
import {SceneShell} from "../../components/anthropic/SceneShell";
import {TextAT} from "../../components/anthropic/TextAT";
import {GlowAT, WordmarkAT} from "../../components/anthropic/MarksAT";
import {cueForAT} from "../../utils/cue-at";
import {IMG} from "../../utils/imagens-at";
import {AT} from "../../utils/theme-at";

const cueFor = cueForAT(2);

/**
 * 03 — THE LEAVING, THE BIRTH. The year and the founders' names live as
 * typographic cards on the dark ground (glow behind, no photo under them —
 * the Downing Street frame is from 2023 and must never carry the "2021"
 * stamp or a caption naming its subjects). The photo itself sits lower,
 * unlabelled, as the world they left; then it sinks, a coral glow rises and
 * the Claude mark pops as "ANTHROPIC" lands on the word itself.
 */
export const Scene3: React.FC = () => {
	const saida = cueFor("04-saida");
	const nova = cueFor("05-nova");
	const turn = nova.start + 28; // inside the pause before "A Anthropic."
	const atAnthropic = nova.wordStart("Anthropic");
	const beatEnd = turn - 8;

	return (
		<SceneShell index={2}>
			<GradedPhoto
				image={IMG.darioComAltman}
				width={1200}
				centerY={1100}
				zoom={[1.12, 1.24]}
				range={[0, 250]}
				pan={[
					[90, 0],
					[-130, 0],
				]}
				showFrom={0}
				showTo={250}
				fadeIn={0}
				fadeOut={30}
				backdropDim={0.34}
			/>
			{/* 2021 + DARIO + DANIELA: cards on the dark ground, a coral pool behind. */}
			<GlowAT top={330} size={620} start={saida.wordStart(/^vinte$/)} end={beatEnd} breath={0.05} />
			<TextAT start={saida.wordStart(/^vinte$/)} end={beatEnd} top={210} size={200} spacing={0.06} scrim={false}>
				2021
			</TextAT>
			<TextAT
				start={saida.wordStart("Dario")}
				end={beatEnd}
				top={462}
				size={42}
				font="sans"
				weight={600}
				spacing={0.24}
				color={AT.grey}
				scrim={false}
			>
				DARIO + DANIELA
			</TextAT>
			<GlowAT top={520} size={760} start={turn} breath={0.05} />
			<WordmarkAT image={IMG.claudeIcone} width={210} top={415} start={turn} spring />
			<TextAT start={atAnthropic} top={700} size={230} color={AT.accentText} spacing={0.04}>
				ANTHROPIC
			</TextAT>
		</SceneShell>
	);
};
