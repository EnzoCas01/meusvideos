import React from "react";
import {Easing, Img, interpolate, staticFile, useCurrentFrame} from "remotion";
import type {ImageCC} from "../../utils/imagens-cc";

export type GradeCC = {brightness: number; saturate: number; sepia: number; contrast: number};

/** Day photos on #050505 look pasted-on; these pull them into the same night. */
export const GRADES = {
	warm: {brightness: 0.78, saturate: 0.78, sepia: 0.22, contrast: 1.1},
	cold: {brightness: 0.5, saturate: 0.2, sepia: 0, contrast: 1.18},
	dim: {brightness: 0.24, saturate: 0.45, sepia: 0.25, contrast: 1.1},
	screen: {brightness: 0.55, saturate: 0.6, sepia: 0.15, contrast: 1.15},
	disc: {brightness: 0.92, saturate: 0.9, sepia: 0.12, contrast: 1.08},
} satisfies Record<string, GradeCC>;

const EASES = {
	linear: (t: number) => t,
	inOut: Easing.inOut(Easing.sin),
	out: Easing.out(Easing.cubic),
	in: Easing.in(Easing.cubic),
};

const FRAME_W = 1080;
const FRAME_H = 1920;

type Props = {
	image: ImageCC;
	/** Displayed width in px at zoom 1. Keep it <= ~1.6x the file width. */
	width: number;
	/** Screen point the anchor sits on at zoom 1. */
	centerX?: number;
	centerY?: number;
	/** Photo point (0..1) that sits on (centerX, centerY) and is the origin of scale/rotation. */
	anchor?: [number, number];
	zoom?: [number, number];
	/** Overrides `zoom`: zoom as a function of local frame. */
	zoomFn?: (frame: number) => number;
	/** Local frames the move plays over (defaults to showFrom..showTo). */
	range?: [number, number];
	ease?: keyof typeof EASES;
	/** Photo point (0..1) the camera pushes toward. */
	focus?: [number, number];
	/** Screen point the focus drifts to as the zoom lands (0 lock = stays put). */
	target?: [number, number];
	lock?: number;
	/** Extra drift in px, start -> end. */
	pan?: [[number, number], [number, number]];
	rotate?: [number, number];
	showFrom?: number;
	showTo?: number;
	fadeIn?: number;
	fadeOut?: number;
	grade?: GradeCC;
	feather?: number;
	/** Cut the photo to a circle: [centerX, centerY, radius] as fractions of its width/height/width. */
	circle?: [number, number, number];
	shadow?: boolean;
	/** Hide the top fraction of the photo (e.g. printed dates that would clash with the scene). */
	cropTop?: number;
};

/**
 * A real photograph, graded to sit on the film's black, moving INSIDE its own
 * frame (slow push, drift, rotation) rather than being cut away from.
 */
