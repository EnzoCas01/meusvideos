import React from "react";
import {useCurrentFrame} from "remotion";
import {BeatAM, SceneAM} from "../../components/alvomanage/SceneAM";
import {WindowAM} from "../../components/alvomanage/FramesAM";
import {HighlightAM, ScreenCropAM} from "../../components/alvomanage/ScreenCropAM";
import {TextAM} from "../../components/alvomanage/TextAM";
import {clampRect, fitRect, kfRect, land, ramp} from "../../components/alvomanage/motion-am";
import {AM, FONT_AM} from "../../utils/theme-am";
import {DASHBOARD, DASHBOARD_RECTS as R, STALE_ALERT} from "../../utils/images-am";
import {SCENE_DURATIONS_AM, cueAM} from "../../utils/timing-am";

const I = 8;
const VW = 960;
const VH = 620;
const AS = VW / VH;

/**
 * am09 — "No painel você vê o que tá em andamento, e ele te avisa quando tem
 * OS parada há mais de cinco dias."
 * A: real OS dashboard; camera lands on "8 Em Andamento" on "andamento".
 *    "Caixa fechado" pill and alert are masked in images-am.ts.
 * B: the list of open OS; the stale-OS warning. Until the real alert is
 *    captured (STALE_ALERT), it is a motion caption in the film's own style,
 *    NOT a fake piece of the system's UI.
 */
export const Scene09Dashboard: React.FC = () => {
	const frame = useCurrentFrame();
	const D = SCENE_DURATIONS_AM[I];
	const c = cueAM(I, "am09");
	const tPainel = c.word("painel");
	const tAnd = c.word("andamento");
	const tAvisa = c.word("e ele");
	const tParada = c.word("parada");
	const tCinco = c.word("cinco dias");

	const wide = clampRect(fitRect({x: 100, y: 110, w: 800, h: 460}, AS, 1.0), DASHBOARD.width, DASHBOARD.height);
	const close = fitRect(R.emAndamento, AS, 1.5);
	const camA = kfRect(frame, [tPainel, tAnd - 6, tAnd + 4], [wide, wide, close]);
	const list = clampRect(fitRect(R.list, AS, 1.0), DASHBOARD.width, DASHBOARD.height);
	const listClose = fitRect(R.firstOs, AS, 1.2);
	const camB = kfRect(frame, [tAvisa, tParada], [list, listClose]);
	const alertCam = STALE_ALERT
		? kfRect(
				frame,
				[tAvisa, tParada - 4, tParada + 6],
				[
					clampRect(fitRect({x: 100, y: 90, w: 1210, h: 200}, AS, 1.0), STALE_ALERT.width, STALE_ALERT.height),
					clampRect(fitRect({x: 100, y: 90, w: 1210, h: 200}, AS, 1.0), STALE_ALERT.width, STALE_ALERT.height),
					fitRect(STALE_ALERT.focus, AS, 1.25),
				],
			)
		: camB;

	return (
		<SceneAM duration={D} entry="push">
			<BeatAM from={0} to={tAvisa - 2} zoomFrom={1.05} zoomTo={1}>
				<WindowAM x={540} y={920} width={VW} height={VH}>
					<ScreenCropAM screen={DASHBOARD} width={VW} height={VH} camera={camA}>
						<HighlightAM rect={R.emAndamento} at={tAnd} stroke={2} pad={3} />
					</ScreenCropAM>
				</WindowAM>
				<TextAM at={2} y={300} size={80} mode="rise">
					no <span style={{color: AM.yellow}}>painel</span>
				</TextAM>
				<TextAM at={tAnd} y={1330} size={84} mode="pop">
					<span style={{color: AM.yellow}}>8</span> em andamento
				</TextAM>
			</BeatAM>

			<BeatAM from={tAvisa - 2} to={D} zoomFrom={1.04} zoomTo={1} blurIn={6}>
				<WindowAM x={540} y={760} width={VW} height={VH}>
					{STALE_ALERT ? (
						<ScreenCropAM
							screen={STALE_ALERT}
							width={VW}
							height={VH}
							camera={alertCam}
						>
							<HighlightAM rect={STALE_ALERT.focus} at={tParada} stroke={2} />
						</ScreenCropAM>
					) : (
						<ScreenCropAM screen={DASHBOARD} width={VW} height={VH} camera={camB} />
					)}
				</WindowAM>
				{STALE_ALERT ? (
					<TextAM at={tParada} y={1210} size={78} mode="pop">
						OS parada há
						<br />
						<span style={{color: AM.yellow}}>+5 dias</span>
					</TextAM>
				) : (
					<StaleCard frame={frame} at={tParada - 4} dotsAt={tCinco} />
				)}
				<TextAM at={tAvisa} y={220} size={80} mode="rise">
					ele te <span style={{color: AM.yellow}}>avisa</span>
				</TextAM>
			</BeatAM>
		</SceneAM>
	);
};

/** Caption card: bell + "OS parada há +5 dias" + five day-dots filling. */
const StaleCard: React.FC<{frame: number; at: number; dotsAt: number}> = ({frame, at, dotsAt}) => {
	if (frame < at) return null;
	const s = land(frame, at, 11);
	const ring = (Math.sin((frame - at) / 2.5) * Math.max(0, 1 - (frame - at) / 30)) * 14;
	return (
		<div
			style={{
				position: "absolute",
				left: 90,
				top: 1180,
				width: 900,
				padding: "40px 44px",
				boxSizing: "border-box",
				borderRadius: 36,
				background: AM.panelHi,
				border: `3px solid ${AM.yellow}`,
				boxShadow: `0 30px 80px rgba(0,0,0,0.6), 0 0 80px ${AM.yellowSoft}`,
				fontFamily: FONT_AM,
				color: AM.white,
				transform: `translateY(${(1 - s) * 120}px) scale(${0.9 + 0.1 * s})`,
				opacity: Math.min(1, s * 1.4),
			}}
		>
			<div style={{display: "flex", alignItems: "center", gap: 30}}>
				<svg width={90} height={90} viewBox="0 0 24 24" style={{transform: `rotate(${ring}deg)`, flexShrink: 0}}>
					<path
						d="M6 16 V11 a6 6 0 0 1 12 0 V16 L19.5 18 H4.5 Z M10 20 a2 2 0 0 0 4 0"
						fill={AM.yellow}
					/>
				</svg>
				<div style={{fontSize: 58, fontWeight: 800, lineHeight: 1.1}}>
					OS parada há
					<br />
					mais de 5 dias
				</div>
			</div>
			<div style={{display: "flex", gap: 22, marginTop: 34, marginLeft: 120}}>
				{[0, 1, 2, 3, 4].map((k) => {
					const on = ramp(frame, dotsAt - 10 + k * 3, 5);
					return (
						<div
							key={k}
							style={{
								width: 60,
								height: 60,
								borderRadius: 30,
								border: `4px solid ${AM.yellow}`,
								background: on > 0.5 ? AM.yellow : "transparent",
								transform: `scale(${0.8 + 0.2 * on})`,
							}}
						/>
					);
				})}
			</div>
		</div>
	);
};
