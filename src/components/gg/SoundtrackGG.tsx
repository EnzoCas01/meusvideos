import React from "react";
import {Audio, Sequence, staticFile} from "remotion";
import {AUDIO_GG} from "./audio-gg";

/**
 * Sound design for the Google film (sx=gg).
 *
 * No music bed — the film is silent except for sound effects.
 * Each cue exists because something specific happens on screen, and the voice
 * never pauses for any of them.
 */
export const SoundtrackGG: React.FC = () => (
	<>
		{AUDIO_GG.sfx.enabled &&
			AUDIO_GG.sfx.cues.map((cue: { src: string; frame: number; durationInFrames: number; volume: number }, i: number) => (
				<Sequence key={i} from={cue.frame} durationInFrames={cue.durationInFrames}>
					<Audio src={staticFile(cue.src)} volume={() => cue.volume} />
				</Sequence>
			))}
	</>
);
