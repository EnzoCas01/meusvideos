import React from "react";
import {GradedPhoto, GRADES} from "../../components/netflix/GradedPhoto";
import {SceneShell} from "../../components/netflix/SceneShell";
import {RuleNF, TextNF} from "../../components/netflix/TextNF";
import {cueForNF} from "../../utils/cue-nf";
import {IMG} from "../../utils/imagens-nf";
import {NF} from "../../utils/theme-nf";
import {sceneDurationNF} from "../../utils/timeline-nf";

const cueFor = cueForNF(3);

/**
 * 04 — the subscription, then the number. The real prepaid return mailer for
 * "no return dates / no fees"; then a wall of generic DVDs, graded down to
 * texture, carries "2003 / 1 MILHÃO" (1 million subscribers, real figure).
 */
export const Scene4: React.FC = () => {
	const cue = cueFor("04-assinatura");
	const dur = sceneDurationNF(3);
	const swap = cue.at(0.66);

	return (
		<SceneShell index={3}>
			<GradedPhoto
				image={IMG.returnMailer}
				width={1200}
				centerY={1040}
				anchor={[0.5, 0.5]}
				zoom={[1, 1.2]}
				focus={[0.22, 0.6]}
				target={[540, 1040]}
				lock={0.6}
				range={[0, swap + 16]}
				showFrom={0}
				showTo={swap + 16}
				fadeIn={0}
				fadeOut={16}
				backdropDim={0.25}
			/>
			<TextNF start={cue.at(0.23)} end={swap - 6} top={150} size={190} spacing={0.05}>
				ASSINATURA
			</TextNF>
			<TextNF start={cue.at(0.37)} end={swap - 6} top={345} size={100} spacing={0.04}>
				SEM DATA DE DEVOLUÇÃO
			</TextNF>
			<TextNF start={cue.at(0.52)} end={swap - 6} top={455} size={100} spacing={0.04} color={NF.accentText}>
				SEM MULTA
			</TextNF>

			<GradedPhoto
				image={IMG.dvdStack}
				width={1180}
				centerY={960}
				zoom={[1.05, 1.2]}
				pan={[
					[0, 80],
					[0, -80],
				]}
				range={[swap, dur]}
				showFrom={swap}
				showTo={dur}
				fadeIn={16}
				fadeOut={0}
				backdrop={false}
				feather={0}
				grade={GRADES.dim}
			/>
			<TextNF start={cue.at(0.68)} top={500} size={210} spacing={0.12} color={NF.grey}>
				2003
			</TextNF>
			<TextNF start={cue.at(0.82)} top={720} size={260} spacing={0.03}>
				1 MILHÃO
			</TextNF>
			<TextNF
				start={cue.at(0.88)}
				top={1010}
				size={34}
				font="sans"
				weight={600}
				spacing={0.3}
				color={NF.grey}
				scrim={false}
			>
				DE ASSINANTES
			</TextNF>
			<RuleNF start={cue.at(0.9)} top={1080} width={300} />
		</SceneShell>
	);
};
