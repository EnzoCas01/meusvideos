import React from "react";
import {AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from "remotion";
import {fontFamily} from "../../utils/font";
import {IF, TYPE_IF} from "../../utils/theme-if";

type TextProps = {
	children: React.ReactNode;
	/** Local frame the text starts arriving on. */
	start: number;
	/** Local frame it starts leaving on. Omit to leave it up. */
	end?: number;
	inFrames?: number;
	outFrames?: number;
	fontSize?: number;
	fontWeight?: number;
	color?: string;
	letterSpacing?: number;
	lineHeight?: number;
	maxWidth?: number;
	rise?: number;
	blurAmount?: number;
	style?: React.CSSProperties;
};

/**
 * Editorial type for this film: resolves out of blur, never a flat fade.
 *
 * Sizing rule for a 1080-wide frame: Inter runs about 0.52em per character at
 * weight 300-500 and about 0.62em at weight 800 with wide tracking. Count the
 * characters before choosing a size — a line wider than ~960px is a crop.
 */
export const TextIF: React.FC<TextProps> = ({
	children,
	start,
	end,
	inFrames = 22,
	outFrames = 14,
	fontSize = TYPE_IF.caption,
	fontWeight = 400,
	color = IF.white,
	letterSpacing = 0,
	lineHeight = 1.2,
	maxWidth = 900,
	rise = 16,
	blurAmount = 10,
	style,
}) => {
	const frame = useCurrentFrame();
	const arrive = interpolate(frame - start, [0, inFrames], [0, 1], {
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

	return (
		<div
			style={{
				fontFamily,
				fontWeight,
				fontSize,
				color,
				letterSpacing,
				lineHeight,
				textAlign: "center",
				maxWidth,
				opacity,
				transform: `translateY(${(1 - arrive) * rise}px)`,
				filter: `blur(${(1 - arrive) * blurAmount + (1 - leave) * 6}px)`,
				...style,
			}}
		>
			{children}
		</div>
	);
};

type DisplayProps = {
	children: React.ReactNode;
	/** Local frame of the hit. This is the frame the sound lands on too. */
	start: number;
	end?: number;
	fontSize?: number;
	color?: string;
	letterSpacing?: number;
	/** Vertical placement, in px from the top of the frame. */
	top?: number;
	/** A thin rule that snaps open under the word. */
	underline?: boolean;
	/** Width of that rule, in px — size it to the word. */
	underlineWidth?: number;
	weight?: number;
	/** A soft dark pool behind the word, so it never fights the image. */
	scrim?: boolean;
};

/**
 * The one-word hit: the display type lands hard on a single frame, scaling
 * down onto the frame with its tracking closing at the same time — the shape
 * of a stamp, not of a fade. Used only for PAPEL, the years and the two
 * closing words: if everything hits, nothing does.
 */
export const DisplayIF: React.FC<DisplayProps> = ({
	children,
	start,
	end,
	fontSize = TYPE_IF.huge,
	color = IF.white,
	letterSpacing = 10,
	top = 780,
	underline = false,
	underlineWidth = 420,
	weight = 800,
	scrim = true,
}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();

	const land = spring({
		frame: frame - start,
		fps,
		config: {damping: 15, mass: 0.7, stiffness: 150},
		durationInFrames: 26,
	});
	if (frame < start - 2) return null;

	const leave =
		end === undefined
			? 1
			: interpolate(frame, [end, end + 12], [1, 0], {
					extrapolateLeft: "clamp",
					extrapolateRight: "clamp",
				});
	if (leave <= 0.002) return null;

	const scale = interpolate(land, [0, 1], [1.26, 1]);
	const track = interpolate(land, [0, 1], [letterSpacing + 46, letterSpacing]);
	// Short: the word has to be readable the frame after it lands, not half a
	// second later.
	const blur = interpolate(land, [0, 0.3], [22, 0], {extrapolateRight: "clamp"});
	const scrimY = ((top + fontSize * 0.5) / 1920) * 100;

	return (
		<AbsoluteFill style={{alignItems: "center", justifyContent: "flex-start"}}>
			{scrim ? (
				<AbsoluteFill
					style={{
						background: `radial-gradient(ellipse 72% 13% at 50% ${scrimY}%, rgba(6,5,3,${0.86 * land * leave}) 0%, rgba(6,5,3,0) 72%)`,
					}}
				/>
			) : null}
			<div
				style={{
					position: "absolute",
					top,
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					opacity: Math.min(land * 1.8, 1) * leave,
					transform: `scale(${scale})`,
					filter: `blur(${blur}px)`,
				}}
			>
				<div
					style={{
						fontFamily,
						fontWeight: weight,
						fontSize,
						color,
						letterSpacing: track,
						lineHeight: 1,
						textAlign: "center",
						// The tracking is wide while the word lands: without this the
						// line wraps for a few frames and then snaps back.
						whiteSpace: "nowrap",
						// The tracking is applied on the right of the last glyph too;
						// pulling it back keeps the word optically centred.
						marginRight: -track,
						textShadow: `0 6px 34px rgba(0,0,0,0.92), 0 0 ${60 * land}px rgba(232,132,58,${0.3 * land})`,
						fontVariantNumeric: "tabular-nums",
					}}
				>
					{children}
				</div>
				{underline ? (
					<div
						style={{
							marginTop: 22,
							height: 4,
							width: underlineWidth * land,
							background: IF.accent,
							opacity: 0.9,
						}}
					/>
				) : null}
			</div>
		</AbsoluteFill>
	);
};

/** Small all-caps tag used for period labels. Never the main message. */
export const LabelIF: React.FC<{children: React.ReactNode; start: number; end?: number; top: number}> =
	({children, start, end, top}) => (
		<AbsoluteFill style={{alignItems: "center", justifyContent: "flex-start"}}>
			<div style={{position: "absolute", top}}>
				<TextIF
					start={start}
					end={end}
					fontSize={TYPE_IF.label}
					fontWeight={600}
					letterSpacing={9}
					color={IF.grey}
					rise={8}
					blurAmount={6}
					inFrames={14}
				>
					{children}
				</TextIF>
			</div>
		</AbsoluteFill>
	);
