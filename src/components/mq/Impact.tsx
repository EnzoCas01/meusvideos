import React from "react";
import {Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from "remotion";
import {DISPLAY_MQ, MQ} from "../../utils/theme-mq";

type Props = {
	/** Local frame where the word is spoken — nothing renders before it. */
	at: number;
	/** 1-3 big words; each string is one line. */
	lines: string[];
	/** Bebas ≈ 0.40em per character — size the line to the 1080 frame. */
	size?: number;
	color?: string;
	y?: number;
	rotate?: number;
	/** Stamp-in instead of pop (scale 1.5 → 1). */
	stamp?: boolean;
	/** Local frame to fade OUT (before another text takes the same spot). */
	out?: number;
};

/** Big impact text entering exactly on the spoken word. */
export const Impact: React.FC<Props> = ({
	at,
	lines,
	size = 140,
	color = MQ.accent,
	y = 800,
	rotate = 0,
	stamp = false,
	out,
}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	if (frame < at) return null;
	if (out !== undefined && frame >= out) return null;
	const pop = spring({
		frame: frame - at,
		fps,
		config: stamp ? {damping: 14, mass: 0.7} : {damping: 200, mass: 0.9},
		durationInFrames: stamp ? 12 : 18,
	});
	const scale = stamp
		? interpolate(pop, [0, 1], [1.5, 1])
		: interpolate(pop, [0, 1], [1.25, 1], {easing: Easing.out(Easing.cubic)});
	return (
		<div
			style={{
				position: "absolute",
				top: y,
				left: 0,
				width: "100%",
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				transform: `translateY(-50%) rotate(${rotate}deg) scale(${scale})`,
				opacity: Math.min(1, pop * 2),
			}}
		>
			{lines.map((line, i) => (
				<div
					key={i}
					style={{
						fontFamily: DISPLAY_MQ,
						fontSize: size,
						lineHeight: 0.95,
						letterSpacing: "0.01em",
						color,
						whiteSpace: "nowrap",
						textShadow: "0 10px 44px rgba(0,0,0,0.6)",
					}}
				>
					{line}
				</div>
			))}
		</div>
	);
};
