import React from "react";
import {AbsoluteFill, Img, staticFile} from "remotion";
import {arq, cor, num, str} from "../_comum/params";
import type {ComponenteProps} from "../types";

const PADRAO = "images/mq-dinheiro/03.jpg";

/**
 * Full 1:1 / 4:5 post layout: title + subtitle in the upper band (sizes fitted
 * to the available space, never cut), image covering the lower part behind a
 * legibility gradient, CTA pill on the image's bottom-left corner.
 */
export const PostLayout1: React.FC<ComponenteProps> = ({params, tema, dims}) => {
	const titulo = str(params.titulo, "Título do post");
	const subtitulo = str(params.subtitulo, "");
	const cta = str(params.cta, "");
	const arquivo = arq(params.arquivo, PADRAO);
	const alturaImagem = num(params.altura_imagem, dims[1] * 0.54);
	const pad = dims[0] * 0.065;
	const area = dims[1] - alturaImagem;
	const util = area - pad * 2;

	// Fit by estimated line count so nothing ever overflows the band.
	const linhasTitulo = Math.max(1, Math.ceil(titulo.length / 16));
	const tamanhoTitulo = Math.min(num(params.tamanho_titulo, dims[0] * 0.1), (util * 0.5) / linhasTitulo);
	const linhasSub = Math.max(1, Math.ceil(subtitulo.length / 26));
	const tamanhoSub = Math.min(num(params.tamanho_subtitulo, dims[0] * 0.034), (util * 0.15) / linhasSub);
	const tamanhoCta = num(params.tamanho_cta, dims[0] * 0.034);

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
						lineHeight: 1.08,
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
							maxWidth: dims[0] * 0.86,
						}}
					>
						{subtitulo}
					</div>
				) : null}
			</div>
			<div style={{position: "absolute", left: 0, bottom: 0, width: dims[0], height: alturaImagem}}>
				<Img src={staticFile(arquivo)} style={{width: "100%", height: "100%", objectFit: "cover"}} />
				<div
					style={{
						position: "absolute",
						inset: 0,
						background: `linear-gradient(180deg, ${tema.fundo} 0%, rgba(0,0,0,0) 36%)`,
					}}
				/>
				{cta ? (
					<div
						style={{
							position: "absolute",
							left: pad,
							bottom: pad,
							display: "flex",
							alignItems: "center",
							gap: dims[0] * 0.02,
							padding: `${tamanhoCta * 0.85}px ${tamanhoCta * 2}px`,
							borderRadius: 999,
							background: cor(params.cor_botao, tema.cores.botao),
							color: cor(params.cor_botao_texto, tema.cores.botaoTexto),
							fontWeight: 700,
							fontSize: tamanhoCta,
							boxShadow: `0 10px 30px ${tema.cores.sombra}`,
						}}
					>
						{cta}
						<span style={{fontSize: tamanhoCta * 1.1}}>→</span>
					</div>
				) : null}
			</div>
		</AbsoluteFill>
	);
};
