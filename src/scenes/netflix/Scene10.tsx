import React from "react";
import {Img, interpolate, staticFile, useCurrentFrame} from "remotion";
import {GradedPhoto, GRADES} from "../../components/netflix/GradedPhoto";
import {SceneShell} from "../../components/netflix/SceneShell";
import {TextNF} from "../../components/netflix/TextNF";
import {cueForNF} from "../../utils/cue-nf";
import {IMG} from "../../utils/imagens-nf";
import {sceneDurationNF} from "../../utils/timeline-nf";

const cueFor = cueForNF(9);

/**
 * 10 — the close. Slowed right down: one real photograph (Netflix on a phone
 * lying on a laptop), a very slow push, one word, then the photo sinks to
 * black and the wordmark surfaces alone before a slow fade out.
 */
export const Scene10: React.FC = () => {
	const frame = useCurrentFrame();
	const cue = cueFor("10-final");
	const dur = sceneDurationNF(9);
	const word = cue.atText("reinventar");
	const sink = cue.end; // photo starts sinking to black as the last word ends

	// Enters right after "REINVENTAR" clears (sink + 4) instead of sink + 12, and
	// holds near-full until close to the very end, instead of fading out almost
	// as soon as it fades in.
	const markOp =
		interpolate(frame, [sink + 4, sink + 22], [0, 0.9], {extrapolateLeft: "clamp", extrapolateRight: "clamp"}) *
		interpolate(frame, [dur - 18, dur - 1], [1, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});

	return (
		<SceneShell index={9}>
			<GradedPhoto
				image={IMG.phone2018}
				width={1500}
				centerY={900}
				zoom={[1, 1.3]}
				focus={[0.62, 0.42]}
				target={[540, 900]}
				lock={0.7}
				ease="linear"
				range={[0, sink + 30]}
				showFrom={0}
				showTo={sink + 30}
				fadeIn={20}
				fadeOut={46}
				grade={GRADES.warm}
				backdropDim={0.22}
			/>
			<TextNF start={word - 4} end={sink + 4} top={170} size={200} spacing={0.1}>
				REINVENTAR
			</TextNF>
			<Img
				src={staticFile(IMG.logomark.path)}
				style={{
					position: "absolute",
					left: 540 - 190,
					top: 900 - (380 * IMG.logomark.height) / IMG.logomark.width / 2,
					width: 380,
					opacity: markOp,
				}}
			/>
		</SceneShell>
	);
};
