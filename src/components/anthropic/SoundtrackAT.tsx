import React from "react";
import {Audio, interpolate, Sequence, staticFile} from "remotion";
import {AUDIO_AT} from "../../utils/audio-at";
import {musicDuckAT, NARRATION_AT} from "../../utils/narration-at";

/** After the last spoken word the score swells (+5 dB) so the close is heard, then fades. */
const TAIL_BOOST = 1.8;
const TAIL_RAMP = 20;
const lastSpokenEnd = () => Math.max(...NARRATION_AT.lines.map((l) => l.frame + l.durationInFrames));

/** Bed under the voice (ducked on every spoken line) plus event effects. */
export const SoundtrackAT: React.FC = () => {
	const {music, sfx} = AUDIO_AT;
	return (
		<>
			{music.enabled && (
				<Audio
					src={staticFile(music.src)}
					volume={(f) =>
						interpolate(f, [0, music.fadeInFrames, music.totalFrames - 60, music.totalFrames], [0, music.peakVolume, music.peakVolume, 0], {
							extrapolateLeft: "clamp",
							extrapolateRight: "clamp",
						}) *
						musicDuckAT(f) *
						interpolate(f, [lastSpokenEnd(), lastSpokenEnd() + TAIL_RAMP], [1, TAIL_BOOST], {extrapolateLeft: "clamp", extrapolateRight: "clamp"})
					}
				/>
			)}
			{sfx.enabled &&
				sfx.cues.map((cue, i) => (
					<Sequence key={i} from={cue.frame} durationInFrames={cue.durationInFrames}>
						<Audio src={staticFile(cue.src)} volume={() => cue.volume} />
					</Sequence>
				))}
		</>
	);
};
