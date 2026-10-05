import React from "react";
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from "remotion";
import {Impact} from "../../components/mq/Impact";
import {Scene1Gancho} from "./Scene1Gancho";
import {cueLocalMQ} from "../../utils/timeline-mq";
import {MQ} from "../../utils/theme-mq";

/** Vídeo pronto: o celular da cena anterior ganha tela — e mostra este próprio vídeo. */
export const Scene5VideoPronto: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const at = cueLocalMQ(4, "08-esse", /^máquina\.$/);
	// o celular pousa com overshoot (continuidade com o pop da cena 4)
	const settle = spring({frame, fps, config: {damping: 13, mass: 0.9}, durationInFrames: 20});
	const scale = interpolate(settle, [0, 1], [0.82, 1]);
	const screenIn = interpolate(frame, [0, 5], [0, 1], {extrapolateRight: "clamp"});
	// pulso de glow atrás do celular — a máquina "viva"
	const pulse = 0.10 + 0.05 * Math.sin(frame * 0.18);
	// varredura sutil na tela: vídeo recém-gerado
	const scan = (frame * 14) % 920;

	return (
		<AbsoluteFill style={{backgroundColor: MQ.background}}>
			<div
				style={{
					position: "absolute",
					inset: 0,
					background: `radial-gradient(circle at 50% 50%, rgba(61,255,138,${pulse}) 0%, transparent 55%)`,
				}}
			/>
			<div
				style={{
					position: "absolute",
					left: 540 - 235,
					top: 960 - 480,
					width: 470,
					height: 960,
					borderRadius: 58,
					background: "#161A22",
					border: "6px solid #2A2F3A",
					boxShadow: "0 40px 110px rgba(0,0,0,0.6), 0 0 60px rgba(61,255,138,0.1)",
					transform: `scale(${scale})`,
				}}
			>
				<div
					style={{
						position: "absolute",
						inset: 18,
						borderRadius: 44,
						overflow: "hidden",
						background: "#000",
						opacity: screenIn,
					}}
				>
					<Scene1Gancho compact />
					<div
						style={{
							position: "absolute",
							left: 0,
							right: 0,
							height: 3,
							top: scan,
							background: MQ.accent,
							opacity: 0.35,
						}}
					/>
				</div>
				<div
					style={{
						position: "absolute",
						top: 30,
						left: "50%",
						transform: "translateX(-50%)",
						width: 120,
						height: 26,
						borderRadius: 13,
						background: "#2A2F3A",
					}}
				/>
			</div>

			<Impact at={at} lines={["FEITO POR", "ESSA MÁQUINA"]} size={122} y={300} />
		</AbsoluteFill>
	);
};
