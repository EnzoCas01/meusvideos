import React from "react";
import {Audio, interpolate, Sequence, staticFile} from "remotion";
import {AUDIO_NF} from "../../utils/audio-nf";
import {musicDuckNF} from "../../utils/narration-nf";

/**
 * Score and sound design for "Netflix". Every file referenced here is
 * synthesised by `node tools/generate-audio.mjs netflix` — no samples, no stock.
 *
 * The bed is always behind the voice: its volume callback multiplies the build
 * curve by `musicDuckNF`, so it drops under every spoken line without the scenes
 * having to know anything about it.
 */
export const SoundtrackNF: React.FC = () => {
	return (
		<>
			{AUDIO_NF.music.enabled && <MusicBed />}
			{AUDIO_NF.sfx.enabled &&
				AUDIO_NF.sfx.cues.map((cue, i) => (
					<Sequence key={i} from={cue.frame} durationInFrames={cue.durationInFrames}>
						<Audio src={staticFile(cue.src)} volume={() => cue.volume} />
					</Sequence>
				))}
		</>
	);
};

/**
 * One curve for the whole bed: quiet under the hook, wider as the film learns,
 * at its peak on the world scale, then easing and leaving under the wordmark.
 * The last stretch is the slowest part of the film, and the bed follows it down
 * rather than fading out on a timer.
 */
const MusicBed: React.FC = () => {
	const {src, fadeInFrames, riseStart, peakStart, easeStart, finalStart, fadeOutStart, totalFrames, peakVolume} =
		AUDIO_NF.music;

	return (
		<Audio
			src={staticFile(src)}
			volume={(f) =>
				interpolate(
					f,
					[0, fadeInFrames, riseStart, peakStart, easeStart, finalStart, fadeOutStart, totalFrames],
					[
						0,
						peakVolume * 0.44,
						peakVolume * 0.68,
						peakVolume,
						peakVolume * 0.84,
						peakVolume * 0.6,
						peakVolume * 0.44,
						0,
					],
					{extrapolateLeft: "clamp", extrapolateRight: "clamp"},
				) * musicDuckNF(f)
			}
		/>
	);
};
