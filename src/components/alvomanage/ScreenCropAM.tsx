import React from "react";
import {Img, staticFile, useCurrentFrame} from "remotion";
import type {RectAM, ScreenAM} from "../../utils/images-am";
import {AM} from "../../utils/theme-am";
import {ramp} from "./motion-am";

/**
 * A camera over a real screenshot. `camera` is a rect in IMAGE pixels; it is
 * scaled to fill the view box (contain, centred). Masks from images-am.ts are
 * painted in the same transformed layer, so anything that must never appear
 * ("Caixa fechado", WhatsApp button, stray cursors) stays covered while the
 * camera moves. `children` are overlays in image coordinates too — they ride
 * with zoom and scroll (highlights, drawn signature).
 */
export const ScreenCropAM: React.FC<{
	screen: ScreenAM;
	width: number;
	height: number;
	camera: RectAM;
	children?: React.ReactNode;
	radius?: number;
	background?: string;
}> = ({screen, width, height, camera, children, radius = 0, background = AM.appPanel}) => {
	const s = Math.min(width / camera.w, height / camera.h);
	const ox = (width - camera.w * s) / 2 - camera.x * s;
	const oy = (height - camera.h * s) / 2 - camera.y * s;
	return (
		<div
			style={{
				position: "relative",
				width,
				height,
				overflow: "hidden",
				borderRadius: radius,
				background,
			}}
		>
			<div
				style={{
					position: "absolute",
					left: 0,
					top: 0,
					width: screen.width,
					height: screen.height,
					transformOrigin: "0 0",
					transform: `translate(${ox}px, ${oy}px) scale(${s})`,
				}}
			>
				<Img
					src={staticFile(screen.src)}
					style={{position: "absolute", left: 0, top: 0, width: screen.width, height: screen.height}}
				/>
				{screen.masks.map((q, i) => (
					<div
						key={i}
						style={{position: "absolute", left: q.x, top: q.y, width: q.w, height: q.h, background: q.color}}
					/>
				))}
				{children}
			</div>
		</div>
	);
};

/**
 * Yellow focus ring drawn around a rect (image coords, inside ScreenCropAM).
 * Draws itself with strokeDashoffset, then breathes. `stroke` is in image px,
 * so pass a thicker value for low-res captures that get scaled up a lot.
 */
export const HighlightAM: React.FC<{
	rect: RectAM;
	at: number;
	until?: number;
	stroke?: number;
	fill?: boolean;
	color?: string;
	pad?: number;
}> = ({rect, at, until, stroke = 3, fill = true, color = AM.yellow, pad = 4}) => {
	const frame = useCurrentFrame();
	if (frame < at) return null;
	const p = ramp(frame, at, 9);
	const out = until === undefined ? 0 : ramp(frame, until, 5);
	if (out >= 1) return null;
	const x = rect.x - pad;
	const y = rect.y - pad;
	const w = rect.w + pad * 2;
	const h = rect.h + pad * 2;
	const per = 2 * (w + h);
	const r = Math.min(h / 2, 10 + stroke * 2);
	const breathe = 0.85 + 0.15 * Math.sin((frame - at) / 6);
	// Box big enough for the stroke + glow, so the SVG viewport never clips it.
	const m = stroke * 6;
	return (
		<svg
			style={{position: "absolute", left: x - m, top: y - m, overflow: "visible", opacity: 1 - out}}
			width={w + m * 2}
			height={h + m * 2}
		>
			{fill && <rect x={m} y={m} width={w} height={h} rx={r} fill={color} opacity={0.14 * p} />}
			<rect
				x={m}
				y={m}
				width={w}
				height={h}
				rx={r}
				fill="none"
				stroke={color}
				strokeWidth={stroke}
				strokeDasharray={per}
				strokeDashoffset={per * (1 - p)}
				opacity={breathe}
				style={{filter: `drop-shadow(0 0 ${stroke * 2}px ${color})`}}
			/>
		</svg>
	);
};
