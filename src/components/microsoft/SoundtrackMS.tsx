import React from "react";
import {Audio, interpolate, Sequence, staticFile} from "remotion";
import {AUDIO_MS} from "../../utils/audio-ms";
import {musicDuckMS} from "../../utils/narration-ms";

/**
 * Score and sound design for "Microsoft".
 *
 * The bed is always behind the voice: its volume callback multiplies the build
 * curve by `musicDuckMS`, so it drops under every spoken line without the scenes
 * having to know anything about it.
 */
export const SoundtrackMS: React.FC = () => {
	const {music, sfx} = AUDIO_MS;
	return (
		<>
			{music.enabled && <MusicBed />}
			{sfx.enabled &&
				sfx.cues.map((cue, i) => (
					<Sequence key={i} from={cue.frame} durationInFrames={cue.durationInFrames}>
						<Audio src={staticFile(cue.src)} volume={() => cue.volume} />
					</Sequence>
				))}
		</>
	);
};

/**
 * One curve for the whole bed: contained under the hook and the two founders,
 * opening through the turn, fullest under US$ 17,3 milhões, then letting go
 * through the close until the wordmark takes it out.
 *
 * Every value is at or below `peakVolume` on purpose: the gain baked into
 * public/audio/microsoft/musica-cama.wav was measured at full scale (16 dB under
 * the voice under every spoken line, see tools/music-bed-ms.py), so a curve that
 * only attenuates can never eat into that margin — and it does not reach zero
 * anywhere except the final fade.
 */
const MusicBed: React.FC = () => {
	const {src, fadeInFrames, riseStart, peakStart, easeStart, fadeOutStart, totalFrames, peakVolume} = AUDIO_MS.music;

	return (
		<Audio
			src={staticFile(src)}
			volume={(f) =>
				interpolate(
					f,
					[0, fadeInFrames, riseStart, peakStart, easeStart, fadeOutStart, totalFrames],
					[
						0,
						peakVolume * 0.6,
						peakVolume * 0.68,
						peakVolume,
						peakVolume * 0.82,
						peakVolume * 0.64,
						0,
					],
					{extrapolateLeft: "clamp", extrapolateRight: "clamp"},
				) * musicDuckMS(f)
			}
		/>
	);
};
