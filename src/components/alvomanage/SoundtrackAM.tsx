import React from "react";
import {Audio, Sequence, interpolate, staticFile} from "remotion";
import {AUDIO_AM, musicDuckAM, quietAM} from "../../utils/audio-am";

/** Bed + effects of "AlvoManage" (files from tools/generate-audio-alvomanage.mjs). */
export const SoundtrackAM: React.FC = () => {
	const {music, sfx} = AUDIO_AM;
	return (
		<>
			{music.enabled && (
				<Audio
					src={staticFile(music.src)}
					volume={(f) =>
						interpolate(
							f,
							[0, music.fadeInFrames, music.fadeOutStart, music.totalFrames],
							[0, music.peakVolume, music.peakVolume, 0],
							{extrapolateLeft: "clamp", extrapolateRight: "clamp"},
						) *
						musicDuckAM(f) *
						quietAM(f)
					}
				/>
			)}
			{sfx.enabled &&
				sfx.cues.map((cue, i) => (
					<Sequence key={i} name={cue.name} from={cue.frame} durationInFrames={cue.durationInFrames} layout="none">
						<Audio src={staticFile(cue.src)} volume={() => cue.volume} />
					</Sequence>
				))}
		</>
	);
};
