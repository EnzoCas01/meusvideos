import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {BeatAM, SceneAM} from "../../components/alvomanage/SceneAM";
import {PhoneAM} from "../../components/alvomanage/FramesAM";
import {ScreenCropAM} from "../../components/alvomanage/ScreenCropAM";
import {TextAM} from "../../components/alvomanage/TextAM";
import {kf, land, ramp} from "../../components/alvomanage/motion-am";
import {AM, FONT_AM} from "../../utils/theme-am";
import {CLIENT_PHONE} from "../../utils/images-am";
import {SCENE_DURATIONS_AM, cueAM} from "../../utils/timing-am";

const I = 3;
const SW = 560;
const SH = 1140;

/**
 * am04 — "Você manda esse link pro cliente, e ele acompanha o conserto pelo
 * celular, a hora que quiser. Sem baixar aplicativo, sem senha."
 * The real-time test came back NEGATIVE (2026-10-05): the customer page only
 * shows the current status when it is opened/reloaded. So nothing on screen
 * may say or suggest "tempo real"/"ao vivo" — no stepper advancing by itself.
 * A: the link flies into a drawn phone, which lights up with the real page.
 * B: closer on the status; the phone is re-opened (screen off -> on) on
 *    "a hora que quiser", showing the same current status.
 * C: two seals struck through: "aplicativo" and "senha".
 */
export const Scene04Phone: React.FC = () => {
	const frame = useCurrentFrame();
	const D = SCENE_DURATIONS_AM[I];
	const c = cueAM(I, "am04");
	const tManda = c.word("manda");
	const tCliente = c.word("cliente");
	const tCel = c.word("celular");
	const tLive = c.word("a hora", 0.6);
	const tSem = c.word("Sem baixar");
	const tApp = c.word("aplicativo");
	const tSenha = c.word("sem senha");

	const lit = ramp(frame, tCliente, 8);
	const fly = ramp(frame, tManda, Math.max(8, tCliente - tManda));
	// Re-open: screen goes dark and comes back on "a hora que quiser".
	const reopen = 1 - kf(frame, [tLive - 2, tLive + 3, tLive + 9], [0, 1, 0]);

	const zoom = kf(frame, [tCel - 6, tCel + 8], [1, 1.3]);
	const shift = kf(frame, [tCel - 6, tCel + 8], [0, 330]);
	const camera = {x: 0, y: 0, w: 780, h: (780 * SH) / SW};

	return (
		<SceneAM duration={D} entry="zoomOut">
			<BeatAM from={0} to={tSem - 2} zoomFrom={1} zoomTo={1}>
				<AbsoluteFill style={{transform: `translateY(${shift}px) scale(${zoom})`, transformOrigin: "50% 40%"}}>
					<PhoneAM x={540} y={1110} screenW={SW} screenH={SH} glow={0.4 + lit}>
						<AbsoluteFill style={{opacity: lit * reopen}}>
							<ScreenCropAM screen={CLIENT_PHONE} width={SW} height={SH} camera={camera} background="#fff" />
						</AbsoluteFill>
					</PhoneAM>
				</AbsoluteFill>
				<LinkChip frame={frame} t={fly} visible={frame >= tManda - 4 && fly < 1} />
				<TextAM at={2} y={200} size={80} mode="rise" until={tCel - 4}>
					manda o <span style={{color: AM.yellow}}>link</span>
				</TextAM>
				<TextAM at={tCel} y={170} size={74} mode="rise" until={tLive - 2}>
					pelo celular
				</TextAM>
				<TextAM at={tLive} y={170} size={84} mode="pop">
					<span style={{color: AM.yellow}}>a hora que quiser</span>
				</TextAM>
			</BeatAM>

			<BeatAM from={tSem - 2} to={D} zoomFrom={1.08} zoomTo={1} blurIn={8}>
				<Seal x={540} y={760} at={tSem} strikeAt={tApp} label="aplicativo" icon="app" />
				<Seal x={540} y={1300} at={tApp + 4} strikeAt={tSenha + 2} label="senha" icon="lock" />
				<TextAM at={tSem} y={250} size={84} mode="rise">
					sem app, sem senha
				</TextAM>
			</BeatAM>
		</SceneAM>
	);
};

