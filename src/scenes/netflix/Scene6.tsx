import React from "react";
import {GradedPhoto, GRADES} from "../../components/netflix/GradedPhoto";
import {SceneShell} from "../../components/netflix/SceneShell";
import {RuleNF, TextNF} from "../../components/netflix/TextNF";
import {cueForNF} from "../../utils/cue-nf";
import {IMG} from "../../utils/imagens-nf";
import {NF} from "../../utils/theme-nf";
import {sceneDurationNF} from "../../utils/timeline-nf";

const cueFor = cueForNF(5);

/**
 * 06 — streaming arrives in the living room (a real Apple TV beside a flat
 * TV: technology, not a Netflix screen), while a spinning DVD stays beside it
 * ("sem abandonar os DVDs"). Then a Netflix streaming disc, dark, carries the
 * revenue figure (US$ 1 billion in 2007, real).
 */
export const Scene6: React.FC = () => {
	const cue = cueFor("06-streaming");
	const dur = sceneDurationNF(5);
	const dvd = cue.atText("sem abandonar");
	const swap = cue.atText("Naquele ano");
	const bil = cue.atText("um bilhão");

	return (
		<SceneShell index={5}>
			<GradedPhoto
				image={IMG.appleTvTv}
				width={1300}
				centerY={880}
				cropTop={0.1}
				zoom={[1, 1.22]}
				focus={[0.3, 0.42]}
				target={[470, 860]}
				lock={0.6}
				range={[0, swap + 14]}
				showFrom={0}
				showTo={swap + 14}
				fadeIn={0}
				fadeOut={14}
				backdropDim={0.25}
			/>
			<TextNF start={cue.start + 6} end={swap - 8} top={130} size={210} spacing={0.08}>
				2007
			</TextNF>
			<TextNF start={cue.atText("streaming")} end={swap - 8} top={350} size={165} spacing={0.05}>
				STREAMING
			</TextNF>

			<GradedPhoto
				image={IMG.disc}
				width={500}
				anchor={[0.505, 0.511]}
				centerX={330}
				centerY={1235}
				circle={[0.505, 0.511, 0.465]}
				shadow
				backdrop={false}
				grade={GRADES.disc}
				zoom={[1, 1.1]}
				rotate={[0, 260]}
				range={[dvd - 14, swap + 14]}
				showFrom={dvd - 14}
				showTo={swap + 14}
				fadeIn={16}
				fadeOut={10}
			/>

			<GradedPhoto
				image={IMG.disc}
				width={1300}
				anchor={[0.505, 0.511]}
				centerX={540}
				centerY={930}
				circle={[0.505, 0.511, 0.465]}
				shadow
				backdrop={false}
				grade={GRADES.disc}
				zoom={[1.05, 1.25]}
				rotate={[0, 90]}
				range={[swap, dur]}
				showFrom={swap}
				showTo={dur}
				fadeIn={14}
				fadeOut={0}
			/>
			<TextNF start={bil - 4} top={140} size={36} font="sans" weight={600} spacing={0.32} color={NF.grey} scrim={false}>
				RECEITA
			</TextNF>
			<TextNF start={bil} top={215} size={175} spacing={0.04}>
				US$ 1 BILHÃO
			</TextNF>
			<RuleNF start={bil + 10} top={430} width={300} />
		</SceneShell>
	);
};
