import React from "react";
import {Audio, Sequence, staticFile} from "remotion";
import {NARRATION_CP, VO_DIR} from "../../utils/narration-cp";

/**
 * The spoken script of "Comece Pequeno". Each line is its own clip mounted at
 * the frame where its moment happens on screen, so re-timing a scene means
 * changing a `frame` in narration-comece-pequeno.json and nothing else.
 *
 * Nothing mounts until the clips have been generated, so the film still
 * renders (silently) on a clean checkout.
 */
export const NarrationCP: React.FC = () => {
	if (!NARRATION_CP.enabled) return null;

	return (
		<>
			{NARRATION_CP.lines.map((l) => (
				<Sequence
					key={l.id}
					from={l.frame}
					durationInFrames={l.durationInFrames}
					layout="none"
				>
					<Audio src={staticFile(`${VO_DIR}/${l.id}.wav`)} volume={() => NARRATION_CP.volume} />
				</Sequence>
			))}
		</>
	);
};
