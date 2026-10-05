import React from "react";
import {AbsoluteFill} from "remotion";
import {cor, num, str} from "../_comum/params";
import type {ComponenteProps} from "../types";

const POSICOES: Record<string, string> = {
	topo: "18%",
	centro: "50%",
	baixo: "82%",
};

/**
 * Impact text: one short key phrase (date, name, number), big, centred on the
 * chosen third of the frame. Used in videos when the voice says the word and
 * as a hero line in posts.
 */
export const TextoTitulo: React.FC<ComponenteProps> = ({params, tema, dims}) => {
	const texto = str(params.texto, "TEXTO");
	const pos = str(params.posicao, "centro");
	const top = num(params.top, (dims[1] * (POSICOES[pos] ? parseInt(POSICOES[pos], 10) / 100 : 0.5)));
	const tamanho = num(params.tamanho, dims[0] * 0.13);

	return (
		<AbsoluteFill style={{pointerEvents: "none"}}>
			<div
				style={{
					position: "absolute",
					top,
					left: 0,
					width: dims[0],
					transform: "translateY(-50%)",
					textAlign: "center",
					fontFamily: tema.fontes.display,
					fontWeight: 900,
					fontSize: tamanho,
					lineHeight: 1.05,
					color: cor(params.cor, tema.cores.texto),
					textTransform: "uppercase",
					textShadow: `0 10px 36px ${tema.cores.sombra}, 0 2px 8px ${tema.cores.sombra}`,
				}}
			>
				{texto}
			</div>
		</AbsoluteFill>
	);
};
