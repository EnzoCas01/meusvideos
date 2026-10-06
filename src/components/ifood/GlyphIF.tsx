import React from "react";
import {IF} from "../../utils/theme-if";

/**
 * The film's drawn vocabulary: the actual objects the narration names.
 *
 * The brief's standing rule on this project is that abstraction repeated across
 * scenes reads as a template and gets rejected. So the imagery here is literal
 * — a printed guide, a desk phone, an order slip, a CRT, a laptop, a phone, a
 * storefront, a scooter, a map pin, a customer at a door, a clock — and each
 * scene uses the ones its own sentence is about.
 *
 * Nothing here is a third-party mark. These are generic objects of the period,
 * drawn as line work; no logotype, no brand silhouette, no device that reads as
 * a specific product.
 */
export type GlyphKind =
	| "guide" //   printed restaurant guide, open — the 2011 origin
	| "phone" //   desk telephone — orders by voice
	| "ticket" //  handwritten order slip
	| "monitor" // CRT computer — the first digital step
	| "laptop" //  the office years
	| "mobile" //  smartphone — the app
	| "store" //   restaurant
	| "scooter" // courier
	| "pin" //     an address on a map
	| "person" //  the customer, waiting
	| "clock"; //  time running — the logistics problem

type Props = {
	kind: GlyphKind;
	/** Centre, in composition px. */
	x: number;
	y: number;
	/** Bounding size in px. The glyph is drawn inside a 200x200 field. */
	size: number;
	/** 0..1 stroke-draw progress. 1 = fully drawn. */
	p?: number;
	color?: string;
	strokeWidth?: number;
	opacity?: number;
	rotate?: number;
	/** 0..1 — red glow behind the glyph, for impact beats. */
	glow?: number;
	/** Drives moving parts (the clock hand, the scooter wheels, the phone cord). */
	anim?: number;
};

/** One stroked path whose draw-on is normalised, so length never matters. */
const S: React.FC<{d: string; p: number; delay?: number; fill?: string}> = ({
	d,
	p,
	delay = 0,
	fill = "none",
}) => {
	// Staggering inside a glyph makes it read as being drawn, not wiped.
	const local = Math.max(0, Math.min(1, (p - delay) / Math.max(0.001, 1 - delay)));
	return (
		<path
			d={d}
			fill={fill}
			pathLength={1}
			strokeDasharray={1}
			strokeDashoffset={1 - local}
			strokeLinecap="round"
			strokeLinejoin="round"
		/>
	);
};

