import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {BeatAM, SceneAM} from "../../components/alvomanage/SceneAM";
import {PhoneAM} from "../../components/alvomanage/FramesAM";
import {TextAM} from "../../components/alvomanage/TextAM";
import {CursorAM} from "../../components/alvomanage/CursorAM";
import {kf, land, ramp} from "../../components/alvomanage/motion-am";
import {AM, FONT_AM} from "../../utils/theme-am";
import {seededRandom} from "../../utils/bezier";
import {SCENE_DURATIONS_AM, cueAM} from "../../utils/timing-am";

const I = 1;

export type PaperAM = {x: number; y: number; w: number; h: number; rot: number; kind: "postit" | "comanda"; seed: number};

/** The messy bench: post-its and work slips, deterministic. Shared with scene 3. */
export const PAPERS_AM: PaperAM[] = Array.from({length: 13}, (_, i) => {
	const r = (k: number) => seededRandom(i * 7.31 + k * 1.7 + 3);
	const postit = i % 3 === 0;
	return {
		x: 140 + r(1) * 800,
		y: 520 + r(2) * 900,
		w: postit ? 210 : 260 + r(3) * 60,
		h: postit ? 210 : 330 + r(4) * 80,
		rot: (r(5) - 0.5) * 50,
		kind: postit ? "postit" : "comanda",
		seed: i,
	};
});

export const PaperAMView: React.FC<{p: PaperAM; style?: React.CSSProperties}> = ({p, style}) => (
	<div
		style={{
			position: "absolute",
			left: p.x - p.w / 2,
			top: p.y - p.h / 2,
			width: p.w,
			height: p.h,
			borderRadius: p.kind === "postit" ? 6 : 10,
			background: p.kind === "postit" ? AM.postit : AM.paper,
			boxShadow: "0 14px 30px rgba(0,0,0,0.45)",
			padding: 24,
			boxSizing: "border-box",
			...style,
		}}
	>
		{Array.from({length: p.kind === "postit" ? 3 : 6}, (_, k) => (
			<div
				key={k}
				style={{
					height: 10,
					width: `${55 + seededRandom(p.seed * 3.1 + k) * 40}%`,
					marginBottom: 22,
					borderRadius: 5,
					background: p.kind === "postit" ? "rgba(80,60,0,0.35)" : "rgba(30,30,40,0.25)",
				}}
			/>
		))}
	</div>
);

/**
 * am02 — "Aí você para tudo, procura o papel, pergunta pro técnico... e o
 * cliente esperando na linha."
 * A: bench seen from above, the cursor rummages, papers fly on "procura".
 * B: "?" balloon over the technician's bench on "pergunta".
 * C: the phone with the call timer running on "esperando na linha".
 */
export const Scene02Mess: React.FC = () => {
	const frame = useCurrentFrame();
	const D = SCENE_DURATIONS_AM[I];
	const c = cueAM(I, "am02");
	const tSearch = c.word("procura");
	const tAsk = c.word("pergunta");
	const tWait = c.word("e o cliente");

	return (
		<SceneAM duration={D} entry="push" glow={AM.yellowSoft}>
			<BeatAM from={0} to={tAsk - 2} zoomFrom={1.06} zoomTo={1}>
				{PAPERS_AM.map((p, i) => {
					const t = ramp(frame, tSearch + (i % 5) * 2, 14);
					const dir = seededRandom(i * 2.3 + 9) - 0.5;
					return (
						<PaperAMView
							key={i}
							p={p}
							style={{
								transform: `translate(${dir * 900 * t}px, ${-t * (300 + seededRandom(i + 4) * 500)}px) rotate(${p.rot + t * dir * 260}deg)`,
							}}
						/>
					);
				})}
				<CursorAM
					frames={[0, tSearch - 10, tSearch - 4, tSearch + 4]}
					xs={[860, 520, 640, 420]}
					ys={[1500, 980, 1100, 900]}
					size={80}
				/>
				<TextAM at={2} y={180} size={86} mode="rise" until={tSearch - 1}>
					para tudo
				</TextAM>
				<TextAM at={tSearch} y={180} size={86} mode="pop">
					cadê o papel?
				</TextAM>
			</BeatAM>

			<BeatAM from={tAsk - 2} to={tWait - 2} zoomFrom={1.1} zoomTo={1.02} blurIn={10}>
				<Workbench frame={frame} at={tAsk + 3} />
				<TextAM at={tAsk + 2} y={1500} size={72} mode="rise">
					pergunta pro técnico
				</TextAM>
			</BeatAM>

			<BeatAM from={tWait - 2} to={D} zoomFrom={1.08} zoomTo={1}>
				<OnHold frame={frame} at={tWait} />
				<TextAM at={tWait + 4} y={210} size={80} mode="rise">
					e o cliente
					<br />
					<span style={{color: AM.yellow}}>esperando na linha</span>
				</TextAM>
			</BeatAM>
		</SceneAM>
	);
};

