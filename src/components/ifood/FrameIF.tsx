import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {W, H} from "../../utils/layout";
import {IF} from "../../utils/theme-if";

type Tone = "neutral" | "warm" | "cool" | "red";

type Props = {
	/** Colour of the key light washing the frame. */
	tone?: Tone;
	/** 0..1 strength of that light. */
	intensity?: number;
	/** Where the key light sits, in composition px. */
	lightX?: number;
	lightY?: number;
	/** 0..1 grain strength. Film grain keeps a dark frame from banding. */
	grain?: number;
	/** Adds the slow cinematic drift. Off for beats that must sit perfectly still. */
	drift?: boolean;
};

const KEY: Record<Tone, string> = {
	neutral: "110,118,132",
	warm: "196,150,84",
	cool: "84,150,178",
	red: "234,29,44",
};

/**
 * The film's ground: never flat black.
 *
 * Every scene sits on a dark stage lit by one soft key that slowly drifts, so
 * that even a "still" beat is never actually still — the brief rejects static
 * images held too long, and a motionless background is the first thing that
 * makes a cut read as a slide.
 *
 * Depth here is blur, falloff and grain — no 3D.
 */
export const FrameIF: React.FC<Props> = ({
	tone = "neutral",
	intensity = 0.5,
	lightX = W * 0.5,
	lightY = H * 0.42,
	grain = 0.5,
	drift = true,
}) => {
	const frame = useCurrentFrame();

	// Slow lissajous drift of the key light. Periods are coprime-ish so the
	// motion never visibly loops inside a scene.
	const dx = drift ? Math.sin(frame / 97) * 70 : 0;
	const dy = drift ? Math.cos(frame / 131) * 52 : 0;
	const breathe = drift ? 1 + Math.sin(frame / 83) * 0.06 : 1;

	const rgb = KEY[tone];
	const a = Math.max(0, Math.min(1, intensity));

	return (
		<AbsoluteFill style={{backgroundColor: IF.background, overflow: "hidden"}}>
			{/* Key light. */}
			<AbsoluteFill
				style={{
					background: `radial-gradient(${Math.round(760 * breathe)}px ${Math.round(
						620 * breathe,
					)}px at ${lightX + dx}px ${lightY + dy}px, rgba(${rgb},${0.30 * a}) 0%, rgba(${rgb},${
						0.12 * a
					}) 38%, rgba(0,0,0,0) 72%)`,
				}}
			/>

			{/* Cold counter-light from the opposite corner: separates subject from ground. */}
			<AbsoluteFill
				style={{
					background: `radial-gradient(620px 520px at ${W - lightX - dx}px ${
						H - lightY * 0.55 + dy
					}px, rgba(111,214,224,${0.085 * a}) 0%, rgba(0,0,0,0) 70%)`,
				}}
			/>

			{/* Vignette: the falloff that makes the frame read as photographed. */}
			<AbsoluteFill
				style={{
					background:
						"radial-gradient(1180px 1180px at 50% 46%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.55) 78%, rgba(0,0,0,0.88) 100%)",
				}}
			/>

			{/* Film grain. feTurbulence reseeded per frame — deterministic (the seed is
			    the frame number), and far cheaper than drawing thousands of specks. */}
			{grain > 0.001 ? (
				<svg
					width={W}
					height={H}
					viewBox={`0 0 ${W} ${H}`}
					style={{position: "absolute", top: 0, left: 0, opacity: 0.16 * grain}}
				>
					<filter id="if-grain">
						<feTurbulence
							type="fractalNoise"
							baseFrequency="0.85"
							numOctaves={2}
							seed={frame % 64}
						/>
						<feColorMatrix type="saturate" values="0" />
					</filter>
					<rect width={W} height={H} filter="url(#if-grain)" />
				</svg>
			) : null}
		</AbsoluteFill>
	);
};