const Body: React.FC<{kind: GlyphKind; p: number; anim: number}> = ({kind, p, anim}) => {
	switch (kind) {
		case "guide":
			return (
				<>
					{/* Open guide: spine, two pages curling away from it. */}
					<S d="M100 40 L100 162" p={p} />
					<S d="M100 40 C 76 26, 42 24, 20 32 L20 150 C 42 142, 76 144, 100 162" p={p} delay={0.05} />
					<S d="M100 40 C 124 26, 158 24, 180 32 L180 150 C 158 142, 124 144, 100 162" p={p} delay={0.1} />
					{/* Menu entries, the thing that made it a guide and not a book. */}
					{[64, 84, 104, 124].map((yy, i) => (
						<S
							key={`l${yy}`}
							d={`M34 ${yy} L${84 - i * 4} ${yy - 2}`}
							p={p}
							delay={0.35 + i * 0.09}
						/>
					))}
					{[64, 84, 104, 124].map((yy, i) => (
						<S
							key={`r${yy}`}
							d={`M116 ${yy - 2} L${166 - i * 6} ${yy - 4}`}
							p={p}
							delay={0.4 + i * 0.09}
						/>
					))}
				</>
			);

		case "phone":
			return (
				<>
					{/* Base and cradle of a desk telephone. */}
					<S d="M44 126 L156 126 L166 162 L34 162 Z" p={p} />
					<S d="M58 140 L96 140" p={p} delay={0.45} />
					<S d="M58 152 L84 152" p={p} delay={0.55} />
					{/* Handset resting on top. */}
					<S
						d="M40 104 C 40 86, 68 86, 68 104 L68 112 L132 112 L132 104 C 132 86, 160 86, 160 104 L160 118 L40 118 Z"
						p={p}
						delay={0.15}
					/>
					{/* Curly cord, coiling as it is drawn. */}
					<S
						d={`M160 132 C 182 ${138 + anim * 6}, 150 ${146 - anim * 5}, 178 ${152 + anim * 4} C 196 158, 176 166, 190 172`}
						p={p}
						delay={0.6}
					/>
				</>
			);

		case "ticket":
			return (
				<>
					{/* Order slip with a torn bottom edge. */}
					<S
						d="M52 26 L148 26 L148 152 L138 144 L128 152 L118 144 L108 152 L98 144 L88 152 L78 144 L68 152 L58 144 L52 150 Z"
						p={p}
					/>
					{[56, 74, 92, 110].map((yy, i) => (
						<S key={yy} d={`M70 ${yy} L${132 - i * 10} ${yy}`} p={p} delay={0.35 + i * 0.12} />
					))}
				</>
			);

		case "monitor":
			return (
				<>
					{/* Deep CRT: the case is as tall as the picture, which is what dates it. */}
					<S d="M22 34 L178 34 L178 136 L22 136 Z" p={p} />
					<S
						d="M40 50 C 100 44, 100 44, 160 50 L160 120 C 100 126, 100 126, 40 120 Z"
						p={p}
						delay={0.25}
					/>
					<S d="M86 136 L86 158 L114 158 L114 136" p={p} delay={0.55} />
					<S d="M56 170 L144 170" p={p} delay={0.7} />
					{/* Scanline creeping down the tube. */}
					<S d={`M46 ${58 + anim * 56} L154 ${58 + anim * 56}`} p={p} delay={0.8} />
				</>
			);

		case "laptop":
			return (
				<>
					<S d="M46 40 L154 40 L154 124 L46 124 Z" p={p} />
					<S d="M60 54 L140 54" p={p} delay={0.4} />
					<S d="M60 72 L122 72" p={p} delay={0.5} />
					<S d="M60 90 L134 90" p={p} delay={0.6} />
					<S d="M28 124 L172 124 L186 156 L14 156 Z" p={p} delay={0.2} />
					<S d="M84 140 L116 140" p={p} delay={0.75} />
				</>
			);

		case "mobile":
			return (
				<>
					<S
						d="M64 16 L136 16 C 144 16, 148 20, 148 28 L148 172 C 148 180, 144 184, 136 184 L64 184 C 56 184, 52 180, 52 172 L52 28 C 52 20, 56 16, 64 16 Z"
						p={p}
					/>
					<S d="M88 28 L112 28" p={p} delay={0.3} />
					{/* Interface rows building inside the screen: the app being made. */}
					{[54, 82, 110, 138].map((yy, i) => (
						<S key={yy} d={`M68 ${yy} L132 ${yy}`} p={p} delay={0.42 + i * 0.13} />
					))}
					<S d="M68 160 L104 160" p={p} delay={0.9} />
				</>
			);

		case "store":
			return (
				<>
					{/* Storefront: awning, window, door. */}
					<S d="M26 70 L100 30 L174 70" p={p} />
					<S d="M36 70 L36 168 L164 168 L164 70" p={p} delay={0.15} />
					{/* Scalloped awning — the thing that says "restaurant" fastest. */}
					<S
						d="M30 70 C 44 88, 58 88, 72 70 C 86 88, 100 88, 114 70 C 128 88, 142 88, 156 70 L170 70"
						p={p}
						delay={0.35}
					/>
					<S d="M56 102 L92 102 L92 134 L56 134 Z" p={p} delay={0.55} />
					<S d="M112 168 L112 106 L146 106 L146 168" p={p} delay={0.65} />
				</>
			);

		case "scooter":
			return (
				<>
					{/* Wheels turn with `anim`; the spoke is what makes the turn visible. */}
					<circle cx={50} cy={144} r={26} fill="none" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} />
					<circle cx={156} cy={144} r={26} fill="none" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} />
					<S d={`M50 144 L${50 + 20 * Math.cos(anim * Math.PI * 2)} ${144 + 20 * Math.sin(anim * Math.PI * 2)}`} p={p} delay={0.6} />
					<S d={`M156 144 L${156 + 20 * Math.cos(anim * Math.PI * 2)} ${144 + 20 * Math.sin(anim * Math.PI * 2)}`} p={p} delay={0.6} />
					<S d="M50 144 L86 112 L128 112 L156 144" p={p} delay={0.25} />
					<S d="M86 112 L74 74 L52 74" p={p} delay={0.4} />
					{/* Delivery box on the back — the detail that makes it a courier. */}
					<S d="M112 108 L112 64 L172 64 L172 108" p={p} delay={0.5} />
					<S d="M126 84 L158 84" p={p} delay={0.8} />
				</>
			);

		case "pin":
			return (
				<>
					<S
						d="M100 176 C 100 176, 40 114, 40 78 C 40 45, 67 20, 100 20 C 133 20, 160 45, 160 78 C 160 114, 100 176, 100 176 Z"
						p={p}
					/>
					<circle cx={100} cy={76} r={22} fill="none" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} />
				</>
			);

		case "person":
			return (
				<>
					{/* Customer framed in a doorway: where the order has to arrive. */}
					<S d="M32 24 L32 184 L168 184 L168 24" p={p} />
					<circle cx={100} cy={82} r={26} fill="none" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} />
					<S d="M52 184 C 52 138, 148 138, 148 184" p={p} delay={0.4} />
					<S d="M146 106 L146 128" p={p} delay={0.8} />
				</>
			);

		case "clock":
			return (
				<>
					<circle cx={100} cy={100} r={72} fill="none" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} />
					{[0, 90, 180, 270].map((deg) => {
						const r = (deg * Math.PI) / 180;
						return (
							<S
								key={deg}
								d={`M${100 + 60 * Math.cos(r)} ${100 + 60 * Math.sin(r)} L${100 + 70 * Math.cos(r)} ${100 + 70 * Math.sin(r)}`}
								p={p}
								delay={0.5}
							/>
						);
					})}
					<S d="M100 100 L100 50" p={p} delay={0.55} />
					{/* Sweeping hand: the waiting the scene is about. */}
					<S
						d={`M100 100 L${100 + 56 * Math.sin(anim * Math.PI * 2)} ${100 - 56 * Math.cos(anim * Math.PI * 2)}`}
						p={p}
						delay={0.65}
					/>
				</>
			);
	}
};

