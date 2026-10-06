import React from "react";
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from "remotion";
import {CaptionIF} from "../../components/ifood/CaptionIF";
import {CutIF} from "../../components/ifood/CutIF";
import {FrameIF} from "../../components/ifood/FrameIF";
import {GlyphIF} from "../../components/ifood/GlyphIF";
import {GuidePageIF} from "../../components/ifood/GuidePageIF";
import {PhotoIF} from "../../components/ifood/PhotoIF";
import {TextIF} from "../../components/ifood/TextIF";
import {YearIF} from "../../components/ifood/YearIF";
import {seededRandom} from "../../utils/bezier";
import {cueForIF} from "../../utils/cue-if";
import {imageAtIF} from "../../utils/images-if";
import {W} from "../../utils/layout";
import {IF} from "../../utils/theme-if";

const cue = cueForIF(1);

/** Order slips piling on the desk: the operation's only database, in 2011. */
const SLIPS = Array.from({length: 9}, (_, i) => ({
	x: 250 + seededRandom(i * 13 + 2) * 580,
	y: 860 + seededRandom(i * 7 + 11) * 520,
	rotate: (seededRandom(i * 19 + 5) - 0.5) * 46,
	size: 180 + seededRandom(i * 3 + 29) * 90,
}));

/**
 * Scene 2 — THE UNEXPECTED ORIGIN (0:04 - 0:10).
 *
 * "Um papel." / "Em 2011, a empresa começou com o Disk Cook, um guia impresso
 * de cardápios."
 *
 * The scene opens on the film's one deliberate PAUSE: the word PAPEL, held
 * still over the print, which is the payoff of scene 1's hook. Then it moves —
 * the reconstruction of a small early-2010s operation, one object per cut:
 * the desk phone that took the orders, the year, the printed guide itself, and
 * the slips piling up beside an old computer.
 *
 * Beats B, C and D are all derived from the "Disk Cook" line, so the year card
 * lands on the words "dois mil e onze" no matter how the narration remeasures.
 */
