import React from "react";
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from "remotion";
import {DISPLAY_CC, CC, SANS_CC} from "../../utils/theme-cc";

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
	/** A solid dark plate behind the type — for type that lands on a bright printed area. */
	plate?: boolean;
	/** Horizontal stretch (poster scale) for single short numerals. */
	stretch?: number;
};

/**
 * One line of type that RISES out of a mask (no blur, no flat fade). Bebas
 * Neue runs ~0.4em per character, Inter ~0.55em: count before choosing `size`.
 */
export const TextCC: React.FC<Props> = ({
	children,
	start,
	end,
	top,
	size,
	font = "display",
	color = CC.white,
	spacing = 0.03,
	weight = 400,
	scrim = true,
	plate = false,
	stretch,
}) => {
	const frame = useCurrentFrame();
	const arrive = interpolate(frame - start, [0, 22], [0, 1], {
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
			{scrim && !plate ? (
				<div
					style={{
						position: "absolute",
						left: 0,
						right: 0,
						top: top - size * 0.5,
						height: size * (lines > 1 ? 2.6 : 1.9),
						background: `radial-gradient(ellipse 72% 58% at 50% 50%, rgba(5,5,5,${0.8 * arrive * leave}), rgba(5,5,5,0) 100%)`,
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
						fontFamily: font === "display" ? DISPLAY_CC : SANS_CC,
						fontWeight: weight,
						fontSize: size,
						lineHeight: font === "display" ? 0.98 : 1.2,
						letterSpacing: `${spacing}em`,
						color,
						textAlign: "center",
						whiteSpace: "nowrap",
						...(plate
							? {
									background: "rgba(5,5,5,0.92)",
									borderRadius: 14,
									padding: "0.05em 0.3em",
									boxShadow: "0 6px 24px rgba(0,0,0,0.6)",
								}
							: {}),
						transform: `translateY(${(1 - arrive) * 108}%)${stretch ? ` scaleX(${stretch})` : ""}`,
						textShadow: "0 2px 10px rgba(0,0,0,0.75), 0 4px 30px rgba(0,0,0,0.85)",
					}}
				>
					{children}
				</div>
			</div>
		</AbsoluteFill>
	);
};

/** A thin red rule that draws itself open, centred at `top`. */
export const RuleCC: React.FC<{start: number; end?: number; top: number; width: number}> = ({
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
				background: CC.accent,
				opacity: leave,
			}}
		/>
	);
};
