import React from "react";
import {interpolate, useCurrentFrame, Easing} from "remotion";
import {COLORS} from "../utils/theme";
import {fontFamily} from "../utils/font";

type Props = {
	children: React.ReactNode;
	delay?: number;
	durationInFrames?: number;
	fontSize?: number;
	fontWeight?: number;
	color?: string;
	letterSpacing?: number;
	rise?: number; // px it travels upward while appearing
	blurAmount?: number;
	align?: "center" | "left";
	maxWidth?: number;
	lineHeight?: number;
};

/**
 * Slow, elegant reveal: opacity + gentle upward drift + soft blur resolving.
 * The default "fade in / fade out everything" look is avoided by giving
 * each caller control of timing so scenes can vary the rhythm.
 */
export const AnimatedText: React.FC<Props> = ({
	children,
	delay = 0,
	durationInFrames = 40,
	fontSize = 64,
	fontWeight = 300,
	color = COLORS.white,
	letterSpacing = 0,
	rise = 26,
	blurAmount = 14,
	align = "center",
	maxWidth = 880,
	lineHeight = 1.25,
}) => {
	const frame = useCurrentFrame();
	const local = frame - delay;

	const progress = interpolate(local, [0, durationInFrames], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.out(Easing.cubic),
	});

	const opacity = interpolate(local, [0, durationInFrames * 0.7], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	const translateY = (1 - progress) * rise;
	const blur = (1 - progress) * blurAmount;

	return (
		<div
			style={{
				fontFamily,
				fontWeight,
				fontSize,
				color,
				letterSpacing,
				lineHeight,
				textAlign: align,
				maxWidth,
				opacity,
				transform: `translateY(${translateY}px)`,
				filter: `blur(${blur}px)`,
			}}
		>
			{children}
		</div>
	);
};
