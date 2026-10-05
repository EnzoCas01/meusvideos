import React from "react";
import {CaptionsStyled, type CaptionLine} from "../../../src/components/captions/CaptionsStyled";
import {cor, num} from "../_comum/params";
import type {ComponenteProps} from "../types";

/** Karaoke caption: the spoken word gets the accent box as the voice says it. */
export const CaptionKaraoke: React.FC<ComponenteProps> = ({params, tema, dims}) => {
	const lines = (params.lines as CaptionLine[]) ?? [];
	return (
		<CaptionsStyled
			style="karaoke"
			lines={lines}
			accent={cor(params.accent, tema.cores.accent)}
			onAccent={cor(params.on_accent, tema.cores.accentTexto)}
			text={cor(params.text, tema.cores.texto)}
			fontFamily={tema.fontes.sans}
			top={num(params.top, dims[1] - 500)}
		/>
	);
};
