import React from "react";
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from "remotion";
import {CaptionIF} from "../../components/ifood/CaptionIF";
import {CutIF} from "../../components/ifood/CutIF";
import {FrameIF} from "../../components/ifood/FrameIF";
import {GlyphIF, type GlyphKind} from "../../components/ifood/GlyphIF";
import {NetworkMapIF} from "../../components/ifood/NetworkMapIF";
import {PhotoIF} from "../../components/ifood/PhotoIF";
import {TextIF} from "../../components/ifood/TextIF";
import {YearIF} from "../../components/ifood/YearIF";
import {cueForIF} from "../../utils/cue-if";
import {fontFamily} from "../../utils/font";
import {imageAtIF} from "../../utils/images-if";
import {W} from "../../utils/layout";
import {IF} from "../../utils/theme-if";

const cue = cueForIF(6);

const END = 270;

/** The chain the sentence describes, top to bottom, with the platform in the
 *  middle — the node that did not exist before and is the whole point. */
const NODE_X = 300;
const LABEL_X = 470;
const CHAIN: {kind: GlyphKind | "hub"; y: number; label: string}[] = [
	{kind: "store", y: 430, label: "RESTAURANTE"},
	{kind: "hub", y: 760, label: "PLATAFORMA"},
	{kind: "scooter", y: 1090, label: "ENTREGADOR"},
	{kind: "person", y: 1420, label: "CLIENTE"},
];

/**
 * The middle node, drawn rather than glyphed.
 *
 * Concentric rings around a solid core: a routing point, not a building and not
 * a mark. The company's actual logotype appears nowhere in this film — this is
 * the neutral stand-in for "inside the platform".
 */
const HubNode: React.FC<{x: number; y: number; size: number; p: number; anim: number}> = ({
	x,
	y,
	size,
	p,
	anim,
}) => {
	if (p <= 0.002) return null;
	return (
		<div style={{position: "absolute", left: x - size / 2, top: y - size / 2, width: size, height: size}}>
			{/* Rings expand past 200; the viewBox is padded so they never clip into
			    a square of light at the edge of the box. */}
			<svg width={size} height={size} viewBox="-60 -60 320 320">
				{[0, 1, 2].map((i) => {
					const t = (anim + i / 3) % 1;
					return (
						<circle
							key={i}
							cx={100}
							cy={100}
							r={44 + t * 96}
							fill="none"
							stroke={IF.red}
							strokeOpacity={(1 - t) * 0.45 * p}
							strokeWidth={2.5}
						/>
					);
				})}
				<circle
					cx={100}
					cy={100}
					r={44}
					fill="none"
					stroke={IF.red}
					strokeWidth={4}
					pathLength={1}
					strokeDasharray={1}
					strokeDashoffset={1 - Math.min(1, p)}
				/>
				<circle cx={100} cy={100} r={16} fill={IF.red} fillOpacity={0.9 * p} />
			</svg>
		</div>
	);
};

/**
 * Scene 7 — THE TURN (0:40 - 0:49).
 *
 * "Em 2018, o iFood consolidou seu modelo logístico e passou a conectar
 * restaurantes, clientes e entregadores dentro da plataforma."
 *
 * The answer to scene 6, and the biggest thing in the film. Its whole job is a
 * visible JUMP IN SCALE: scene 6 ended on one blinking address in a city that
 * could not be solved; this one ends on a country of several hundred lit points
 * wired together, pulses running the long links.
 *
 * Four beats: the date, the country waking up, the chain that explains HOW
 * (restaurant → platform → courier → customer, one link drawing at a time), and
 * then the map again — wider, fully bloomed, links live, red pushed in.
 *
 * RENDER COST, deliberately bounded: `NetworkMapIF` holds ~620 seeded points and
 * 26 links as plain SVG circles and paths in ONE svg, not thousands of DOM
 * nodes. "Milhares" is read from density and from the pulses, not counted. This
 * machine has no GPU and two physical cores; a per-dot component would not
 * survive the render.
 */
