import React from "react";
import {Audio, Sequence, staticFile} from "remotion";
import {NARRATION_AG, VO_DIR_AG} from "../../utils/narration-ag";

/** Each spoken line is its own clip, mounted at the frame in src/narration-agentes.json. */
export const NarrationAG: React.FC = () => {
	if (!NARRATION_AG.enabled) return null;
	return (
		<>
			{NARRATION_AG.lines.map((l) => (
				<Sequence key={l.id} from={l.frame} durationInFrames={l.durationInFrames} layout="none">
					<Audio src={staticFile(`${VO_DIR_AG}/${l.id}.wav`)} volume={() => NARRATION_AG.volume} />
				</Sequence>
			))}
		</>
	);
};
