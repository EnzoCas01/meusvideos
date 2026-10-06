import React from "react";
import {Audio, Sequence, staticFile} from "remotion";
import {LINES_AM, NARRATION_AM} from "../../utils/timing-am";

/**
 * The voice of "AlvoManage": one clip per line, mounted at its frame.
 * Nothing mounts until the `narracao` agent flips `enabled` in
 * src/narration-alvomanage.json, so the film renders silently before that.
 */
export const NarrationAM: React.FC = () => {
	if (!NARRATION_AM.enabled) return null;
	return (
		<>
			{LINES_AM.map((l) => (
				<Sequence key={l.id} from={l.frame} durationInFrames={l.durationInFrames + 6} layout="none">
					<Audio src={staticFile(`${NARRATION_AM.dir}/${l.file}`)} volume={() => NARRATION_AM.volume} />
				</Sequence>
			))}
		</>
	);
};