export const Scene7Network: React.FC = () => {
	const frame = useCurrentFrame();
	const lModel = cue("12-modelo-logistico");

	// The date lands on the words "dois mil e dezoito", at the head of the line.
	const yearAt = Math.max(6, Math.round(lModel.at(0.04)));
	const bStart = yearAt + 40; //  the country starts waking up
	// The chain needs 55 frames to build (4 nodes at a 10-frame stagger plus the
	// last connector), so both boundaries are clamped: whatever the remeasure
	// does to the line, the chain is never cut off mid-build.
	const cStart = Math.max(bStart + 32, Math.round(lModel.at(0.44)));
	const dStart = Math.max(cStart + 60, Math.min(END - 70, Math.round(lModel.at(0.78))));
	const labelAt = Math.max(dStart + 12, Math.min(END - 46, Math.round(lModel.at(0.88))));

	const outline = interpolate(frame, [bStart + 2, bStart + 34], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.out(Easing.cubic),
	});
	// The bloom never stops growing across the scene: the two map beats are one
	// continuous swell cut in half by the chain, so the return reads as a leap.
	const bloomB = interpolate(frame, [bStart + 14, cStart], [0.05, 0.46], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.out(Easing.cubic),
	});
	const bloomD = interpolate(frame, [dStart, dStart + 52], [0.5, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.out(Easing.cubic),
	});
	const links = interpolate(frame, [dStart + 10, dStart + 70], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.out(Easing.cubic),
	});
	const heat = interpolate(frame, [labelAt - 10, labelAt + 20], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});
	const anim = (frame % 60) / 60;
	const slowAnim = (frame % 110) / 110;

	return (
		<AbsoluteFill>
			{/* Cool and wide open — the opposite of scene 6's red pressure. */}
			<FrameIF
				tone="cool"
				intensity={0.42 + 0.28 * Math.min(1, frame / END)}
				lightY={1000 - 460 * Math.min(1, frame / END)}
				grain={0.4}
			/>

			<PhotoIF
				image={imageAtIF(7, 0)}
				start={cStart}
				durationInFrames={Math.max(1, dStart - cStart)}
				zoomFrom={1.16}
				zoomTo={1.34}
				panX={-50}
				fadeIn={10}
				fadeOut={10}
				opacity={0.3}
				tintCyan={0.55}
			/>

			{/* A — the date, over the country as a bare outline: the shape arrives
			    before the scale does. */}
			<CutIF
				start={0}
				durationInFrames={bStart + 8}
				fadeIn={6}
				fadeOut={5}
				zoomFrom={1.1}
				zoomTo={1.0}
				entryBlur={16}
			>
				<NetworkMapIF
					x={W / 2}
					y={1080}
					width={760}
					outlineP={interpolate(frame, [4, 40], [0, 1], {
						extrapolateLeft: "clamp",
						extrapolateRight: "clamp",
						easing: Easing.out(Easing.cubic),
					})}
					bloom={0}
					linkP={0}
					opacity={0.35}
				/>
				<AbsoluteFill style={{alignItems: "center", justifyContent: "flex-start"}}>
					<div style={{marginTop: 480}}>
						{/* "2018" at 290px with tabular figures ≈ 660px wide; the rule under
						    it is 290 * 3.1 ≈ 900px. Both clear of 1080 with margin. */}
						<YearIF year="2018" start={yearAt} fontSize={290} impact={1} />
					</div>
				</AbsoluteFill>
			</CutIF>

			{/* B — the country lights up. */}
			<CutIF
				start={bStart}
				durationInFrames={cStart - bStart + 3}
				fadeIn={5}
				fadeOut={4}
				zoomFrom={1.0}
				zoomTo={1.14}
				panY={-40}
			>
				<NetworkMapIF
					x={W / 2}
					y={1060}
					width={800}
					outlineP={outline}
					bloom={bloomB}
					linkP={0}
					anim={slowAnim}
				/>
			</CutIF>

			{/* C — HOW. The chain that did not exist before 2018, one link at a time,
			    with a pulse running the whole way down once it is built. */}
			<CutIF
				start={cStart}
				durationInFrames={dStart - cStart + 3}
				fadeIn={4}
				fadeOut={4}
				zoomFrom={1.04}
				zoomTo={1.1}
				panY={-20}
				entryBlur={10}
			>
				{/* Connectors, drawn between consecutive nodes. */}
				<svg
					width={W}
					height={1920}
					viewBox={`0 0 ${W} 1920`}
					style={{position: "absolute", left: 0, top: 0}}
				>
					{CHAIN.slice(0, -1).map((n, i) => {
						const next = CHAIN[i + 1];
						const from = n.y + 112;
						const to = next.y - 112;
						const p = interpolate(frame, [cStart + 14 + i * 10, cStart + 30 + i * 10], [0, 1], {
							extrapolateLeft: "clamp",
							extrapolateRight: "clamp",
							easing: Easing.out(Easing.cubic),
						});
						if (p <= 0.01) return null;
						const py = from + (to - from) * ((anim + i * 0.18) % 1);
						return (
							<g key={i}>
								<line
									x1={NODE_X}
									y1={from}
									x2={NODE_X}
									y2={to}
									stroke={IF.cyan}
									strokeOpacity={0.4}
									strokeWidth={2.4}
									pathLength={1}
									strokeDasharray={1}
									strokeDashoffset={1 - p}
								/>
								{p > 0.98 ? (
									<>
										<circle cx={NODE_X} cy={py} r={14} fill={IF.cyan} fillOpacity={0.2} />
										<circle cx={NODE_X} cy={py} r={5} fill={IF.white} />
									</>
								) : null}
							</g>
						);
					})}
				</svg>

				{CHAIN.map((n, i) => {
					const p = interpolate(frame, [cStart + 4 + i * 10, cStart + 22 + i * 10], [0, 1], {
						extrapolateLeft: "clamp",
						extrapolateRight: "clamp",
						easing: Easing.out(Easing.cubic),
					});
					if (p <= 0.01) return null;
					const isHub = n.kind === "hub";
					return (
						<React.Fragment key={n.label}>
							{isHub ? (
								<HubNode x={NODE_X} y={n.y} size={200} p={p} anim={anim} />
							) : (
								<GlyphIF
									kind={n.kind as GlyphKind}
									x={NODE_X}
									y={n.y}
									size={200}
									p={p}
									color={IF.white}
									strokeWidth={3}
									anim={n.kind === "scooter" ? anim : slowAnim}
								/>
							)}
							{/* Labels sit to the right of the column: 11 chars at 40px ≈ 250px,
							    so the widest one ends near x=720, well inside the frame. */}
							<div
								style={{
									position: "absolute",
									left: LABEL_X,
									top: n.y - 26,
									fontFamily,
									fontSize: 40,
									fontWeight: isHub ? 600 : 400,
									letterSpacing: 6,
									color: isHub ? IF.white : IF.grey,
									opacity: p,
									transform: `translateX(${(1 - p) * 22}px)`,
									whiteSpace: "nowrap",
								}}
							>
								{n.label}
							</div>
						</React.Fragment>
					);
				})}
			</CutIF>

			{/* D — and then the scale. Wider than beat B, fully bloomed, every link
			    live, red pushed into the points on the label beat. */}
			<CutIF
				start={dStart}
				durationInFrames={END - dStart}
				fadeIn={4}
				fadeOut={6}
				zoomFrom={1.0}
				zoomTo={1.12}
				panY={-30}
				entryBlur={12}
			>
				<NetworkMapIF
					x={W / 2}
					y={1120}
					width={980}
					outlineP={1}
					bloom={bloomD}
					linkP={links}
					anim={anim}
					heat={heat}
				/>
			</CutIF>

			{/* "LOGÍSTICA" — 9 chars at 108px ≈ 545px. */}
			<AbsoluteFill style={{alignItems: "center", justifyContent: "flex-start"}}>
				<div style={{marginTop: 300}}>
					<TextIF
						start={labelAt}
						fontSize={108}
						fontWeight={600}
						letterSpacing={12}
						mode="slam"
						inFrames={10}
						rule
					>
						LOGÍSTICA
					</TextIF>
				</div>
			</AbsoluteFill>

			<CaptionIF
				cue={lModel}
				emphasis={["logístico", "conectar", "restaurantes", "clientes", "entregadores", "plataforma"]}
			/>
		</AbsoluteFill>
	);
};
