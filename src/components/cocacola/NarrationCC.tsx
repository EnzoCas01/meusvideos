import React from "react";
import {Audio, Sequence, staticFile} from "remotion";
import {NARRATION_CC, VO_DIR_CC} from "../../utils/narration-cc";

/** Each spoken line is its own clip, mounted at the frame in src/narration-cocacola.json. */
export const NarrationCC: React.FC = () => {
	if (!NARRATION_CC.enabled) return null;
	return (
		<>
			{NARRATION_CC.lines.map((l) => (
				<Sequence key={l.id} from={l.frame} durationInFrames={l.durationInFrames} layout="none">
					<Audio src={staticFile(`${VO_DIR_CC}/${l.id}.wav`)} volume={() => NARRATION_CC.volume} />
				</Sequence>
			))}
		</>
	);
};
