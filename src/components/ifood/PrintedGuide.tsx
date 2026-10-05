import React from "react";
import {seededRandom} from "../../utils/bezier";
import {fontFamily} from "../../utils/font";
import {IF} from "../../utils/theme-if";

/**
 * The printed restaurant guide — the object the whole film turns on.
 *
 * Everything here is drawn: paper, the bow of the pages, the thickness of the
 * stack, the menu columns. The menu entries are bars rather than words on
 * purpose: they read as any menu at a glance, and they cannot accidentally
 * become a real restaurant's name or mark.
 *
 * Local drawing box, for a scene to place and scale:
 */
export const GUIDE_W = 900;
export const GUIDE_H = 600;
const SPINE = 451;

const LEFT_PAGE = "M 26 78 C 140 52, 320 36, 448 34 L 448 566 C 320 568, 140 552, 26 526 Z";
const RIGHT_PAGE = "M 454 34 C 582 36, 762 52, 876 78 L 876 526 C 762 552, 582 568, 454 566 Z";

/** One column of menu entries: a heading rule, then name + price rows. */
const MenuColumn: React.FC<{
	x: number;
	y: number;
	width: number;
	rows: number;
	seed: number;
	/** 0..1 — how much of the column is inked in yet. Used when a page lands. */
	reveal?: number;
}> = ({x, y, width, rows, seed, reveal = 1}) => {
	const rowHeight = 30;
	const shown = Math.round(rows * Math.max(0, Math.min(1, reveal)));

	return (
		<g>
			<rect x={x} y={y} width={width * 0.46} height={13} rx={2} fill={IF.ink} opacity={0.8} />
			<rect x={x} y={y + 24} width={width} height={1.6} fill={IF.ink} opacity={0.34} />
			{Array.from({length: shown}).map((_, i) => {
				const r = seededRandom(seed * 13.3 + i * 7.7);
				const nameWidth = width * (0.42 + r * 0.34);
				const rowY = y + 46 + i * rowHeight;
				const priceWidth = 40 + Math.round(seededRandom(seed * 3.1 + i) * 22);
				return (
					<g key={i}>
						<rect x={x} y={rowY} width={nameWidth} height={9} rx={1.5} fill={IF.ink} opacity={0.62} />
						<rect
							x={x + nameWidth + 10}
							y={rowY + 4}
							width={Math.max(0, width - nameWidth - priceWidth - 20)}
							height={1.4}
							fill={IF.ink}
							opacity={0.22}
						/>
						<rect
							x={x + width - priceWidth}
							y={rowY}
							width={priceWidth}
							height={9}
							rx={1.5}
							fill={IF.ink}
							opacity={0.46}
						/>
					</g>
				);
			})}
		</g>
	);
};

/** Paper: base tone, a warm gradient from the lamp, and printing fibres. */
const PaperDefs: React.FC = () => (
	<defs>
		<linearGradient id="if-paper" x1="0" y1="0" x2="1" y2="1">
			<stop offset="0%" stopColor={IF.paper} />
			<stop offset="55%" stopColor={IF.paperShade} />
			<stop offset="100%" stopColor="#B6A37D" />
		</linearGradient>
		<linearGradient id="if-spine" x1="0" y1="0" x2="1" y2="0">
			<stop offset="0%" stopColor="rgba(0,0,0,0)" />
			<stop offset="45%" stopColor="rgba(30,22,10,0.55)" />
			<stop offset="55%" stopColor="rgba(30,22,10,0.55)" />
			<stop offset="100%" stopColor="rgba(0,0,0,0)" />
		</linearGradient>
		<filter id="if-paper-grain">
			<feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves={3} seed={11} />
			<feColorMatrix type="saturate" values="0" />
		</filter>
	</defs>
);

/**
 * The guide lying open on a table, seen from above. `turn` drives a page
 * lifting off the right side and falling to the left — the page is mirrored by
 * a negative scale about the spine, which is what the back of a real page is.
 */
export const OpenGuide: React.FC<{turn?: number; reveal?: number}> = ({turn = 0, reveal = 1}) => {
	const a = Math.PI * Math.max(0, Math.min(1, turn));
	const c = Math.cos(a);
	const flip = Math.abs(c) < 0.004 ? 0.004 * Math.sign(c || 1) : c;
	const lift = Math.sin(a);

	return (
		<g>
			<PaperDefs />

			{/* The stack the open pages sit on: three offset copies read as depth. */}
			{[10, 6, 3].map((d, i) => (
				<g key={d} transform={`translate(0 ${d})`} opacity={0.5 + i * 0.16}>
					<path d={LEFT_PAGE} fill={IF.paperEdge} />
					<path d={RIGHT_PAGE} fill={IF.paperEdge} />
				</g>
			))}

			<path d={LEFT_PAGE} fill="url(#if-paper)" />
			<path d={RIGHT_PAGE} fill="url(#if-paper)" />

			<g clipPath="url(#if-clip-left)">
				<MenuColumn x={70} y={110} width={330} rows={11} seed={3} reveal={reveal} />
			</g>
			<g clipPath="url(#if-clip-right)">
				<MenuColumn x={506} y={110} width={330} rows={11} seed={9} reveal={reveal} />
			</g>
			<clipPath id="if-clip-left">
				<path d={LEFT_PAGE} />
			</clipPath>
			<clipPath id="if-clip-right">
				<path d={RIGHT_PAGE} />
			</clipPath>

			{/* The page in flight. */}
			{turn > 0.001 && turn < 0.999 ? (
				<g transform={`translate(${SPINE} 0) scale(${flip} 1) translate(${-SPINE} 0)`}>
					<path d={RIGHT_PAGE} fill="url(#if-paper)" />
					<MenuColumn x={506} y={110} width={330} rows={11} seed={c > 0 ? 21 : 27} />
					<path d={RIGHT_PAGE} fill="rgba(20,14,6,1)" opacity={lift * 0.26} />
				</g>
			) : null}

			{/* Shadow the flying page throws across the left page. */}
			<path d={LEFT_PAGE} fill="rgba(18,12,5,1)" opacity={lift * 0.3} />

			{/* The gutter, and the paper texture over everything. */}
			<rect x={SPINE - 42} y={20} width={84} height={560} fill="url(#if-spine)" />
			<g opacity={0.16} style={{mixBlendMode: "multiply"}}>
				<path d={LEFT_PAGE} filter="url(#if-paper-grain)" />
				<path d={RIGHT_PAGE} filter="url(#if-paper-grain)" />
			</g>
		</g>
	);
};

