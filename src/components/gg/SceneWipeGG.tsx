import React from "react";
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from "remotion";
import {GG} from "../../utils/theme-gg";

const LEN = 14;

/**
 * Corte com intenção entre cenas: barra de acento varre o quadro uma vez
 * (com rastro escuro curto), nunca um corte seco. Ritmo rápido de TikTok.
 */
export const SceneWipeGG: React.FC<{dir?: 1 | -1}> = ({dir = 1}) => {
	const frame = useCurrentFrame();
	if (frame >= LEN) return null;

	const p = interpolate(frame, [0, 11], [0, 1], {easing: Easing.inOut(Easing.quad)});
	const veil = interpolate(frame, [0, 2, 9, LEN], [0, 0.32, 0.1, 0], {extrapolateRight: "clamp"});

	const raw = interpolate(p, [0, 1], dir === 1 ? [-140, 1220] : [1220, -140]);
	const x = dir === 1 ? raw : 1080 - raw;

	return (
		<AbsoluteFill style={{pointerEvents: "none"}}>
			<AbsoluteFill style={{background: GG.background, opacity: veil}} />
			<AbsoluteFill
				style={{
					background:
						dir === 1
							? `linear-gradient(90deg, transparent ${Math.max(0, x - 150)}px, rgba(66,133,244,0.14) ${Math.max(0, x - 80)}px, ${GG.accent} ${x}px, transparent ${x + 26}px)`
							: `linear-gradient(90deg, transparent ${x}px, ${GG.accent} ${x}px, rgba(66,133,244,0.14) ${Math.min(1080, x + 80)}px, transparent ${Math.min(1080, x + 150)}px)`,
				}}
			/>
		</AbsoluteFill>
	);
};
