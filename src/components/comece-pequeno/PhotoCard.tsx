import React from "react";
import {Easing, Img, interpolate, staticFile, useCurrentFrame} from "remotion";
import type {SceneImage} from "../../utils/images-cp";
import {CP} from "../../utils/theme-cp";

type Props = {
	/** From `imagesFor()` / `imageAt()`. `undefined` renders nothing. */
	image?: SceneImage;
	/** Local frame the card appears on. */
	start: number;
	/** How long it stays, in frames. */
	durationInFrames: number;

	/** Box, in composition pixels. */
	x: number;
	y: number;
	width: number;
	height: number;

	/** Ken Burns: scale at the start and at the end of the card's life. */
	zoomFrom?: number;
	zoomTo?: number;
	/** Ken Burns: total travel across the card's life, in px of the source. */
	panX?: number;
	panY?: number;

	fadeIn?: number;
	fadeOut?: number;
	/** 0..1 ceiling — photos sit under type, so they rarely run at full. */
	opacity?: number;
	borderRadius?: number;
	/** Extra blur, for a photo used as a backdrop behind text. */
	blur?: number;

	/**
	 * `record` adds the archival treatment (warm desaturated grade, hard frame).
	 * It is IGNORED unless the manifest marked the image as `registro` — an
	 * illustrative stand-in must never be dressed up as a historical document.
	 */
	grade?: "neutral" | "record";
	/** Violet wash over the photo, tying it to the palette. */
	tint?: number;
	rotate?: number;
};

/**
 * One photograph on screen, always moving. A still photo dropped into a motion
 * piece reads as a bug, so every card carries a slow push and a slow drift.
 */
export const PhotoCard: React.FC<Props> = ({
	image,
	start,
	durationInFrames,
	x,
	y,
	width,
	height,
	zoomFrom = 1.06,
	zoomTo = 1.2,
	panX = 0,
	panY = 0,
	fadeIn = 18,
	fadeOut = 18,
	opacity = 1,
	borderRadius = 10,
	blur = 0,
	grade = "neutral",
	tint = 0.18,
	rotate = 0,
}) => {
	const frame = useCurrentFrame();
	const local = frame - start;

	if (!image) return null;
	if (local < -1 || local > durationInFrames) return null;

	// Editorial guard: archival treatment only on an actual record.
	const archival = grade === "record" && image.isRecord;

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

	const scale = zoomFrom + (zoomTo - zoomFrom) * life;
	const tx = panX * (life - 0.5);
	const ty = panY * (life - 0.5);

	// Blur resolving on entry, rather than a flat fade — the motion language of
	// the piece. Keeps the cut feeling like focus finding the subject.
	const entryBlur = (1 - appear) * 12 + blur;

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
				boxShadow: archival
					? "0 0 0 1px rgba(232,199,122,0.22), 0 30px 70px rgba(0,0,0,0.6)"
					: "0 30px 80px rgba(0,0,0,0.55)",
			}}
		>
			<Img
				src={staticFile(image.src)}
				style={{
					width: "100%",
					height: "100%",
					objectFit: "cover",
					transform: `scale(${scale}) translate(${tx}px, ${ty}px)`,
					filter: archival
						? `blur(${entryBlur}px) saturate(0.45) contrast(1.08) sepia(0.28) brightness(0.86)`
						: `blur(${entryBlur}px) saturate(0.82) contrast(1.05) brightness(0.8)`,
				}}
			/>

			{/* Violet wash + bottom falloff, so type can sit over the photo. */}
			<div
				style={{
					position: "absolute",
					inset: 0,
					background: `linear-gradient(180deg, rgba(83,32,168,${tint * 0.7}) 0%, rgba(7,6,11,0.1) 45%, rgba(7,6,11,0.82) 100%)`,
				}}
			/>
			<div
				style={{
					position: "absolute",
					inset: 0,
					boxShadow: `inset 0 0 90px 24px ${CP.background}`,
				}}
			/>
		</div>
	);
};
