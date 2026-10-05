import React from "react";
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from "remotion";
import {Impact} from "../../components/mdd/Impact";
import {MachineClip} from "../../components/mdd/MachineClip";
import {cueLocalMDD} from "../../utils/timeline-mdd";
import {MDD} from "../../utils/theme-mdd";

/**
 * Abertura: UMA ideia só — a máquina. Escura e quase parada na pergunta;
 * corte seco (brilho + zoom) no "montei" e a frase pousa.
 */
export const Scene1Maquina: React.FC = () => {
	const frame = useCurrentFrame();
	const at = cueLocalMDD(0, "02-montei", /^montei$/);

	// punch-in contínuo; o corte seco dá um degrau no zoom
	const zoomBefore = interpolate(frame, [0, at], [1.08, 1.14], {easing: Easing.inOut(Easing.sin)});
	const zoomAfter = interpolate(frame, [at, 114], [1.22, 1.3], {
		extrapolateRight: "clamp",
		easing: Easing.inOut(Easing.sin),
	});
	const zoom = frame < at ? zoomBefore : zoomAfter;
	const brightness = frame < at ? 0.55 : 1;

	return (
		<AbsoluteFill style={{backgroundColor: MDD.background}}>
			<MachineClip zoom={zoom} brightness={brightness} />
			{/* base de leitura para legenda e frase */}
			<AbsoluteFill
				style={{
					background: "linear-gradient(to top, rgba(5,5,7,0.85) 0%, rgba(5,5,7,0.35) 45%, transparent 70%)",
				}}
			/>
			<Impact at={at} lines={["EU MONTEI UMA."]} size={152} color={MDD.white} y={1120} />
		</AbsoluteFill>
	);
};