const LinkChip: React.FC<{frame: number; t: number; visible: boolean}> = ({frame, t, visible}) => {
	if (!visible) return null;
	// Arc from top-left down into the phone screen.
	const x = 180 + (540 - 180) * t;
	const y = 420 + (1000 - 420) * t - Math.sin(t * Math.PI) * 220;
	const s = 1 - 0.55 * t;
	return (
		<div
			style={{
				position: "absolute",
				left: x - 300,
				top: y - 50,
				width: 600,
				height: 100,
				borderRadius: 50,
				background: AM.yellow,
				color: "#1A1400",
				fontFamily: FONT_AM,
				fontWeight: 700,
				fontSize: 34,
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				gap: 16,
				transform: `scale(${s}) rotate(${(1 - t) * -8 + Math.sin(frame / 3) * 0.5}deg)`,
				boxShadow: `0 20px 60px ${AM.yellowSoft}`,
				filter: t > 0.05 ? `blur(${Math.sin(t * Math.PI) * 2}px)` : undefined,
				whiteSpace: "nowrap",
			}}
		>
			<svg width={40} height={40} viewBox="0 0 24 24" fill="none" stroke="#1A1400" strokeWidth={2.6} strokeLinecap="round">
				<path d="M10 14 a5 5 0 0 0 7 0 l3-3 a5 5 0 0 0 -7-7 l-1 1" />
				<path d="M14 10 a5 5 0 0 0 -7 0 l-3 3 a5 5 0 0 0 7 7 l1-1" />
			</svg>
			app.alvomanage.com/acompanhar/…
		</div>
	);
};

const Seal: React.FC<{x: number; y: number; at: number; strikeAt: number; label: string; icon: "app" | "lock"}> = ({
	x,
	y,
	at,
	strikeAt,
	label,
	icon,
}) => {
	const frame = useCurrentFrame();
	if (frame < at) return null;
	const s = land(frame, at, 12);
	const strike = ramp(frame, strikeAt, 7);
	const R = 190;
	const BOX = 520; // larger than the circle + the strike overhang
	return (
		<div style={{position: "absolute", left: x - BOX / 2, top: y - BOX / 2, width: BOX, height: BOX, transform: `scale(${s})`}}>
			<svg width={BOX} height={BOX}>
				<circle cx={BOX / 2} cy={BOX / 2 - 30} r={R} fill={AM.panel} stroke={AM.line} strokeWidth={4} />
				{icon === "app" ? (
					<g transform={`translate(${BOX / 2 - 70}, ${BOX / 2 - 130})`} fill="none" stroke={AM.white} strokeWidth={12} strokeLinecap="round" strokeLinejoin="round">
						<path d="M70 0 L70 100" />
						<path d="M30 62 L70 102 L110 62" />
						<path d="M0 120 L0 150 L140 150 L140 120" />
					</g>
				) : (
					<g transform={`translate(${BOX / 2 - 60}, ${BOX / 2 - 140})`} fill="none" stroke={AM.white} strokeWidth={12} strokeLinejoin="round">
						<path d="M22 70 L22 40 a38 38 0 0 1 76 0 L98 70" />
						<rect x={0} y={70} width={120} height={95} rx={16} />
					</g>
				)}
				<line
					x1={BOX / 2 - R * 0.8}
					y1={BOX / 2 - 30 + R * 0.8}
					x2={BOX / 2 - R * 0.8 + R * 1.6 * strike}
					y2={BOX / 2 - 30 + R * 0.8 - R * 1.6 * strike}
					stroke={AM.yellow}
					strokeWidth={18}
					strokeLinecap="round"
					style={{filter: `drop-shadow(0 0 10px ${AM.yellow})`}}
				/>
			</svg>
			<div
				style={{
					position: "absolute",
					left: 0,
					right: 0,
					top: BOX / 2 + R - 10,
					textAlign: "center",
					fontFamily: FONT_AM,
					fontWeight: 800,
					fontSize: 52,
					color: strike > 0.5 ? AM.dim : AM.white,
					textDecoration: strike > 0.9 ? "line-through" : "none",
				}}
			>
				{label}
			</div>
		</div>
	);
};
