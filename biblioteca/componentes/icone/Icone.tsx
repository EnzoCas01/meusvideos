import React from "react";
import {cor, num, str} from "../_comum/params";
import type {ComponenteProps} from "../types";
import {ICONES} from "./icones";

/**
 * Stroke icon from the built-in catalog (lucide, ISC). The director/Jev picks
 * the icon by name — the full list lives in icones.json. Renders nothing when
 * the name is unknown, so a typo never breaks the piece.
 */
export const Icone: React.FC<ComponenteProps> = ({params, tema, dims}) => {
	const nome = str(params.nome, "");
	const els = ICONES[nome];
	if (!els) return null;
	const tamanho = num(params.tamanho, dims[0] * 0.16);
	const grossura = num(params.grossura, 1.8);

	return (
		<svg
			width={tamanho}
			height={tamanho}
			viewBox="0 0 24 24"
			fill="none"
			stroke={cor(params.cor, tema.cores.accent)}
			strokeWidth={grossura}
			strokeLinecap="round"
			strokeLinejoin="round"
			style={{display: "block"}}
		>
			{els.map((el, i) => {
				if (el.t === "path") return <path key={i} d={el.a.d} />;
				if (el.t === "circle") return <circle key={i} cx={el.a.cx} cy={el.a.cy} r={el.a.r} />;
				if (el.t === "rect") return <rect key={i} x={el.a.x} y={el.a.y} width={el.a.width} height={el.a.height} rx={el.a.rx} />;
				if (el.t === "line") return <line key={i} x1={el.a.x1} y1={el.a.y1} x2={el.a.x2} y2={el.a.y2} />;
				if (el.t === "polyline") return <polyline key={i} points={el.a.points} />;
				if (el.t === "polygon") return <polygon key={i} points={el.a.points} />;
				return null;
			})}
		</svg>
	);
};
