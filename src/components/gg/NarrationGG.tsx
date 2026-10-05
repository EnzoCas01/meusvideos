import React from "react";
import {Audio, Sequence, staticFile} from "remotion";
import {NARRATION_GG, VO_DIR_GG} from "../../utils/narration-gg";

/** Each spoken line is its own clip, mounted at the frame in src/narration-gg.json. */
export const NarrationGG: React.FC = () => (
	<>
		{NARRATION_GG.lines.map((l) => (
			<Sequence key={l.id} from={l.frame} durationInFrames={l.durationInFrames} layout="none">
				<Audio src={staticFile(`${VO_DIR_GG}/${l.id}.wav`)} />
			</Sequence>
		))}
	</>
);
