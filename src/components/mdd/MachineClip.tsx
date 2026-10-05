import React from "react";
import {OffthreadVideo, staticFile} from "remotion";

type Props = {
	/** Punch-in; the machine should always fill more than the frame. */
	zoom?: number;
	startFrom?: number;
	playbackRate?: number;
	/** Filter brightness — the "powering on" ramp of the final scene. */
	brightness?: number;
};

/**
 * The machine: a water-cooled rig glowing in the dark (Pexels, brand-free).
 * Shared by the opening, the blurred CTA base and the powering-on finale.
 */
export const MachineClip: React.FC<Props> = ({
	zoom = 1.12,
	startFrom,
	playbackRate = 1,
	brightness = 1,
}) => (
	<div style={{position: "absolute", inset: 0, overflow: "hidden"}}>
		<OffthreadVideo
			src={staticFile("videos/mdd-maquina/clip-02.mp4")}
			muted
			startFrom={startFrom}
			playbackRate={playbackRate}
			style={{
				width: "100%",
				height: "100%",
				objectFit: "cover",
				filter: `brightness(${brightness})`,
				transform: `scale(${zoom})`,
			}}
		/>
	</div>
);
