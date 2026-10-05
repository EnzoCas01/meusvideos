import React from "react";
import {seededRandom} from "../../utils/bezier";
import {IF} from "../../utils/theme-if";

/**
 * The objects of the early 2010s ordering desk, all drawn: a corded telephone,
 * a paper order pad, a restaurant counter, a CRT computer and the first
 * touchscreen phone. Generic models — nothing here copies a real product.
 *
 * Each one is an SVG <g> in its own local box, for a scene to place and scale.
 */

/** Corded desk telephone, three-quarter from above. Box ~520 x 380. */
export const DeskPhone: React.FC<{lift?: number; cordPhase?: number}> = ({
	lift = 0,
	cordPhase = 0,
}) => {
	const cord = Array.from({length: 7}).map((_, i) => {
		const t = i / 6;
		const x = 96 + t * 300;
		const y = 300 + Math.sin(t * 7 + cordPhase) * (26 - lift * 10) + t * 40;
		return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
	});

	return (
		<g>
			<defs>
				<linearGradient id="if-phone-body" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0%" stopColor="#3B342B" />
					<stop offset="100%" stopColor="#191410" />
				</linearGradient>
			</defs>

			{/* Base with the keypad. */}
			<rect x={40} y={140} width={330} height={210} rx={22} fill="url(#if-phone-body)" />
			<rect x={70} y={176} width={130} height={48} rx={6} fill="#0D0B08" opacity={0.85} />
			{Array.from({length: 12}).map((_, i) => (
				<rect
					key={i}
					x={72 + (i % 3) * 42}
					y={240 + Math.floor(i / 3) * 26}
					width={32}
					height={18}
					rx={4}
					fill="#574D40"
					opacity={0.9}
				/>
			))}

			{/* Handset, lifted off the cradle by `lift`. */}
			<g transform={`translate(${210 - lift * 40} ${60 - lift * 86}) rotate(${-8 - lift * 12} 120 40)`}>
				<rect x={0} y={16} width={250} height={54} rx={26} fill="url(#if-phone-body)" />
				<rect x={-16} y={-6} width={76} height={94} rx={26} fill="url(#if-phone-body)" />
				<rect x={196} y={-6} width={76} height={94} rx={26} fill="url(#if-phone-body)" />
				<ellipse cx={22} cy={40} rx={22} ry={26} fill="#0B0906" />
				<ellipse cx={234} cy={40} rx={22} ry={26} fill="#0B0906" />
				<rect x={-10} y={0} width={280} height={12} rx={6} fill={IF.accent} opacity={0.14} />
			</g>

			<path
				d={cord.join(" ")}
				fill="none"
				stroke="#2A231B"
				strokeWidth={9}
				strokeLinecap="round"
			/>
		</g>
	);
};

/** Order pad with a pen: handwriting appears stroke by stroke. Box ~420 x 520. */
export const OrderPad: React.FC<{written?: number}> = ({written = 1}) => {
	const lines = 7;
	const shown = lines * Math.max(0, Math.min(1, written));

	return (
		<g>
			<rect x={0} y={0} width={400} height={500} rx={6} fill="#D9CBA8" />
			<rect x={0} y={0} width={400} height={38} fill="#C2B18C" />
			{Array.from({length: 10}).map((_, i) => (
				<rect key={i} x={26} y={86 + i * 42} width={348} height={1.4} fill={IF.ink} opacity={0.18} />
			))}

			{Array.from({length: lines}).map((_, i) => {
				const p = Math.max(0, Math.min(1, shown - i));
				if (p <= 0) return null;
				const seed = i * 4.7 + 1;
				const width = 150 + seededRandom(seed) * 170;
				const y = 78 + i * 42;
				const d = Array.from({length: 9})
					.map((__, k) => {
						const t = k / 8;
						const x = 34 + t * width;
						const wob = Math.sin(t * 16 + seed) * 5 + (seededRandom(seed + k) - 0.5) * 4;
						return `${k === 0 ? "M" : "L"} ${x.toFixed(1)} ${(y + wob).toFixed(1)}`;
					})
					.join(" ");
				return (
					<path
						key={i}
						d={d}
						fill="none"
						stroke="#1F2A3C"
						strokeOpacity={0.82}
						strokeWidth={4}
						strokeLinecap="round"
						pathLength={1}
						strokeDasharray={1}
						strokeDashoffset={1 - p}
					/>
				);
			})}

			{/* The pen, resting where the writing stops. */}
			<g transform={`translate(${60 + shown * 30} ${44 + shown * 42}) rotate(38)`}>
				<rect x={0} y={0} width={18} height={230} rx={8} fill="#15110C" />
				<path d="M 0 230 L 9 262 L 18 230 Z" fill="#2E2720" />
				<rect x={0} y={40} width={18} height={26} fill={IF.accent} opacity={0.5} />
			</g>
		</g>
	);
};

