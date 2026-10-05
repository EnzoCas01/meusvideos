import React from "react";
import {GradedPhoto, GRADES} from "../../components/netflix/GradedPhoto";
import {SceneShell} from "../../components/netflix/SceneShell";
import {TextNF} from "../../components/netflix/TextNF";
import {cueForNF} from "../../utils/cue-nf";
import {IMG} from "../../utils/imagens-nf";
import {NF} from "../../utils/theme-nf";
import {sceneDurationNF} from "../../utils/timeline-nf";

const cueFor = cueForNF(0);

/**
 * 01 — HOOK. Opens already on the real red envelope, pushing slowly toward
 * its print; the DVD slides in from the right when "DVDs" is said.
 */
export const Scene1: React.FC = () => {
	const cue = cueFor("01-gancho");
	const dur = sceneDurationNF(0);
	const sayNetflix = cue.at(0.27);
	const sayDvd = cue.at(0.6);

	return (
		<SceneShell index={0}>
			<GradedPhoto
				image={IMG.envelope}
				width={1750}
				centerY={860}
				zoom={[1, 1.3]}
				range={[0, dur]}
				focus={[0.47, 0.47]}
				target={[540, 860]}
				lock={0.5}
				showFrom={0}
				showTo={dur}
				fadeIn={0}
				fadeOut={0}
				backdropDim={0.28}
			/>
			<GradedPhoto
				image={IMG.disc}
				width={620}
				anchor={[0.505, 0.511]}
				centerX={730}
				centerY={1190}
				circle={[0.505, 0.511, 0.465]}
				shadow
				backdrop={false}
				grade={GRADES.disc}
				zoom={[1, 1.12]}
				pan={[
					[430, 40],
					[0, 0],
				]}
				rotate={[-50, 40]}
				ease="out"
				range={[sayDvd - 14, dur]}
				showFrom={sayDvd - 14}
				showTo={dur}
				fadeIn={8}
				fadeOut={0}
			/>

			<TextNF start={cue.start} end={sayNetflix - 4} top={130} size={200}>
				VOCÊ SABIA<span style={{color: NF.accentText}}>?</span>
			</TextNF>
			<TextNF start={sayNetflix} top={130} size={210} spacing={0.05}>
				NETFLIX
			</TextNF>
			<TextNF start={sayDvd} top={330} size={130} color={NF.accentText} spacing={0.06} scrim={false}>
				+ DVDs
			</TextNF>
		</SceneShell>
	);
};
