import React from "react";
import {Audio, Sequence, staticFile} from "remotion";
import {NARRATION_MS, VO_DIR_MS} from "../../utils/narration-ms";

/** Each spoken line is its own clip, mounted at the frame in src/narration-microsoft.json. */
export const NarrationMS: React.FC = () => {
	if (!NARRATION_MS.enabled) return null;
	return (
		<>
			{NARRATION_MS.lines.map((l) => (
				<Sequence key={l.id} from={l.frame} durationInFrames={l.durationInFrames} layout="none">
					<Audio src={staticFile(`${VO_DIR_MS}/${l.id}.wav`)} volume={() => NARRATION_MS.volume} />
				</Sequence>
			))}
		</>
	);
};
