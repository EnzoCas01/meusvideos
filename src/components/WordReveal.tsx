import React from "react";
import {interpolate, useCurrentFrame, Easing} from "remotion";
import {COLORS} from "../utils/theme";
import {fontFamily} from "../utils/font";

type Props = {
	text: string;
	delay?: number;
	perWordFrames?: number; // how many frames between each word's reveal start
	fontSize?: number;
	fontWeight?: number;
	color?: string;
	align?: "center" | "left";
	maxWidth?: number;
	highlightLastWord?: boolean;
	highlightColor?: string;
};

/**
 * Reveals a phrase word by word, each with its own soft rise + blur-in,
 * so the sentence assembles itself instead of fading in as a block.
 */
export const WordReveal: React.FC<Props> = ({
	text,
	delay = 0,
	perWordFrames = 10,
	fontSize = 72,
	fontWeight = 300,
	color = COLORS.white,
	align = "center",
	maxWidth = 900,
	highlightLastWord = false,
	highlightColor = COLORS.accent,
}) => {
	const frame = useCurrentFrame();
	const words = text.split(" ");

	return (
		<div
			style={{
				fontFamily,
				fontSize,
				fontWeight,
				lineHeight: 1.3,
				textAlign: align,
				maxWidth,
				display: "flex",
				flexWrap: "wrap",
				justifyContent: align === "center" ? "center" : "flex-start",
				gap: `0 ${fontSize * 0.28}px`,
			}}
		>
			{words.map((word, i) => {
				const local = frame - delay - i * perWordFrames;
				const progress = interpolate(local, [0, 22], [0, 1], {
					extrapolateLeft: "clamp",
					extrapolateRight: "clamp",
					easing: Easing.out(Easing.cubic),
				});
				const isLast = highlightLastWord && i === words.length - 1;
				return (
					<span
						key={i}
						style={{
							display: "inline-block",
							opacity: progress,
							transform: `translateY(${(1 - progress) * 18}px)`,
							filter: `blur(${(1 - progress) * 10}px)`,
							color: isLast ? highlightColor : color,
						}}
					>
						{word}
					</span>
				);
			})}
		</div>
	);
};
