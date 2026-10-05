import React from "react";
import {AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from "remotion";
import {MoneyClip} from "../../components/mq/MoneyClip";
import {cueLocalMQ} from "../../utils/timeline-mq";
import {DISPLAY_MQ, MQ} from "../../utils/theme-mq";

/**
 * Gancho: a contadora real, nítida, em punch-in lento. No "montei" entra
 * "EU MONTEI UMA." com sublinhado desenhado sobre a tarja sólida. Reusada
 * dentro do celular da cena 5 (o vídeo mostra a si mesmo) com `compact`.
 */
export const Scene1Gancho: React.FC<{compact?: boolean}> = ({compact = false}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const at = cueLocalMQ(0, "02-montei", /^montei$/);

	// entrada com peso: a imagem pousa (leve overshoot) e continua em punch-in lento
	const settle = spring({frame, fps, config: {damping: 200, mass: 1.1}, durationInFrames: 22});
	const settleScale = interpolate(settle, [0, 1], [1.3, 1.15]);
	const zoom = interpolate(frame, [12, 110], [1.15, 1.32], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.inOut(Easing.sin),
	});
	// pan lateral lento (parallax dentro do clipe, sempre nítido)
	const pan = interpolate(frame, [0, 110], ["46%", "54%"], {easing: Easing.inOut(Easing.sin)});

	// scrim só quando o texto precisa de base de leitura
	const scrim = interpolate(frame, [at - 6, at + 5], [0, compact ? 0.5 : 0.66], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	const pop = spring({frame: frame - at, fps, config: {damping: 15, mass: 0.9}, durationInFrames: 18});
	const scale = interpolate(pop, [0, 1], [1.25, 1], {easing: Easing.out(Easing.cubic)});
	// sublinhado desenhado logo depois do pouso do texto
	const under = interpolate(frame, [at + 10, at + 26], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.out(Easing.cubic),
	});

	const size = compact ? 62 : 148;
	const textTop = compact ? 620 : 1200;

	return (
		<AbsoluteFill style={{backgroundColor: MQ.background}}>
			<MoneyClip zoom={settleScale * zoom} panX={pan} line={!compact} />
			<AbsoluteFill
				style={{
					background: "linear-gradient(to top, rgba(5,7,10,0.92) 0%, rgba(5,7,10,0.45) 55%, transparent 100%)",
					opacity: scrim,
				}}
			/>
			{frame >= at && (
				<div
					style={{
						position: "absolute",
						top: textTop,
						left: 0,
						width: "100%",
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						transform: `translateY(-50%) scale(${scale})`,
						opacity: Math.min(1, pop * 2),
					}}
				>
					<div
						style={{
							fontFamily: DISPLAY_MQ,
							fontSize: size,
							lineHeight: 0.95,
							letterSpacing: "0.01em",
							color: MQ.white,
							whiteSpace: "nowrap",
							textShadow: "0 10px 44px rgba(0,0,0,0.6)",
						}}
					>
						EU MONTEI UMA.
					</div>
					<div
						style={{
							marginTop: compact ? 8 : 22,
							width: interpolate(under, [0, 1], [0, size * 7]),
							height: compact ? 3 : 6,
							borderRadius: 3,
							background: MQ.accent,
							boxShadow: "0 0 24px rgba(61,255,138,0.55)",
						}}
					/>
				</div>
			)}
		</AbsoluteFill>
	);
};
