import React from "react";
import {Audio, Sequence, staticFile, interpolate} from "remotion";
import {AUDIO_IF} from "../../utils/audio-if";
import {musicDuckIF} from "../../utils/narration-if";

/**
 * Score and sound design for "iFood — a virada". Every file referenced here is
 * synthesised by `node tools/generate-audio.mjs ifood` — no samples, no stock.
 */
export const SoundtrackIF: React.FC = () => {
	return (
		<>
			{AUDIO_IF.music.enabled && <MusicBedIF />}
			{AUDIO_IF.sfx.enabled &&
				AUDIO_IF.sfx.cues.map((cue, i) => (
					<Sequence key={i} from={cue.frame} durationInFrames={cue.durationInFrames}>
						<Audio src={staticFile(cue.src)} volume={() => cue.volume} />
					</Sequence>
				))}
		</>
	);
};

/** Low bed that gains intensity with the story and resolves on the close. */
const MusicBedIF: React.FC = () => {
	const {src, fadeInFrames, fadeOutStart, totalFrames, peakVolume} = AUDIO_IF.music;

	return (
		<Audio
			src={staticFile(src)}
			volume={(f) =>
				interpolate(
					f,
					[0, fadeInFrames, fadeOutStart, totalFrames],
					[0, peakVolume * 0.7, peakVolume, 0],
					{extrapolateLeft: "clamp", extrapolateRight: "clamp"},
				) * musicDuckIF(f)
			}
		/>
	);
};
