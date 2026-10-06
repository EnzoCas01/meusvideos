import React from "react";
import {seededRandom} from "../../utils/bezier";
import {IF} from "../../utils/theme-if";

type Props = {
	x: number;
	y: number;
	width: number;
	/** 0..1 — the coastline drawing itself. */
	outlineP?: number;
	/** 0..1 — how much of the country has lit up. */
	bloom?: number;
	/** 0..1 — how many of the links between cities are drawn. */
	linkP?: number;
	/** 0..1 loop phase for the pulses travelling the links. */
	anim?: number;
	opacity?: number;
	/** 0..1 — red pushed into the lit points, for the 2018 impact beat. */
	heat?: number;
};

/** Brazil, as a coarse silhouette in a 1000 x 1100 field. Not a survey map —
 *  a recognisable shape at a glance, which is all a 9:16 frame can carry. */
const OUTLINE: [number, number][] = [
	[430, 30],
	[520, 85],
	[600, 60],
	[640, 150],
	[720, 200],
	[800, 250],
	[880, 330],
	[905, 400],
	[860, 470],
	[830, 540],
	[800, 620],
	[760, 700],
	[700, 760],
	[640, 800],
	[590, 860],
	[540, 930],
	[480, 1000],
	[430, 1050],
	[390, 1010],
	[360, 940],
	[330, 880],
	[300, 820],
	[270, 760],
	[240, 700],
	[200, 640],
	[150, 580],
	[110, 520],
	[60, 470],
	[90, 420],
	[140, 390],
	[120, 330],
	[170, 270],
	[210, 210],
	[270, 160],
	[330, 110],
	[380, 60],
];

const FIELD_W = 1000;
const FIELD_H = 1100;

const OUTLINE_D = `${OUTLINE.map(([px, py], i) => `${i === 0 ? "M" : "L"} ${px} ${py}`).join(" ")} Z`;

const inside = (px: number, py: number): boolean => {
	let hit = false;
	for (let i = 0, j = OUTLINE.length - 1; i < OUTLINE.length; j = i++) {
		const [xi, yi] = OUTLINE[i];
		const [xj, yj] = OUTLINE[j];
		if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) hit = !hit;
	}
	return hit;
};

type Dot = {x: number; y: number; r: number; order: number; bright: boolean};

/**
 * The points, generated ONCE at module load.
 *
 * Rejection sampling with a seeded generator, so the constellation is identical
 * on every render and on every machine. `order` is a blend of distance from the
 * southeast and a seeded jitter: the country lights up roughly from the big
 * cities outward, but not in a visible sweep.
 */
const DOTS: Dot[] = (() => {
	const out: Dot[] = [];
	let seed = 1;
	let guard = 0;
	while (out.length < 620 && guard < 40000) {
		guard++;
		seed++;
		const px = seededRandom(seed * 3.1) * FIELD_W;
		const py = seededRandom(seed * 7.7 + 19) * FIELD_H;
		if (!inside(px, py)) continue;
		// Density weighting: the southeast is denser, which is both true and
		// what makes the shape readable.
		const d = Math.hypot(px - 690, py - 760) / 900;
		if (seededRandom(seed * 11.3 + 5) < d * 0.72) continue;
		const jitter = seededRandom(seed * 2.9 + 41);
		out.push({
			x: px,
			y: py,
			r: 2.2 + seededRandom(seed * 5.5) * 3.4,
			order: Math.min(1, d * 0.78 + jitter * 0.38),
			bright: seededRandom(seed * 13.7 + 3) > 0.87,
		});
	}
	return out.sort((a, b) => a.order - b.order);
})();

/** A handful of long links between distant hubs: the network, not the pins. */
const LINKS = Array.from({length: 26}, (_, i) => {
	const a = DOTS[Math.floor(seededRandom(i * 17 + 2) * DOTS.length)];
	const b = DOTS[Math.floor(seededRandom(i * 23 + 9) * DOTS.length)];
	return {a, b, seed: i};
}).filter((l) => l.a && l.b && Math.hypot(l.a.x - l.b.x, l.a.y - l.b.y) > 170);

/**
 * Scene 7's image: the country as one connected system.
 *
 * The sentence is "connected restaurants, customers and couriers inside the
 * platform" — so the picture is a map that stops being a set of separate points
 * and becomes a network. The bloom is the scale; the links are the model.
 */
