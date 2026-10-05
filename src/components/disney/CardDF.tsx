import React from "react";
import {Easing, Img, interpolate, staticFile, useCurrentFrame} from "remotion";
import type {ImageDF} from "../../utils/imagens-df";
import {GRADE_DF, type GradeDF} from "../../utils/theme-df";

const EASES = {
	inOut: Easing.inOut(Easing.sin),
	out: Easing.out(Easing.cubic),
	linear: (t: number) => t,
};

export type CardCrop = {top?: number; bottom?: number; left?: number; right?: number};

type Props = {
	image: ImageDF;
	/** Displayed width in px at zoom 1 (before side crops). */
	width: number;
	/** Screen point the card is centred on. */
	center?: [number, number];
	/** The move inside the photo: zoom at the start and at the end of `range`. */
	zoom?: [number, number];
	/** Local frames the move plays over (defaults to showFrom..showFrom+240). */
	range?: [number, number];
	/** Photo point (0..1) the zoom pivots around. */
	anchor?: [number, number];
	/** Extra drift in px across `range`. */
	pan?: [[number, number], [number, number]];
	/** Static tilt in degrees. */
	tilt?: number;
	/** A move of the CARD itself across the frame (the rabbit being carried out). */
	drift?: {from: number; to: number; dx: number; dy: number; rotate?: number; ease?: "in" | "out" | "linear"};
	/** Fractions of the photo hidden on each side (auction strips, print bars). */
	crop?: CardCrop;
	grade?: GradeDF;
	/** Coloured light wrapping the card (drop-shadow in the scene's accent). */
	glow?: string;
	/** Thin light edge and deep shadow — the "lit print" look. */
	frame?: boolean;
	/** Transparent PNGs (the rabbit) skip the edge and the box shadow. */
	flat?: boolean;
	showFrom: number;
	showTo?: number;
	fadeIn?: number;
	fadeOut?: number;
	/** Entrance: the card is unmasked upward like a print pulled from a tray. */
	reveal?: boolean;
	ease?: keyof typeof EASES;
};

const GRADE_CSS = (g: GradeDF): string =>
	`brightness(${g.brightness}) saturate(${g.saturate}) sepia(${g.sepia}) contrast(${g.contrast})`;

/**
 * A real photograph held as a lit card: thin light edge, deep shadow, and a
 * slow move INSIDE the print so a shot is a shot, not a slide. Crop fractions
 * remove printed strips without touching the drawing.
 */
export const CardDF: React.FC<Props> = ({
	image,
	width,
	center = [540, 780],
	zoom = [1, 1],
	range,
	anchor = [0.5, 0.5],
	pan = [
		[0, 0],
		[0, 0],
	],
	tilt = 0,
	/** A move of the CARD itself across the frame (the rabbit being carried out). */
	drift,
	crop,
	grade = GRADE_DF.photoWarm,
	glow,
	frame = true,
	flat = false,
	showFrom,
	showTo,
	fadeIn = 14,
	fadeOut = 14,
	reveal = true,
	ease = "inOut",
}) => {
	const f = useCurrentFrame();
	const to = showTo ?? showFrom + 300;
	if (f < showFrom - 1 || f > to + 1) return null;

	const opacity = Math.min(
		fadeIn > 0 ? interpolate(f, [showFrom, showFrom + fadeIn], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"}) : 1,
		fadeOut > 0
			? interpolate(f, [to - fadeOut, to], [1, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"})
			: 1,
	);
	if (opacity <= 0.002) return null;

	const [r0, r1] = range ?? [showFrom, showFrom + 240];
	const p = interpolate(f, [r0, r1], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASES[ease]});
	const z = zoom[0] + (zoom[1] - zoom[0]) * p;
	const arrive = interpolate(f, [showFrom, showFrom + 16], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.out(Easing.cubic),
	});

	const t = crop?.top ?? 0;
	const b = crop?.bottom ?? 0;
	const l = crop?.left ?? 0;
	const r = crop?.right ?? 0;
	const dp = drift
		? interpolate(f, [drift.from, drift.to], [0, 1], {
				extrapolateLeft: "clamp",
				extrapolateRight: "clamp",
				easing:
					drift.ease === "in"
						? Easing.in(Easing.cubic)
						: drift.ease === "out"
							? Easing.out(Easing.cubic)
							: undefined,
			})
		: 0;
	// The print is shown larger than its window, so the hidden strips sit outside.
	const shownW = width / (1 - l - r);
	const shownH = shownW * (image.height / image.width);
	const cardW = shownW * (1 - l - r);
	const cardH = shownH * (1 - t - b);

	const clip = reveal ? `inset(${(1 - arrive) * 7.5}% round 6px)` : undefined;
	const filter = GRADE_CSS(grade);
	const shadows = [
		flat ? undefined : "0 34px 80px rgba(0,0,0,0.62)",
		glow ?? undefined,
		frame && !flat ? "inset 0 0 0 1px rgba(245,239,227,0.14)" : undefined,
	]
		.filter(Boolean)
		.join(", ");

	return (
		<div
			style={{
				position: "absolute",
				left: center[0] - cardW / 2,
				top: center[1] - cardH / 2,
				width: cardW,
				height: cardH,
				opacity,
				overflow: "hidden",
				borderRadius: flat ? 0 : 6,
				boxShadow: shadows || undefined,
				transform: `translate(${(drift?.dx ?? 0) * dp}px, ${(drift?.dy ?? 0) * dp}px) rotate(${tilt + (drift?.rotate ?? 0) * dp}deg)`,
			}}
		>
			<div
				style={{
					position: "absolute",
					left: -l * shownW,
					top: -t * shownH,
					width: shownW,
					height: shownH,
					transformOrigin: `${(anchor[0] * shownW - l * shownW).toFixed(1)}px ${(anchor[1] * shownH - t * shownH).toFixed(1)}px`,
					transform: `translate(${pan[0][0] + (pan[1][0] - pan[0][0]) * p}px, ${pan[0][1] + (pan[1][1] - pan[0][1]) * p}px) scale(${z + (1 - arrive) * 0.025})`,
					clipPath: clip,
					borderRadius: flat ? 0 : 6,
				}}
			>
				<Img
					src={staticFile(image.path)}
					style={{width: "100%", height: "100%", objectFit: "fill", filter, display: "block"}}
				/>
			</div>
		</div>
	);
};