/** Technician's bench in the back: lamp, mat, tools, and a big "?" over it. */
const Workbench: React.FC<{frame: number; at: number}> = ({frame, at}) => {
	const q = land(frame, at, 9);
	const lamp = 0.7 + 0.3 * Math.sin(frame / 5);
	return (
		<AbsoluteFill>
			<svg width={1080} height={1920} style={{position: "absolute"}}>
				<defs>
					<radialGradient id="am-lamp" cx="50%" cy="0%" r="80%">
						<stop offset="0%" stopColor="#FFE9A8" stopOpacity={0.35 * lamp} />
						<stop offset="100%" stopColor="#FFE9A8" stopOpacity={0} />
					</radialGradient>
				</defs>
				<path d="M160 1060 L920 1060 L760 1300 L320 1300 Z" fill="url(#am-lamp)" />
				{/* lamp arm */}
				<path d="M820 1320 L820 1000 L640 900 L560 950" stroke="#3A3D46" strokeWidth={14} fill="none" strokeLinecap="round" />
				<path d="M500 930 L620 930 L590 980 L530 980 Z" fill="#4A4E58" />
				{/* bench + mat */}
				<rect x={90} y={1300} width={900} height={40} rx={12} fill="#2A2D35" />
				<rect x={230} y={1240} width={560} height={60} rx={10} fill="#1F3A2E" />
				{/* opened device + screwdriver */}
				<rect x={380} y={1190} width={140} height={60} rx={10} fill="#0D0F14" stroke="#555" strokeWidth={3} />
				<path d="M600 1250 L720 1200" stroke={AM.yellow} strokeWidth={10} strokeLinecap="round" />
				<path d="M720 1200 L770 1180" stroke="#BBB" strokeWidth={5} strokeLinecap="round" />
			</svg>
			<div
				style={{
					position: "absolute",
					left: 340,
					top: 420,
					width: 400,
					height: 400,
					borderRadius: 200,
					background: AM.yellow,
					color: "#16120A",
					fontFamily: FONT_AM,
					fontWeight: 800,
					fontSize: 300,
					lineHeight: "400px",
					textAlign: "center",
					transform: `scale(${q}) translateY(${Math.sin(frame / 7) * 8}px)`,
					boxShadow: `0 0 80px ${AM.yellowSoft}`,
				}}
			>
				?
			</div>
		</AbsoluteFill>
	);
};

/** Phone on hold: call timer keeps counting (00:47, 00:48...). */
const OnHold: React.FC<{frame: number; at: number}> = ({frame, at}) => {
	// The timer runs faster than real time on purpose: it should feel long.
	const secs = 47 + Math.max(0, Math.floor((frame - at) / 6));
	const mm = String(Math.floor(secs / 60)).padStart(2, "0");
	const ss = String(secs % 60).padStart(2, "0");
	const bob = kf(frame, [at, at + 12], [80, 0]);
	return (
		<PhoneAM x={540} y={1140 + bob} screenW={440} screenH={880}>
			<AbsoluteFill
				style={{
					background: "linear-gradient(180deg, #1B2033, #0A0C12)",
					fontFamily: FONT_AM,
					color: AM.white,
					alignItems: "center",
				}}
			>
				<div style={{marginTop: 160, fontSize: 34, color: AM.grey, fontWeight: 500}}>em espera</div>
				<div style={{marginTop: 14, fontSize: 58, fontWeight: 800}}>Cliente</div>
				<div
					style={{
						marginTop: 60,
						fontSize: 120,
						fontWeight: 800,
						color: AM.yellow,
						fontVariantNumeric: "tabular-nums",
						letterSpacing: -2,
					}}
				>
					{mm}:{ss}
				</div>
				<div
					style={{
						position: "absolute",
						bottom: 110,
						width: 120,
						height: 120,
						borderRadius: 60,
						background: "#E5484D",
					}}
				/>
			</AbsoluteFill>
		</PhoneAM>
	);
};
