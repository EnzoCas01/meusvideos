import React from "react";
import {cubicBezier} from "../../utils/bezier";
import {seededRandom} from "../../utils/bezier";
import {fontFamily} from "../../utils/font";
import {IF} from "../../utils/theme-if";

/**
 * The map every route in scenes 6–9 runs on: an abstract city grid seen from
 * above, streets and blocks only — never a real map, never real street names.
 * Local drawing box ~ 960 x 1440.
 */
export const CityMap: React.FC<{opacity?: number}> = ({opacity = 1}) => {
	const cols = 6;
	const rows = 9;
	const cell = 160;

	return (
		<g opacity={opacity}>
			<rect x={0} y={0} width={cols * cell} height={rows * cell} fill={IF.panel} />
			{Array.from({length: cols + 1}).map((_, i) => (
				<rect key={`v${i}`} x={i * cell - 2} y={0} width={4} height={rows * cell} fill={IF.line} />
			))}
			{Array.from({length: rows + 1}).map((_, i) => (
				<rect key={`h${i}`} x={0} y={i * cell - 2} width={cols * cell} height={4} fill={IF.line} />
			))}
			{Array.from({length: cols * rows}).map((_, i) => {
				const cx = i % cols;
				const cy = Math.floor(i / cols);
				const s = seededRandom(i * 3.1 + 5);
				if (s < 0.22) return null; // a few open plazas
				const pad = 18 + seededRandom(i * 7.7) * 14;
				return (
					<rect
						key={i}
						x={cx * cell + pad}
						y={cy * cell + pad}
						width={cell - pad * 2}
						height={cell - pad * 2}
						rx={6}
						fill={IF.room}
						opacity={0.45 + seededRandom(i * 1.9) * 0.3}
					/>
				);
			})}
		</g>
	);
};

/** A named point on the map: a lamp that lands, with its label above it. */
export const MapPin: React.FC<{
	x: number;
	y: number;
	label: string;
	color?: string;
	progress?: number;
}> = ({x, y, label, color = IF.accent, progress = 1}) => {
	const p = Math.max(0, Math.min(1, progress));
	const scale = 0.4 + p * 0.6;

	return (
		<g transform={`translate(${x} ${y})`} opacity={p}>
			<circle r={30 * scale} fill={color} opacity={0.2} />
			<circle r={11 * scale} fill={color} />
			<circle r={11 * scale} fill="none" stroke={color} strokeOpacity={0.5} strokeWidth={3} />
			<text
				x={0}
				y={-32}
				textAnchor="middle"
				fontFamily={fontFamily}
				fontSize={26}
				fontWeight={700}
				letterSpacing={2}
				fill={IF.white}
			>
				{label}
			</text>
		</g>
	);
};

const routeControls = (from: {x: number; y: number}, to: {x: number; y: number}, bow: number) => {
	const dx = to.x - from.x;
	const dy = to.y - from.y;
	const len = Math.hypot(dx, dy) || 1;
	const nx = -dy / len;
	const ny = dx / len;
	const c1 = {x: from.x + dx * 0.33 + nx * bow, y: from.y + dy * 0.33 + ny * bow};
	const c2 = {x: from.x + dx * 0.66 + nx * bow, y: from.y + dy * 0.66 + ny * bow};
	return {c1, c2};
};

/** A point at `t` along the same curve `MapRoute` draws — for a courier riding it. */
export const mapRoutePoint = (
	from: {x: number; y: number},
	to: {x: number; y: number},
	t: number,
	bow = 60,
): {x: number; y: number} => {
	const {c1, c2} = routeControls(from, to, bow);
	return cubicBezier(Math.max(0, Math.min(1, t)), from, c1, c2, to);
};

/** A route between two pins, drawn stroke-first as it is revealed. */
export const MapRoute: React.FC<{
	from: {x: number; y: number};
	to: {x: number; y: number};
	progress?: number;
	color?: string;
	bow?: number;
	width?: number;
}> = ({from, to, progress = 1, color = IF.accent, bow = 60, width = 4}) => {
	const {c1, c2} = routeControls(from, to, bow);
	const p = Math.max(0, Math.min(1, progress));
	if (p <= 0) return null;
	return (
		<path
			d={`M ${from.x} ${from.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${to.x} ${to.y}`}
			fill="none"
			stroke={color}
			strokeWidth={width}
			strokeLinecap="round"
			strokeOpacity={0.75}
			pathLength={1}
			strokeDasharray={1}
			strokeDashoffset={1 - p}
		/>
	);
};

/**
 * The delivery courier: a scooter and rider in silhouette, generic — no
 * brand, no face. Local origin sits between the wheels.
 */
export const Courier: React.FC<{scale?: number; angle?: number; opacity?: number}> = ({
	scale = 1,
	angle = 0,
	opacity = 1,
}) => (
	<g transform={`scale(${scale}) rotate(${angle})`} opacity={opacity}>
		<ellipse cx={0} cy={20} rx={30} ry={8} fill="#000" opacity={0.35} />
		<circle cx={-22} cy={12} r={10} fill="#141210" />
		<circle cx={22} cy={12} r={10} fill="#141210" />
		<path d="M -24 12 Q -16 -6 4 -6 L 22 12 Z" fill={IF.accentDeep} />
		<rect x={16} y={-18} width={18} height={18} rx={3} fill={IF.accent} />
		<circle cx={2} cy={-24} r={10} fill={IF.white} opacity={0.85} />
		<rect x={-4} y={-15} width={12} height={20} rx={5} fill={IF.white} opacity={0.7} />
	</g>
);
