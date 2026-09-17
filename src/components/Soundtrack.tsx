import React from "react";
import {Audio, Sequence, staticFile, interpolate} from "remotion";
import {AUDIO} from "../utils/audio";
import {musicDuck} from "../utils/narration";

/**
 * Optional audio layer.
 *
 * The project ships without any audio file, so nothing is mounted by default
 * and the film is designed to work in complete silence. To enable sound, drop
 * the files into `public/audio/` and flip the flags in `src/utils/audio.ts` —
 * no other change is needed.
 */
export const Soundtrack: React.FC = () => {
	return (
		<>
			{AUDIO.music.enabled && <MusicBed />}
			{AUDIO.sfx.enabled &&
				AUDIO.sfx.cues.map((cue, i) => (
					<Sequence key={i} from={cue.frame} durationInFrames={cue.durationInFrames}>
						<Audio src={staticFile(cue.src)} volume={() => cue.volume} />
					</Sequence>
				))}
		</>
	);
};

/** The score swells very slowly with the film and resolves into silence. */
const MusicBed: React.FC = () => {
	const {src, fadeInFrames, fadeOutStart, totalFrames, peakVolume} = AUDIO.music;

	return (
		<Audio
			src={staticFile(src)}
			volume={(f) =>
				interpolate(
					f,
					[0, fadeInFrames, fadeOutStart, totalFrames],
					[0, peakVolume * 0.55, peakVolume, 0],
					{extrapolateLeft: "clamp", extrapolateRight: "clamp"},
				) * musicDuck(f)
			}
		/>
	);
};
