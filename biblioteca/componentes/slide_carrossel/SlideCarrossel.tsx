import React from "react";
import {AbsoluteFill, Img, staticFile} from "remotion";
import {arq, num, str} from "../_comum/params";
import type {ComponenteProps} from "../types";

/**
 * One 4:5 carousel slide: fitted title, support line, image on the lower half
 * and a page counter (e.g. "2/5") — the same rhythm across slides so the set
 * reads as one piece.
 */
export const SlideCarrossel: React.FC<ComponenteProps> = ({params, tema, dims}) => {
	const titulo = str(params.titulo, "Título do slide");
	const subtitulo = str(params.subtitulo, "");
	const arquivo = arq(params.arquivo, "");
	const pagina = num(params.pagina, 1);
	const total = num(params.total, pagina);
	const alturaImagem = num(params.altura_imagem, dims[1] * 0.52);
	const pad = dims[0] * 0.07;
	const area = dims[1] - alturaImagem;
	const util = area - pad * 2;

	const linhasTitulo = Math.max(1, Math.ceil(titulo.length / 16));
	const tamanhoTitulo = Math.min(num(params.tamanho_titulo, dims[0] * 0.09), (util * 0.55) / linhasTitulo);
	const linhasSub = Math.max(1, Math.ceil(subtitulo.length / 26));
	const tamanhoSub = Math.min(num(params.tamanho_subtitulo, dims[0] * 0.034), (util * 0.18) / linhasSub);

	return (
		<AbsoluteFill style={{backgroundColor: tema.fundo, fontFamily: tema.fontes.sans}}>
			<div
				style={{
					position: "absolute",
					top: 0,
					left: 0,
					width: dims[0],
					height: area,
					padding: pad,
					boxSizing: "border-box",
					display: "flex",
					flexDirection: "column",
					justifyContent: "center",
				}}
			>
				<div
					style={{
						fontFamily: tema.fontes.display,
						fontWeight: 800,
						fontSize: tamanhoTitulo,
						lineHeight: 1.1,
						color: tema.cores.texto,
						textTransform: "uppercase",
					}}
				>
					{titulo}
				</div>
				{subtitulo ? (
					<div
						style={{
							marginTop: util * 0.05,
							fontSize: tamanhoSub,
							lineHeight: 1.32,
							color: tema.cores.subtitulo,
							maxWidth: dims[0] * 0.84,
						}}
					>
						{subtitulo}
					</div>
				) : null}
			</div>
			<div style={{position: "absolute", left: 0, bottom: 0, width: dims[0], height: alturaImagem}}>
				{arquivo ? (
					<>
						<Img src={staticFile(arquivo)} style={{width: "100%", height: "100%", objectFit: "cover"}} />
						<div
							style={{
								position: "absolute",
								inset: 0,
								background: `linear-gradient(180deg, ${tema.fundo} 0%, rgba(0,0,0,0) 34%)`,
							}}
						/>
					</>
				) : (
					<div style={{position: "absolute", inset: 0, background: tema.cores.accent, opacity: 0.14}} />
				)}
			</div>
			<div
				style={{
					position: "absolute",
					bottom: dims[1] * 0.035,
					right: dims[0] * 0.06,
					fontWeight: 700,
					fontSize: dims[0] * 0.035,
					color: tema.cores.accent,
				}}
			>
				{Math.round(pagina)}/{Math.round(total)}
			</div>
		</AbsoluteFill>
	);
};
