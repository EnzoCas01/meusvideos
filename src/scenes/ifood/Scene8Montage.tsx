import React from "react";
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from "remotion";
import {CaptionIF} from "../../components/ifood/CaptionIF";
import {CityMapIF} from "../../components/ifood/CityMapIF";
import {CutIF} from "../../components/ifood/CutIF";
import {FrameIF} from "../../components/ifood/FrameIF";
import {GlyphIF, type GlyphKind} from "../../components/ifood/GlyphIF";
import {GuidePageIF} from "../../components/ifood/GuidePageIF";
import {NetworkMapIF} from "../../components/ifood/NetworkMapIF";
import {PhotoIF} from "../../components/ifood/PhotoIF";
import {TextIF} from "../../components/ifood/TextIF";
import {seededRandom} from "../../utils/bezier";
import {cueForIF} from "../../utils/cue-if";
import {imageAtIF} from "../../utils/images-if";
import {W} from "../../utils/layout";
import {IF} from "../../utils/theme-if";

const cue = cueForIF(7);

const END = 270;

/**
 * The recall: every object the film has already used, replayed in order and
 * compressed to a fraction of the time it originally got.
 *
 * The colours are the ORIGINAL scene's colours on purpose — the guide and the
 * desk phone come back warm as they were in 2011, the CRT grey, the smartphone
 * cyan as in scene 3. That is what makes the montage read as memory instead of
 * as a new sequence of icons.
 */
const RECALL: {kind: GlyphKind; start: number; len: number; color: string; size: number; y: number}[] = [
	{kind: "guide", start: 0, len: 18, color: IF.paper, size: 620, y: 960},
	{kind: "phone", start: 32, len: 16, color: IF.paper, size: 580, y: 980},
	{kind: "ticket", start: 46, len: 14, color: IF.paper, size: 420, y: 1000},
	{kind: "monitor", start: 58, len: 14, color: IF.grey, size: 540, y: 960},
	{kind: "laptop", start: 70, len: 14, color: IF.white, size: 520, y: 980},
	{kind: "mobile", start: 82, len: 18, color: IF.cyan, size: 500, y: 980},
	{kind: "store", start: 102, len: 16, color: IF.white, size: 540, y: 960},
	{kind: "scooter", start: 116, len: 16, color: IF.white, size: 580, y: 1000},
	{kind: "person", start: 130, len: 16, color: IF.grey, size: 520, y: 960},
];

/** Orders raining at the end of the montage — the "milhares de pedidos" beat,
 *  read as density rather than counted out one element per order. */
const RAIN = Array.from({length: 14}, (_, i) => ({
	x: 110 + seededRandom(i * 23 + 7) * 860,
	y: 460 + seededRandom(i * 31 + 3) * 1120,
	size: 90 + seededRandom(i * 11 + 19) * 70,
	rotate: (seededRandom(i * 41 + 13) - 0.5) * 50,
}));

/**
 * Scene 8 — WHAT IT BECAME (0:49 - 0:58).
 *
 * "E aquilo que começou com um guia impresso havia se transformado em uma
 * plataforma digital em rápida expansão."
 *
 * The sentence is a comparison across eight years, so the scene is a compression
 * of the film itself: fourteen cuts of 12-20 frames replaying the guide, the
 * desk phone, the slips, the CRT, the laptop, the phone, the restaurant, the
 * courier, the customer, the city and finally the country — each one in the
 * grade it had when the film first showed it. Everything the viewer has seen,
 * in nine seconds.
 *
 * Type in three moves, as the brief asks: PAPEL → APP → PLATAFORMA, each landing
 * on the part of the montage it names.
 */
