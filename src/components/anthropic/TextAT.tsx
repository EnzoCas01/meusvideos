import React from "react";
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from "remotion";
import {DISPLAY_AT, AT, SANS_AT} from "../../utils/theme-at";

type Props = {
	children: React.ReactNode;
	/** Local frame the line starts rising into place. */
	start: number;
	/** Local frame it starts leaving. Omit to keep it up. */
	end?: number;
	top: number;
	size: number;
	font?: "display" | "sans";
	color?: string;
	/** Letter spacing in em. */
	spacing?: number;
	weight?: number;
	/** A dark pool behind the type so it holds over a photo. */
	scrim?: boolean;
	/** Strength of that pool (0..1) — raise it when the photo behind is bright. */
	scrimOpacity?: number;
	/** Frames the rise plays over. Shorter on impact words that must read complete on the word itself. */
	arriveFrames?: number;
};

/**
 * One line of type that RISES out of a mask (no blur, no flat fade). Bebas
 * Neue runs ~0.4em per character, Inter ~0.55em: count before choosing `size`.
 */
export const TextAT: React.FC<Props> = ({
	children,
	start,
	end,
	top,
	size,
	font = "display",
	color = AT.white,
	spacing = 0.03,
	weight = 400,
	scrim = true,
	scrimOpacity = 0.62,
	arriveFrames = 22,
}) => {
	const frame = useCurrentFrame();
	const arrive = interpolate(frame - start, [0, arriveFrames], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.bezier(0.16, 1, 0.3, 1),
	});
	const leave =
		end === undefined
			? 1
			: interpolate(frame, [end, end + 12], [1, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
	if (frame < start - 1 || leave <= 0.002) return null;

	const lines = React.Children.count(children);
	return (
		<AbsoluteFill style={{pointerEvents: "none"}}>
			{scrim ? (
				<div
					style={{
						position: "absolute",
						left: 0,
						right: 0,
						top: top - size * 0.5,
						height: size * (lines > 1 ? 2.6 : 1.9),
						background: `radial-gradient(ellipse 60% 50% at 50% 50%, rgba(5,5,5,${scrimOpacity * arrive * leave}), rgba(5,5,5,0) 100%)`,
					}}
				/>
			) : null}
			<div
				style={{
					position: "absolute",
					left: 0,
					width: 1080,
					top,
					display: "flex",
					justifyContent: "center",
					overflow: "hidden",
					padding: `${size * 0.08}px 0`,
					opacity: leave,
					transform: `translateY(${(1 - leave) * -24}px)`,
				}}
			>
				<div
					style={{
						fontFamily: font === "display" ? DISPLAY_AT : SANS_AT,
						fontWeight: weight,
						fontSize: size,
						lineHeight: font === "display" ? 0.98 : 1.2,
						letterSpacing: `${spacing}em`,
						color,
						textAlign: "center",
						whiteSpace: "nowrap",
						transform: `translateY(${(1 - arrive) * 108}%)`,
						textShadow: "0 4px 30px rgba(0,0,0,0.85)",
					}}
				>
					{children}
				</div>
			</div>
		</AbsoluteFill>
	);
};

/** A thin red rule that draws itself open, centred at `top`. */
export const RuleAT: React.FC<{start: number; end?: number; top: number; width: number}> = ({
	start,
	end,
	top,
	width,
}) => {
	const frame = useCurrentFrame();
	const open = interpolate(frame - start, [0, 20], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.out(Easing.cubic),
	});
	const leave =
		end === undefined ? 1 : interpolate(frame, [end, end + 10], [1, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
	if (open <= 0 || leave <= 0) return null;
	return (
		<div
			style={{
				position: "absolute",
				left: 540 - (width * open) / 2,
				top,
				width: width * open,
				height: 5,
				background: AT.accent,
				opacity: leave,
			}}
		/>
	);
};
