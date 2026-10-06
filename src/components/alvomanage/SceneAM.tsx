import React from "react";
import {AbsoluteFill, interpolate, useCurrentFrame} from "remotion";
import {AM, TRANSITION_AM} from "../../utils/theme-am";
import {ramp} from "./motion-am";

export type EntryAM = "push" | "rise" | "blur" | "wipe" | "zoomOut";

/**
 * Scene shell: background, a slow global camera drift (nothing ever sits
 * still) and a short entry transition of TRANSITION_AM frames. The incoming
 * scene is mounted on top of the outgoing one during the overlap, so only the
 * entry is animated — the outgoing scene never needs to fade.
 */
export const SceneAM: React.FC<{
	children: React.ReactNode;
	/** Scene length in frames (SCENE_DURATIONS_AM[i]). */
	duration: number;
	entry?: EntryAM;
	/** Total scale drift across the scene (1 -> 1+drift). */
	drift?: number;
	glow?: string;
}> = ({children, duration, entry = "push", drift = 0.03, glow = AM.blueSoft}) => {
	const frame = useCurrentFrame();
	const p = ramp(frame, 0, TRANSITION_AM);
	const life = interpolate(frame, [0, Math.max(1, duration)], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	let transform = "";
	let filter: string | undefined;
	let clipPath: string | undefined;
	if (entry === "push") transform = `scale(${1.08 - 0.08 * p})`;
	if (entry === "zoomOut") transform = `scale(${0.9 + 0.1 * p})`;
	if (entry === "rise") transform = `translateY(${(1 - p) * 120}px)`;
	if (entry === "blur") filter = p < 1 ? `blur(${(1 - p) * 18}px)` : undefined;
	if (entry === "wipe") clipPath = `inset(0 0 ${(1 - p) * 100}% 0)`;

	return (
		<AbsoluteFill
			style={{
				backgroundColor: AM.background,
				opacity: entry === "wipe" ? 1 : p,
				transform,
				filter,
				clipPath,
				overflow: "hidden",
			}}
		>
			{/* Soft brand glow, low and off-centre — depth without 3D. */}
			<AbsoluteFill
				style={{
					background: `radial-gradient(ellipse 900px 700px at 50% ${70 - life * 12}%, ${glow}, transparent 70%)`,
				}}
			/>
			<AbsoluteFill style={{transform: `scale(${1 + drift * life})`}}>{children}</AbsoluteFill>
		</AbsoluteFill>
	);
};

/**
 * One internal shot of a scene. Renders null outside its window, so shot
 * boundaries read as cuts (6-frame handle), each with its own push.
 */
export const BeatAM: React.FC<{
	children: React.ReactNode;
	from: number;
	to: number;
	fadeIn?: number;
	fadeOut?: number;
	zoomFrom?: number;
	zoomTo?: number;
	blurIn?: number;
	style?: React.CSSProperties;
}> = ({children, from, to, fadeIn = 6, fadeOut = 4, zoomFrom = 1.04, zoomTo = 1, blurIn = 0, style}) => {
	const frame = useCurrentFrame();
	if (frame < from || frame > to) return null;
	const local = frame - from;
	const len = Math.max(1, to - from);
	const a = Math.min(
		interpolate(local, [0, Math.max(1, fadeIn)], [0, 1], {extrapolateRight: "clamp"}),
		interpolate(local, [len - Math.max(1, fadeOut), len], [1, 0], {extrapolateLeft: "clamp"}),
	);
	const life = local / len;
	const appear = ramp(frame, from, fadeIn + 2);
	const scale = zoomFrom + (zoomTo - zoomFrom) * appear * 0.7 + (zoomTo - zoomFrom) * life * 0.3;
	return (
		<AbsoluteFill
			style={{
				opacity: a,
				transform: `scale(${scale})`,
				filter: blurIn > 0 && appear < 1 ? `blur(${(1 - appear) * blurIn}px)` : undefined,
				...style,
			}}
		>
			{children}
		</AbsoluteFill>
	);
};
