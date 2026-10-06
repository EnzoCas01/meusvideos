import React from "react";
import {Easing, Img, interpolate, staticFile, useCurrentFrame} from "remotion";
import type {SceneImageIF} from "../../utils/images-if";

type Props = {
	/** From `imageAtIF()`. `undefined` renders nothing — every scene must compose
	 *  without photos, because the manifest can arrive late or empty. */
	image?: SceneImageIF;
	start: number;
	durationInFrames: number;

	/** Box in composition px. Defaults to full bleed. */
	x?: number;
	y?: number;
	width?: number;
	height?: number;

	/** Ken Burns. A photo held still in a motion piece reads as a freeze. */
	zoomFrom?: number;
	zoomTo?: number;
	panX?: number;
	panY?: number;

	fadeIn?: number;
	fadeOut?: number;
	opacity?: number;
	borderRadius?: number;
	blur?: number;
	/** 0..1 red wash, for scenes where the photo sits under the accent. */
	tintRed?: number;
	/** 0..1 cyan wash, for the tech / map scenes. */
	tintCyan?: number;
	rotate?: number;
	/** Inner shadow that melts the card edge into the stage. On by default. */
	melt?: boolean;
};

/**
 * One photograph, always moving.
 *
 * NOTE THE ABSENCE: there is no `grade="record"` here, unlike the sibling
 * component in the other film. Every photo in this piece is illustrative, so
 * archival dressing — aged filter, document frame, a caption implying the shot
 * is from that year — is forbidden. The option does not exist rather than
 * existing and being easy to pass by mistake.
 */
export const PhotoIF: React.FC<Props> = ({
	image,
	start,
	durationInFrames,
	x = 0,
	y = 0,
	width = 1080,
	height = 1920,
	zoomFrom = 1.08,
	zoomTo = 1.22,
	panX = 0,
	panY = 0,
	fadeIn = 10,
	fadeOut = 10,
	opacity = 1,
	borderRadius = 0,
	blur = 0,
	tintRed = 0,
	tintCyan = 0,
	rotate = 0,
	melt = true,
}) => {
	const frame = useCurrentFrame();
	const local = frame - start;

	if (!image) return null;
	if (local < 0 || local > durationInFrames) return null;

	const life = interpolate(local, [0, Math.max(1, durationInFrames)], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.inOut(Easing.ease),
	});

	const appear = interpolate(local, [0, Math.max(1, fadeIn)], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});
	const leave = interpolate(
		local,
		[durationInFrames - Math.max(1, fadeOut), durationInFrames],
		[1, 0],
		{extrapolateLeft: "clamp", extrapolateRight: "clamp"},
	);
	const alpha = Math.min(appear, leave) * opacity;
	if (alpha <= 0.002) return null;

	const scale = zoomFrom + (zoomTo - zoomFrom) * life;
	const tx = panX * (life - 0.5);
	const ty = panY * (life - 0.5);
	const entryBlur = (1 - appear) * 10 + blur;

	return (
		<div
			style={{
				position: "absolute",
				left: x,
				top: y,
				width,
				height,
				borderRadius,
				overflow: "hidden",
				opacity: alpha,
				transform: `rotate(${rotate}deg)`,
			}}
		>
			<Img
				src={staticFile(image.src)}
				style={{
					width: "100%",
					height: "100%",
					objectFit: "cover",
					transform: `scale(${scale}) translate(${tx}px, ${ty}px)`,
					// Dark, desaturated, contrasty: the "cores escuras e sofisticadas"
					// the brief asks for, and it keeps type readable over the photo.
					filter: `blur(${entryBlur}px) saturate(0.6) contrast(1.14) brightness(0.62)`,
				}}
			/>

			{tintRed > 0.001 ? (
				<div
					style={{
						position: "absolute",
						inset: 0,
						background: `linear-gradient(180deg, rgba(142,14,24,${tintRed * 0.55}) 0%, rgba(8,7,10,0.18) 52%, rgba(8,7,10,0.9) 100%)`,
					}}
				/>
			) : null}
			{tintCyan > 0.001 ? (
				<div
					style={{
						position: "absolute",
						inset: 0,
						background: `linear-gradient(180deg, rgba(30,86,100,${tintCyan * 0.5}) 0%, rgba(8,7,10,0.2) 55%, rgba(8,7,10,0.92) 100%)`,
					}}
				/>
			) : null}
			{tintRed <= 0.001 && tintCyan <= 0.001 ? (
				<div
					style={{
						position: "absolute",
						inset: 0,
						background:
							"linear-gradient(180deg, rgba(8,7,10,0.35) 0%, rgba(8,7,10,0.1) 45%, rgba(8,7,10,0.88) 100%)",
					}}
				/>
			) : null}

			{melt ? (
				<div
					style={{
						position: "absolute",
						inset: 0,
						boxShadow: "inset 0 0 130px 40px #08070A",
					}}
				/>
			) : null}
		</div>
	);
};
