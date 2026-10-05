import React from "react";
import {Audio, Sequence, staticFile} from "remotion";
import {AUDIO_MQ} from "../../utils/audio-mq";

/**
 * Sound design for "MaquinaIA". Every file referenced here is synthesised by
 * `node tools/generate-audio.mjs maquina` — no samples, no stock.
 *
 * There is no bed in this film (no music was asked for), so this component is
 * only the effect cues: one short sound per thing that happens on screen, all
 * of them under the voice, none of them ever interrupting it.
 */
export const SoundtrackMQ: React.FC = () => (
	<>
		{AUDIO_MQ.sfx.enabled &&
			AUDIO_MQ.sfx.cues.map((cue, i) => (
				<Sequence key={i} from={cue.frame} durationInFrames={cue.durationInFrames}>
					<Audio src={staticFile(cue.src)} volume={() => cue.volume} />
				</Sequence>
			))}
	</>
);
