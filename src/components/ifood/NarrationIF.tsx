import React from "react";
import {Audio, Sequence, staticFile} from "remotion";
import {NARRATION_IF, VO_DIR_IF} from "../../utils/narration-if";

/**
 * The spoken script of "IFood". Each line is its own clip mounted at the frame
 * recorded in src/narration-ifood.json, which is the single source of truth
 * for the whole edit — scenes, captions and cuts all derive from it.
 *
 * Nothing mounts if the clips have not been generated, so the film still
 * renders silently on a clean checkout.
 */
export const NarrationIF: React.FC = () => {
	if (!NARRATION_IF.enabled) return null;

	return (
		<>
			{NARRATION_IF.lines.map((l) => (
				<Sequence
					key={l.id}
					from={l.frame}
					durationInFrames={l.durationInFrames}
					layout="none"
				>
					<Audio src={staticFile(`${VO_DIR_IF}/${l.id}.wav`)} volume={() => NARRATION_IF.volume} />
				</Sequence>
			))}
		</>
	);
};
