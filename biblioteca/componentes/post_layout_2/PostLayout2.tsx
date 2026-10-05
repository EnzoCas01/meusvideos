import React from "react";
import {AbsoluteFill} from "remotion";
import {cor, num, str} from "../_comum/params";
import type {ComponenteProps} from "../types";

const destaca = (texto: string, trecho: string, corDestaque: string) => {
	if (!trecho) return texto;
	const i = texto.toLowerCase().indexOf(trecho.toLowerCase());
	if (i < 0) return texto;
	return (
		<>
			{texto.slice(0, i)}
			<span style={{color: corDestaque}}>{texto.slice(i, i + trecho.length)}</span>
			{texto.slice(i + trecho.length)}
		</>
	);
};

/**
 * Quote / motivational post: one big centred phrase in the display font, with
 * an optional highlighted fragment and attribution. No photo needed — colour
 * and typography carry the moment.
 */
export const PostLayout2: React.FC<ComponenteProps> = ({params, tema, dims}) => {
	const frase = str(params.frase, "Frase de impacto");
	const destaque = str(params.destaque, "");
	const autor = str(params.autor, "");
	const tamanho = num(params.tamanho, dims[0] * 0.096);

	return (
		<AbsoluteFill
			style={{
				backgroundColor: cor(params.fundo, tema.fundo),
				fontFamily: tema.fontes.display,
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				padding: dims[0] * 0.12,
				boxSizing: "border-box",
			}}
		>
			<div
				style={{
					fontSize: tamanho,
					lineHeight: 1.16,
					color: tema.cores.texto,
					textAlign: "center",
					fontWeight: 700,
					textShadow: `0 10px 40px ${tema.cores.sombra}`,
				}}
			>
				{destaca(frase, destaque, cor(params.cor_destaque, tema.cores.accent))}
			</div>
			{autor ? (
				<div
					style={{
						position: "absolute",
						bottom: dims[1] * 0.09,
						left: 0,
						width: dims[0],
						textAlign: "center",
						fontFamily: tema.fontes.sans,
						fontWeight: 600,
						fontSize: dims[0] * 0.035,
						color: tema.cores.subtitulo,
					}}
				>
					— {autor}
				</div>
			) : null}
		</AbsoluteFill>
	);
};
