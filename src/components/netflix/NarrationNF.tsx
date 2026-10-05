import React from "react";
import {Audio, Sequence, staticFile} from "remotion";
import {NARRATION_NF, VO_DIR_NF} from "../../utils/narration-nf";

/** Each spoken line is its own clip, mounted at the frame in src/narration-netflix.json. */
export const NarrationNF: React.FC = () => {
	if (!NARRATION_NF.enabled) return null;
	return (
		<>
			{NARRATION_NF.lines.map((l) => (
				<Sequence key={l.id} from={l.frame} durationInFrames={l.durationInFrames} layout="none">
					<Audio src={staticFile(`${VO_DIR_NF}/${l.id}.wav`)} volume={() => NARRATION_NF.volume} />
				</Sequence>
			))}
		</>
	);
};
