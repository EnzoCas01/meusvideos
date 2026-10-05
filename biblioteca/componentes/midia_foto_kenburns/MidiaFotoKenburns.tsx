import React from "react";
import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame} from "remotion";
import {arq, str} from "../_comum/params";
import type {ComponenteProps} from "../types";

const MOVIMENTOS: Record<string, {scale: [number, number]; tx: [number, number]; ty: [number, number]}> = {
	"zoom-in": {scale: [1.04, 1.16], tx: [0, 0], ty: [0, 0]},
	"zoom-out": {scale: [1.16, 1.04], tx: [0, 0], ty: [0, 0]},
	"pan-r": {scale: [1.14, 1.14], tx: [2.2, -2.2], ty: [0, 0]},
	"pan-l": {scale: [1.14, 1.14], tx: [-2.2, 2.2], ty: [0, 0]},
	nenhum: {scale: [1, 1], tx: [0, 0], ty: [0, 0]},
};

/**
 * Photo with Ken Burns movement: slow zoom/pan so a still never reads as a
 * slide. Sharp, never blurred. The progression is clamped — long scenes stay
 * alive without drifting out of frame.
 */
export const MidiaFotoKenburns: React.FC<ComponenteProps> = ({params}) => {
	const frame = useCurrentFrame();
	const arquivo = arq(params.arquivo, "");
	const movimento = str(params.movimento, "zoom-in");
	const m = MOVIMENTOS[movimento] ?? MOVIMENTOS["zoom-in"];

	const progress = interpolate(frame, [0, 600], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.inOut(Easing.sin),
	});
	const scale = interpolate(progress, [0, 1], m.scale);
	const tx = interpolate(progress, [0, 1], m.tx);
	const ty = interpolate(progress, [0, 1], m.ty);

	if (!arquivo) return null;

	return (
		<AbsoluteFill style={{overflow: "hidden"}}>
			<Img
				src={staticFile(arquivo)}
				style={{
					position: "absolute",
					inset: 0,
					width: "100%",
					height: "100%",
					objectFit: "cover",
					transform: `scale(${scale}) translate(${tx}%, ${ty}%)`,
				}}
			/>
		</AbsoluteFill>
	);
};
