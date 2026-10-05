import React from "react";
import {Audio, Sequence, staticFile, interpolate} from "remotion";
import {AUDIO_IF} from "../../utils/audio-if";
import {musicDuckIF} from "../../utils/narration-if";

/**
 * Score and sound design for "IFood". Every file referenced here is
 * synthesised by `node tools/generate-audio.mjs ifood` — no samples, no stock.
 *
 * The bed is always behind the voice: its volume callback multiplies the build
 * curve by `musicDuckIF`, so it drops under every spoken line without the
 * scenes having to know anything about it.
 */
export const SoundtrackIF: React.FC = () => {
	return (
		<>
			{AUDIO_IF.music.enabled && <MusicBed />}
			{AUDIO_IF.sfx.enabled &&
				AUDIO_IF.sfx.cues.map((cue, i) => (
					<Sequence key={i} from={cue.frame} durationInFrames={cue.durationInFrames}>
						<Audio src={staticFile(cue.src)} volume={() => cue.volume} />
					</Sequence>
				))}
		</>
	);
};

/**
 * One curve for the whole bed: quiet under the hook, a machine by 2012, urgent
 * through the challenge, full on the 2018 impact, then out over the close.
 */
const MusicBed: React.FC = () => {
	const {src, fadeInFrames, riseStart, peakStart, resolveStart, fadeOutStart, totalFrames, peakVolume} =
		AUDIO_IF.music;

	return (
		<Audio
			src={staticFile(src)}
			volume={(f) =>
				interpolate(
					f,
					[0, fadeInFrames, riseStart, peakStart, resolveStart, fadeOutStart, totalFrames],
					[0, peakVolume * 0.5, peakVolume * 0.8, peakVolume, peakVolume * 0.85, peakVolume * 0.5, 0],
					{extrapolateLeft: "clamp", extrapolateRight: "clamp"},
				) * musicDuckIF(f)
			}
		/>
	);
};