export const GradedPhoto: React.FC<Props> = ({
	image,
	width,
	centerX = FRAME_W / 2,
	centerY = FRAME_H / 2,
	anchor = [0.5, 0.5],
	zoom = [1, 1],
	zoomFn,
	range,
	ease = "inOut",
	focus = [0.5, 0.5],
	target,
	lock = 0.6,
	pan = [
		[0, 0],
		[0, 0],
	],
	rotate,
	showFrom = 0,
	showTo = 100000,
	fadeIn = 12,
	fadeOut = 12,
	grade = GRADES.warm,
	feather = 70,
	circle,
	shadow = false,
	cropTop = 0,
}) => {
	const frame = useCurrentFrame();
	if (frame < showFrom - 1 || frame > showTo + 1) return null;

	const opacity = Math.min(
		fadeIn > 0 ? interpolate(frame, [showFrom, showFrom + fadeIn], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"}) : 1,
		fadeOut > 0 ? interpolate(frame, [showTo - fadeOut, showTo], [1, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"}) : 1,
	);
	if (opacity <= 0.002) return null;

	const [r0, r1] = range ?? [showFrom, Math.min(showTo, showFrom + 300)];
	const p = interpolate(frame, [r0, r1], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: EASES[ease],
	});
	const z = zoomFn ? zoomFn(frame) : zoom[0] + (zoom[1] - zoom[0]) * p;

	const W = width;
	const H = width * (image.height / image.width);
	const ax = anchor[0] * W;
	const ay = anchor[1] * H;
	// Focus relative to the anchor, in un-zoomed px.
	const fx = focus[0] * W - ax;
	const fy = focus[1] * H - ay;
	const tgt = target ?? [centerX, centerY];
	const zSpan = Math.max(zoomFn ? 1 : Math.abs(zoom[1] - zoom[0]), 0.0001);
	const zProgress = zoomFn ? Math.min(1, Math.max(0, (z - 1) / 3)) : Math.min(1, Math.abs(z - zoom[0]) / zSpan);
	const sx = centerX + fx + (tgt[0] - (centerX + fx)) * zProgress * lock;
	const sy = centerY + fy + (tgt[1] - (centerY + fy)) * zProgress * lock;
	const tx = sx - centerX - z * fx + pan[0][0] + (pan[1][0] - pan[0][0]) * p;
	const ty = sy - centerY - z * fy + pan[0][1] + (pan[1][1] - pan[0][1]) * p;
	const rot = rotate ? rotate[0] + (rotate[1] - rotate[0]) * p : 0;

	const filter = `brightness(${grade.brightness}) saturate(${grade.saturate}) sepia(${grade.sepia}) contrast(${grade.contrast})`;
	const feathered = feather > 0 && !circle;
	const topCut = cropTop * H;
	const mask = feathered
		? `linear-gradient(to bottom, transparent ${topCut}px, #000 ${topCut + feather}px, #000 calc(100% - ${feather}px), transparent), linear-gradient(to right, transparent, #000 ${feather}px, #000 calc(100% - ${feather}px), transparent)`
		: undefined;

	// The photo itself is always SHARP: if it doesn't fill the frame, compose with
	// solid colour / graphics beside it — never with a blurred copy of itself.
	return (
		<div style={{position: "absolute", inset: 0, opacity, overflow: "hidden"}}>
			<div
				style={{
					position: "absolute",
					left: centerX - ax,
					top: centerY - ay,
					width: W,
					height: H,
					transformOrigin: `${ax}px ${ay}px`,
					transform: `translate(${tx}px, ${ty}px) scale(${z})`,
					filter: shadow ? "drop-shadow(0 30px 50px rgba(0,0,0,0.75))" : undefined,
				}}
			>
				<div
					style={{
						width: "100%",
						height: "100%",
						transformOrigin: `${ax}px ${ay}px`,
						transform: rotate ? `rotate(${rot}deg)` : undefined,
						clipPath: circle
							? `circle(${circle[2] * W}px at ${circle[0] * W}px ${circle[1] * H}px)`
							: undefined,
						WebkitMaskImage: mask,
						WebkitMaskComposite: feathered ? "source-in" : undefined,
						maskImage: mask,
						maskComposite: feathered ? "intersect" : undefined,
					}}
				>
					<Img src={staticFile(image.path)} style={{width: "100%", height: "100%", filter, display: "block"}} />
				</div>
			</div>
		</div>
	);
};

const GRAIN = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.9 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")`;

/** Vignette + a whisper of moving grain, over the whole frame. */
export const FilmOverlay: React.FC = () => {
	const frame = useCurrentFrame();
	return (
		<>
			<div
				style={{
					position: "absolute",
					inset: 0,
					pointerEvents: "none",
					background:
						"radial-gradient(ellipse 75% 62% at 50% 46%, rgba(5,5,5,0) 38%, rgba(5,5,5,0.55) 78%, rgba(5,5,5,0.9) 100%)",
				}}
			/>
			<div
				style={{
					position: "absolute",
					inset: 0,
					pointerEvents: "none",
					opacity: 0.09,
					mixBlendMode: "overlay",
					backgroundImage: GRAIN,
					backgroundPosition: `${(frame * 37) % 220}px ${(frame * 91) % 220}px`,
				}}
			/>
		</>
	);
};
