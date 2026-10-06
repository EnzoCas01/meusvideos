import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {SceneAM} from "../../components/alvomanage/SceneAM";
import {PhoneAM} from "../../components/alvomanage/FramesAM";
import {TextAM} from "../../components/alvomanage/TextAM";
import {kf, ramp, shake} from "../../components/alvomanage/motion-am";
import {AM, FONT_AM} from "../../utils/theme-am";
import {SCENE_DURATIONS_AM, cueAM} from "../../utils/timing-am";

const I = 6;

/**
 * am07 — "Resultado? O telefone toca bem menos." (0.6 s of air before it)
 * The only joke of the film. The shop owner's phone from scene 1 lies quiet on
 * the counter next to a steaming coffee. On "toca": one tiny buzz that dies
 * out (half a ring arc that never closes). The missed-calls badge counts DOWN.
 * Almost still on purpose — only a slow push and the steam move.
 */
export const Scene07Quiet: React.FC = () => {
	const frame = useCurrentFrame();
	const D = SCENE_DURATIONS_AM[I];
	const c = cueAM(I, "am07");
	const tTel = c.word("O telefone");
	const tToca = c.word("toca");
	const tMenos = c.word("bem menos");

	const buzz = frame >= tToca && frame < tToca + 6 ? shake(frame, 4, 3.4) : 0;
	const arc = ramp(frame, tToca, 10);
	const arcOut = ramp(frame, tToca + 10, 8);
	const badge = Math.round(kf(frame, [tTel, tMenos + 6], [9, 1]));

	return (
		<SceneAM duration={D} entry="blur" drift={0.05} glow={AM.yellowSoft}>
			{/* counter */}
			<div
				style={{
					position: "absolute",
					left: 0,
					right: 0,
					top: 1240,
					bottom: 0,
					background: "linear-gradient(180deg, #1B1D23, #0E0F13)",
					borderTop: `3px solid ${AM.line}`,
				}}
			/>
			{/* phone lying on the counter (slight perspective via scaleY) */}
			<AbsoluteFill>
				<div style={{position: "absolute", inset: 0, transform: "scaleY(0.62)", transformOrigin: "50% 1260px"}}>
					<PhoneAM x={380 + buzz} y={1200} screenW={300} screenH={620} rotate={-72} glow={0}>
						<AbsoluteFill style={{background: "#07080B"}} />
					</PhoneAM>
				</div>
				{/* missed-calls badge, counting down */}
				<div
					style={{
						position: "absolute",
						left: 560,
						top: 1060,
						width: 110,
						height: 110,
						borderRadius: 55,
						background: AM.yellow,
						color: "#1A1400",
						fontFamily: FONT_AM,
						fontWeight: 800,
						fontSize: 64,
						textAlign: "center",
						lineHeight: "110px",
						opacity: ramp(frame, tTel - 4, 8),
					}}
				>
					{badge}
				</div>
				{/* the ring that never completes */}
				<svg width={600} height={600} style={{position: "absolute", left: 120, top: 900}}>
					<path
						d="M 80 300 A 220 220 0 0 1 300 80"
						fill="none"
						stroke={AM.yellow}
						strokeWidth={6}
						strokeLinecap="round"
						pathLength={1}
						strokeDasharray={1}
						strokeDashoffset={1 - arc * 0.6}
						opacity={(1 - arcOut) * 0.8}
					/>
				</svg>
			</AbsoluteFill>
			<Coffee frame={frame} />
			<TextAM at={0} y={300} size={92} mode="rise" color={AM.grey} until={tTel - 2}>
				Resultado?
			</TextAM>
			<TextAM at={tTel} y={300} size={86} mode="rise">
				o telefone
				<br />
				toca <span style={{color: AM.yellow}}>bem menos</span>
			</TextAM>
		</SceneAM>
	);
};

const Coffee: React.FC<{frame: number}> = ({frame}) => (
	<svg width={360} height={560} style={{position: "absolute", left: 660, top: 820, overflow: "hidden"}}>
		{[0, 1, 2].map((k) => {
			const ph = frame / 9 + k * 2.1;
			const x = 130 + k * 40;
			const d = `M${x} 300 C ${x + Math.sin(ph) * 30} 240, ${x - Math.sin(ph + 1) * 30} 170, ${x + Math.sin(ph + 2) * 20} 90`;
			return (
				<path
					key={k}
					d={d}
					fill="none"
					stroke="#FFFFFF"
					strokeWidth={8}
					strokeLinecap="round"
					opacity={0.16 + 0.08 * Math.sin(ph)}
					style={{filter: "blur(3px)"}}
				/>
			);
		})}
		{/* cup */}
		<path d="M70 320 L250 320 L230 470 Q225 500 195 500 L125 500 Q95 500 90 470 Z" fill="#E9E4D8" />
		<path d="M250 350 Q320 350 315 400 Q310 450 238 445" fill="none" stroke="#E9E4D8" strokeWidth={18} />
		<ellipse cx={160} cy={322} rx={90} ry={14} fill="#3B2617" />
		<ellipse cx={160} cy={520} rx={150} ry={18} fill="rgba(0,0,0,0.35)" />
	</svg>
);
