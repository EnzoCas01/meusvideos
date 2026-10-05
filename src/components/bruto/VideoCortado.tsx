import React from "react";
import {AbsoluteFill, OffthreadVideo, Sequence, staticFile} from "remotion";

/** One kept stretch of the raw video: source frames [de, ate) placed at `frame` on the output timeline. */
export type Corte = {de: number; ate: number; frame: number; durationInFrames: number};

type Props = {
	/** Path inside public/, e.g. "bruto/xx/fonte.mp4" (the `fonte` field of narration-<sx>.json). */
	src: string;
	cortes: Corte[];
	/** Alternate a slight punch-in on every other cut so jump cuts read as intentional. 1 = off. */
	zoomAlternado?: number;
	volume?: number;
};

/** Plays the raw video with its original audio, skipping everything between the kept stretches. */
export const VideoCortado: React.FC<Props> = ({src, cortes, zoomAlternado = 1.08, volume = 1}) => (
	<AbsoluteFill style={{backgroundColor: "#000"}}>
		{cortes.map((c, i) => (
			<Sequence key={i} from={c.frame} durationInFrames={c.durationInFrames}>
				<AbsoluteFill style={{transform: `scale(${i % 2 ? zoomAlternado : 1})`}}>
					<OffthreadVideo
						src={staticFile(src)}
						trimBefore={c.de}
						trimAfter={c.ate}
						volume={volume}
						style={{width: "100%", height: "100%", objectFit: "cover"}}
					/>
				</AbsoluteFill>
			</Sequence>
		))}
	</AbsoluteFill>
);
