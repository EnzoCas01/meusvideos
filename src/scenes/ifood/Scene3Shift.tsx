import React from "react";
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from "remotion";
import {CaptionIF} from "../../components/ifood/CaptionIF";
import {CutIF} from "../../components/ifood/CutIF";
import {FrameIF} from "../../components/ifood/FrameIF";
import {GlyphIF, type GlyphKind} from "../../components/ifood/GlyphIF";
import {PhotoIF} from "../../components/ifood/PhotoIF";
import {TextIF} from "../../components/ifood/TextIF";
import {cueForIF} from "../../utils/cue-if";
import {imageAtIF} from "../../utils/images-if";
import {W} from "../../utils/layout";
import {IF} from "../../utils/theme-if";

const cue = cueForIF(2);

const END = 210;

/**
 * The chain of devices, each beat SHORTER than the one before it.
 * 50 → 44 → 34 → 28 frames: the edit physically accelerates across the scene,
 * which is the one thing the brief explicitly asks THIS scene to do.
 */
const STEPS: {kind: GlyphKind; start: number; length: number; color: string; size: number}[] = [
	{kind: "phone", start: 0, length: 50, color: IF.paper, size: 620},
	{kind: "monitor", start: 48, length: 44, color: IF.grey, size: 600},
	{kind: "laptop", start: 90, length: 34, color: IF.white, size: 560},
	{kind: "mobile", start: 122, length: 28, color: IF.cyan, size: 480},
];

/** The final stutter: the whole chain replayed four frames each. */
const FLICKER: GlyphKind[] = ["guide", "phone", "ticket", "monitor", "laptop", "mobile"];
const FLICK_START = 148;
const FLICK_STEP = 4;
/** Visual beat, not a voice beat: the label lands out of the stutter. */
const LABEL_AT = FLICK_START + FLICKER.length * FLICK_STEP + 4;

/**
 * Scene 3 — THE TRANSFORMATION (0:10 - 0:17).
 *
 * "Os pedidos eram feitos por telefone." / "Mas o mundo estava mudando." /
 * "E eles perceberam que aquele modelo precisava sair do papel."
 *
 * The image is the sentence's verb: the same object, replaced four times.
 * Desk phone → CRT → laptop → smartphone, each cut arriving sooner than the
 * last and each grade a little cooler and more modern, until the chain stutters
 * through itself and the frame resolves on "DO PAPEL → DIGITAL".
 *
 * They are match cuts, not transitions: every device is centred on the same
 * point and drawn with the same stroke weight, so one becomes the next.
 */
export const Scene3Shift: React.FC = () => {
	const frame = useCurrentFrame();
	const lPhone = cue("04-por-telefone");
	const lWorld = cue("05-mundo-mudando");
	const lPaper = cue("06-sair-do-papel");

	// The room modernises ON the cuts, never between them: a grade change that
	// lands on a cut reads as a new shot; one that drifts reads as a mistake.
	const tone = frame < STEPS[1].start ? "warm" : frame < STEPS[3].start ? "neutral" : "cool";

	const holdDraw = interpolate(frame, [LABEL_AT - 8, LABEL_AT + 22], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.out(Easing.cubic),
	});

	return (
		<AbsoluteFill>
			<FrameIF
				tone={tone}
				intensity={0.5 + 0.2 * (frame / END)}
				lightY={920 - 360 * (frame / END)}
				grain={0.5}
			/>

			<PhotoIF
				image={imageAtIF(3, 0)}
				start={STEPS[2].start}
				durationInFrames={END - STEPS[2].start}
				zoomFrom={1.14}
				zoomTo={1.3}
				panX={-60}
				fadeIn={10}
				fadeOut={14}
				opacity={0.38}
				tintCyan={0.5}
			/>

			{STEPS.map((s, i) => {
				const draw = interpolate(frame, [s.start, s.start + Math.round(s.length * 0.5)], [0, 1], {
					extrapolateLeft: "clamp",
					extrapolateRight: "clamp",
					easing: Easing.out(Easing.cubic),
				});
				return (
					<CutIF
						key={s.kind}
						start={s.start}
						durationInFrames={s.length + 3}
						fadeIn={3}
						fadeOut={3}
						zoomFrom={1.0}
						// Each beat pushes harder than the last: the acceleration is in the
						// camera as well as in the cut lengths.
						zoomTo={1.06 + i * 0.035}
						panX={i % 2 === 0 ? -40 : 40}
						panY={20 - i * 10}
						entryBlur={9}
					>
						<GlyphIF
							kind={s.kind}
							x={W / 2}
							y={900}
							size={s.size}
							p={draw}
							color={s.color}
							strokeWidth={2.8}
							anim={(frame % 70) / 70}
							rotate={(i % 2 === 0 ? -1 : 1) * 2}
						/>
					</CutIF>
				);
			})}

			{/* The stutter: the whole chain flashed through in 24 frames. The scene's
			    climax of pace, and the launch pad for the label. */}
			{FLICKER.map((kind, i) => {
				const s = FLICK_START + i * FLICK_STEP;
				if (frame < s || frame > s + FLICK_STEP) return null;
				return (
					<GlyphIF
						key={`f-${kind}`}
						kind={kind}
						x={W / 2}
						y={900}
						size={540 - i * 22}
						p={1}
						color={i === FLICKER.length - 1 ? IF.cyan : IF.white}
						strokeWidth={3.4}
						opacity={0.92}
					/>
				);
			})}

			{/* What the chain arrived at, held under the label so the last third of
			    the scene is not an empty frame with type floating in it. */}
			<GlyphIF
				kind="mobile"
				x={W / 2}
				y={1140}
				size={560}
				p={holdDraw}
				color={IF.cyan}
				strokeWidth={3}
				opacity={holdDraw * 0.95}
			/>

			{/* "DO PAPEL → DIGITAL" is 18 chars. Split across two lines so the arrow
			    carries the turn, and so nothing approaches the 1080 edge. */}
			<AbsoluteFill style={{alignItems: "center", justifyContent: "flex-start"}}>
				<div style={{marginTop: 400}}>
					<TextIF
						start={LABEL_AT}
						fontSize={104}
						fontWeight={600}
						letterSpacing={6}
						mode="rise"
						inFrames={12}
						lineHeight={1.14}
					>
						DO PAPEL
						<br />
						<span style={{color: IF.red}}>→</span>{" "}
						<span style={{color: IF.cyan}}>DIGITAL</span>
					</TextIF>
				</div>
			</AbsoluteFill>

			<CaptionIF cue={lPhone} emphasis={["telefone"]} />
			<CaptionIF cue={lWorld} emphasis={["mudando"]} />
			<CaptionIF cue={lPaper} emphasis={["sair", "papel"]} />
		</AbsoluteFill>
	);
};
