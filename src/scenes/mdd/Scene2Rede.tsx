import React from "react";
import {
	AbsoluteFill,
	Easing,
	OffthreadVideo,
	interpolate,
	staticFile,
	useCurrentFrame,
} from "remotion";
import {MachineClip} from "../../components/mdd/MachineClip";
import {cueLocalMDD} from "../../utils/timeline-mdd";
import {MDD} from "../../utils/theme-mdd";

/**
 * Revelação: "não é uma máquina de verdade" — a máquina desliga e some;
 * "agentes" — a rede de nós acende. Sem texto de impacto: a legenda cobre.
 */
export const Scene2Rede: React.FC = () => {
	const frame = useCurrentFrame();
	const morre = cueLocalMDD(1, "03-caltime", /^verdade\.$/); // a máquina desliga
	const rede = cueLocalMDD(1, "03-caltime", /^time$/); // a rede acende

	const zoom = interpolate(frame, [0, morre + 30], [1.3, 1.42], {
		extrapolateRight: "clamp",
		easing: Easing.inOut(Easing.sin),
	});
	// desliga: apaga rápido depois do "verdade", some logo antes da rede
	const dark = interpolate(frame, [morre, morre + 8], [1, 0.4], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});
	const out = interpolate(frame, [morre + 26, morre + 40], [1, 0], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	const netIn = interpolate(frame, [rede, rede + 12], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});
	const netZoom = interpolate(frame, [rede, 187], [1.12, 1.24], {
		extrapolateRight: "clamp",
		easing: Easing.inOut(Easing.sin),
	});

	return (
		<AbsoluteFill style={{backgroundColor: MDD.background}}>
			{out > 0 && <MachineClip zoom={zoom} brightness={dark} />}
			<AbsoluteFill style={{opacity: out * dark, backgroundColor: "#000"}} />
			{netIn > 0 && (
				<>
					<AbsoluteFill style={{opacity: netIn}}>
						<OffthreadVideo
							src={staticFile("videos/mdd-rede/clip-01.mp4")}
							muted
							playbackRate={0.62}
							style={{
								width: "100%",
								height: "100%",
								objectFit: "cover",
								transform: `scale(${netZoom})`,
							}}
						/>
					</AbsoluteFill>
					{/* assenta a rede no canvas da peça */}
					<AbsoluteFill
						style={{
							opacity: netIn * 0.55,
							background:
								"radial-gradient(circle at 50% 46%, transparent 30%, rgba(7,7,9,0.9) 100%)",
						}}
					/>
				</>
			)}
		</AbsoluteFill>
	);
};
