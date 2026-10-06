import React from "react";
import {IF} from "../../utils/theme-if";

type Props = {
	x: number;
	y: number;
	width: number;
	height: number;
	/** 0..1 — the curve drawing itself left to right. */
	p?: number;
	/** 0..1 — the axis and gridlines. */
	gridP?: number;
	opacity?: number;
	/** Bars under the curve, for the quarters. */
	bars?: number;
};

/**
 * Scene 5's image: a line going up.
 *
 * Deliberately UNLABELLED — no numbers, no currency, no axis values. The only
 * fact the script states about 2013 is that Movile invested; inventing an
 * amount, a valuation or a growth rate on screen would be putting a false
 * statement in a documentary. The curve carries "a decision that changed the
 * trajectory" and nothing more.
 */
export const GrowthChartIF: React.FC<Props> = ({
	x,
	y,
	width,
	height,
	p = 1,
	gridP = 1,
	opacity = 1,
	bars = 9,
}) => {
	if (opacity <= 0.002) return null;

	// A curve that is flat, then decides. The inflection is the point of the shot.
	const pts: [number, number][] = Array.from({length: 40}, (_, i) => {
		const t = i / 39;
		const shape = Math.pow(t, 2.6) * 0.86 + t * 0.14;
		return [t * width, height - shape * height * 0.92];
	});
	const d = pts.map(([px, py], i) => `${i === 0 ? "M" : "L"} ${px.toFixed(1)} ${py.toFixed(1)}`).join(" ");

	const headT = Math.max(0, Math.min(1, p));
	const head = pts[Math.min(pts.length - 1, Math.round(headT * (pts.length - 1)))];

	return (
		<div
			style={{position: "absolute", left: x - width / 2, top: y - height / 2, width, height, opacity}}
		>
			<svg
				width={width}
				height={height}
				viewBox={`-40 -60 ${width + 80} ${height + 100}`}
				style={{overflow: "visible"}}
			>
				{/* Grid: four rules, drawn from the left. */}
				{[0, 0.25, 0.5, 0.75, 1].map((g, i) => (
					<line
						key={g}
						x1={0}
						y1={height * g}
						x2={width}
						y2={height * g}
						stroke={IF.white}
						strokeOpacity={g === 1 ? 0.28 : 0.09}
						strokeWidth={g === 1 ? 2 : 1.2}
						pathLength={1}
						strokeDasharray={1}
						strokeDashoffset={1 - Math.max(0, Math.min(1, (gridP - i * 0.08) / 0.5))}
					/>
				))}

				{/* Quarter bars under the curve: volume behind the trend. */}
				{Array.from({length: bars}, (_, i) => {
					const t = (i + 0.5) / bars;
					const a = Math.max(0, Math.min(1, (p - t * 0.85) / 0.12));
					if (a <= 0.01) return null;
					const shape = Math.pow(t, 2.6) * 0.86 + t * 0.14;
					const h = shape * height * 0.92 * a;
					const bw = (width / bars) * 0.44;
					return (
						<rect
							key={i}
							x={t * width - bw / 2}
							y={height - h}
							width={bw}
							height={h}
							fill={IF.white}
							fillOpacity={0.09}
						/>
					);
				})}

				{/* The trend. */}
				<path
					d={d}
					fill="none"
					stroke={IF.red}
					strokeWidth={4}
					strokeLinecap="round"
					pathLength={1}
					strokeDasharray={1}
					strokeDashoffset={1 - headT}
				/>
				{headT > 0.02 ? (
					<>
						<circle cx={head[0]} cy={head[1]} r={26} fill={IF.red} fillOpacity={0.16} />
						<circle cx={head[0]} cy={head[1]} r={7} fill={IF.white} />
					</>
				) : null}
			</svg>
		</div>
	);
};
