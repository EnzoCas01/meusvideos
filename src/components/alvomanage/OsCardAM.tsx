import React from "react";
import {useCurrentFrame} from "remotion";
import {AM, FONT_AM} from "../../utils/theme-am";
import {land, ramp} from "./motion-am";

/**
 * The OS card, DRAWN (scenes 3 and 6). It is the symbol of "cada conserto
 * vira uma ordem de serviço" — not a copy of the system's screen. Status can
 * flip "Em aberto" -> "Pronta" (green, stamped) and a generic green
 * "Plano WhatsApp" pill can land on its corner (simple speech bubble drawn in
 * code — never the WhatsApp logo).
 *
 * (x, y) = centre. Width 760 fixed so text sizes stay legible on a phone.
 */
export const OsCardAM: React.FC<{
	x: number;
	y: number;
	scale?: number;
	opacity?: number;
	/** Local frame where the status flips to "Pronta". */
	readyAt?: number;
	/** Local frame where the plan pill lands. */
	pillAt?: number;
	rotate?: number;
}> = ({x, y, scale = 1, opacity = 1, readyAt, pillAt, rotate = 0}) => {
	const frame = useCurrentFrame();
	const W = 760;
	const H = 470;
	const flip = readyAt === undefined ? 0 : ramp(frame, readyAt, 8);
	const ready = readyAt !== undefined && frame >= readyAt + 4;
	// Badge squashes to 0 at the midpoint of the flip, then reopens as "Pronta".
	const squash = Math.abs(1 - flip * 2);
	const stamp = readyAt === undefined ? 0 : land(frame, readyAt + 4, 9);
	const pill = pillAt === undefined ? 0 : land(frame, pillAt, 11);

	return (
		<div
			style={{
				position: "absolute",
				left: x - W / 2,
				top: y - H / 2,
				width: W,
				height: H,
				borderRadius: 34,
				background: "linear-gradient(170deg, #1E2027, #15171C)",
				boxShadow: `0 0 0 2px ${AM.line}, 0 40px 100px rgba(0,0,0,0.6)`,
				borderTop: `10px solid ${AM.yellow}`,
				transform: `rotate(${rotate}deg) scale(${scale})`,
				opacity,
				fontFamily: FONT_AM,
				color: AM.white,
			}}
		>
			<div style={{position: "absolute", left: 48, top: 44, fontSize: 64, fontWeight: 800, letterSpacing: -1}}>
				OS #13
			</div>
			{/* Status badge */}
			<div
				style={{
					position: "absolute",
					left: 290,
					top: 54,
					padding: "8px 24px",
					borderRadius: 999,
					fontSize: 34,
					fontWeight: 700,
					color: ready ? "#0B2915" : AM.yellow,
					background: ready ? AM.green : AM.yellowSoft,
					transform: `scaleY(${squash}) scale(${ready ? 0.7 + 0.3 * stamp : 1})`,
					whiteSpace: "nowrap",
				}}
			>
				{ready ? "✓ Pronta" : "Em aberto"}
			</div>
			{/* Body lines: device, defect, value — abstract bars + short words */}
			{[
				["Aparelho", "iPhone 11"],
				["Defeito", "Tela trincada"],
				["Valor", "R$ 260,00"],
			].map(([k, v], i) => (
				<div
					key={k}
					style={{
						position: "absolute",
						left: 48,
						right: 48,
						top: 170 + i * 88,
						display: "flex",
						justifyContent: "space-between",
						fontSize: 36,
						borderBottom: `2px solid ${AM.faint}`,
						paddingBottom: 18,
					}}
				>
					<span style={{color: AM.grey, fontWeight: 500}}>{k}</span>
					<span style={{fontWeight: 700}}>{v}</span>
				</div>
			))}
			{/* Green ring burst on the stamp */}
			{ready && stamp < 1 && (
				<div
					style={{
						position: "absolute",
						left: 290 + 110 - 140 * stamp,
						top: 80 - 140 * stamp,
						width: 280 * stamp,
						height: 280 * stamp,
						borderRadius: "50%",
						border: `4px solid ${AM.green}`,
						opacity: 1 - stamp,
					}}
				/>
			)}
			{pillAt !== undefined && frame >= pillAt && (
				<div
					style={{
						position: "absolute",
						right: -30,
						top: -46,
						display: "flex",
						alignItems: "center",
						gap: 14,
						padding: "14px 28px",
						borderRadius: 999,
						background: AM.green,
						color: "#06210F",
						fontSize: 34,
						fontWeight: 800,
						transform: `scale(${pill}) rotate(${(1 - pill) * -12}deg)`,
						boxShadow: `0 10px 40px ${AM.greenSoft}`,
						whiteSpace: "nowrap",
					}}
				>
					<BubbleIconAM size={40} color="#06210F" />
					Plano WhatsApp
				</div>
			)}
		</div>
	);
};

/** Plain chat bubble with three dots — deliberately NOT the WhatsApp mark. */
export const BubbleIconAM: React.FC<{size: number; color: string}> = ({size, color}) => (
	<svg width={size} height={size} viewBox="0 0 40 40">
		<path d="M6 8 h28 a4 4 0 0 1 4 4 v14 a4 4 0 0 1 -4 4 h-16 l-8 7 v-7 h-4 a4 4 0 0 1 -4 -4 v-14 a4 4 0 0 1 4 -4 z" fill={color} />
		{[13, 20, 27].map((cx) => (
			<circle key={cx} cx={cx} cy={19} r={2.4} fill={AM.green} />
		))}
	</svg>
);
