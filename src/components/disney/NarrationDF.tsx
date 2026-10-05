import React from "react";
import {Audio, Sequence, staticFile} from "remotion";
import {NARRATION_DF, VO_DIR_DF} from "../../utils/narration-df";

/** Each spoken line is its own clip, mounted at the frame in src/narration-disney.json. */
export const NarrationDF: React.FC = () => {
	if (!NARRATION_DF.enabled) return null;
	return (
		<>
			{NARRATION_DF.lines.map((l) => (
				<Sequence key={l.id} from={l.frame} durationInFrames={l.durationInFrames} layout="none">
					<Audio src={staticFile(`${VO_DIR_DF}/${l.id}.wav`)} volume={() => NARRATION_DF.volume} />
				</Sequence>
			))}
		</>
	);
};
