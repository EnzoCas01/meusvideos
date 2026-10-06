import React from "react";
import {seededRandom} from "../../utils/bezier";
import {IF} from "../../utils/theme-if";

type Props = {
	/** Centre of the spread, in composition px. */
	x: number;
	y: number;
	/** Width of the whole spread. */
	width: number;
	/** 0..1 — how much of the page has resolved out of the dark. */
	reveal?: number;
	/** 0..1 — a page lifting and turning over the spine. */
	turn?: number;
	/** How many entries per column. */
	rows?: number;
	opacity?: number;
	rotate?: number;
	/** Warm lamp falling across the paper, 0..1. */
	lamp?: number;
};

const COLS = 2;

/**
 * The printed restaurant guide, seen close: the film's opening image and the
 * thing the whole story turns away from.
 *
 * It is drawn rather than photographed because the sentence is specific — a
 * *printed menu guide* — and no stock photograph of one would be a record of
 * this company anyway. Entry widths are seeded, never random, so the page is
 * identical on every render and on every machine.
 */
export const GuidePageIF: React.FC<Props> = ({
	x,
	y,
	width,
	reveal = 1,
	turn = 0,
	rows = 9,
	opacity = 1,
	rotate = 0,
	lamp = 0.8,
}) => {
	const r = Math.max(0, Math.min(1, reveal));
	if (r <= 0.002 || opacity <= 0.002) return null;

	const height = width * 0.72;
	// A paper spread is not flat: the page tilts away toward the outer edge.
	const pageW = width / 2;

	const columns = Array.from({length: COLS}, (_, c) =>
		Array.from({length: rows}, (_, i) => {
			const seed = c * 41 + i * 7 + 3;
			return {
				// Entry name, then a dotted leader, then a price: the grammar of a menu.
				name: 0.42 + seededRandom(seed) * 0.34,
				price: 0.08 + seededRandom(seed + 100) * 0.05,
				// Every third entry is a section heading, set heavier and shorter.
				heading: i % 4 === 0,
			};
		}),
	);

	const rowGap = (height - 120) / rows;

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
			<svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
				<defs>
					<linearGradient id="if-paper" x1="0" y1="0" x2="1" y2="1">
						<stop offset="0%" stopColor={IF.paper} stopOpacity={0.30 + 0.30 * lamp} />
						<stop offset="55%" stopColor={IF.paper} stopOpacity={0.16 + 0.14 * lamp} />
						<stop offset="100%" stopColor={IF.paperDeep} stopOpacity={0.10} />
					</linearGradient>
					<linearGradient id="if-spine" x1="0" y1="0" x2="1" y2="0">
						<stop offset="0%" stopColor="#000" stopOpacity={0} />
						<stop offset="50%" stopColor="#000" stopOpacity={0.55} />
						<stop offset="100%" stopColor="#000" stopOpacity={0} />
					</linearGradient>
					<clipPath id="if-guide-clip">
						<rect x={0} y={0} width={width} height={height} rx={6} />
					</clipPath>
				</defs>

				<g clipPath="url(#if-guide-clip)" opacity={r}>
					{/* The two leaves. */}
					<rect x={0} y={0} width={width} height={height} fill="url(#if-paper)" />
					<rect
						x={0}
						y={0}
						width={width}
						height={height}
						fill="none"
						stroke={IF.paper}
						strokeOpacity={0.24}
						strokeWidth={2}
					/>
					{/* Gutter shadow — what makes it read as an open book. */}
					<rect x={pageW - 56} y={0} width={112} height={height} fill="url(#if-spine)" />

					{/* Entries. They resolve column by column so the page fills like
					    focus finding the print, not like a fade. */}
					{columns.map((col, c) =>
						col.map((entry, i) => {
							const appear = Math.max(
								0,
								Math.min(1, (r - 0.15 - (c * 0.1 + (i / rows) * 0.45)) / 0.4),
							);
							if (appear <= 0.01) return null;
							const left = c === 0 ? 62 : pageW + 62;
							const avail = pageW - 124;
							const yy = 76 + i * rowGap;
							const nameW = avail * entry.name;
							return (
								<g key={`${c}-${i}`} opacity={appear}>
									<rect
										x={left}
										y={yy}
										width={nameW}
										height={entry.heading ? 11 : 7}
										rx={3}
										fill={IF.paper}
										fillOpacity={entry.heading ? 0.62 : 0.34}
									/>
									{!entry.heading ? (
										<>
											<rect
												x={left + nameW + 12}
												y={yy + 3}
												width={Math.max(0, avail - nameW - avail * entry.price - 24)}
												height={2}
												fill={IF.paper}
												fillOpacity={0.16}
											/>
											<rect
												x={left + avail - avail * entry.price}
												y={yy}
												width={avail * entry.price}
												height={7}
												rx={3}
												fill={IF.paper}
												fillOpacity={0.4}
											/>
										</>
									) : null}
								</g>
							);
						}),
					)}

					{/* A leaf lifting off the spine. Skewing it as it rises is what sells
					    the turn without any 3D. */}
					{turn > 0.002 ? (
						<g
							transform={`translate(${pageW} 0) scale(${Math.max(0.02, 1 - turn * 2 > 0 ? 1 - turn * 2 : 0.02)} 1) translate(${-pageW} 0)`}
							opacity={1 - turn * 0.35}
						>
							<rect x={0} y={0} width={pageW} height={height} fill="url(#if-paper)" />
							<rect
								x={0}
								y={0}
								width={pageW}
								height={height}
								fill="#08070A"
								fillOpacity={turn * 0.45}
							/>
						</g>
					) : null}
				</g>
			</svg>
		</div>
	);
};
