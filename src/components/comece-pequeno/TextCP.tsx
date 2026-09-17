import React from "react";
import {Easing, interpolate, useCurrentFrame} from "remotion";
import {fontFamily} from "../../utils/font";
import {CP} from "../../utils/theme-cp";

type Props = {
	children: React.ReactNode;
	/** Local frame the text starts arriving on. */
	start: number;
	/** Local frame it starts leaving on. Omit to leave it on screen. */
	end?: number;
	inFrames?: number;
	outFrames?: number;
	fontSize?: number;
	fontWeight?: number;
	color?: string;
	letterSpacing?: number;
	lineHeight?: number;
	maxWidth?: number;
	align?: "center" | "left";
	/** px it travels upward while arriving. */
	rise?: number;
	blurAmount?: number;
	style?: React.CSSProperties;
};

/**
 * Type that resolves out of blur and settles, rather than a flat fade.
 *
 * Sizing rule for this frame: Inter at weight 300-500 runs about 0.52em per
 * character, so a line of N characters needs roughly N * 0.52 * fontSize px.
 * Keep that under ~940 or break the sentence across two lines — 1080 wide with
 * no margin is a crop, not a design.
 */
export const TextCP: React.FC<Props> = ({
	children,
	start,
	end,
	inFrames = 34,
	outFrames = 22,
	fontSize = 56,
	fontWeight = 300,
	color = CP.white,
	letterSpacing = 0,
	lineHeight = 1.26,
	maxWidth = 860,
	align = "center",
	rise = 22,
	blurAmount = 12,
	style,
}) => {
	const frame = useCurrentFrame();
	const local = frame - start;

	const arrive = interpolate(local, [0, inFrames], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.out(Easing.cubic),
	});

	const leave =
		end === undefined
			? 1
			: interpolate(frame, [end, end + outFrames], [1, 0], {
					extrapolateLeft: "clamp",
					extrapolateRight: "clamp",
				});

	const opacity = Math.min(arrive, leave);
	if (opacity <= 0.002) return null;

	const blur = (1 - arrive) * blurAmount + (1 - leave) * 8;

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
				transform: `translateY(${(1 - arrive) * rise}px)`,
				filter: `blur(${blur}px)`,
				...style,
			}}
		>
			{children}
		</div>
	);
};