export const Scene2DiskCook: React.FC = () => {
	const frame = useCurrentFrame();
	const lPapel = cue("02-um-papel");
	const lDisk = cue("03-disk-cook");

	const bStart = Math.round(lPapel.end + 4); // the phone
	const cStart = Math.round(lDisk.at(0.1)); // 2011 / Disk Cook
	const dStart = Math.round(lDisk.at(0.58)); // slips + old computer
	const END = 180;

	// The phone cord and the handset ring: a slow, tense idle.
	const ring = (Math.sin(frame / 6) + 1) / 2;
	const phoneDraw = interpolate(frame, [bStart, bStart + 26], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.out(Easing.cubic),
	});
	const monitorDraw = interpolate(frame, [dStart + 10, dStart + 40], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.out(Easing.cubic),
	});

	return (
		<AbsoluteFill>
			<FrameIF
				tone="warm"
				intensity={frame < cStart ? 0.6 : 0.5}
				lightY={frame < bStart ? 700 : 980}
				grain={0.55}
			/>

			<PhotoIF
				image={imageAtIF(2, 0)}
				start={bStart}
				durationInFrames={Math.max(1, END - bStart)}
				zoomFrom={1.12}
				zoomTo={1.3}
				panX={50}
				fadeIn={14}
				fadeOut={14}
				opacity={0.42}
			/>

			{/* A — THE REVEAL. The page from scene 1 continues, and the word lands on
			    it. This is the film's held beat; everything after it moves. */}
			<CutIF start={0} durationInFrames={bStart + 2} fadeIn={4} fadeOut={4} zoomFrom={1.16} zoomTo={1.02}>
				<GuidePageIF x={430} y={1120} width={2200} reveal={1} rows={13} rotate={1.6} lamp={0.9} />
				<AbsoluteFill style={{background: "rgba(8,7,10,0.5)"}} />
			</CutIF>

			{/* "PAPEL" — 5 chars at 220px ≈ 620px wide. Slams, then sits still. */}
			<AbsoluteFill style={{alignItems: "center", justifyContent: "center"}}>
				<TextIF
					start={lPapel.start}
					end={bStart - 6}
					fontSize={220}
					fontWeight={600}
					letterSpacing={16}
					mode="slam"
					inFrames={9}
					outFrames={6}
					style={{marginTop: -160}}
				>
					PAPEL
				</TextIF>
			</AbsoluteFill>

			{/* B — the desk phone. The orders were taken by voice; this is the object
			    that took them. */}
			<CutIF
				start={bStart}
				durationInFrames={cStart - bStart + 3}
				fadeIn={3}
				fadeOut={3}
				zoomFrom={1.02}
				zoomTo={1.14}
				panX={-50}
				panY={30}
				entryBlur={12}
			>
				<GlyphIF
					kind="phone"
					x={W / 2}
					y={950}
					size={680}
					p={phoneDraw}
					color={IF.paper}
					strokeWidth={2.6}
					anim={ring}
					rotate={-3}
				/>
				{/* Two slips already on the desk beside it. */}
				<GlyphIF kind="ticket" x={210} y={1360} size={230} p={phoneDraw} color={IF.paper} opacity={0.5} rotate={-16} />
				<GlyphIF kind="ticket" x={880} y={1430} size={200} p={phoneDraw} color={IF.paper} opacity={0.38} rotate={13} />
			</CutIF>

			{/* C — the date and the name, as free-standing type on the stage. It is
			    never laid over a photograph: every photo here is illustrative, and a
			    year card on an illustrative photo would assert something false. */}
			<CutIF
				start={cStart}
				durationInFrames={dStart - cStart + 3}
				fadeIn={4}
				fadeOut={4}
				zoomFrom={1.0}
				zoomTo={1.05}
			>
				<GuidePageIF x={W / 2} y={1380} width={900} reveal={1} rows={8} rotate={-3} opacity={0.5} lamp={0.7} />
				<AbsoluteFill style={{alignItems: "center", justifyContent: "flex-start"}}>
					<div style={{marginTop: 520}}>
						<YearIF year="2011" start={cStart + 2} fontSize={230} impact={0.45} />
					</div>
					<div style={{marginTop: 62}}>
						{/* "Disk Cook" — the name, set apart from the date. */}
						<TextIF
							start={cStart + 22}
							fontSize={82}
							fontWeight={400}
							letterSpacing={5}
							mode="wipe"
							inFrames={16}
							color={IF.paper}
						>
							Disk&nbsp;Cook
						</TextIF>
					</div>
				</AbsoluteFill>
			</CutIF>

			{/* D — the slips pile up next to an old computer. The operation's scale. */}
			<CutIF
				start={dStart}
				durationInFrames={END - dStart}
				fadeIn={3}
				fadeOut={6}
				zoomFrom={1.02}
				zoomTo={1.12}
				panY={-40}
				entryBlur={10}
			>
				<GlyphIF
					kind="monitor"
					x={W / 2}
					y={700}
					size={560}
					p={monitorDraw}
					color={IF.grey}
					strokeWidth={2.6}
					anim={(frame % 90) / 90}
				/>
				{SLIPS.map((s, i) => {
					const a = interpolate(frame, [dStart + 4 + i * 4, dStart + 16 + i * 4], [0, 1], {
						extrapolateLeft: "clamp",
						extrapolateRight: "clamp",
						easing: Easing.out(Easing.cubic),
					});
					return (
						<GlyphIF
							key={i}
							kind="ticket"
							x={s.x}
							y={s.y}
							size={s.size}
							p={a}
							color={IF.paper}
							opacity={0.34 + 0.4 * a}
							rotate={s.rotate}
							strokeWidth={2.4}
						/>
					);
				})}
			</CutIF>

			{/* No caption for "Um papel." — the 220px word on screen IS that line. */}
			<CaptionIF cue={lDisk} emphasis={["Disk", "Cook", "impresso", "guia"]} />
		</AbsoluteFill>
	);
};
