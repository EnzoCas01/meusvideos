import React from "react";
import {Easing, interpolate, useCurrentFrame} from "remotion";
import {fontFamily} from "../../utils/font";
import {IF} from "../../utils/theme-if";

type Mode = "slam" | "rise" | "wipe";

type Props = {
	children: React.ReactNode;
	/** Local frame the word arrives on. */
	start: number;
	/** Local frame it starts leaving on. Omit to leave it up. */
	end?: number;
	/** Deliberately short: the brief asks for simple, fast type animation. */
	inFrames?: number;
	outFrames?: number;
	fontSize?: number;
	fontWeight?: number;
	color?: string;
	letterSpacing?: number;
	lineHeight?: number;
	maxWidth?: number;
	align?: "center" | "left";
	mode?: Mode;
	/** Thin rule under the word, wiping open with it. The film's date/label mark. */
	rule?: boolean;
	ruleColor?: string;
	style?: React.CSSProperties;
};

/**
 * Screen type for this film: few words, large, fast.
 *
 * SIZING RULE FOR 1080 WIDE — Inter at weight 400-600 runs about 0.56em per
 * character once letter-spacing is in play. A line of N characters needs about
 * N * 0.56 * fontSize px, and must stay under ~960 or it is a crop, not a
 * design. "O PROBLEMA: LOGÍSTICA" is 21 chars, so 21 * 0.56 * 76 = 894: fits on
 * one line at 76px and not a pixel more. Longer labels get a <br />.
 */
export const TextIF: React.FC<Props> = ({
	children,
	start,
	end,
	inFrames = 12,
	outFrames = 8,
	fontSize = 76,
	fontWeight = 600,
	color = IF.white,
	letterSpacing = 2,
	lineHeight = 1.06,
	maxWidth = 960,
	align = "center",
	mode = "rise",
	rule = false,
	ruleColor = IF.red,
	style,
}) => {
	const frame = useCurrentFrame();
	const local = frame - start;

	const arrive = interpolate(local, [0, Math.max(1, inFrames)], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.out(Easing.cubic),
	});

	const leave =
		end === undefined
			? 1
			: interpolate(frame, [end, end + Math.max(1, outFrames)], [1, 0], {
					extrapolateLeft: "clamp",
					extrapolateRight: "clamp",
				});

	const opacity = Math.min(arrive, leave);
	if (opacity <= 0.002) return null;

	// Three arrivals, all short. "slam" overshoots in from slightly too large and
	// settles — the impact beat (dates, the LOGÍSTICA reveal). "rise" lifts and
	// unblurs. "wipe" opens from the left behind a clipping mask.
	const scale = mode === "slam" ? 1 + (1 - arrive) * 0.16 : 1;
	const ty = mode === "rise" ? (1 - arrive) * 26 : 0;
	const blur = mode === "slam" ? (1 - arrive) * 14 : (1 - arrive) * 9;
	const clip = mode === "wipe" ? `inset(0 ${(1 - arrive) * 100}% 0 0)` : undefined;

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
				transform: `translateY(${ty}px) scale(${scale})`,
				filter: blur > 0.01 ? `blur(${blur}px)` : undefined,
				clipPath: clip,
				...style,
			}}
		>
			{children}
			{rule ? (
				<div
					style={{
						height: 5,
						marginTop: Math.round(fontSize * 0.22),
						width: `${arrive * 100}%`,
						marginLeft: align === "center" ? "auto" : 0,
						marginRight: align === "center" ? "auto" : 0,
						maxWidth: 260,
						background: ruleColor,
						boxShadow: `0 0 24px ${IF.redSoft}`,
					}}
				/>
			) : null}
		</div>
	);
};