export const GlyphIF: React.FC<Props> = ({
	kind,
	x,
	y,
	size,
	p = 1,
	color = IF.white,
	strokeWidth = 3.2,
	opacity = 1,
	rotate = 0,
	glow = 0,
	anim = 0,
}) => {
	const clamped = Math.max(0, Math.min(1, p));
	if (clamped <= 0.001 || opacity <= 0.002) return null;

	// Gradient ids are document-global in SVG, and several glyphs of the same
	// kind can be on screen at once with different glows. Keying the id on the
	// glow value keeps them from stealing each other's halo.
	const glowId = `gl-${kind}-${Math.round(glow * 100)}-${Math.round(x)}`;

	return (
		<div
			style={{
				position: "absolute",
				left: x - size / 2,
				top: y - size / 2,
				width: size,
				height: size,
				opacity,
				transform: `rotate(${rotate}deg)`,
			}}
		>
			{/* Generous viewBox margin: a glyph's glow and its round caps must never
			    be clipped by the SVG viewport — that turns a halo into a hard box. */}
			<svg width={size} height={size} viewBox="-24 -24 248 248">
				{glow > 0.001 ? (
					<>
						<defs>
							<radialGradient id={glowId}>
								<stop offset="0%" stopColor={IF.red} stopOpacity={0.5 * glow} />
								<stop offset="100%" stopColor={IF.red} stopOpacity={0} />
							</radialGradient>
						</defs>
						<circle cx={100} cy={100} r={130} fill={`url(#${glowId})`} />
					</>
				) : null}
				<g
					stroke={color}
					strokeWidth={strokeWidth}
					strokeLinecap="round"
					strokeLinejoin="round"
					fill="none"
				>
					<Body kind={kind} p={clamped} anim={anim} />
				</g>
			</svg>
		</div>
	);
};
