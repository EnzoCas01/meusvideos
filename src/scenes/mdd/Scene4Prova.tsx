import React from "react";
import {
	AbsoluteFill,
	Easing,
	interpolate,
	useCurrentFrame,
} from "remotion";
import {Impact} from "../../components/mdd/Impact";
import {cueLocalMDD} from "../../utils/timeline-mdd";
import {DISPLAY_MDD, MDD, SANS_MDD} from "../../utils/theme-mdd";

const CODE_COLS = ["#7A8296", "#FFC531", "#5B6478", "#9AA3B5", "#FFC531", "#7A8296", "#5B6478", "#9AA3B5"];

/**
 * Prova literal: uma janela de estúdio (editor + timeline + render) desenhada
 * em CSS — sem marca de terceiros. "FEITO POR ESSA MÁQUINA" na palavra.
 */
export const Scene4Prova: React.FC = () => {
	const frame = useCurrentFrame();
	const at = cueLocalMDD(3, "06-prova", /^máquina\.$/);
	const winIn = interpolate(frame, [2, 12], [0.94, 1], {
		extrapolateRight: "clamp",
		easing: Easing.out(Easing.cubic),
	});
	// a barra de render corre e completa antes do texto pousar
	const fill = interpolate(frame, [8, 56], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.inOut(Easing.cubic),
	});
	const playhead = interpolate(frame, [0, 90], [0, 1], {extrapolateRight: "clamp"});

	return (
		<AbsoluteFill style={{backgroundColor: MDD.background}}>
			{/* janela do estúdio */}
			<div
				style={{
					position: "absolute",
					left: 90,
					top: 540,
					width: 900,
					height: 620,
					borderRadius: 22,
					background: MDD.panel,
					border: `1.5px solid ${MDD.panelBorder}`,
					boxShadow: "0 40px 100px rgba(0,0,0,0.6), 0 0 70px rgba(255,197,49,0.06)",
					overflow: "hidden",
					transform: `scale(${winIn})`,
				}}
			>
				{/* barra de título */}
				<div style={{height: 52, display: "flex", alignItems: "center", paddingLeft: 24, gap: 10, borderBottom: `1px solid ${MDD.panelBorder}`}}>
					{["#5B6478", "#5B6478", "#5B6478"].map((c, i) => (
						<div key={i} style={{width: 13, height: 13, borderRadius: 7, background: c, opacity: 0.7}} />
					))}
					<div style={{marginLeft: 18, fontFamily: SANS_MDD, fontWeight: 600, fontSize: 24, color: MDD.grey}}>
						studio — MaquinaDinheiro
					</div>
				</div>

				{/* render em progresso */}
				<div style={{position: "absolute", top: 66, left: 24, right: 24, height: 14, borderRadius: 7, background: "rgba(255,255,255,0.07)"}}>
					<div style={{width: 900 * fill, height: 14, borderRadius: 7, background: MDD.accent, boxShadow: "0 0 18px rgba(255,197,49,0.45)"}} />
					<div style={{position: "absolute", right: 4, top: -8, fontFamily: SANS_MDD, fontWeight: 800, fontSize: 26, color: MDD.accent}}>
						{Math.round(fill * 100)}%
					</div>
				</div>

				{/* editor: sidebar + linhas de código */}
				<div style={{position: "absolute", top: 104, left: 24, width: 168, height: 300, borderRadius: 12, background: "rgba(255,255,255,0.04)"}}>
					{Array.from({length: 7}, (_, i) => (
						<div key={i} style={{margin: "20px 18px 0", height: 12, borderRadius: 6, background: "rgba(255,255,255,0.12)", width: 132 - (i % 3) * 26}} />
					))}
				</div>
				<div style={{position: "absolute", top: 104, left: 212, right: 24, height: 300, borderRadius: 12, background: "rgba(255,255,255,0.03)"}}>
					{CODE_COLS.map((c, i) => (
						<div key={i} style={{margin: "24px 22px 0", height: 13, borderRadius: 6, background: c, opacity: 0.55, width: 620 - ((i * 97) % 300)}} />
					))}
				</div>

				{/* timeline com playhead */}
				<div style={{position: "absolute", left: 24, right: 24, bottom: 24, height: 150, borderRadius: 12, background: "rgba(255,255,255,0.04)"}}>
					{[
						{left: 20, w: 180, c: MDD.accentDim},
						{left: 212, w: 260, c: "rgba(255,255,255,0.14)"},
						{left: 484, w: 140, c: MDD.accentDim},
						{left: 636, w: 220, c: "rgba(255,255,255,0.14)"},
					].map((b, i) => (
						<div key={i} style={{position: "absolute", left: b.left, top: 18 + (i % 2) * 62, width: b.w, height: 52, borderRadius: 8, background: b.c}} />
					))}
					<div style={{position: "absolute", left: 16 + playhead * 848, top: 8, width: 3, height: 134, borderRadius: 2, background: MDD.accent, boxShadow: "0 0 14px rgba(255,197,49,0.7)"}} />
				</div>
			</div>

			{/* rótulo pequeno ancorando a prova */}
			<div
				style={{
					position: "absolute",
					top: 470,
					width: "100%",
					textAlign: "center",
					fontFamily: DISPLAY_MDD,
					fontSize: 44,
					letterSpacing: "0.1em",
					color: MDD.grey,
				}}
			>
				ESSE VÍDEO AQUI
			</div>

			<Impact at={at} lines={["FEITO POR", "ESSA MÁQUINA"]} size={128} color={MDD.white} y={280} />
		</AbsoluteFill>
	);
};
