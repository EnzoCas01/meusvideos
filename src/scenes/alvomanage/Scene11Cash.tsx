import React from "react";
import {useCurrentFrame} from "remotion";
import {SceneAM} from "../../components/alvomanage/SceneAM";
import {TextAM} from "../../components/alvomanage/TextAM";
import {kf, land, ramp} from "../../components/alvomanage/motion-am";
import {AM, FONT_AM} from "../../utils/theme-am";
import {SCENE_DURATIONS_AM, cueAM} from "../../utils/timing-am";

const I = 10;

/**
 * am11 — "Financeiro também: caixa, contas a pagar e a receber, fluxo de caixa."
 * DRAWING (the real Fluxo de Caixa screen never appears).
 * The cash drawer slides open on "caixa"; one chip leaves it ("a pagar"), one
 * drops into it ("a receber"); on "fluxo" the chips line up and become a
 * rising line chart, drawn with strokeDashoffset.
 */
export const Scene11Cash: React.FC = () => {
	const frame = useCurrentFrame();
	const D = SCENE_DURATIONS_AM[I];
	const c = cueAM(I, "am11");
	const tCaixa = c.word("caixa");
	const tPagar = c.word("pagar");
	const tReceber = c.word("receber");
	const tFluxo = c.word("fluxo");

	const open = ramp(frame, tCaixa, 8);
	const out = ramp(frame, tPagar - 2, 12);
	const inn = ramp(frame, tReceber - 4, 12);
	const toChart = ramp(frame, tFluxo - 2, 10);
	const draw = ramp(frame, tFluxo, Math.max(12, D - tFluxo - 10));

	// drawer + chips fade down when the chart takes over
	const drawerA = 1 - toChart * 0.85;

	const CHART = "M140 1500 L320 1420 L480 1450 L640 1300 L800 1230 L950 1080";

	return (
		<SceneAM duration={D} entry="rise" glow={AM.yellowSoft}>
			<TextAM at={0} y={230} size={92} mode="rise">
				Financeiro
			</TextAM>

			{/* Drawer */}
			<svg width={1080} height={1920} style={{position: "absolute", left: 0, top: 0, opacity: drawerA}}>
				{/* register body */}
				<rect x={220} y={760} width={640} height={300} rx={30} fill="#23262E" stroke={AM.line} strokeWidth={3} />
				<rect x={300} y={800} width={480} height={90} rx={14} fill="#0E1014" />
				<text x={540} y={862} textAnchor="middle" fill={AM.yellow} fontFamily={FONT_AM} fontWeight={800} fontSize={54}>
					R$
				</text>
				{/* sliding drawer */}
				<g transform={`translate(0, ${open * 150})`}>
					<rect x={180} y={1000} width={720} height={170} rx={20} fill="#2D313B" stroke={AM.line} strokeWidth={3} />
					<rect x={480} y={1060} width={120} height={22} rx={11} fill={AM.yellow} />
					{/* compartments visible when open */}
					{[0, 1, 2, 3].map((k) => (
						<rect key={k} x={210 + k * 170} y={960} width={150} height={50} rx={8} fill="#15171C" opacity={open} />
					))}
				</g>
			</svg>

			{/* Chip leaving: a pagar */}
			<Chip
				x={kf(frame, [tPagar - 2, tPagar + 10], [400, 170])}
				y={kf(frame, [tPagar - 2, tPagar + 10], [1150, 560])}
				show={frame >= tPagar - 2}
				opacity={(1 - toChart) * Math.min(1, out * 3)}
				sign="−"
				label="a pagar"
				color={AM.white}
				labelSide="right"
			/>
			{/* Chip arriving: a receber */}
			<Chip
				x={kf(frame, [tReceber - 4, tReceber + 8], [910, 680])}
				y={kf(frame, [tReceber - 4, tReceber + 8], [560, 1150])}
				show={frame >= tReceber - 4}
				opacity={(1 - toChart) * Math.min(1, inn * 3)}
				sign="+"
				label="a receber"
				color={AM.yellow}
				labelSide="left"
			/>

			{/* Flow chart */}
			{frame >= tFluxo - 2 && (
				<svg width={1080} height={1920} style={{position: "absolute", left: 0, top: 0, opacity: toChart}}>
					{[1100, 1250, 1400, 1550].map((y) => (
						<line key={y} x1={120} x2={960} y1={y} y2={y} stroke={AM.faint} strokeWidth={2} />
					))}
					<path
						d={CHART}
						fill="none"
						stroke={AM.yellow}
						strokeWidth={14}
						strokeLinecap="round"
						strokeLinejoin="round"
						pathLength={1}
						strokeDasharray={1}
						strokeDashoffset={1 - draw}
						style={{filter: `drop-shadow(0 0 16px ${AM.yellow})`}}
					/>
					<circle cx={950} cy={1080} r={22 * land(frame, tFluxo + Math.round((D - tFluxo) * 0.6), 10)} fill={AM.yellow} />
				</svg>
			)}
			<TextAM at={tFluxo} y={1640} size={80} mode="pop">
				fluxo de <span style={{color: AM.yellow}}>caixa</span>
			</TextAM>
			<TextAM at={tCaixa} y={1640} size={80} mode="rise" until={tFluxo - 2}>
				caixa
			</TextAM>
		</SceneAM>
	);
};

const Chip: React.FC<{
	x: number;
	y: number;
	show: boolean;
	opacity: number;
	sign: string;
	label: string;
	color: string;
	labelSide: "left" | "right";
}> = ({x, y, show, opacity, sign, label, color, labelSide}) => {
	if (!show || opacity <= 0.01) return null;
	return (
		<div style={{position: "absolute", left: x - 70, top: y - 70, opacity}}>
			<div
				style={{
					width: 140,
					height: 140,
					borderRadius: 70,
					border: `8px solid ${color}`,
					background: AM.panelHi,
					color,
					fontFamily: FONT_AM,
					fontWeight: 800,
					fontSize: 90,
					lineHeight: "122px",
					textAlign: "center",
				}}
			>
				{sign}
			</div>
			<div
				style={{
					position: "absolute",
					top: 40,
					[labelSide === "right" ? "left" : "right"]: 160,
					whiteSpace: "nowrap",
					fontFamily: FONT_AM,
					fontWeight: 800,
					fontSize: 52,
					color,
				}}
			>
				{label}
			</div>
		</div>
	);
};
