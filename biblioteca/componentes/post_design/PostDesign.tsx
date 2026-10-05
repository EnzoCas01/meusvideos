import React from "react";
import {AbsoluteFill} from "remotion";
import {cor, str} from "../_comum/params";
import type {ComponenteProps} from "../types";
import {Icone} from "../icone/Icone";

const fontSizeFor = (text: string, width: number, recipe: string) => {
	const n = text.trim().length;
	const base = recipe === "oferta_impacto" ? 0.155 : recipe === "energia_geometrica" ? 0.125 : 0.112;
	if (n <= 16) return width * base;
	if (n <= 30) return width * Math.min(base, 0.12);
	if (n <= 48) return width * 0.096;
	return width * 0.072;
};

const Decoracao: React.FC<{tipo: string; posicao: string; intensidade: string; cor: string; dims: [number, number]}> = ({tipo, posicao, intensidade, cor: accent, dims}) => {
	if (tipo === "nenhuma") return null;
	const opacity = intensidade === "marcante" ? 0.3 : intensidade === "media" ? 0.2 : 0.12;
	const common: React.CSSProperties = {position: "absolute", inset: 0, width: dims[0], height: dims[1], pointerEvents: "none", opacity};
	if (tipo === "folhagem") return <svg style={common} viewBox={`0 0 ${dims[0]} ${dims[1]}`} fill="none" stroke={accent} strokeWidth="8">
		<path d={`M-40 ${dims[1] - 90} C160 ${dims[1] - 250},170 ${dims[1] - 510},350 ${dims[1] - 650}`} />
		{[[80, -180, -45], [145, -275, 45], [205, -380, -48], [270, -500, 42]].map(([x,y,r], i) => <ellipse key={i} cx={x} cy={dims[1] + y} rx="52" ry="112" transform={`rotate(${r} ${x} ${dims[1] + y})`} fill={accent} fillOpacity=".18" />)}
		{posicao === "cantos_opostos" ? <path d={`M${dims[0] + 30} 80 C${dims[0] - 100} 170,${dims[0] - 120} 300,${dims[0] - 270} 390`} /> : null}
	</svg>;
	if (tipo === "moldura") return <svg style={common}><rect x="42" y="42" width={dims[0] - 84} height={dims[1] - 84} rx="24" fill="none" stroke={accent} strokeWidth="3"/><path d="M42 150V42h108M930 42h108v108M42 1200v108h108M930 1308h108v-108" stroke={accent} strokeWidth="9"/></svg>;
	if (tipo === "grade") return <div style={{...common, backgroundImage: `linear-gradient(${accent} 1px, transparent 1px),linear-gradient(90deg,${accent} 1px,transparent 1px)`, backgroundSize: "72px 72px", maskImage: "linear-gradient(to bottom,transparent,#000 20%,#000 80%,transparent)"}} />;
	if (tipo === "brilho") return <div style={{...common, background: `radial-gradient(circle at 78% 15%,${accent} 0 2%,transparent 28%),radial-gradient(circle at 15% 85%,${accent} 0 1%,transparent 22%)`, filter: "blur(5px)"}} />;
	return <svg style={common} viewBox={`0 0 ${dims[0]} ${dims[1]}`} fill="none" stroke={accent} strokeWidth="6">
		<circle cx={dims[0] * .83} cy={posicao === "topo" ? 80 : dims[1] * .18} r={dims[0] * .2}/><circle cx={dims[0] * .08} cy={dims[1] * .88} r={dims[0] * .16}/>
		{tipo === "geometria" ? <path d={`M${dims[0] * .68} 0L${dims[0]} 0L${dims[0]} ${dims[1] * .35}Z M0 ${dims[1] * .74}L${dims[0] * .3} ${dims[1]}H0Z`} fill={accent} fillOpacity=".2"/> : null}
	</svg>;
};

