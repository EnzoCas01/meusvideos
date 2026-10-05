import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {seededRandom} from "../../utils/bezier";
import {IF} from "../../utils/theme-if";

type Props = {
	/** 0 = the room is dark, 1 = the lamp is full on. */
	lamp?: number;
	/** Where the lamp pools, in percent of the frame. */
	lampX?: number;
	lampY?: number;
	/** Cold instead of warm — used once the story leaves the paper era. */
	cool?: boolean;
	/** How heavy the vignette closes in. */
	vignette?: number;
};

/**
 * The room every IFood scene is lit in: near black, one warm practical light
 * overhead, a hard vignette and a constant film grain. The grain is what keeps
 * the frame from reading as a flat computer drawing — it is a fixed-seed
 * turbulence that is only translated per frame, so Chromium caches the filter
 * instead of recomputing noise 1950 times.
 */
export const BackgroundIF: React.FC<Props> = ({
	lamp = 0.6,
	lampX = 50,
	lampY = 38,
	cool = false,
	vignette = 1,
}) => {
	const frame = useCurrentFrame();
	const flicker = 1 + Math.sin(frame * 0.09) * 0.012 + Math.sin(frame * 0.031) * 0.02;
	const g = Math.max(0, lamp) * flicker;
	const warm = cool ? "159,200,230" : "232,164,90";
	const deep = cool ? "26,48,66" : "94,48,18";

	const gx = Math.round(seededRandom(frame * 1.7 + 3) * 6 - 3);
	const gy = Math.round(seededRandom(frame * 2.3 + 11) * 6 - 3);

	return (
		<AbsoluteFill style={{backgroundColor: IF.background}}>
			<AbsoluteFill
				style={{
					background: `radial-gradient(ellipse 70% 46% at ${lampX}% ${lampY}%, rgba(${warm},${0.2 * g}) 0%, rgba(10,9,7,0) 70%)`,
				}}
			/>
			<AbsoluteFill
				style={{
					background: `radial-gradient(ellipse 100% 60% at 50% 104%, rgba(${deep},${0.5 * g}) 0%, rgba(10,9,7,0) 62%)`,
				}}
			/>
			<AbsoluteFill
				style={{boxShadow: `inset 0 0 300px 110px rgba(0,0,0,${0.86 * vignette})`}}
			/>
			<FilmGrain dx={gx} dy={gy} />
		</AbsoluteFill>
	);
};

/** 16mm-ish grain. Static noise, moved a few pixels each frame. */
export const FilmGrain: React.FC<{dx: number; dy: number; opacity?: number}> = ({
	dx,
	dy,
	opacity = 0.14,
}) => (
	<AbsoluteFill style={{opacity, mixBlendMode: "overlay", pointerEvents: "none"}}>
		<svg
			width={1180}
			height={2020}
			style={{position: "absolute", left: -50 + dx, top: -50 + dy}}
		>
			<filter id="if-grain">
				<feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={7} />
				<feColorMatrix type="saturate" values="0" />
			</filter>
			<rect width={1180} height={2020} filter="url(#if-grain)" />
		</svg>
	</AbsoluteFill>
);