export const Scene8Montage: React.FC = () => {
	const frame = useCurrentFrame();
	const lPlatform = cue("13-plataforma-digital");

	// The montage's own cadence is fixed (it IS the scene's subject), but the
	// three type beats are pinned to the voice so the words land with the line.
	const paperAt = Math.max(4, Math.round(lPlatform.at(0.06)));
	const appAt = Math.round(lPlatform.at(0.42));
	const platformAt = Math.max(196, Math.round(lPlatform.at(0.82)));

	const cityStart = 146;
	const netStart = 170;
	const wideStart = 200;

	const cityGrid = interpolate(frame, [cityStart, cityStart + 18], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.out(Easing.cubic),
	});
	const bloomA = interpolate(frame, [netStart, netStart + 28], [0.12, 0.6], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.out(Easing.cubic),
	});
	const bloomB = interpolate(frame, [wideStart, wideStart + 46], [0.62, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.out(Easing.cubic),
	});
	const links = interpolate(frame, [wideStart + 8, END - 18], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.out(Easing.cubic),
	});
	const anim = (frame % 44) / 44;

	// The grade walks the whole film's arc again, in nine seconds.
	const tone = frame < 56 ? "warm" : frame < 130 ? "neutral" : "cool";

	return (
		<AbsoluteFill>
			<FrameIF
				tone={tone}
				intensity={0.46 + 0.26 * Math.min(1, frame / END)}
				lightY={1020 - 460 * Math.min(1, frame / END)}
				grain={0.45}
			/>

			<PhotoIF
				image={imageAtIF(8, 0)}
				start={96}
				durationInFrames={54}
				zoomFrom={1.14}
				zoomTo={1.34}
				panX={-60}
				fadeIn={8}
				fadeOut={8}
				opacity={0.34}
				tintCyan={0.4}
			/>

			{/* The paper era gets one real close-up before the glyph chain takes over:
			    the printed guide is what the sentence is comparing against. */}
			<CutIF start={14} durationInFrames={20} fadeIn={3} fadeOut={3} zoomFrom={1.04} zoomTo={1.2} panX={80}>
				<GuidePageIF x={480} y={1040} width={1500} reveal={1} rows={11} rotate={-1.6} lamp={0.9} />
			</CutIF>

			{/* The chain of objects, each shorter than it was the first time. */}
			{RECALL.map((r, i) => {
				const draw = interpolate(frame, [r.start, r.start + Math.round(r.len * 0.7)], [0, 1], {
					extrapolateLeft: "clamp",
					extrapolateRight: "clamp",
					easing: Easing.out(Easing.cubic),
				});
				return (
					<CutIF
						key={r.kind}
						start={r.start}
						durationInFrames={r.len + 2}
						fadeIn={2}
						fadeOut={2}
						zoomFrom={1.0}
						zoomTo={1.09 + (i % 3) * 0.02}
						panX={i % 2 === 0 ? -34 : 34}
						panY={i % 3 === 0 ? 24 : -18}
						entryBlur={8}
					>
						<GlyphIF
							kind={r.kind}
							x={W / 2}
							y={r.y}
							size={r.size}
							p={draw}
							color={r.color}
							strokeWidth={3}
							anim={anim}
							rotate={(i % 2 === 0 ? -1 : 1) * 2.5}
						/>
					</CutIF>
				);
			})}

			{/* The city — scene 6's map, but solved: routes orthogonal, in cyan. */}
			<CutIF
				start={cityStart}
				durationInFrames={netStart - cityStart + 2}
				fadeIn={3}
				fadeOut={3}
				zoomFrom={1.12}
				zoomTo={1.0}
			>
				<CityMapIF
					x={W / 2}
					y={1040}
					width={780}
					height={1060}
					gridP={cityGrid}
					routeP={cityGrid}
					routes={6}
					anim={anim}
					tangle={0}
				/>
			</CutIF>

			{/* The country — scene 7's map, at half bloom, then wide open. */}
			<CutIF
				start={netStart}
				durationInFrames={wideStart - netStart + 2}
				fadeIn={3}
				fadeOut={3}
				zoomFrom={1.0}
				zoomTo={1.12}
				panY={-24}
			>
				<NetworkMapIF x={W / 2} y={1080} width={800} outlineP={1} bloom={bloomA} linkP={0} anim={anim} />
			</CutIF>

			<CutIF
				start={wideStart}
				durationInFrames={END - wideStart}
				fadeIn={4}
				fadeOut={6}
				zoomFrom={1.08}
				zoomTo={0.98}
			>
				<NetworkMapIF
					x={W / 2}
					y={1120}
					width={960}
					outlineP={1}
					bloom={bloomB}
					linkP={links}
					anim={anim}
					heat={0.4}
				/>
				{RAIN.map((o, i) => {
					const a = interpolate(frame, [wideStart + 14 + i * 2, wideStart + 24 + i * 2], [0, 1], {
						extrapolateLeft: "clamp",
						extrapolateRight: "clamp",
						easing: Easing.out(Easing.cubic),
					});
					if (a <= 0.01) return null;
					return (
						<GlyphIF
							key={i}
							kind="ticket"
							x={o.x}
							y={o.y}
							size={o.size}
							p={a}
							color={IF.white}
							opacity={a * 0.3}
							rotate={o.rotate}
							strokeWidth={2.2}
						/>
					);
				})}
			</CutIF>

			{/* Three words, three moments. "PLATAFORMA" is 10 chars: at 104px it is
			    about 580px wide, so it holds one line with room on both sides. */}
			<AbsoluteFill style={{alignItems: "center", justifyContent: "flex-start"}}>
				<div style={{marginTop: 350}}>
					<TextIF
						start={paperAt}
						end={paperAt + 34}
						fontSize={128}
						fontWeight={600}
						letterSpacing={14}
						mode="slam"
						inFrames={8}
						outFrames={6}
						color={IF.paper}
					>
						PAPEL
					</TextIF>
					<TextIF
						start={appAt}
						end={appAt + 34}
						fontSize={128}
						fontWeight={600}
						letterSpacing={14}
						mode="slam"
						inFrames={8}
						outFrames={6}
						color={IF.cyan}
					>
						APP
					</TextIF>
					<TextIF
						start={platformAt}
						fontSize={104}
						fontWeight={600}
						letterSpacing={12}
						mode="slam"
						inFrames={10}
						rule
					>
						PLATAFORMA
					</TextIF>
				</div>
			</AbsoluteFill>

			<CaptionIF cue={lPlatform} emphasis={["impresso", "plataforma", "digital", "expansão"]} />
		</AbsoluteFill>
	);
};