/** Restaurant counter at night: shelves, hanging lamps, a service bell. Box 1080 x 700. */
export const CounterScene: React.FC<{glow?: number}> = ({glow = 1}) => (
	<g>
		<defs>
			<linearGradient id="if-counter" x1="0" y1="0" x2="0" y2="1">
				<stop offset="0%" stopColor="#2A1F15" />
				<stop offset="100%" stopColor="#0C0906" />
			</linearGradient>
			<radialGradient id="if-lampglow">
				<stop offset="0%" stopColor="rgba(232,164,90,0.55)" />
				<stop offset="100%" stopColor="rgba(232,164,90,0)" />
			</radialGradient>
		</defs>

		{/* Back wall shelving, out of focus behind. */}
		<g opacity={0.5}>
			{[120, 210, 300].map((y) => (
				<rect key={y} x={60} y={y} width={960} height={9} fill="#3A2C1E" />
			))}
			{Array.from({length: 18}).map((_, i) => {
				const shelf = [120, 210, 300][i % 3];
				const x = 90 + Math.floor(i / 3) * 150 + seededRandom(i * 3.3) * 40;
				const h = 34 + seededRandom(i) * 30;
				return <rect key={i} x={x} y={shelf - h} width={26} height={h} rx={5} fill="#5A4429" />;
			})}
		</g>

		{/* Two hanging lamps: the only real light in the room. */}
		{[300, 780].map((x) => (
			<g key={x}>
				<rect x={x - 2} y={0} width={4} height={150} fill="#2A2018" />
				<path d={`M ${x - 62} 210 L ${x + 62} 210 L ${x + 30} 150 L ${x - 30} 150 Z`} fill="#33271B" />
				<circle cx={x} cy={214} r={16} fill={IF.accent} opacity={0.9 * glow} />
				<circle cx={x} cy={220} r={190} fill="url(#if-lampglow)" opacity={glow} />
			</g>
		))}

		{/* The counter itself, foreground. */}
		<rect x={0} y={470} width={1080} height={230} fill="url(#if-counter)" />
		<rect x={0} y={470} width={1080} height={10} fill={IF.accent} opacity={0.2 * glow} />

		{/* Service bell and a stack of guides on the counter. */}
		<g transform="translate(760 396)">
			<path d="M -46 74 C -46 24, 46 24, 46 74 Z" fill="#4A3A26" />
			<rect x={-56} y={74} width={112} height={12} rx={6} fill="#3A2C1C" />
			<circle cx={0} cy={18} r={9} fill="#6B5433" />
		</g>
		{[0, 9, 18].map((d, i) => (
			<rect key={d} x={180 - d} y={432 - d} width={190} height={26} rx={3} fill={IF.paperEdge} opacity={0.5 + i * 0.16} />
		))}
	</g>
);

