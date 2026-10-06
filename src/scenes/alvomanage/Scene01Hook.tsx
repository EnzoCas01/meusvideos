import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {BeatAM, SceneAM} from "../../components/alvomanage/SceneAM";
import {PhoneAM} from "../../components/alvomanage/FramesAM";
import {TextAM} from "../../components/alvomanage/TextAM";
import {kf, land, ramp, shake} from "../../components/alvomanage/motion-am";
import {AM, FONT_AM} from "../../utils/theme-am";
import {SCENE_DURATIONS_AM, cueAM} from "../../utils/timing-am";

const I = 0;

/** Crack paths in screen coords of a 440x900 screen, radiating from an impact. */
const CRACKS = [
	"M300 300 L250 210 L262 140 L210 40 L190 -10",
	"M300 300 L380 240 L470 250",
	"M300 300 L360 380 L350 470 L410 560 L460 700",
	"M300 300 L220 360 L120 350 L40 420 L-20 430",
	"M300 300 L290 420 L230 520 L250 640 L190 780 L210 940",
	"M300 300 L180 250 L80 180",
	"M250 210 L170 220",
	"M360 380 L430 400",
	"M230 520 L140 560 L90 640",
];

/**
 * am01 — "Sabe quando o cliente deixa o iPhone com a tela trincada, e dois
 * dias depois liga. E aí, ficou pronto?"
 * Shot A: phone on the counter, the glass cracks on "trincada".
 * Shot B: calendar tears two pages on "dois dias".
 * Shot C: the shop owner's phone rings on "liga"; balloon "E aí, ficou pronto?".
 */
export const Scene01Hook: React.FC = () => {
	const frame = useCurrentFrame();
	const D = SCENE_DURATIONS_AM[I];
	const c = cueAM(I, "am01");
	const tCrack = c.word("trincada");
	const tDays = c.word("dois dias");
	const tCall = c.word("liga");
	const tAsk = c.word("E aí");

	return (
		<SceneAM duration={D} entry="blur">
			{/* A — the cracked phone */}
			<BeatAM from={0} to={tDays - 2} zoomFrom={1.12} zoomTo={1.02}>
				<Counter />
				<CrackedPhone frame={frame} tCrack={tCrack} />
				<TextAM at={Math.max(2, c.word("iPhone") - 4)} y={170} size={64} color={AM.grey} until={tCrack - 2}>
					o cliente deixa o iPhone...
				</TextAM>
				<TextAM at={tCrack} y={170} size={92} mode="pop">
					tela trincada
				</TextAM>
			</BeatAM>

			{/* B — two days go by */}
			<BeatAM from={tDays - 2} to={tCall - 2} zoomFrom={0.94} zoomTo={1.02} blurIn={8}>
				<Calendar frame={frame} t0={tDays} t1={tCall - 4} />
				<TextAM at={tDays + 2} y={1430} size={88} mode="rise">
					2 dias depois
				</TextAM>
			</BeatAM>

			{/* C — the owner's phone rings */}
			<BeatAM from={tCall - 2} to={D} zoomFrom={1.1} zoomTo={1}>
				<RingingPhone frame={frame} t0={tCall} />
				<SpeechBubble frame={frame} at={tAsk} />
			</BeatAM>
		</SceneAM>
	);
};

const Counter: React.FC = () => (
	<AbsoluteFill>
		<div
			style={{
				position: "absolute",
				left: 0,
				right: 0,
				top: 1420,
				bottom: 0,
				background: "linear-gradient(180deg, #1B1D23, #0E0F13)",
				borderTop: `3px solid ${AM.line}`,
			}}
		/>
	</AbsoluteFill>
);

const CrackedPhone: React.FC<{frame: number; tCrack: number}> = ({frame, tCrack}) => {
	const crack = ramp(frame, tCrack, 8);
	const hit = frame >= tCrack && frame < tCrack + 8 ? shake(frame, 10, 3.1) : 0;
	const flash = frame >= tCrack ? Math.max(0, 1 - (frame - tCrack) / 6) : 0;
	return (
		<PhoneAM x={540 + hit} y={930} screenW={440} screenH={900} rotate={-4 + hit * 0.2}>
			<AbsoluteFill
				style={{background: "linear-gradient(150deg, #1A2140 0%, #090B12 55%, #0B0D15 100%)"}}
			/>
			{/* glass reflection */}
			<div
				style={{
					position: "absolute",
					left: -200,
					top: 0,
					width: 260,
					height: 1200,
					background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)",
					transform: `rotate(25deg) translateX(${kf(frame, [0, tCrack], [0, 400])}px)`,
				}}
			/>
			<svg width={440} height={900} style={{position: "absolute", left: 0, top: 0}}>
				{CRACKS.map((d, i) => (
					<path
						key={i}
						d={d}
						fill="none"
						stroke="#EDEFF5"
						strokeWidth={i < 6 ? 3 : 2}
						strokeLinecap="round"
						strokeLinejoin="round"
						pathLength={1}
						strokeDasharray={1}
						strokeDashoffset={1 - Math.min(1, crack * (1 + i * 0.12))}
						opacity={0.9}
						style={{filter: "drop-shadow(0 0 4px rgba(255,255,255,0.7))"}}
					/>
				))}
				<circle cx={300} cy={300} r={18 * crack} fill="none" stroke="#fff" strokeWidth={3} opacity={crack} />
			</svg>
			<AbsoluteFill style={{background: "#fff", opacity: flash * 0.5}} />
		</PhoneAM>
	);
};

