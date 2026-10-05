import React from "react";
import {AbsoluteFill, Img, staticFile} from "remotion";
import {arq, num, str} from "../_comum/params";
import type {ComponenteProps} from "../types";

/**
 * Brand logo overlay. The engine renders it once per piece when the spec says
 * `logo: true`. Position: canto (top-right), topo (top-centre) or rodape
 * (bottom-centre). White glow behind keeps it readable on any background.
 */
export const LogoMarca: React.FC<ComponenteProps> = ({params, dims}) => {
	const arquivo = arq(params.arquivo, "brand/logo.png");
	const posicao = str(params.posicao, "canto");
	const largura = num(params.largura, dims[0] * 0.2);
	const m = dims[0] * 0.055;

	const pos: React.CSSProperties =
		posicao === "topo"
			? {top: m, left: "50%", transform: "translateX(-50%)"}
			: posicao === "rodape"
				? {bottom: m, left: "50%", transform: "translateX(-50%)"}
				: {top: m, right: m};

	return (
		<AbsoluteFill style={{pointerEvents: "none"}}>
			<Img
				src={staticFile(arquivo)}
				style={{
					position: "absolute",
					width: largura,
					filter: "drop-shadow(0 4px 18px rgba(0,0,0,0.45))",
					...pos,
				}}
			/>
		</AbsoluteFill>
	);
};
