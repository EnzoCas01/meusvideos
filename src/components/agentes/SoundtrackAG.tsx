import React from "react";
import {Audio, Sequence, staticFile} from "remotion";
import {AUDIO_AG} from "../../utils/audio-ag";

/**
 * Sound design for "Agentes" — effects only, no music bed (project default).
 * Each cue marks an event on screen; the list lives in utils/audio-ag.ts.
 */
export const SoundtrackAG: React.FC = () => {
	const {sfx} = AUDIO_AG;
	if (!sfx.enabled) return null;
	return (
		<>
			{sfx.cues.map((cue, i) => (
				<Sequence key={i} from={cue.frame} durationInFrames={cue.durationInFrames}>
					<Audio src={staticFile(cue.src)} volume={() => cue.volume} />
				</Sequence>
			))}
		</>
	);
};
