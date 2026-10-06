import React from "react";
import {Audio, Sequence, staticFile} from "remotion";
import {NARRATION_IF, VO_DIR_IF} from "../../utils/narration-if";

/**
 * The spoken script of "iFood — a virada". Each line is its own clip mounted at
 * the frame where its moment happens on screen, so re-timing a scene means
 * changing a `frame` in narration-ifood.json and nothing else.
 *
 * Nothing mounts until the clips have been generated, so the film still
 * renders (silently) on a clean checkout.
 */
export const NarrationIF: React.FC = () => {
	if (!NARRATION_IF.enabled) return null;

	return (
		<>
			{NARRATION_IF.lines.map((l) => (
				<Sequence key={l.id} from={l.frame} durationInFrames={l.durationInFrames} layout="none">
					<Audio src={staticFile(`${VO_DIR_IF}/${l.id}.wav`)} volume={() => NARRATION_IF.volume} />
				</Sequence>
			))}
		</>
	);
};
