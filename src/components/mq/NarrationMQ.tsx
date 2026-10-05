import React from "react";
import {Audio, Sequence, staticFile} from "remotion";
import {NARRATION_MQ, VO_DIR_MQ} from "../../utils/narration-mq";

/** Each spoken line is its own clip, mounted at the frame in src/narration-mq.json. */
export const NarrationMQ: React.FC = () => {
	if (!NARRATION_MQ.enabled) return null;
	return (
		<>
			{NARRATION_MQ.lines.map((l) => (
				<Sequence key={l.id} from={l.frame} durationInFrames={l.durationInFrames} layout="none">
					<Audio src={staticFile(`${VO_DIR_MQ}/${l.id}.wav`)} volume={() => NARRATION_MQ.volume} />
				</Sequence>
			))}
		</>
	);
};
