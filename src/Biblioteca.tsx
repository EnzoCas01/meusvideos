import React from "react";
import {AbsoluteFill} from "remotion";
import {COMPONENTES} from "./engine/registro";
import {TEMAS, TEMA_PADRAO} from "../biblioteca/temas/registro";

export const FPS_BIB = 30;
export const TOTAL_FRAMES_BIB = 150;

/**
 * Studio preview for any library component:
 * npx remotion still src/index.ts Biblioteca x.png --props='{"componente":"texto_cta"}'
 */
export const Biblioteca: React.FC<{componente: string; params?: Record<string, unknown>; tema?: string}> = ({
	componente,
	params = {},
	tema = "escuro_clean",
}) => {
	const Comp = COMPONENTES[componente];
	const t = TEMAS[tema] ?? TEMA_PADRAO;

	return (
		<AbsoluteFill style={{backgroundColor: t.fundo}}>
			{Comp ? (
				<Comp params={params} tema={t} dims={[1080, 1920]} />
			) : (
				<div
					style={{
						color: "#FFFFFF",
						fontFamily: "Inter, system-ui, sans-serif",
						padding: 80,
						fontSize: 44,
						lineHeight: 1.5,
					}}
				>
					Componente não encontrado: {componente}
					<br />
					Existem: {Object.keys(COMPONENTES).join(", ")}
				</div>
			)}
		</AbsoluteFill>
	);
};