/**
 * The same guide closed, cover up: the object as you would find it on a
 * counter. Wording is generic and descriptive — no mark, no imitation.
 */
export const GuideCover: React.FC<{title?: string; subtitle?: string}> = ({
	title = "GUIA DE RESTAURANTES",
	subtitle = "CARDÁPIOS · PEDIDOS POR TELEFONE",
}) => (
	<g>
		<PaperDefs />
		{[14, 9, 5].map((d, i) => (
			<rect
				key={d}
				x={126}
				y={26 + d}
				width={650}
				height={560}
				rx={8}
				fill={IF.paperEdge}
				opacity={0.45 + i * 0.16}
			/>
		))}
		<rect x={126} y={26} width={650} height={560} rx={8} fill="url(#if-paper)" />
		<rect
			x={158}
			y={58}
			width={586}
			height={496}
			rx={3}
			fill="none"
			stroke={IF.ink}
			strokeOpacity={0.4}
			strokeWidth={2.5}
		/>
		<rect x={158} y={58} width={586} height={92} fill={IF.ink} opacity={0.84} />
		<text
			x={451}
			y={118}
			textAnchor="middle"
			fill={IF.paper}
			fontFamily={fontFamily}
			fontSize={40}
			fontWeight={700}
			letterSpacing={3}
		>
			{title}
		</text>

		{/* A fork and a knife, drawn as line work — the universal sign for a meal. */}
		<g
			stroke={IF.ink}
			strokeOpacity={0.74}
			strokeWidth={6}
			strokeLinecap="round"
			strokeLinejoin="round"
			fill="none"
		>
			{/* Fork: three tines meeting a neck, then the handle. */}
			<path d="M 382 216 L 382 262" />
			<path d="M 404 216 L 404 262" />
			<path d="M 426 216 L 426 262" />
			<path d="M 382 262 L 426 262" />
			<path d="M 404 262 L 404 362" />
			{/* Knife: a filled blade — pointed tip, curved spine, flat bolster
			    meeting the handle. (A blade tapering at BOTH ends reads as a leaf,
			    not a knife — the bolster has to stay full width.) */}
			<path
				d="M 504 206 C 523 224, 525 260, 522 288 L 498 294 C 496 252, 497 224, 504 206 Z"
				fill={IF.ink}
				fillOpacity={0.74}
				stroke="none"
			/>
			<path d="M 510 294 L 510 362" />
		</g>

		<rect x={266} y={404} width={370} height={11} rx={2} fill={IF.ink} opacity={0.6} />
		{/* Printing texture and the fall-off of the lamp, so the cover is an
		    object in a dark room and not a bright rectangle pasted on it. */}
		<g opacity={0.16} style={{mixBlendMode: "multiply"}}>
			<rect x={126} y={26} width={650} height={560} rx={8} filter="url(#if-paper-grain)" />
		</g>
		<rect x={126} y={26} width={650} height={560} rx={8} fill="url(#if-cover-falloff)" />
		<defs>
			<linearGradient id="if-cover-falloff" x1="0" y1="0" x2="0.4" y2="1">
				<stop offset="0%" stopColor="rgba(0,0,0,0)" />
				<stop offset="60%" stopColor="rgba(12,8,3,0.12)" />
				<stop offset="100%" stopColor="rgba(12,8,3,0.42)" />
			</linearGradient>
		</defs>
		<text
			x={451}
			y={470}
			textAnchor="middle"
			fill={IF.ink}
			fillOpacity={0.62}
			fontFamily={fontFamily}
			fontSize={22}
			fontWeight={500}
			letterSpacing={2}
		>
			{subtitle}
		</text>
	</g>
);

/** The table the guide lies on: dark wood, one pool of lamp light, grain. */
export const TableTop: React.FC<{width: number; height: number}> = ({width, height}) => (
	<g>
		<defs>
			<linearGradient id="if-wood" x1="0" y1="0" x2="0" y2="1">
				<stop offset="0%" stopColor="#1B140D" />
				<stop offset="60%" stopColor="#120D08" />
				<stop offset="100%" stopColor="#0B0805" />
			</linearGradient>
			<radialGradient id="if-tablepool" cx="50%" cy="42%" r="62%">
				<stop offset="0%" stopColor="rgba(232,164,90,0.34)" />
				<stop offset="100%" stopColor="rgba(0,0,0,0)" />
			</radialGradient>
		</defs>
		<rect width={width} height={height} fill="url(#if-wood)" />
		{Array.from({length: 14}).map((_, i) => (
			<rect
				key={i}
				x={0}
				y={(i * height) / 14 + seededRandom(i * 5.5) * 12}
				width={width}
				height={1.6}
				fill="#2A1E13"
				opacity={0.35 + seededRandom(i * 2.2) * 0.3}
			/>
		))}
		<rect width={width} height={height} fill="url(#if-tablepool)" />
	</g>
);
