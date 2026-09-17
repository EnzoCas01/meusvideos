import React from "react";
import {Audio, Sequence, staticFile} from "remotion";
import {NARRATION} from "../utils/narration";

/**
 * The spoken script. Each line is a separate clip mounted at the frame where
 * its text appears on screen, so re-timing a scene only means changing the
 * `frame` in narration.json — the audio follows.
 *
 * Nothing mounts until the clips have been generated (see
 * `tools/generate-narration.mjs`), so the film still renders in silence.
 */
export const Narration: React.FC = () => {
	if (!NARRATION.enabled) return null;

	return (
		<>
			{NARRATION.lines.map((line) => (
				<Sequence
					key={line.id}
					from={line.frame}
					durationInFrames={line.durationInFrames}
					layout="none"
				>
					<Audio
						src={staticFile(`audio/vo/${line.id}.wav`)}
						volume={() => NARRATION.volume}
					/>
				</Sequence>
			))}
		</>
	);
};
