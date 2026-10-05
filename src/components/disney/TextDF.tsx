import React from "react";
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from "remotion";
import {DF, DISPLAY_DF, SANS_DF} from "../../utils/theme-df";

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
	/** Horizontal centre of the line (frame is 1080 wide). */
	x?: number;
	/** A dark pool behind the type so it holds over a photo. */
	scrim?: boolean;
};

/** Width budget: count characters before choosing `size` (Limelight caps ≈0.58em/char measured; 0.60 leaves margin). */
export const textWidthDF = (chars: number, size: number, spacing = 0.03): number =>
	chars * size * 0.6 * (1 + spacing);

/**
 * One line of type that RISES out of a mask into place — the film's single
 * entrance for impact words. Never a flat fade, never per-word karaoke.
 */
export const TextDF: React.FC<Props> = ({
	children,
	start,
	end,
	top,
	size,
	font = "display",
	color = DF.white,
	spacing = 0.03,
	weight = 400,
	x = 540,
	scrim = true,
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
			{scrim ? (
				<div
					style={{
						position: "absolute",
						left: x - 540,
						right: 1080 - x - 540,
						top: top - size * 0.5,
						height: size * (lines > 1 ? 2.6 : 1.9),
						background: `radial-gradient(ellipse 60% 50% at 50% 50%, rgba(6,4,3,${0.58 * arrive * leave}), rgba(6,4,3,0) 100%)`,
					}}
				/>
			) : null}
			<div
				style={{
					position: "absolute",
					left: x - 540,
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
						fontFamily: font === "display" ? DISPLAY_DF : SANS_DF,
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

/** A thin rule that draws itself open, centred at `top`. */
export const RuleDF: React.FC<{start: number; end?: number; top: number; width: number; color?: string; x?: number}> = ({
	start,
	end,
	top,
	width,
	color = DF.gold,
	x = 540,
}) => {
	const frame = useCurrentFrame();
	const open = interpolate(frame - start, [0, 20], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.out(Easing.cubic),
	});
	const leave =
		end === undefined
			? 1
			: interpolate(frame, [end, end + 10], [1, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
	if (open <= 0 || leave <= 0) return null;
	return (
		<div
			style={{
				position: "absolute",
				left: x - (width * open) / 2,
				top,
				width: width * open,
				height: 4,
				background: color,
				opacity: 0.9 * leave,
			}}
		/>
	);
};

/** Small tracked-out sans label — dates and credits of support, never shouting. */
const TYPE_SMALL = 44;
export const LabelDF: React.FC<{
	children: React.ReactNode;
	start: number;
	end?: number;
	top: number;
	size?: number;
	color?: string;
	x?: number;
	spacing?: number;
}> = ({children, start, end, top, size = TYPE_SMALL, color = DF.grey, x = 540, spacing = 0.24}) => {
	const frame = useCurrentFrame();
	const arrive = interpolate(frame - start, [0, 14], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.out(Easing.cubic),
	});
	const leave =
		end === undefined
			? 1
			: interpolate(frame, [end, end + 10], [1, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
	if (frame < start - 1 || arrive <= 0.002 || leave <= 0.002) return null;
	return (
		<div
			style={{
				position: "absolute",
				left: 0,
				width: 1080,
				top,
				display: "flex",
				justifyContent: "center",
				opacity: arrive * leave,
				transform: `translateY(${(1 - arrive) * 10}px)`,
				fontFamily: SANS_DF,
				fontWeight: 600,
				fontSize: size,
				letterSpacing: `${spacing}em`,
				color,
				textShadow: "0 2px 16px rgba(0,0,0,0.8)",
				whiteSpace: "nowrap",
			}}
		>
			<div style={{transform: `translateX(${x - 540}px)`}}>{children}</div>
		</div>
	);
};
