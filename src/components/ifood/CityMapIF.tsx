import React from "react";
import {seededRandom} from "../../utils/bezier";
import {IF} from "../../utils/theme-if";

type Props = {
	/** Box in composition px. */
	x: number;
	y: number;
	width: number;
	height: number;
	/** 0..1 — how much of the street grid has been drawn. */
	gridP?: number;
	/** 0..1 — how much of each route has been drawn. */
	routeP?: number;
	/** How many deliveries are in the air. */
	routes?: number;
	/** 0..1 loop phase driving the couriers along their routes. */
	anim?: number;
	/**
	 * 0..1 — the routes go crooked and red: this is the PROBLEM version of the
	 * map, before there is a logistics model. At 0 the same map reads as solved.
	 */
	tangle?: number;
	opacity?: number;
};

const COLS = 7;
const ROWS = 11;

type Node = {x: number; y: number};

/**
 * The city, as a delivery problem.
 *
 * Scene 6 asks: how does the order reach the customer's door? So the map is
 * literally a street grid with routes being attempted across it — and the
 * `tangle` control is the dramatic axis: crooked, red, overlapping routes when
 * the problem is unsolved, clean orthogonal ones when it is.
 *
 * Everything is seeded, never Math.random: the same city every render.
 */
export const CityMapIF: React.FC<Props> = ({
	x,
	y,
	width,
	height,
	gridP = 1,
	routeP = 1,
	routes = 6,
	anim = 0,
	tangle = 0,
	opacity = 1,
}) => {
	if (opacity <= 0.002) return null;

	const cellW = width / (COLS - 1);
	const cellH = height / (ROWS - 1);
	const node = (c: number, r: number): Node => ({
		// Streets are not perfectly regular — a slight seeded warp reads as a city
		// rather than as graph paper.
		x: c * cellW + (seededRandom(c * 13 + r * 7) - 0.5) * cellW * 0.22,
		y: r * cellH + (seededRandom(c * 5 + r * 29 + 61) - 0.5) * cellH * 0.22,
	});

	const verticals = Array.from({length: COLS}, (_, c) =>
		Array.from({length: ROWS}, (_, r) => node(c, r)),
	);
	const horizontals = Array.from({length: ROWS}, (_, r) =>
		Array.from({length: COLS}, (_, c) => node(c, r)),
	);

	const toD = (pts: Node[]) =>
		pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");

	// One delivery: a staircase from a restaurant node to a customer node. When
	// `tangle` is up, it takes detours — the wrong turns the scene is about.
	const trips = Array.from({length: routes}, (_, i) => {
		const s = i * 97 + 11;
		const from = {c: Math.floor(seededRandom(s) * COLS), r: Math.floor(seededRandom(s + 1) * ROWS)};
		const to = {
			c: Math.floor(seededRandom(s + 2) * COLS),
			r: Math.floor(seededRandom(s + 3) * ROWS),
		};
		const pts: Node[] = [node(from.c, from.r)];
		let c = from.c;
		let r = from.r;
		let guard = 0;
		while ((c !== to.c || r !== to.r) && guard < 40) {
			guard++;
			// The detour: under tangle, a step sometimes goes the wrong way.
			const wrong = tangle > 0.02 && seededRandom(s + guard * 3) < tangle * 0.34;
			if ((guard % 2 === 0 && c !== to.c) || r === to.r) {
				c += (c < to.c ? 1 : -1) * (wrong ? -1 : 1);
				c = Math.max(0, Math.min(COLS - 1, c));
			} else {
				r += (r < to.r ? 1 : -1) * (wrong ? -1 : 1);
				r = Math.max(0, Math.min(ROWS - 1, r));
			}
			pts.push(node(c, r));
		}
		return {pts, from: pts[0], to: pts[pts.length - 1], seed: s};
	});

	const routeColor = tangle > 0.35 ? IF.red : IF.cyan;

	return (
		<div
			style={{
				position: "absolute",
				left: x - width / 2,
				top: y - height / 2,
				width,
				height,
				opacity,
			}}
		>
			{/* Margin in the viewBox so glows and end caps are never clipped. */}
			<svg
				width={width}
				height={height}
				viewBox={`-40 -40 ${width + 80} ${height + 80}`}
				style={{overflow: "visible"}}
			>
				{/* Streets. */}
				<g stroke={IF.white} strokeOpacity={0.14} strokeWidth={1.6} fill="none">
					{verticals.map((col, i) => (
						<path
							key={`v${i}`}
							d={toD(col)}
							pathLength={1}
							strokeDasharray={1}
							strokeDashoffset={1 - Math.max(0, Math.min(1, (gridP - i * 0.035) / 0.6))}
						/>
					))}
					{horizontals.map((row, i) => (
						<path
							key={`h${i}`}
							d={toD(row)}
							pathLength={1}
							strokeDasharray={1}
							strokeDashoffset={1 - Math.max(0, Math.min(1, (gridP - i * 0.025) / 0.6))}
						/>
					))}
				</g>

				{/* Deliveries in progress. */}
				{trips.map((t, i) => {
					const p = Math.max(0, Math.min(1, (routeP - i * 0.09) / 0.55));
					if (p <= 0.01) return null;
					// Courier position along the polyline, looping.
					const phase = (anim + seededRandom(t.seed + 7)) % 1;
					const seg = phase * (t.pts.length - 1);
					const si = Math.min(t.pts.length - 2, Math.floor(seg));
					const st = seg - si;
					const a = t.pts[si];
					const b = t.pts[si + 1];
					const cx = a.x + (b.x - a.x) * st;
					const cy = a.y + (b.y - a.y) * st;
					return (
						<g key={i}>
							<path
								d={toD(t.pts)}
								fill="none"
								stroke={routeColor}
								strokeOpacity={0.30 + 0.35 * tangle}
								strokeWidth={2.6}
								strokeLinecap="round"
								strokeLinejoin="round"
								pathLength={1}
								strokeDasharray={1}
								strokeDashoffset={1 - p}
							/>
							{/* Restaurant end and customer end. */}
							<rect
								x={t.from.x - 6}
								y={t.from.y - 6}
								width={12}
								height={12}
								fill={IF.white}
								fillOpacity={0.75 * p}
							/>
							<circle cx={t.to.x} cy={t.to.y} r={6} fill={routeColor} fillOpacity={0.9 * p} />
							{/* The courier itself. */}
							{p > 0.92 ? (
								<>
									<circle cx={cx} cy={cy} r={16} fill={routeColor} fillOpacity={0.18} />
									<circle cx={cx} cy={cy} r={5.5} fill={IF.white} />
								</>
							) : null}
						</g>
					);
				})}
			</svg>
		</div>
	);
};
