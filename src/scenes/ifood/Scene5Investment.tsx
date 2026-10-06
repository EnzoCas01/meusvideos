import React from "react";
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from "remotion";
import {CaptionIF} from "../../components/ifood/CaptionIF";
import {CityMapIF} from "../../components/ifood/CityMapIF";
import {CutIF} from "../../components/ifood/CutIF";
import {FrameIF} from "../../components/ifood/FrameIF";
import {GlyphIF} from "../../components/ifood/GlyphIF";
import {GrowthChartIF} from "../../components/ifood/GrowthChartIF";
import {PhotoIF} from "../../components/ifood/PhotoIF";
import {TextIF} from "../../components/ifood/TextIF";
import {YearIF} from "../../components/ifood/YearIF";
import {seededRandom} from "../../utils/bezier";
import {cueForIF} from "../../utils/cue-if";
import {imageAtIF} from "../../utils/images-if";
import {W} from "../../utils/layout";
import {IF} from "../../utils/theme-if";

const cue = cueForIF(4);

const END = 210;

/**
 * A corporate document, drawn.
 *
 * Cold grey and empty — NOT the warm printed guide of 2011. It carries body
 * rules and a signature, and nothing else: no figures, no percentages, no
 * letterhead. The only fact the script states about this year is that Movile
 * invested, so the sheet must not appear to assert anything more.
 */
const DocSheet: React.FC<{
	x: number;
	y: number;
	width: number;
	p: number;
	rotate?: number;
	opacity?: number;
	/** 0..1 — the signature stroke drawing itself. */
	sign?: number;
	rows?: number;
}> = ({x, y, width, p, rotate = 0, opacity = 1, sign = 0, rows = 9}) => {
	if (p <= 0.002 || opacity <= 0.002) return null;
	const height = width * 1.3;
	return (
		<div
			style={{
				position: "absolute",
				left: x - width / 2,
				top: y - height / 2,
				width,
				height,
				opacity,
				transform: `rotate(${rotate}deg)`,
			}}
		>
			{/* Margin in the viewBox so the signature's round caps are never clipped. */}
			<svg width={width} height={height} viewBox="-20 -20 440 560">
				<rect
					x={0}
					y={0}
					width={400}
					height={520}
					fill="rgba(245,243,242,0.045)"
					stroke={IF.line}
					strokeWidth={2}
					pathLength={1}
					strokeDasharray={1}
					strokeDashoffset={1 - Math.min(1, p)}
				/>
				{Array.from({length: rows}, (_, i) => {
					const a = Math.max(0, Math.min(1, (p - 0.24 - i * 0.055) / 0.3));
					if (a <= 0.01) return null;
					const w = 190 + seededRandom(i * 31 + 5) * 120;
					return (
						<rect
							key={i}
							x={46}
							y={90 + i * 34}
							width={i === 0 ? 210 : w}
							height={i === 0 ? 11 : 6}
							rx={3}
							fill={IF.white}
							fillOpacity={(i === 0 ? 0.5 : 0.2) * a}
						/>
					);
				})}
				{/* The signature line, and the decision landing on it in red. */}
				<rect x={46} y={472} width={308} height={2} fill={IF.white} fillOpacity={0.18 * p} />
				{sign > 0.002 ? (
					<path
						d="M 58 454 C 106 412, 138 488, 188 442 C 222 412, 240 472, 288 438"
						fill="none"
						stroke={IF.red}
						strokeWidth={4}
						strokeLinecap="round"
						pathLength={1}
						strokeDasharray={1}
						strokeDashoffset={1 - Math.min(1, sign)}
					/>
				) : null}
			</svg>
		</div>
	);
};

/**
 * Scene 5 — THE DECISION (0:24 - 0:31).
 *
 * "E no ano seguinte veio uma decisão importante." / "A Movile investiu no
 * negócio."
 *
 * FACTUAL GUARD RAIL, and the reason this scene looks the way it does: the only
 * claim the script makes is that Movile invested. No amount, no stake, no
 * valuation, no other investor's name. So the chart carries NO numbers and no
 * axis values — `GrowthChartIF` was built unlabelled on purpose — and the
 * document is blank body copy. The scene states "a decision, and a trajectory
 * that changed"; it states nothing that could be checked and found invented.
 *
 * Four beats: the room and the signature, the date, the curve, the city.
 */
