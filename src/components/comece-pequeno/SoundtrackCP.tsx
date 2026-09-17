import React from "react";
import {Audio, Sequence, staticFile, interpolate} from "remotion";
import {AUDIO_CP} from "../../utils/audio-cp";
import {musicDuckCP} from "../../utils/narration-cp";

/**
 * Score and sound design for "Comece Pequeno". Every file referenced here is
 * synthesised by `node tools/generate-audio.mjs comece-pequeno` — no samples,
 * no stock.
 */
export const SoundtrackCP: React.FC = () => {
	return (
		<>
			{AUDIO_CP.music.enabled && <MusicBed />}
			{AUDIO_CP.sfx.enabled &&
				AUDIO_CP.sfx.cues.map((cue, i) => (
					<Sequence key={i} from={cue.frame} durationInFrames={cue.durationInFrames}>
						<Audio src={staticFile(cue.src)} volume={() => cue.volume} />
					</Sequence>
				))}
		</>
	);
};

/** Builds with the story and resolves under the last line. */
const MusicBed: React.FC = () => {
	const {src, fadeInFrames, fadeOutStart, totalFrames, peakVolume} = AUDIO_CP.music;

	return (
		<Audio
			src={staticFile(src)}
			volume={(f) =>
				interpolate(
					f,
					[0, fadeInFrames, fadeOutStart, totalFrames],
					[0, peakVolume * 0.6, peakVolume, 0],
					{extrapolateLeft: "clamp", extrapolateRight: "clamp"},
				) * musicDuckCP(f)
			}
		/>
	);
};
