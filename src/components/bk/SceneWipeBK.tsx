import React from "react";
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from "remotion";
import {BK} from "../../utils/theme-bk";

const LEN = 18;

/**
 * Transição de cena para cena — nunca corte seco. Dois modos:
 *  - "shutter": duas metades fecham no meio e abem do outro lado (abertura).
 *  - "sweep": painel escuro com borda de chama varre o quadro inteiro,
 *    cobrindo o corte no meio do movimento.
 */
export const SceneWipeBK: React.FC<{mode?: "sweep" | "shutter"; dir?: 1 | -1}> = ({
	mode = "sweep",
	dir = 1,
}) => {
	const frame = useCurrentFrame();
	if (frame >= LEN) return null;

	const p = interpolate(frame, [0, LEN - 1], [0, 1], {easing: Easing.inOut(Easing.quad)});

	if (mode === "shutter") {
		// as metades se encontram no meio exato da transição (p = 0.5)
		const y = interpolate(p, [0, 1], [-1010, 1010]);
		return (
			<AbsoluteFill style={{pointerEvents: "none"}}>
				<div style={{position: "absolute", left: 0, top: y - 1010, width: "100%", height: 1010, background: BK.background, borderBottom: `6px solid ${BK.gold}`, boxShadow: "0 14px 60px rgba(0,0,0,0.8)"}} />
				<div style={{position: "absolute", left: 0, top: -y, width: "100%", height: 1010, background: BK.background, borderTop: `6px solid ${BK.gold}`, boxShadow: "0 -14px 60px rgba(0,0,0,0.8)"}} />
			</AbsoluteFill>
		);
	}

	// sweep: painel de 1180px cruza os 1080 do quadro, cobrindo tudo em p≈0.5
	const raw = interpolate(p, [0, 1], [-1240, 1240]);
	const x = dir === 1 ? raw : 1080 - raw;
	const edge = dir === 1 ? x - 590 : x + 590;

	return (
		<AbsoluteFill style={{pointerEvents: "none"}}>
			<div
				style={{
					position: "absolute",
					left: dir === 1 ? x - 1180 : x,
					top: 0,
					width: 1180,
					height: "100%",
					background: `linear-gradient(90deg, ${BK.background} 0%, #0B0A0C 92%, ${BK.gold} 100%)`,
					boxShadow: "0 0 90px rgba(0,0,0,0.9)",
				}}
			/>
			{/* brilho quente na quina que arrasta a cena nova */}
			<div
				style={{
					position: "absolute",
					left: edge - 90,
					top: 0,
					width: 180,
					height: "100%",
					background: `linear-gradient(90deg, transparent, rgba(255,174,0,0.35), transparent)`,
					opacity: 0.8,
				}}
			/>
		</AbsoluteFill>
	);
};
