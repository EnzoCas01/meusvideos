import React from "react";
import {CaptionsStyled, type CaptionLine} from "../../../src/components/captions/CaptionsStyled";
import {cor, str} from "../_comum/params";
import type {ComponenteProps} from "../types";

const POS: Record<string, "meio" | "baixo" | "alto"> = {meio: "meio", baixo: "baixo", alto: "alto"};

/** Fast caption: 1-2 words at a time, big, centred — the "rapido" style. */
export const CaptionRapido: React.FC<ComponenteProps> = ({params, tema}) => {
	const lines = (params.lines as CaptionLine[]) ?? [];
	const posicao = POS[str(params.posicao, "meio")] ?? "meio";
	return (
		<CaptionsStyled
			style="rapido"
			lines={lines}
			posicao={posicao}
			accent={cor(params.accent, tema.cores.accent)}
			onAccent={cor(params.on_accent, tema.cores.accentTexto)}
			text={cor(params.text, tema.cores.texto)}
			fontFamily={tema.fontes.sans}
		/>
	);
};
