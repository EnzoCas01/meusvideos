import React from "react";
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from "remotion";
import {Impact} from "../../components/mdd/Impact";
import {MachineClip} from "../../components/mdd/MachineClip";
import {cueLocalMDD} from "../../utils/timeline-mdd";
import {MDD, SANS_MDD} from "../../utils/theme-mdd";

/**
 * Fechamento: a máquina liga de vez — brilho sobe até o fim — e o CTA final
 * fica limpo em cima dela.
 */
export const Scene7CTA: React.FC = () => {
	const frame = useCurrentFrame();
	const quero = cueLocalMDD(6, "09-cta", /^quero,$/);
	const segue = cueLocalMDD(6, "09-cta", /^segue$/);
	const vamos = cueLocalMDD(6, "09-cta", /^Vamos$/);

	// luzes acendendo todas de vez: brilho sobe contínuo, pico no "Vamos"
	const zoom = interpolate(frame, [0, 214], [1.14, 1.3], {
		easing: Easing.inOut(Easing.sin),
	});
	const brightness = interpolate(frame, [0, vamos + 40], [0.75, 1.5], {
		extrapolateRight: "clamp",
	});
	// base de leitura sob o CTA
	const scrim = interpolate(frame, [quero - 6, quero + 6], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	return (
		<AbsoluteFill style={{backgroundColor: MDD.background}}>
			<MachineClip zoom={zoom} playbackRate={0.85} brightness={brightness} />
			<AbsoluteFill
				style={{
					background: "linear-gradient(to top, rgba(7,7,9,0.92) 0%, rgba(7,7,9,0.5) 50%, rgba(7,7,9,0.15) 100%)",
					opacity: scrim,
				}}
			/>
			<Impact at={quero} lines={["COMENTA EU QUERO"]} size={138} y={880} stamp />
			<div
				style={{
					position: "absolute",
					top: 1030,
					width: "100%",
					textAlign: "center",
					fontFamily: SANS_MDD,
					fontWeight: 800,
					fontSize: 44,
					color: MDD.white,
					letterSpacing: "0.04em",
					opacity: interpolate(frame, [segue, segue + 8], [0, 1], {
						extrapolateLeft: "clamp",
						extrapolateRight: "clamp",
					}),
				}}
			>
				SEGUE O PERFIL · MANDA PRA ALGUÉM
			</div>
		</AbsoluteFill>
	);
};
