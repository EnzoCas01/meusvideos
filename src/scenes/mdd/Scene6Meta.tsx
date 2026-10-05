import React from "react";
import {
	AbsoluteFill,
	OffthreadVideo,
	interpolate,
	staticFile,
	useCurrentFrame,
} from "remotion";
import {Impact} from "../../components/mdd/Impact";
import {cueLocalMDD} from "../../utils/timeline-mdd";
import {MDD, SANS_MDD} from "../../utils/theme-mdd";

/**
 * O pedido: a máquina/rede ao fundo (desfocada — é a base do texto, única
 * exceção da regra), "EU QUERO" e "100 MIL LIKES" na palavra exata.
 */
export const Scene6Meta: React.FC = () => {
	const frame = useCurrentFrame();
	const quero = cueLocalMDD(5, "08-quer", /^quero$/);
	const cem = cueLocalMDD(5, "08-quer", /^100$/);
	const likesEnd = cueLocalMDD(5, "08-quer", /^likes,$/) + 18;
	const pergunta = cueLocalMDD(5, "08-quer", /^montei$/);

	// a barra da meta completa quando "likes" termina
	const fill = interpolate(frame, [cem, likesEnd], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	return (
		<AbsoluteFill style={{backgroundColor: MDD.background}}>
			{/* fundo desfocado só como base do texto */}
			<OffthreadVideo
				src={staticFile("videos/mdd-rede/clip-03.mp4")}
				muted
				playbackRate={0.85}
				style={{
					width: "100%",
					height: "100%",
					objectFit: "cover",
					transform: "scale(1.18)",
					filter: "blur(22px) brightness(0.5)",
				}}
			/>
			<AbsoluteFill style={{backgroundColor: "rgba(7,7,9,0.45)"}} />

			{/* a pergunta da voz, como texto, até o EU QUERO pousar */}
			<div
				style={{
					position: "absolute",
					top: 620,
					width: "100%",
					textAlign: "center",
					fontFamily: SANS_MDD,
					fontWeight: 800,
					fontSize: 64,
					lineHeight: 1.15,
					color: MDD.white,
					opacity: interpolate(frame, [pergunta, pergunta + 8], [0, 1], {
						extrapolateLeft: "clamp",
						extrapolateRight: "clamp",
					}) * interpolate(frame, [quero - 8, quero], [1, 0], {
						extrapolateLeft: "clamp",
						extrapolateRight: "clamp",
					}),
				}}
			>
				COMO EU MONTEI
				<br />
				ESSA MÁQUINA?
			</div>

			<Impact at={quero} lines={["EU QUERO"]} size={280} y={880} stamp />
			<Impact at={cem} lines={["100 MIL LIKES"]} size={150} color={MDD.white} y={1075} />

			{/* a barra da meta */}
			{frame >= cem && (
				<div style={{position: "absolute", left: 160, top: 1160, width: 760, height: 22, borderRadius: 11, background: "rgba(255,255,255,0.1)"}}>
					<div
						style={{
							width: 760 * fill,
							height: 22,
							borderRadius: 11,
							background: MDD.accent,
							boxShadow: frame >= likesEnd ? "0 0 30px rgba(255,197,49,0.6)" : "0 0 16px rgba(255,197,49,0.35)",
						}}
					/>
				</div>
			)}
		</AbsoluteFill>
	);
};
