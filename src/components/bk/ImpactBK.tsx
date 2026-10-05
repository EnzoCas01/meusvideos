import React from "react";
import {Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from "remotion";
import {DISPLAY_BK, BK} from "../../utils/theme-bk";

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
	/** Deslocamento de subida ao entrar. */
	rise?: number;
	/** Contorno escuro, para texto claro sobre céu/foto clara. */
	stroke?: boolean;
};

/** Texto de impacto grande, entrando exatamente na palavra falada. */
export const ImpactBK: React.FC<Props> = ({at, lines, size = 140, color = BK.white, y = 820, out, rise = 26, stroke}) => {
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
				opacity: Math.min(1, pop * 2),
				transform: `translateY(${(1 - pop) * rise - 50}%) scale(${scale})`,
			}}
		>
			{lines.map((line, i) => (
				<div
					key={i}
					style={{
						fontFamily: DISPLAY_BK,
						fontSize: size,
						lineHeight: 0.95,
						letterSpacing: "0.01em",
						color,
						whiteSpace: "nowrap",
						WebkitTextStroke: stroke ? "9px #000" : undefined,
						paintOrder: "stroke fill",
						textShadow: "0 10px 44px rgba(0,0,0,0.75)",
					}}
				>
					{line}
				</div>
			))}
		</div>
	);
};
