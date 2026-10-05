import React from "react";
import {Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from "remotion";
import {GG, SANS_GG} from "../../utils/theme-gg";

type Props = {
	/** Dígitos com pontos de milhar, ex. "3.000.000.000.000" — nunca "bilhão"/"trilhão" por extenso. */
	value: string;
	/** Frame local onde o contador começa a subir. */
	at: number;
	/** Tamanho do dígito em px; o rótulo fica a ~0,3x disso. */
	size: number;
	y: number;
	color?: string;
	labelColor?: string;
};

/** Contador de zeros subindo rápido, um caractere pop de cada vez — nunca escreve o valor por extenso. */
export const MarketCap: React.FC<Props> = ({value, at, size, y, color = GG.white, labelColor = GG.accent}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	if (frame < at) return null;
	const chars = value.split("");
	const labelPop = spring({frame: frame - at, fps, config: {damping: 16, mass: 0.6}, durationInFrames: 10});

	return (
		<div style={{position: "absolute", top: y, left: 0, width: "100%", display: "flex", flexDirection: "column", alignItems: "center"}}>
			<div
				style={{
					fontFamily: SANS_GG,
					fontWeight: 800,
					fontSize: Math.round(size * 0.26),
					letterSpacing: "0.16em",
					color: labelColor,
					marginBottom: Math.round(size * 0.12),
					opacity: labelPop,
					textTransform: "uppercase",
				}}
			>
				Valor de mercado (US$)
			</div>
			<div style={{display: "flex", fontVariantNumeric: "tabular-nums"}}>
				{chars.map((c, i) => {
					const delay = i * 2;
					const pop = spring({frame: frame - at - delay, fps, config: {damping: 13, mass: 0.55}, durationInFrames: 10});
					const scale = interpolate(pop, [0, 1], [0.3, 1], {easing: Easing.out(Easing.back(1.6))});
					return (
						<span
							key={i}
							style={{
								display: "inline-block",
								fontFamily: SANS_GG,
								fontWeight: 900,
								fontSize: size,
								lineHeight: 1,
								color: c === "." ? labelColor : color,
								opacity: pop,
								transform: `scale(${scale})`,
								textShadow: "0 6px 26px rgba(0,0,0,0.6)",
							}}
						>
							{c}
						</span>
					);
				})}
			</div>
		</div>
	);
};
