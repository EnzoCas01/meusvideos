import React from "react";
import {AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from "remotion";
import {BackgroundCP} from "../../components/comece-pequeno/BackgroundCP";
import {PhotoCard} from "../../components/comece-pequeno/PhotoCard";
import {TextCP} from "../../components/comece-pequeno/TextCP";
import {cueFor} from "../../utils/cue-cp";
import {fontFamily} from "../../utils/font";
import {imageAt} from "../../utils/images-cp";
import {W, H} from "../../utils/layout";
import {CP} from "../../utils/theme-cp";

const cue = cueFor(3);

const RAIL_X = 112;
const TEXT_X = 172;
const FIRST_Y = 980;
const STEP_Y = 130;

/**
 * The five, one per spoken line. Kept short on screen on purpose: at 48px,
 * Inter runs ~0.52em per character, so the longest of these is ~725px wide and
 * still leaves a real margin inside a 1080 frame.
 */
const ITEMS = [
	{cueId: "12-pode-comecar", label: "Começar pequeno"},
	{cueId: "13-guardar", label: "Guardar um pouco"},
	{cueId: "14-aprender", label: "Aprender"},
	{cueId: "15-divida", label: "Evitar dívidas desnecessárias"},
	{cueId: "16-investir", label: "Investir em você"},
];

/**
 * Scene 4 — THE LESSON. The long one, 23 seconds.
 *
 * Opens on a person and a phone — an illustrative stand-in, so it gets support
 * treatment and never an archival one — then the photograph steps back into a
 * dim panel and the list takes the frame. Each of the five lands on its own
 * spoken line and STAYS: by the last one, all five are on screen together,
 * strung on a rail that draws itself downward as they accumulate.
 */
export const Scene4Lesson: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();

	const l10 = cue("10-licao");
	const l11 = cue("11-nao-precisa");
	const items = ITEMS.map((it) => ({...it, c: cue(it.cueId)}));
	const first = items[0].c;
	const last = items[items.length - 1].c;

	// The reframe: the big photograph dissolves into a dim backdrop just before
	// the list starts, so the list arrives into an empty stage.
	const reframe = Math.round(first.start - 34);

	// Rail length follows the last item that has landed.
	const railTop = FIRST_Y - 44;
	const railTarget = items.reduce((acc, it, i) => {
		const p = interpolate(frame, [it.c.start, it.c.start + 26], [0, 1], {
			extrapolateLeft: "clamp",
			extrapolateRight: "clamp",
			easing: Easing.out(Easing.cubic),
		});
		return Math.max(acc, railTop + (FIRST_Y + i * STEP_Y - railTop + 26) * p);
	}, railTop);

	// After the last line, the five settle to equal weight — they are one list now.
	const together = interpolate(frame, [last.end, last.end + 30], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	return (
		<AbsoluteFill>
			<BackgroundCP glow={0.34} glowY={30} />

			{/* Illustrative: support image, neutral grade, no year, no archive frame. */}
			<PhotoCard
				image={imageAt(4, 0)}
				start={0}
				durationInFrames={reframe + 40}
				x={150}
				y={310}
				width={780}
				height={560}
				zoomFrom={1.05}
				zoomTo={1.24}
				panX={-40}
				panY={22}
				fadeIn={30}
				fadeOut={40}
				opacity={0.9}
				tint={0.2}
			/>
			<PhotoCard
				image={imageAt(4, 0)}
				start={reframe}
				durationInFrames={690 - reframe}
				x={60}
				y={220}
				width={960}
				height={470}
				zoomFrom={1.12}
				zoomTo={1.3}
				panX={38}
				fadeIn={38}
				fadeOut={40}
				opacity={0.3}
				blur={4}
				tint={0.34}
			/>

			{/* The lesson, spoken over the photograph. */}
			<AbsoluteFill>
				{/* Both headlines share one slot below the photograph — 1060 clears the
				    big card (which bottoms out at 870) and clears the list (946). */}
				<div
					style={{
						position: "absolute",
						top: 1060,
						width: "100%",
						display: "flex",
						justifyContent: "center",
					}}
				>
					<TextCP
						start={l10.start}
						end={Math.round(l10.end + 6)}
						fontSize={54}
						maxWidth={860}
						inFrames={40}
					>
						Talvez sirva para a
						<br />
						sua própria vida.
					</TextCP>
				</div>

				{/* Trimmed straight from the spoken line — nothing invented. */}
				<div
					style={{
						position: "absolute",
						top: 1060,
						width: "100%",
						display: "flex",
						justifyContent: "center",
					}}
				>
					<TextCP
						start={l11.start}
						end={Math.round(first.start - 34)}
						fontSize={52}
						fontWeight={400}
						maxWidth={880}
						inFrames={42}
					>
						Você não precisa ganhar muito.
					</TextCP>
				</div>
			</AbsoluteFill>

			<svg
				width={W}
				height={H}
				viewBox={`0 0 ${W} ${H}`}
				style={{position: "absolute", top: 0, left: 0}}
			>
				{railTarget > railTop + 1 && (
					<line
						x1={RAIL_X}
						y1={railTop}
						x2={RAIL_X}
						y2={railTarget}
						stroke={CP.violetSoft}
						strokeWidth={2}
					/>
				)}
				{items.map((it, i) => (
					<Marker
						key={it.cueId}
						cx={RAIL_X}
						cy={FIRST_Y + i * STEP_Y}
						start={it.c.start}
						fps={fps}
						frame={frame}
					/>
				))}
			</svg>

			{items.map((it, i) => (
				<ListItem
					key={it.cueId}
					label={it.label}
					y={FIRST_Y + i * STEP_Y}
					start={it.c.start}
					active={frame >= it.c.start && frame <= it.c.end + 16}
					together={together}
				/>
			))}
		</AbsoluteFill>
	);
};

/** The bullet: a violet dot that lands with a ring, on the rail. */
const Marker: React.FC<{cx: number; cy: number; start: number; fps: number; frame: number}> = ({
	cx,
	cy,
	start,
	fps,
	frame,
}) => {
	const local = frame - start;
	if (local < 0) return null;
	const land = spring({frame: local, fps, config: {damping: 13, mass: 0.5, stiffness: 150}});
	const ring = interpolate(local, [0, 30], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.out(Easing.cubic),
	});
	return (
		<g>
			<circle
				cx={cx}
				cy={cy}
				r={9 + ring * 44}
				fill="none"
				stroke={CP.violet}
				strokeWidth={2}
				opacity={(1 - ring) * 0.65}
			/>
			<circle cx={cx} cy={cy} r={9 * land} fill={CP.violet} />
			<circle cx={cx} cy={cy} r={22 * land} fill={CP.violet} opacity={0.2} />
		</g>
	);
};

/** One verb, sliding in from the rail and then staying put for good. */
const ListItem: React.FC<{
	label: string;
	y: number;
	start: number;
	active: boolean;
	together: number;
}> = ({label, y, start, active, together}) => {
	const frame = useCurrentFrame();
	const local = frame - start;
	if (local < 0) return null;

	const arrive = interpolate(local, [0, 30], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.out(Easing.cubic),
	});
	const base = active ? 1 : 0.68;
	const opacity = arrive * (base + (1 - base) * together);

	return (
		<div
			style={{
				position: "absolute",
				left: TEXT_X,
				top: y - 34,
				fontFamily,
				fontSize: 48,
				fontWeight: 400,
				color: CP.white,
				letterSpacing: 0.2,
				opacity,
				transform: `translateX(${(1 - arrive) * -36}px)`,
				filter: `blur(${(1 - arrive) * 10}px)`,
				whiteSpace: "nowrap",
			}}
		>
			{label}
		</div>
	);
};