export const NetworkMapIF: React.FC<Props> = ({
	x,
	y,
	width,
	outlineP = 1,
	bloom = 1,
	linkP = 0,
	anim = 0,
	opacity = 1,
	heat = 0,
}) => {
	if (opacity <= 0.002) return null;
	const height = (width * FIELD_H) / FIELD_W;

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
			{/* Wide viewBox margin: the glow around an edge city must not be clipped
			    into a straight line by the viewport. */}
			<svg
				width={width}
				height={height}
				viewBox={`-90 -90 ${FIELD_W + 180} ${FIELD_H + 180}`}
				style={{overflow: "visible"}}
			>
				<defs>
					<radialGradient id="if-net-glow">
						<stop offset="0%" stopColor={IF.cyan} stopOpacity={0.16} />
						<stop offset="100%" stopColor={IF.cyan} stopOpacity={0} />
					</radialGradient>
				</defs>

				{/* Atmosphere behind the country, so the dots sit in air not on black. */}
				<ellipse
					cx={520}
					cy={560}
					rx={560}
					ry={620}
					fill="url(#if-net-glow)"
					opacity={bloom}
				/>

				{/* Coastline, drawn. */}
				<path
					d={OUTLINE_D}
					fill={IF.white}
					fillOpacity={0.022 * outlineP}
					stroke={IF.white}
					strokeOpacity={0.3}
					strokeWidth={2.4}
					strokeLinejoin="round"
					pathLength={1}
					strokeDasharray={1}
					strokeDashoffset={1 - Math.max(0, Math.min(1, outlineP))}
				/>

				{/* Links between hubs, with a pulse running each one. */}
				{LINKS.map((l, i) => {
					const p = Math.max(0, Math.min(1, (linkP - i * 0.018) / 0.5));
					if (p <= 0.01) return null;
					const mx = (l.a.x + l.b.x) / 2 + (seededRandom(l.seed * 3 + 1) - 0.5) * 150;
					const my = (l.a.y + l.b.y) / 2 - 60 - seededRandom(l.seed * 5) * 90;
					const d = `M ${l.a.x} ${l.a.y} Q ${mx} ${my} ${l.b.x} ${l.b.y}`;
					// Pulse: a short dash travelling the curve. Offsetting by a seeded
					// phase keeps the 26 from marching in lockstep.
					const phase = (anim + seededRandom(l.seed * 9 + 4)) % 1;
					return (
						<g key={i}>
							<path
								d={d}
								fill="none"
								stroke={IF.cyan}
								strokeOpacity={0.22 * p}
								strokeWidth={1.6}
								pathLength={1}
								strokeDasharray={1}
								strokeDashoffset={1 - p}
							/>
							{p > 0.95 ? (
								<path
									d={d}
									fill="none"
									stroke={IF.white}
									strokeOpacity={0.85}
									strokeWidth={2.6}
									strokeLinecap="round"
									pathLength={1}
									strokeDasharray="0.055 0.945"
									strokeDashoffset={-phase}
								/>
							) : null}
						</g>
					);
				})}

				{/* The points. */}
				{DOTS.map((dot, i) => {
					const t = i / DOTS.length;
					const a = Math.max(0, Math.min(1, (bloom - t * 0.82) / 0.2));
					if (a <= 0.01) return null;
					// A brief overshoot as each point lands: thousands of small arrivals
					// rather than one opacity ramp on a finished plate.
					const pop = 1 + Math.max(0, 1 - (bloom - t * 0.82) / 0.09) * 1.5;
					const col = dot.bright ? IF.white : heat > 0.02 ? IF.red : IF.cyan;
					return (
						<g key={i}>
							{dot.bright ? (
								<circle cx={dot.x} cy={dot.y} r={dot.r * 4.5} fill={col} fillOpacity={0.1 * a} />
							) : null}
							<circle
								cx={dot.x}
								cy={dot.y}
								r={dot.r * Math.min(2.4, pop)}
								fill={col}
								fillOpacity={(dot.bright ? 0.95 : 0.5 + 0.35 * heat) * a}
							/>
						</g>
					);
				})}
			</svg>
		</div>
	);
};
