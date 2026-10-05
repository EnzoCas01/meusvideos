import React from "react";
import {seededRandom} from "../../utils/bezier";
import {IF} from "../../utils/theme-if";

/**
 * The objects of the platform era: a browser window, an order notification, a
 * rising chart, a growing skyline. Drawn in the same flat, generic style as
 * `PeriodProps` — nothing here is a real product or a real number.
 */

/** A site in a browser chrome, order rows appearing below. Box ~700 x 480. */
export const BrowserWindow: React.FC<{rows?: number; on?: number}> = ({rows = 6, on = 1}) => {
	const shown = Math.round(rows * Math.max(0, Math.min(1, on)));
	return (
		<g>
			<rect x={0} y={0} width={700} height={480} rx={14} fill={IF.panel} />
			<rect x={0} y={0} width={700} height={48} rx={14} fill="#211A12" />
			<rect x={0} y={34} width={700} height={14} fill="#211A12" />
			<circle cx={28} cy={24} r={7} fill={IF.accent} opacity={0.6} />
			<circle cx={52} cy={24} r={7} fill={IF.grey} opacity={0.4} />
			<circle cx={76} cy={24} r={7} fill={IF.grey} opacity={0.4} />
			<rect x={110} y={14} width={420} height={20} rx={10} fill="#0E0B07" />
			<g opacity={on}>
				{Array.from({length: shown}).map((_, i) => (
					<g key={i}>
						<rect x={30} y={78 + i * 60} width={92} height={46} rx={8} fill={IF.accentSoft} />
						<rect
							x={142}
							y={88 + i * 60}
							width={260 + seededRandom(i * 4.2) * 170}
							height={12}
							rx={3}
							fill={IF.white}
							opacity={0.62}
						/>
						<rect x={142} y={112 + i * 60} width={130} height={9} rx={3} fill={IF.white} opacity={0.3} />
					</g>
				))}
			</g>
		</g>
	);
};

/** A new-order alert popping onto the map or a screen. Local origin centred. */
export const NotificationBadge: React.FC<{x: number; y: number; pop: number; color?: string}> = ({
	x,
	y,
	pop,
	color = IF.accent,
}) => {
	const p = Math.max(0, Math.min(1, pop));
	if (p <= 0) return null;
	const scale = 0.3 + p * 0.7;
	return (
		<g transform={`translate(${x} ${y}) scale(${scale})`} opacity={p}>
			<circle r={28} fill={color} opacity={0.22} />
			<circle r={15} fill={color} />
			<rect x={-7} y={-2} width={14} height={4} rx={2} fill={IF.background} />
			<rect x={-2} y={-7} width={4} height={14} rx={2} fill={IF.background} />
		</g>
	);
};

/** A rising line, drawn stroke-first. Local box ~ 560 x 300. */
export const GrowthChart: React.FC<{progress?: number}> = ({progress = 1}) => {
	const pts = [
		{x: 0, y: 264},
		{x: 112, y: 248},
		{x: 224, y: 220},
		{x: 336, y: 168},
		{x: 448, y: 92},
		{x: 560, y: 24},
	];
	const d = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
	const p = Math.max(0, Math.min(1, progress));

	return (
		<g>
			<line x1={0} y1={284} x2={560} y2={284} stroke={IF.line} strokeWidth={2} />
			<line x1={0} y1={0} x2={0} y2={284} stroke={IF.line} strokeWidth={2} />
			<path
				d={d}
				fill="none"
				stroke={IF.accent}
				strokeWidth={7}
				strokeLinecap="round"
				strokeLinejoin="round"
				pathLength={1}
				strokeDasharray={1}
				strokeDashoffset={1 - p}
			/>
			{pts.map((pt, i) =>
				i / (pts.length - 1) <= p ? <circle key={i} cx={pt.x} cy={pt.y} r={8} fill={IF.accent} /> : null,
			)}
		</g>
	);
};

/** A skyline growing bar by bar, a city in expansion. Local box ~ 630 x 420. */
export const Skyline: React.FC<{progress?: number}> = ({progress = 1}) => {
	const heights = [0.3, 0.52, 0.4, 0.72, 0.55, 0.88, 0.6, 1, 0.46];
	const maxH = 420;
	const p = Math.max(0, Math.min(1, progress)) * heights.length;

	return (
		<g>
			<line x1={-10} y1={maxH} x2={heights.length * 70} y2={maxH} stroke={IF.line} strokeWidth={3} />
			{heights.map((h, i) => {
				const curH = h * maxH * Math.max(0, Math.min(1, p - i));
				return (
					<rect
						key={i}
						x={i * 70}
						y={maxH - curH}
						width={52}
						height={curH}
						fill={IF.room}
						opacity={0.7 + (i % 3) * 0.1}
					/>
				);
			})}
		</g>
	);
};

/** A simple clock face, the hands set by the scene. Radius 90. */
export const Clock: React.FC<{hourAngle?: number; minuteAngle?: number}> = ({
	hourAngle = -30,
	minuteAngle = 40,
}) => (
	<g>
		<circle r={90} fill={IF.panel} stroke={IF.line} strokeWidth={3} />
		{Array.from({length: 12}).map((_, i) => {
			const a = (i / 12) * Math.PI * 2;
			return (
				<rect
					key={i}
					x={-2}
					y={-84}
					width={4}
					height={12}
					fill={IF.grey}
					opacity={0.6}
					transform={`rotate(${(a * 180) / Math.PI})`}
				/>
			);
		})}
		<rect x={-4} y={-52} width={8} height={52} rx={4} fill={IF.white} transform={`rotate(${hourAngle})`} />
		<rect x={-3} y={-70} width={6} height={70} rx={3} fill={IF.accent} transform={`rotate(${minuteAngle})`} />
		<circle r={7} fill={IF.accent} />
	</g>
);