export const PostDesign: React.FC<ComponenteProps> = ({params, tema, dims}) => {
	const frase = str(params.frase, "Frase do post");
	const subtitulo = str(params.subtitulo, "");
	const cta = str(params.cta, "");
	const icone = str(params.icone, "");
	const receita = str(params.receita, "editorial_organico");
	const alinhamento = str(params.alinhamento, "esquerda");
	const decoracao = str(params.decoracao, "moldura");
	const fundo = cor(params.fundo, tema.fundo);
	const left = alinhamento !== "centro";
	const escalaIcone = str(params.icone_escala, "discreto");
	const iconSize = dims[0] * ({micro: 0.055, discreto: 0.078, protagonista: 0.105}[escalaIcone] ?? 0.078);
	const titleSize = fontSizeFor(frase, dims[0], receita);
	const premium = receita === "premium_moldura";
	const energetic = receita === "energia_geometrica";
	const offer = receita === "oferta_impacto";
	const padX = dims[0] * 0.12;

	return <AbsoluteFill style={{backgroundColor: fundo, fontFamily: tema.fontes.sans, overflow: "hidden"}}>
		<Decoracao tipo={decoracao} posicao={str(params.decoracao_posicao, "cantos_opostos")} intensidade={str(params.decoracao_intensidade, "discreta")} cor={tema.cores.accent} dims={dims} />
		<div style={{position: "absolute", inset: 0, background: energetic ? `linear-gradient(145deg,transparent 45%,${tema.cores.accent}16)` : `radial-gradient(ellipse 90% 55% at 50% 10%,${tema.cores.accent}16,transparent 72%)`}} />
		<div style={{position: "relative", height: "100%", boxSizing: "border-box", padding: `${dims[1] * .095}px ${padX}px ${dims[1] * .095}px`, display: "flex", flexDirection: "column", alignItems: left ? "flex-start" : "center", textAlign: left ? "left" : "center"}}>
			<div style={{display: "flex", alignItems: "center", gap: 24, minHeight: iconSize * 1.35}}>
				{icone ? <div style={{width: iconSize * 1.48, height: iconSize * 1.48, borderRadius: premium ? 18 : "50%", border: `2px solid ${tema.cores.accent}66`, display: "grid", placeItems: "center", background: `${fundo}CC`}}><Icone params={{nome: icone, tamanho: iconSize}} tema={tema} dims={dims}/></div> : <div style={{width: offer ? 100 : 62, height: 8, borderRadius: 9, background: tema.cores.accent}} />}
				<div style={{fontSize: dims[0] * .027, fontWeight: 800, letterSpacing: 5, color: tema.cores.accent, textTransform: "uppercase"}}>{offer ? "OFERTA ESPECIAL" : premium ? "EDIÇÃO ESPECIAL" : "EM DESTAQUE"}</div>
			</div>
			<div style={{flex: offer ? .35 : .65}} />
			<div style={{fontFamily: tema.fontes.display, fontWeight: 900, fontSize: titleSize, lineHeight: .98, letterSpacing: titleSize > 115 ? -4 : -2, color: tema.cores.texto, textTransform: "uppercase", maxWidth: "100%", overflowWrap: "anywhere", textWrap: "balance", textShadow: `0 12px 44px ${tema.cores.sombra}`}}>{frase}</div>
			{subtitulo ? <div style={{marginTop: dims[1] * .038, maxWidth: "100%", overflowWrap: "anywhere", fontSize: Math.max(40, dims[0] * .043), lineHeight: 1.3, fontWeight: 500, color: tema.cores.subtitulo, textWrap: "balance"}}>{subtitulo}</div> : null}
			<div style={{flex: 1}} />
			{cta ? <div style={{display: "inline-flex", alignItems: "center", gap: 18, padding: "22px 34px", maxWidth: "100%", boxSizing: "border-box", overflowWrap: "anywhere", borderRadius: premium ? 10 : 999, background: tema.cores.botao, color: tema.cores.botaoTexto, fontWeight: 900, fontSize: Math.max(34, dims[0] * .034), letterSpacing: 1, textTransform: "uppercase", boxShadow: `0 16px 42px ${tema.cores.sombra}`}}>{cta}<span aria-hidden>→</span></div> : <div style={{width: left ? "38%" : "22%", height: 3, background: tema.cores.accent, opacity: .8}} />}
		</div>
	</AbsoluteFill>;
};
