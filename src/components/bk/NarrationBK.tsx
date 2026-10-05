import React from "react";
import {Audio, Sequence, staticFile} from "remotion";
import {NARRATION_BK, VO_DIR_BK} from "../../utils/narration-bk";

/** Each spoken line is its own clip, mounted at the frame in src/narration-bk.json. */
export const NarrationBK: React.FC = () => (
	<>
		{NARRATION_BK.lines.map((l) => (
			<Sequence key={l.id} from={l.frame} durationInFrames={l.durationInFrames} layout="none">
				<Audio src={staticFile(`${VO_DIR_BK}/${l.id}.wav`)} />
			</Sequence>
		))}
	</>
);
