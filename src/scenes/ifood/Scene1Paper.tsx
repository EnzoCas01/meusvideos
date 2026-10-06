import React from "react";
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from "remotion";
import {CaptionIF} from "../../components/ifood/CaptionIF";
import {CutIF} from "../../components/ifood/CutIF";
import {FrameIF} from "../../components/ifood/FrameIF";
import {GuidePageIF} from "../../components/ifood/GuidePageIF";
import {PhotoIF} from "../../components/ifood/PhotoIF";
import {TextIF} from "../../components/ifood/TextIF";
import {cueForIF} from "../../utils/cue-if";
import {imageAtIF} from "../../utils/images-if";
import {W} from "../../utils/layout";

const cue = cueForIF(0);

/**
 * Scene 1 — THE HOOK (0:00 - 0:04).
 *
 * "Antes de ser o aplicativo que você usa para pedir comida, o iFood era..."
 *
 * The image is the sentence's missing object, arriving before the word does: a
 * printed restaurant guide lying on a desk, found by the camera out of black.
 * No abstraction, no particles — the literal thing the film is about to name.
 *
 * Three internal beats in four seconds, because the brief opens fast:
 *   A  the page resolves out of the dark under a slow push
 *   B  cut in close, a leaf lifting — somebody is leafing through it
 *   C  cut tighter still, and "ANTES DO APP" lands over the print
 */
export const Scene1Paper: React.FC = () => {
	const frame = useCurrentFrame();
	const l1 = cue("01-antes-de-ser");

	// Beat boundaries. A and B are visual and stay put; C is pinned to the voice
	// so the label lands where he says "o aplicativo que você usa".
	const B_START = 44;
	const cStart = Math.round(l1.at(0.62));

	// The page emerging from black, rather than fading up: print finding light.
	const reveal = interpolate(frame, [4, 40], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.out(Easing.cubic),
	});
	// A leaf lifting over the spine during beat B.
	const turn = interpolate(frame, [B_START + 8, B_START + 40], [0, 0.5], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.inOut(Easing.cubic),
	});
	// A shadow crossing the paper: a hand passing over it, drawn as light.
	const handSweep = interpolate(frame, [B_START, B_START + 44], [-0.4, 1.4], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	return (
		<AbsoluteFill>
			<FrameIF tone="warm" intensity={0.62} lightY={760} grain={0.55} />

			{/* An illustrative photograph if the manifest has one, held far back and
			    always moving. The scene is designed to read with or without it. */}
			<PhotoIF
				image={imageAtIF(1, 0)}
				start={0}
				durationInFrames={120}
				zoomFrom={1.1}
				zoomTo={1.26}
				panY={-40}
				fadeIn={16}
				fadeOut={10}
				opacity={0.5}
			/>

			{/* A — the guide found in the dark. */}
			<CutIF start={0} durationInFrames={B_START + 2} fadeIn={16} fadeOut={3} zoomFrom={1.0} zoomTo={1.1} panY={-26}>
				<GuidePageIF x={W / 2} y={1010} width={880} reveal={reveal} rotate={-2.4} lamp={0.85} />
			</CutIF>

			{/* B — cut in close; the leaf lifts and a shadow crosses the page. */}
			<CutIF
				start={B_START}
				durationInFrames={cStart - B_START + 2}
				fadeIn={3}
				fadeOut={3}
				zoomFrom={1.0}
				zoomTo={1.09}
				panX={70}
				panY={20}
				entryBlur={10}
			>
				<GuidePageIF x={620} y={980} width={1560} reveal={1} turn={turn} rows={11} rotate={-1.2} lamp={1} />
				<AbsoluteFill
					style={{
						background: `linear-gradient(104deg, rgba(0,0,0,0) ${handSweep * 100 - 26}%, rgba(0,0,0,0.72) ${
							handSweep * 100
						}%, rgba(0,0,0,0) ${handSweep * 100 + 26}%)`,
					}}
				/>
			</CutIF>

			{/* C — tight on the print, and the label lands. */}
			<CutIF
				start={cStart}
				durationInFrames={120 - cStart}
				fadeIn={3}
				fadeOut={4}
				zoomFrom={1.04}
				zoomTo={1.18}
				panX={-90}
				panY={-40}
				entryBlur={12}
			>
				<GuidePageIF x={430} y={1120} width={2200} reveal={1} rows={13} rotate={1.6} lamp={1} />
			</CutIF>

			{/* "ANTES DO APP" — 12 chars at 96px ≈ 645px wide: clear of both margins. */}
			<AbsoluteFill style={{alignItems: "center", justifyContent: "flex-start"}}>
				<div style={{marginTop: 470}}>
					<TextIF
						start={cStart + 4}
						fontSize={96}
						fontWeight={600}
						letterSpacing={9}
						mode="rise"
						inFrames={14}
					>
						ANTES DO APP
					</TextIF>
				</div>
			</AbsoluteFill>

			<CaptionIF cue={l1} emphasis={["aplicativo", "comida", "era"]} />
		</AbsoluteFill>
	);
};
