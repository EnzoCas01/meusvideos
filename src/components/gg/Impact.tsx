import React from "react";
import {Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from "remotion";
import {DISPLAY_GG, GG} from "../../utils/theme-gg";

type Props = {
	/** Local frame where the word is spoken — nothing renders before it. */
	at: number;
	/** 1-3 big words; each string is one line. */
	lines: string[];
	/** Bebas ≈ 0.40em por caractere — dimensione a linha para o quadro de 1080. */
	size?: number;
	color?: string;
	y?: number;
	/** Frame local para sumir (antes de outro texto usar o mesmo lugar). */
	out?: number;
};

/** Texto de impacto grande, entrando exatamente na palavra falada. */
export const Impact: React.FC<Props> = ({at, lines, size = 140, color = GG.white, y = 800, out}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	if (frame < at) return null;
	if (out !== undefined && frame >= out) return null;
	const pop = spring({frame: frame - at, fps, config: {damping: 200, mass: 0.9}, durationInFrames: 18});
	const scale = interpolate(pop, [0, 1], [1.22, 1], {easing: Easing.out(Easing.cubic)});
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
				transform: `translateY(-50%) scale(${scale})`,
				opacity: Math.min(1, pop * 2),
			}}
		>
			{lines.map((line, i) => (
				<div
					key={i}
					style={{
						fontFamily: DISPLAY_GG,
						fontSize: size,
						lineHeight: 0.95,
						letterSpacing: "0.01em",
						color,
						whiteSpace: "nowrap",
						textShadow: "0 10px 44px rgba(0,0,0,0.65)",
					}}
				>
					{line}
				</div>
			))}
		</div>
	);
};
