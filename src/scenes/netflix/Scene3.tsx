import React from "react";
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from "remotion";
import {GradedPhoto, GRADES} from "../../components/netflix/GradedPhoto";
import {SceneShell} from "../../components/netflix/SceneShell";
import {TextNF} from "../../components/netflix/TextNF";
import {cueForNF} from "../../utils/cue-nf";
import {IMG} from "../../utils/imagens-nf";
import {NF} from "../../utils/theme-nf";
import {sceneDurationNF} from "../../utils/timeline-nf";

const cueFor = cueForNF(2);

/**
 * 03 — the problem, then the turn. A real rental store under a cold,
 * desaturated grade while the three complaints are said; on "mudou as regras"
 * a red panel sweeps the frame and the red envelope is what remains — the
 * accent enters the film.
 */
export const Scene3: React.FC = () => {
	const frame = useCurrentFrame();
	const cue = cueFor("03-problema");
	const dur = sceneDurationNF(2);
	const wipe = cue.atText("Então") - 4; // on "Então": earlier = longer envelope
	const handoff = wipe + 8; // red fully covers the frame here

	const panelY = interpolate(frame, [wipe, handoff, wipe + 18], [100, 0, -100], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.bezier(0.7, 0, 0.3, 1),
	});

	return (
		<SceneShell index={2}>
			<GradedPhoto
				image={IMG.rentalStore}
				width={1600}
				centerY={900}
				zoom={[1, 1.25]}
				focus={[0.45, 0.5]}
				pan={[
					[70, 0],
					[-70, 0],
				]}
				range={[0, handoff]}
				showFrom={0}
				showTo={handoff}
				fadeIn={0}
				fadeOut={0}
				grade={GRADES.cold}
				backdropDim={0.25}
			/>
			<TextNF start={cue.at(0.27)} end={cue.at(0.35)} top={330} size={230} spacing={0.05}>
				MULTAS
			</TextNF>
			<TextNF start={cue.at(0.36)} end={cue.at(0.53)} top={290} size={180} spacing={0.05}>
				DATAS DE
				<br />
				DEVOLUÇÃO
			</TextNF>
			<TextNF start={cue.at(0.55)} end={wipe} top={290} size={150} spacing={0.05}>
				POUCA
				<br />
				CONVENIÊNCIA
			</TextNF>

			<GradedPhoto
				image={IMG.envelope}
				width={1750}
				centerY={860}
				zoom={[1, 1.28]}
				focus={[0.47, 0.47]}
				target={[540, 860]}
				lock={0.5}
				range={[handoff, dur]}
				showFrom={handoff}
				showTo={dur}
				fadeIn={0}
				fadeOut={0}
				backdropDim={0.28}
			/>
			<TextNF start={cue.at(0.86)} top={180} size={175} spacing={0.04}>
				MUDOU
				<br />
				AS REGRAS
			</TextNF>

			{frame >= wipe && frame <= wipe + 19 ? (
				<AbsoluteFill style={{backgroundColor: NF.accent, transform: `translateY(${panelY}%)`}} />
			) : null}
		</SceneShell>
	);
};
