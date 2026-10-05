import React from "react";
import {AbsoluteFill, OffthreadVideo, staticFile} from "remotion";
import {arq, num} from "../_comum/params";
import type {ComponenteProps} from "../types";

/**
 * Video clip filling the frame (muted, cover). OffthreadVideo only — never
 * <Video> in a render. A clip shorter than the scene gets a playbackRate
 * boost from params, never a freeze.
 */
export const MidiaClipe: React.FC<ComponenteProps> = ({params}) => {
	const arquivo = arq(params.arquivo, "");
	const startFrom = num(params.start_from, 0);
	const endAt = num(params.end_at, 300);
	const playbackRate = num(params.playback_rate, 1);

	if (!arquivo) return null;

	return (
		<AbsoluteFill style={{overflow: "hidden"}}>
			<OffthreadVideo
				src={staticFile(arquivo)}
				muted
				startFrom={startFrom}
				endAt={endAt}
				playbackRate={playbackRate}
				style={{width: "100%", height: "100%", objectFit: "cover"}}
			/>
		</AbsoluteFill>
	);
};