/** CRT computer of the era: deep tube, scan lines, phosphor list. Box 760 x 660. */
export const CrtMonitor: React.FC<{rows?: number; on?: number; cursorOn?: boolean}> = ({
	rows = 9,
	on = 1,
	cursorOn = true,
}) => {
	const shown = Math.round(rows * Math.max(0, Math.min(1, on)));
	return (
		<g>
			<defs>
				<linearGradient id="if-crt-case" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0%" stopColor="#4A443A" />
					<stop offset="100%" stopColor="#221E18" />
				</linearGradient>
				<radialGradient id="if-crt-screen" cx="50%" cy="46%" r="72%">
					<stop offset="0%" stopColor="#142A1E" />
					<stop offset="100%" stopColor="#060D09" />
				</radialGradient>
			</defs>

			{/* Stand and the depth of the tube. */}
			<rect x={250} y={520} width={220} height={40} rx={10} fill="#2A251E" />
			<rect x={180} y={556} width={360} height={26} rx={12} fill="#3A342B" />
			<rect x={40} y={20} width={640} height={520} rx={40} fill="url(#if-crt-case)" />

			<rect x={86} y={62} width={548} height={412} rx={34} fill="#0A0F0C" />
			<rect x={100} y={76} width={520} height={384} rx={28} fill="url(#if-crt-screen)" />

			<g clipPath="url(#if-crt-clip)">
				<rect x={128} y={104} width={200} height={12} rx={2} fill={IF.phosphor} opacity={0.75 * on} />
				<rect x={128} y={130} width={464} height={1.6} fill={IF.phosphor} opacity={0.3 * on} />
				{Array.from({length: shown}).map((_, i) => (
					<g key={i}>
						<rect
							x={128}
							y={152 + i * 32}
							width={180 + seededRandom(i * 8.1) * 200}
							height={9}
							rx={2}
							fill={IF.phosphor}
							opacity={0.62}
						/>
						<rect x={520} y={152 + i * 32} width={64} height={9} rx={2} fill={IF.phosphor} opacity={0.4} />
					</g>
				))}
				{cursorOn ? (
					<rect x={128} y={152 + shown * 32} width={16} height={18} fill={IF.phosphor} opacity={0.8} />
				) : null}

				{/* Scan lines and the glass bloom. */}
				{Array.from({length: 96}).map((_, i) => (
					<rect key={i} x={100} y={76 + i * 4} width={520} height={1.6} fill="#000" opacity={0.26} />
				))}
				<ellipse cx={250} cy={150} rx={230} ry={120} fill="#FFFFFF" opacity={0.05} />
			</g>
			<clipPath id="if-crt-clip">
				<rect x={100} y={76} width={520} height={384} rx={28} />
			</clipPath>

			<circle cx={620} cy={500} r={7} fill={IF.accent} opacity={0.85 * on} />
		</g>
	);
};

/** First-generation touchscreen phone, generic. Box 380 x 740. */
export const EarlyPhone: React.FC<{rows?: number; on?: number}> = ({rows = 6, on = 1}) => {
	const shown = Math.round(rows * Math.max(0, Math.min(1, on)));
	return (
		<g>
			<defs>
				<linearGradient id="if-mobile-body" x1="0" y1="0" x2="1" y2="1">
					<stop offset="0%" stopColor="#3A362F" />
					<stop offset="52%" stopColor="#16130F" />
					<stop offset="100%" stopColor="#2A2620" />
				</linearGradient>
			</defs>
			<rect x={0} y={0} width={360} height={700} rx={46} fill="url(#if-mobile-body)" />
			<rect x={16} y={16} width={328} height={668} rx={34} fill="#070A08" />
			<rect x={30} y={74} width={300} height={520} rx={4} fill="#0D110E" />

			<g opacity={on}>
				<rect x={30} y={74} width={300} height={34} fill="#141A16" />
				<rect x={44} y={86} width={60} height={9} rx={2} fill={IF.white} opacity={0.5} />
				<rect x={286} y={86} width={28} height={9} rx={2} fill={IF.white} opacity={0.5} />
				<rect x={46} y={128} width={150} height={13} rx={2} fill={IF.accent} opacity={0.9} />
				{Array.from({length: shown}).map((_, i) => (
					<g key={i}>
						<rect x={46} y={168 + i * 62} width={44} height={44} rx={8} fill={IF.white} opacity={0.12} />
						<rect
							x={104}
							y={176 + i * 62}
							width={100 + seededRandom(i * 6.4) * 110}
							height={10}
							rx={2}
							fill={IF.white}
							opacity={0.66}
						/>
						<rect x={104} y={196 + i * 62} width={80} height={8} rx={2} fill={IF.white} opacity={0.3} />
					</g>
				))}
			</g>

			<circle cx={180} cy={640} r={24} fill="none" stroke={IF.white} strokeOpacity={0.2} strokeWidth={3} />
			<rect x={140} y={44} width={80} height={7} rx={3.5} fill="#000" opacity={0.7} />
		</g>
	);
};
