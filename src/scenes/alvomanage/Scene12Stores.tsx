import React from "react";
import {useCurrentFrame} from "remotion";
import {SceneAM} from "../../components/alvomanage/SceneAM";
import {TextAM} from "../../components/alvomanage/TextAM";
import {land, ramp} from "../../components/alvomanage/motion-am";
import {AM, FONT_AM} from "../../utils/theme-am";
import {SCENE_DURATIONS_AM, cueAM} from "../../utils/timing-am";

const I = 11;

const STORES = [
	{x: 230, y: 700},
	{x: 850, y: 700},
	{x: 540, y: 1560},
];
const PANEL = {x: 540, y: 1110};

/**
 * am12 — "Tem mais de uma loja? Cuida de todas no mesmo lugar."
 * DRAWING. Three small storefronts pop in on "mais de uma loja"; on "mesmo
 * lugar" yellow lines draw from each to ONE panel in the centre, a pulse runs
 * along each line and the panel lights up.
 */
export const Scene12Stores: React.FC = () => {
	const frame = useCurrentFrame();
	const D = SCENE_DURATIONS_AM[I];
	const c = cueAM(I, "am12");
	const tMais = c.word("mais de uma");
	const tCuida = c.word("Cuida");
	const tLugar = c.word("mesmo lugar");

	const link = ramp(frame, tLugar - 6, 10);
	const lit = ramp(frame, tLugar + 4, 8);

	return (
		<SceneAM duration={D} entry="zoomOut">
			<svg width={1080} height={1920} style={{position: "absolute", left: 0, top: 0}}>
				{STORES.map((s, i) => {
					const len = Math.hypot(PANEL.x - s.x, PANEL.y - s.y);
					const pulse = ((frame - tLugar) / 18 + i * 0.3) % 1;
					return (
						<g key={i}>
							<line
								x1={s.x}
								y1={s.y}
								x2={PANEL.x}
								y2={PANEL.y}
								stroke={AM.yellow}
								strokeWidth={8}
								strokeLinecap="round"
								strokeDasharray={len}
								strokeDashoffset={len * (1 - link)}
								style={{filter: `drop-shadow(0 0 10px ${AM.yellow})`}}
							/>
							{frame > tLugar + 4 && (
								<circle
									cx={s.x + (PANEL.x - s.x) * pulse}
									cy={s.y + (PANEL.y - s.y) * pulse}
									r={14}
									fill="#FFF3C4"
								/>
							)}
						</g>
					);
				})}
			</svg>

			{STORES.map((s, i) => (
				<Store key={i} x={s.x} y={s.y} s={land(frame, tMais + i * 4, 11)} n={i + 1} />
			))}

			{/* the one panel */}
			<div
				style={{
					position: "absolute",
					left: PANEL.x - 190,
					top: PANEL.y - 130,
					width: 380,
					height: 260,
					borderRadius: 30,
					background: AM.panelHi,
					border: `4px solid ${lit > 0.5 ? AM.yellow : AM.line}`,
					boxShadow: `0 0 ${100 * lit}px ${AM.yellowSoft}`,
					transform: `scale(${land(frame, tMais + 6, 12) * (1 + 0.05 * lit)})`,
					display: "flex",
					alignItems: "flex-end",
					justifyContent: "center",
					gap: 22,
					padding: 40,
					boxSizing: "border-box",
				}}
			>
				{[0.45, 0.7, 0.55, 0.95].map((h, k) => (
					<div
						key={k}
						style={{
							width: 50,
							height: 150 * h * (0.3 + 0.7 * lit),
							borderRadius: 10,
							background: k === 3 ? AM.yellow : AM.blue,
						}}
					/>
				))}
			</div>

			<TextAM at={tMais - 4} y={210} size={80} mode="rise" until={tCuida - 2}>
				mais de uma loja?
			</TextAM>
			<TextAM at={tCuida} y={210} size={80} mode="rise">
				todas <span style={{color: AM.yellow}}>num lugar só</span>
			</TextAM>
		</SceneAM>
	);
};

/** Small storefront: awning stripes, door, window. Generic. */
const Store: React.FC<{x: number; y: number; s: number; n: number}> = ({x, y, s, n}) => (
	<svg
		width={300}
		height={300}
		viewBox="0 0 300 300"
		style={{position: "absolute", left: x - 150, top: y - 150, transform: `scale(${s})`, opacity: Math.min(1, s * 1.5)}}
	>
		<rect x={40} y={110} width={220} height={160} rx={10} fill="#20232A" stroke={AM.line} strokeWidth={4} />
		{[0, 1, 2, 3, 4].map((k) => (
			<path
				key={k}
				d={`M${30 + k * 48} 70 h48 v40 a24 24 0 0 1 -48 0 z`}
				fill={k % 2 === 0 ? AM.yellow : "#E9E4D8"}
			/>
		))}
		<rect x={30} y={56} width={240} height={16} rx={6} fill="#3A3D46" />
		<rect x={70} y={160} width={80} height={110} rx={6} fill="#0E1014" />
		<rect x={170} y={160} width={70} height={60} rx={6} fill={AM.blueSoft} stroke={AM.blue} strokeWidth={3} />
		<text x={205} y={202} textAnchor="middle" fill={AM.white} fontSize={34} fontWeight={800} fontFamily={FONT_AM}>
			{n}
		</text>
	</svg>
);