const Calendar: React.FC<{frame: number; t0: number; t1: number}> = ({frame, t0, t1}) => {
	const days = ["SEG", "TER", "QUA"];
	const nums = ["05", "06", "07"];
	const step = Math.max(8, (t1 - t0) / 2.4);
	const flips = [t0 + 2, t0 + 2 + step];
	const W = 560;
	const H = 600;
	const page = (i: number) => {
		// page i is torn at flips[i]; it lifts, rotates and flies away.
		const t = i < flips.length ? ramp(frame, flips[i], 10) : 0;
		if (t >= 1) return null;
		return (
			<div
				key={i}
				style={{
					position: "absolute",
					left: 0,
					top: 0,
					width: W,
					height: H,
					borderRadius: 36,
					background: "#F2F0EA",
					overflow: "hidden",
					zIndex: 10 - i,
					transformOrigin: "50% 0%",
					transform: `translate(${t * 260}px, ${-t * 520}px) rotate(${t * 38}deg)`,
					opacity: 1 - t * 0.6,
					boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
					fontFamily: FONT_AM,
				}}
			>
				<div
					style={{
						height: 150,
						background: AM.yellow,
						color: "#1A1400",
						fontSize: 70,
						fontWeight: 800,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						letterSpacing: 6,
					}}
				>
					{days[i]}
				</div>
				<div
					style={{
						fontSize: 300,
						fontWeight: 800,
						color: "#16181D",
						textAlign: "center",
						lineHeight: "430px",
						letterSpacing: -10,
					}}
				>
					{nums[i]}
				</div>
			</div>
		);
	};
	const enter = land(frame, t0 - 2, 14);
	return (
		<div
			style={{
				position: "absolute",
				left: 540 - W / 2,
				top: 720 - H / 2,
				width: W,
				height: H,
				transform: `scale(${0.8 + 0.2 * enter})`,
			}}
		>
			{[2, 1, 0].map((i) => page(i))}
			{/* binder rings */}
			{[150, 410].map((x) => (
				<div
					key={x}
					style={{
						position: "absolute",
						left: x - 14,
						top: -30,
						width: 28,
						height: 70,
						borderRadius: 14,
						background: "#3A3D46",
						zIndex: 20,
					}}
				/>
			))}
		</div>
	);
};

const RingingPhone: React.FC<{frame: number; t0: number}> = ({frame, t0}) => {
	const local = frame - t0;
	const buzzing = local >= 0 && local % 24 < 14;
	const jitter = buzzing ? shake(frame, 7, 3.3) : 0;
	const pulse = (k: number) => ((local + k * 10) % 30) / 30;
	return (
		<>
			{/* ring waves around the phone, inside an SVG box larger than the biggest ring */}
			<svg width={1080} height={1400} style={{position: "absolute", left: 0, top: 360}}>
				{local >= 0 &&
					[0, 1, 2].map((k) => (
						<circle
							key={k}
							cx={540}
							cy={760}
							r={360 + pulse(k) * 220}
							fill="none"
							stroke={AM.yellow}
							strokeWidth={4}
							opacity={(1 - pulse(k)) * 0.45}
						/>
					))}
			</svg>
			<PhoneAM x={540 + jitter} y={1120} screenW={400} screenH={820} rotate={jitter * 0.4}>
				<AbsoluteFill
					style={{
						background: "linear-gradient(180deg, #13203F, #0A0C14)",
						fontFamily: FONT_AM,
						color: AM.white,
						alignItems: "center",
					}}
				>
					<div style={{marginTop: 140, fontSize: 30, color: AM.grey, fontWeight: 500}}>chamada recebida</div>
					<div style={{marginTop: 20, fontSize: 56, fontWeight: 800}}>Cliente</div>
					<div
						style={{
							position: "absolute",
							bottom: 110,
							width: 120,
							height: 120,
							borderRadius: 60,
							background: AM.green,
							transform: `scale(${1 + (buzzing ? 0.06 : 0)})`,
						}}
					/>
				</AbsoluteFill>
			</PhoneAM>
		</>
	);
};

const SpeechBubble: React.FC<{frame: number; at: number}> = ({frame, at}) => {
	if (frame < at) return null;
	const s = land(frame, at, 11);
	return (
		<div
			style={{
				position: "absolute",
				left: 90,
				top: 250,
				width: 900,
				padding: "44px 40px",
				borderRadius: 48,
				background: AM.white,
				color: "#121318",
				fontFamily: FONT_AM,
				fontWeight: 800,
				fontSize: 84,
				letterSpacing: -2,
				textAlign: "center",
				transformOrigin: "50% 100%",
				transform: `scale(${s}) rotate(${(1 - s) * -6}deg)`,
				boxShadow: "0 30px 80px rgba(0,0,0,0.5)",
			}}
		>
			E aí, ficou pronto?
			<div
				style={{
					position: "absolute",
					left: 430,
					bottom: -36,
					width: 0,
					height: 0,
					borderLeft: "30px solid transparent",
					borderRight: "30px solid transparent",
					borderTop: `40px solid ${AM.white}`,
				}}
			/>
		</div>
	);
};