export const Scene5Investment: React.FC = () => {
	const frame = useCurrentFrame();
	const lDec = cue("08-decisao");
	const lMov = cue("09-movile");

	// Beats derive from the voice, never from literal frames: the narration is
	// still an estimate and every one of these will move on a remeasure.
	const bStart = Math.round(lDec.at(0.5)); // the year card
	const cStart = Math.max(bStart + 34, Math.round(lMov.start - 6)); // the curve
	const dStart = Math.min(END - 40, cStart + 66); // the city expanding

	const docDraw = interpolate(frame, [4, 40], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.out(Easing.cubic),
	});
	const sign = interpolate(frame, [30, 50], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.out(Easing.cubic),
	});
	// The curve decides slowly, then commits — the shape of the whole beat.
	const curve = interpolate(frame, [cStart + 8, cStart + 58], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.out(Easing.cubic),
	});
	const grid = interpolate(frame, [cStart + 2, cStart + 26], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});
	const cityGrid = interpolate(frame, [dStart + 2, dStart + 34], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.out(Easing.cubic),
	});
	const cityRoutes = interpolate(frame, [dStart + 16, END - 10], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.out(Easing.cubic),
	});

	return (
		<AbsoluteFill>
			{/* Sober and modern: neutral key, low grain, the light climbing as the
			    scene opens up. Nothing here is warm — 2011 is over. */}
			<FrameIF
				tone="neutral"
				intensity={0.48 + 0.16 * (frame / END)}
				lightY={900 - 300 * (frame / END)}
				grain={0.4}
			/>

			<PhotoIF
				image={imageAtIF(5, 0)}
				start={0}
				durationInFrames={Math.max(1, cStart)}
				zoomFrom={1.1}
				zoomTo={1.26}
				panX={-50}
				fadeIn={14}
				fadeOut={10}
				opacity={0.42}
				tintCyan={0.35}
			/>
			<PhotoIF
				image={imageAtIF(5, 1)}
				start={dStart}
				durationInFrames={END - dStart}
				zoomFrom={1.16}
				zoomTo={1.34}
				panY={-60}
				fadeIn={10}
				fadeOut={10}
				opacity={0.34}
				tintCyan={0.5}
			/>

			{/* A — the room: papers on a table, and a decision being signed. */}
			<CutIF
				start={0}
				durationInFrames={bStart + 3}
				fadeIn={12}
				fadeOut={3}
				zoomFrom={1.12}
				zoomTo={1.0}
				panY={26}
				entryBlur={14}
			>
				<DocSheet x={250} y={980} width={420} p={docDraw} rotate={-7} opacity={0.4} rows={8} />
				<DocSheet x={830} y={1040} width={400} p={docDraw} rotate={9} opacity={0.32} rows={8} />
				<DocSheet x={W / 2} y={1010} width={560} p={docDraw} sign={sign} rotate={-1.5} />
				{/* The laptop on the far side of the table, in the fall-off. */}
				<GlyphIF
					kind="laptop"
					x={W / 2}
					y={1620}
					size={420}
					p={docDraw}
					color={IF.grey}
					strokeWidth={2.4}
					opacity={0.3}
				/>
			</CutIF>

			{/* B — the date. Free-standing type on the stage, never over a photo. */}
			<CutIF
				start={bStart}
				durationInFrames={cStart - bStart + 3}
				fadeIn={4}
				fadeOut={4}
				zoomFrom={1.0}
				zoomTo={1.06}
			>
				<DocSheet x={W / 2} y={1330} width={520} p={1} sign={1} rotate={-2} opacity={0.42} />
				<AbsoluteFill style={{alignItems: "center", justifyContent: "flex-start"}}>
					<div style={{marginTop: 420}}>
						<YearIF year="2013" start={bStart + 2} fontSize={230} impact={0.5} />
					</div>
				</AbsoluteFill>
			</CutIF>

			{/* C — the curve. No numbers on it, by editorial rule: it is a gesture of
			    growth, not a figure. */}
			<CutIF
				start={cStart}
				durationInFrames={dStart - cStart + 3}
				fadeIn={4}
				fadeOut={4}
				zoomFrom={1.02}
				zoomTo={1.1}
				panY={-24}
				entryBlur={10}
			>
				<GrowthChartIF x={W / 2} y={1180} width={780} height={520} p={curve} gridP={grid} />
				<AbsoluteFill style={{alignItems: "center", justifyContent: "flex-start"}}>
					<div style={{marginTop: 470}}>
						{/* "INVESTIMENTO" — 12 chars at 86px ≈ 580px wide. */}
						<TextIF
							start={cStart + 6}
							fontSize={86}
							fontWeight={600}
							letterSpacing={10}
							mode="wipe"
							inFrames={14}
							rule
						>
							INVESTIMENTO
						</TextIF>
					</div>
				</AbsoluteFill>
			</CutIF>

			{/* D — what the decision buys: the operation spreading across a city. The
			    curve stays up top, small, so the two read as one movement. */}
			<CutIF
				start={dStart}
				durationInFrames={END - dStart}
				fadeIn={4}
				fadeOut={6}
				zoomFrom={1.12}
				zoomTo={0.98}
				panY={30}
			>
				<CityMapIF
					x={W / 2}
					y={1090}
					width={820}
					height={1120}
					gridP={cityGrid}
					routeP={cityRoutes}
					routes={7}
					anim={(frame % 96) / 96}
					tangle={0}
					opacity={0.9}
				/>
				<GrowthChartIF
					x={W / 2}
					y={430}
					width={520}
					height={280}
					p={1}
					gridP={1}
					opacity={0.42}
					bars={7}
				/>
			</CutIF>

			<CaptionIF cue={lDec} emphasis={["decisão", "importante"]} />
			<CaptionIF cue={lMov} emphasis={["Movile", "investiu"]} />
		</AbsoluteFill>
	);
};
