import React from "react";
import {Img, interpolate, staticFile, useCurrentFrame} from "remotion";
import {seededRandom} from "../../utils/bezier";
import type {ImageDF} from "../../utils/imagens-df";

/**
 * The living room each shot sits in: a coloured ground that breathes, a
 * projector beam, drifting dust. Depth comes from blur, glow and opacity.
 * Everything is deterministic — seededRandom or sin, never Math.random.
 */

/** A ground gradient that drifts almost imperceptibly, so black never sits still. */
export const WashDF: React.FC<{css: React.CSSProperties; drift?: number}> = ({css, drift = 0.018}) => {
	const f = useCurrentFrame();
	const s = 1 + Math.sin(f / 240) * drift;
	return (
		<AbsoluteFillLike
			style={{
				...css,
				transform: `scale(${s})`,
				transformOrigin: "50% 40%",
			}}
		/>
	);
};

const AbsoluteFillLike: React.FC<{style: React.CSSProperties}> = ({style}) => (
	<div style={{position: "absolute", inset: 0, ...style}} />
);

/** A projector cone cutting through the room. Subtle; it flickers like carbon arcs do. */
export const BeamDF: React.FC<{
	color: string;
	/** Where the beam is thrown from. */
	from?: "left" | "right";
	opacity?: number;
}> = ({color, from = "left", opacity = 0.16}) => {
	const f = useCurrentFrame();
	const breathe = 0.82 + Math.sin(f / 9) * 0.05 + Math.sin(f / 23) * 0.06;
	const lean = Math.sin(f / 300) * 2.2;
	return (
		<div
			style={{
				position: "absolute",
				inset: -60,
				opacity: opacity * breathe,
				filter: "blur(14px)",
				background: `linear-gradient(${from === "left" ? 158 : 202}deg, ${color} 0%, transparent 58%)`,
				clipPath:
					from === "left"
						? `polygon(0% 0%, 26% 0%, ${74 + lean}% 100%, ${18 + lean}% 100%)`
						: `polygon(${74 - lean}% 0%, 100% 0%, ${82 - lean}% 100%, ${26 - lean}% 100%)`,
				mixBlendMode: "screen",
			}}
		/>
	);
};

/** Dust in the beam: a few motes floating on sin waves, brightening as they cross the light. */
export const DustDF: React.FC<{
	count?: number;
	color?: string;
	seed?: number;
	opacity?: number;
}> = ({count = 26, color = "245, 239, 227", seed = 7, opacity = 0.5}) => {
	const f = useCurrentFrame();
	const motes = Array.from({length: count}, (_, i) => {
		const r1 = seededRandom(seed * 131 + i * 17);
		const r2 = seededRandom(seed * 197 + i * 29);
		const r3 = seededRandom(seed * 61 + i * 11);
		const r4 = seededRandom(seed * 89 + i * 5);
		const size = 1.6 + r3 * 2.6;
		const speed = 0.35 + r4 * 0.5;
		const x = r1 * 1080 + Math.sin(f / (160 * speed) + i) * 26;
		const y = ((r2 * 1920 + f * speed * 2.2) % 2100) - 90;
		const twinkle = 0.55 + 0.45 * Math.sin(f / (40 + r4 * 40) + i * 2.1);
		return {x, y, size, twinkle};
	});
	return (
		<div style={{position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none"}}>
			{motes.map((m, i) => (
				<div
					key={i}
					style={{
						position: "absolute",
						left: m.x,
						top: m.y,
						width: m.size,
						height: m.size,
						borderRadius: "50%",
						background: `rgba(${color}, 1)`,
						opacity: opacity * m.twinkle,
						boxShadow: `0 0 ${m.size * 3}px rgba(${color}, 0.55)`,
					}}
				/>
			))}
		</div>
	);
};

/** A photo used as TEXTURE: blended into the ground at low opacity, drifting slowly. */
export const TextureDF: React.FC<{
	image: ImageDF;
	blend?: "soft-light" | "screen" | "overlay" | "multiply" | "color-burn";
	opacity: number;
	/** Cover the whole frame or hug one edge. */
	pos?: "cover" | "right" | "bottom";
	drift?: number;
	grade?: React.CSSProperties["filter"];
}> = ({image, blend = "soft-light", opacity, pos = "cover", drift = 26, grade}) => {
	const f = useCurrentFrame();
	const slide = Math.sin(f / 420) * drift;
	const dims: React.CSSProperties =
		pos === "cover"
			? {inset: -40, width: "calc(100% + 80px)", height: "calc(100% + 80px)"}
			: pos === "right"
				? {right: -30, top: -30, bottom: -30, width: "62%"}
				: {left: -30, right: -30, bottom: -30, height: "55%"};
	return (
		<div style={{position: "absolute", inset: 0, overflow: "hidden", opacity, mixBlendMode: blend}}>
			<Img
				src={staticFile(image.path)}
				style={{
					position: "absolute",
					...dims,
					objectFit: "cover",
					filter: grade ?? GRADE_CSS_FILTER,
					transform: `translateX(${slide}px) scale(1.06)`,
				}}
			/>
		</div>
	);
};

const GRADE_CSS_FILTER = "brightness(0.85) saturate(1.05) contrast(1.05)";

/** A 35mm strip running down one edge, lit from the room. Used sparingly. */
export const FilmEdgeDF: React.FC<{side?: "left" | "right"; opacity?: number; lit?: string}> = ({
	side = "left",
	opacity = 0.5,
	lit = "rgba(240, 195, 119, 0.16)",
}) => {
	const holes = Array.from({length: 16}, (_, i) => i);
	const left = side === "left" ? 0 : undefined;
	const right = side === "right" ? 0 : undefined;
	return (
		<div
			style={{
				position: "absolute",
				left,
				right,
				top: 0,
				bottom: 0,
				width: 58,
				background: "linear-gradient(90deg, rgba(4,2,1,0.94), rgba(10,6,3,0.82))",
				borderRight: side === "left" ? "1px solid rgba(245,239,227,0.07)" : undefined,
				borderLeft: side === "right" ? "1px solid rgba(245,239,227,0.07)" : undefined,
				opacity,
			}}
		>
			<div
				style={{
					position: "absolute",
					inset: 0,
					background: `linear-gradient(${side === "left" ? "90deg" : "270deg"}, transparent 40%, ${lit})`,
				}}
			/>
			{holes.map((i) => (
				<div
					key={i}
					style={{
						position: "absolute",
						left: 15,
						top: 40 + i * 118,
						width: 28,
						height: 42,
						borderRadius: 7,
						background: "rgba(5,3,2,0.98)",
						boxShadow: "inset 0 0 0 1px rgba(245,239,227,0.10)",
					}}
				/>
			))}
		</div>
	);
};

/** Spotlight pool from above — for the poster the film ends on. */
export const SpotlightDF: React.FC<{color?: string; opacity?: number; top?: number; width?: number}> = ({
	color = "rgba(240, 195, 119, 0.30)",
	opacity = 1,
	top = -160,
	width = 900,
}) => {
	const f = useCurrentFrame();
	const breathe = interpolate(Math.sin(f / 180), [-1, 1], [0.92, 1]);
	return (
		<div
			style={{
				position: "absolute",
				left: 540 - width / 2,
				top,
				width,
				height: 1400,
				opacity: opacity * breathe,
				background: `radial-gradient(ellipse 50% 46% at 50% 24%, ${color}, transparent 70%)`,
				mixBlendMode: "screen",
				pointerEvents: "none",
			}}
		/>
	);
};
