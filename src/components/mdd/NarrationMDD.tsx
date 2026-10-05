import React from "react";
import {Audio, Sequence, staticFile} from "remotion";
import {NARRATION_MDD, VO_DIR_MDD} from "../../utils/narration-mdd";

/** Each spoken line is its own clip, mounted at the frame in src/narration-mdd.json. */
export const NarrationMDD: React.FC = () => {
	if (!NARRATION_MDD.enabled) return null;
	return (
		<>
			{NARRATION_MDD.lines.map((l) => (
				<Sequence key={l.id} from={l.frame} durationInFrames={l.durationInFrames} layout="none">
					<Audio src={staticFile(`${VO_DIR_MDD}/${l.id}.wav`)} volume={() => NARRATION_MDD.volume} />
				</Sequence>
			))}
		</>
	);
};
