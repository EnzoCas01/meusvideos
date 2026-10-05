import React from "react";
import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame} from "remotion";
import {cueLocalBK} from "../../utils/timeline-bk";
import {BK, DISPLAY_BK, SANS_BK} from "../../utils/theme-bk";

const SCENE = 9;
const META = 1_000_000_000;

/**
 * A receita: UM contador, em dígitos completos, acelerando do zero ao
 * 1.000.000.000 — aparece em "fatura" e pousa no fim da palavra falada. O
 * número grande da legenda não existe aqui: o contador É o número na tela.
 */
export const Scene10Contador: React.FC = () => {
	const frame = useCurrentFrame();
	const fatura = cueLocalBK(SCENE, "10-numero", /^fatura$/);
	const numFim = cueLocalBK(SCENE, "10-numero", /^1/);
	const dolares = cueLocalBK(SCENE, "10-numero", /^dólares$/);

	// rolagem acelerada: começa em "fatura", termina junto com o número falado
	const p = interpolate(frame, [fatura, numFim], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.in(Easing.quad),
	});
	const valor = Math.round(META * p);
	const escala = 1.1 + (frame / 143) * 0.09;
	const surge = interpolate(frame, [fatura, fatura + 8], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});

	return (
		<AbsoluteFill style={{backgroundColor: BK.background}}>
			<Img
				src={staticFile("images/bk/cena10/01.jpg")}
				style={{
					width: "100%",
					height: "100%",
					objectFit: "cover",
					transform: `scale(${escala}) translateY(${(frame / 143) * -18}px)`,
					filter: "saturate(1.15) contrast(1.06) brightness(0.92)",
				}}
			/>
			{/* base escura atrás do número, para pousar legível sobre as moedas */}
			<AbsoluteFill style={{background: "radial-gradient(circle at 50% 30%, rgba(7,7,8,0.72) 0%, rgba(7,7,8,0.3) 46%, rgba(7,7,8,0.05) 100%)"}} />

			<div style={{position: "absolute", top: 560, left: 0, width: "100%", textAlign: "center", opacity: surge, transform: `translateY(${(1 - surge) * 18}px)`}}>
				<div
					style={{
						fontFamily: DISPLAY_BK,
						fontSize: 178,
						lineHeight: 1,
						color: BK.gold,
						textShadow: "0 12px 60px rgba(0,0,0,0.9), 0 0 46px rgba(255,174,0,0.35)",
						whiteSpace: "nowrap",
					}}
				>
					{valor.toLocaleString("pt-BR")}
				</div>
				{frame >= dolares && (
					<div
						style={{
							marginTop: 30,
							fontFamily: SANS_BK,
							fontWeight: 700,
							fontSize: 38,
							letterSpacing: "0.22em",
							color: BK.white,
							textShadow: "0 4px 24px rgba(0,0,0,0.9)",
						}}
					>
						DÓLARES EM RECEITA ANUAL
					</div>
				)}
			</div>
		</AbsoluteFill>
	);
};
