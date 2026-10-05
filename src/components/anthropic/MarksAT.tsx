import React from "react";
import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame} from "remotion";
import type {ImageAT} from "../../utils/imagens-at";
import {AT} from "../../utils/theme-at";

/**
 * Brand marks dropped onto the dark stage. JPEG wordmarks carry their own
 * background: `invert` flips black-on-white to white-on-black and the screen
 * blend keys the black out (pure black adds nothing under "screen").
 */
export const WordmarkAT: React.FC<{
	image: ImageAT;
	width: number;
	top: number;
	start: number;
	end?: number;
	/** Black-on-white source: invert it, then let "screen" eat the black. */
	invert?: boolean;
	/** A dark pool behind the mark so it holds over a bright photo. */
	backing?: boolean;
	/** Gentle scale pulse, for the closing card. */
	breath?: number;
	/** Small logo pops in with an overshoot, instead of fading. */
	spring?: boolean;
}> = ({image, width, top, start, end, invert = false, backing = false, breath = 0, spring = false}) => {
	const frame = useCurrentFrame();
	const arrive = interpolate(frame - start, [0, spring ? 22 : 12], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: spring ? Easing.bezier(0.34, 1.56, 0.64, 1) : Easing.out(Easing.cubic),
	});
	const leave =
		end === undefined ? 1 : interpolate(frame, [end, end + 12], [1, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
	if (frame < start - 1 || leave <= 0.002) return null;
	const breathe = breath > 0 ? 1 + breath * Math.sin(((frame - start) * Math.PI * 2) / 90) : 1;
	const height = width * (image.height / image.width);
	return (
		<AbsoluteFill style={{pointerEvents: "none"}}>
			{backing ? (
				<div
					style={{
						position: "absolute",
						left: 540 - width,
						top: top - height * 0.9,
						width: width * 2,
						height: height * 2.4,
						background: "radial-gradient(ellipse 50% 50% at 50% 50%, rgba(5,5,5,0.8), rgba(5,5,5,0) 72%)",
					}}
				/>
			) : null}
			<div
				style={{
					position: "absolute",
					left: 540 - width / 2,
					top,
					width,
					height,
					opacity: arrive * leave,
					transform: `scale(${breathe})`,
					mixBlendMode: "screen",
					filter: invert ? "invert(1)" : undefined,
				}}
			>
				<Img src={staticFile(image.path)} style={{width: "100%", height: "100%", display: "block"}} />
			</div>
		</AbsoluteFill>
	);
};

/** A pool of coral light behind a mark, breathing slowly. */
export const GlowAT: React.FC<{top: number; size: number; start: number; end?: number; breath?: number}> = ({
	top,
	size,
	start,
	end,
	breath = 0,
}) => {
	const frame = useCurrentFrame();
	const arrive = interpolate(frame - start, [0, 26], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.out(Easing.cubic),
	});
	const leave =
		end === undefined ? 1 : interpolate(frame, [end, end + 12], [1, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
	if (frame < start - 1 || arrive <= 0.002 || leave <= 0.002) return null;
	const breathe = breath > 0 ? 1 + breath * Math.sin(((frame - start) * Math.PI * 2) / 90) : 1;
	return (
		<div
			style={{
				position: "absolute",
				left: 540 - size / 2,
				top: top - size / 2,
				width: size,
				height: size,
				borderRadius: "50%",
				background: `radial-gradient(circle, ${AT.accent}55 0%, ${AT.accent}1f 42%, rgba(5,5,5,0) 70%)`,
				opacity: 0.92 * arrive * leave,
				transform: `scale(${breathe})`,
				pointerEvents: "none",
			}}
		/>
	);
};

/** The photo as a blurred, darkened full-frame presence — no foreground copy. */
export const BlurBackdropAT: React.FC<{image: ImageAT; zoom?: [number, number]; pos?: string; dim?: number}> = ({
	image,
	zoom = [1.1, 1.22],
	pos = "50% 40%",
	dim = 0.3,
}) => {
	const frame = useCurrentFrame();
	const p = interpolate(frame, [0, 300], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.sin)});
	return (
		<Img
			src={staticFile(image.path)}
			style={{
				position: "absolute",
				inset: 0,
				width: "100%",
				height: "100%",
				objectFit: "cover",
				objectPosition: pos,
				filter: `blur(46px) brightness(${dim}) saturate(0.75)`,
				transform: `scale(${zoom[0] + (zoom[1] - zoom[0]) * p})`,
			}}
		/>
	);
};
