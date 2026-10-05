import React from "react";
import {Audio, Sequence, staticFile} from "remotion";
import {NARRATION_AT, VO_DIR_AT} from "../../utils/narration-at";

/** Each spoken line is its own clip, mounted at the frame in src/narration-anthropic.json. */
export const NarrationAT: React.FC = () => {
	if (!NARRATION_AT.enabled) return null;
	return (
		<>
			{NARRATION_AT.lines.map((l) => (
				<Sequence key={l.id} from={l.frame} durationInFrames={l.durationInFrames} layout="none">
					<Audio src={staticFile(`${VO_DIR_AT}/${l.id}.wav`)} volume={() => NARRATION_AT.volume} />
				</Sequence>
			))}
		</>
	);
};
