import React from "react";
import {AbsoluteFill} from "remotion";
import {cor, num, str} from "../_comum/params";
import type {ComponenteProps} from "../types";

const POSICOES: Record<string, string> = {
	topo: "22%",
	centro: "50%",
	baixo: "80%",
};

/**
 * Call-to-action pill: rounded button with arrow, on the theme's accent colour.
 */
export const TextoCta: React.FC<ComponenteProps> = ({params, tema, dims}) => {
	const texto = str(params.texto, "Saiba mais");
	const pos = str(params.posicao, "baixo");
	const top = num(params.top, dims[1] * (parseInt(POSICOES[pos] ?? POSICOES.baixo, 10) / 100));
	const tamanho = num(params.tamanho, dims[0] * 0.04);

	return (
		<AbsoluteFill style={{pointerEvents: "none"}}>
			<div
				style={{
					position: "absolute",
					top,
					left: 0,
					width: dims[0],
					display: "flex",
					justifyContent: "center",
				}}
			>
				<div
					style={{
						display: "flex",
						alignItems: "center",
						gap: dims[0] * 0.025,
						padding: `${tamanho * 0.85}px ${tamanho * 2.2}px`,
						borderRadius: 999,
						background: cor(params.cor_fundo, tema.cores.botao),
						color: cor(params.cor_texto, tema.cores.botaoTexto),
						fontFamily: tema.fontes.sans,
						fontWeight: 800,
						fontSize: tamanho,
						textTransform: "uppercase",
						boxShadow: `0 14px 40px ${tema.cores.sombra}`,
					}}
				>
					{texto}
					<span style={{fontSize: tamanho * 1.15}}>→</span>
				</div>
			</div>
		</AbsoluteFill>
	);
};
