import React from "react";
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from "remotion";
import {CaptionIF} from "../../components/ifood/CaptionIF";
import {CutIF} from "../../components/ifood/CutIF";
import {FrameIF} from "../../components/ifood/FrameIF";
import {GlyphIF} from "../../components/ifood/GlyphIF";
import {MarkIF} from "../../components/ifood/MarkIF";
import {PhotoIF} from "../../components/ifood/PhotoIF";
import {cueForIF} from "../../utils/cue-if";
import {imageAtIF} from "../../utils/images-if";
import {W} from "../../utils/layout";
import {IF} from "../../utils/theme-if";

const cue = cueForIF(8);

const END = 225;

/**
 * Scene 9 — THE CLOSE (0:58 - 1:04).
 *
 * "O iFood não começou grande." / "Ele começou mudando a forma como um pedido
 * era feito." / "Essa foi a virada."
 *
 * The film lands by subtraction. It opens almost black, finds one modern
 * delivery — a courier, a door, an order handed over — then strips even that
 * away for the last sentence, so that the only thing left in the frame is the
 * mark.
 *
 * THE MARK IS NOT THE COMPANY'S LOGO. `MarkIF` is the film's own title card,
 * drawn in code: no trademark is reproduced or approximated anywhere here, and
 * `images-if.ts` filters logo files out of the manifest for the same reason.
 *
 * And the ending is the silence. After "Essa foi a virada." the mark holds
 * alone for over a second with the light falling away — no tagline, no call to
 * follow anything, nothing added. The air is the point.
 *
 * Note the first line begins BEFORE this scene: at 30 fps it starts inside
 * scene 8's tail, so `CaptionIF` opens here mid-line, which is correct — it
 * picks its card by elapsed time, not by scene boundary.
 */
export const Scene9Close: React.FC = () => {
	const frame = useCurrentFrame();
	const lSmall = cue("14-nao-comecou-grande");
	const lChanged = cue("15-mudando-a-forma");
	const lTurn = cue("16-a-virada");

	// The mark arrives just inside the last line and then owns the rest.
	const markAt = Math.max(60, Math.min(END - 58, Math.round(lTurn.at(0.22))));
	const bStart = Math.max(40, Math.min(markAt - 70, Math.round(lChanged.start - 6)));
	const cStart = Math.max(bStart + 40, markAt - 34);

	const scooterDraw = interpolate(frame, [10, 46], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.out(Easing.cubic),
	});
	const doorDraw = interpolate(frame, [bStart + 4, bStart + 34], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.out(Easing.cubic),
	});
	// The film's whole argument in one dissolve: the 2011 slip becoming the app.
	const morph = interpolate(frame, [cStart + 4, cStart + 30], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.inOut(Easing.cubic),
	});
	// Everything but the mark falls away, and the light with it.
	const fall = interpolate(frame, [markAt - 8, markAt + 24], [1, 0], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.out(Easing.cubic),
	});

	return (
		<AbsoluteFill>
			<FrameIF
				tone="cool"
				intensity={0.18 + 0.3 * interpolate(frame, [0, 70], [0, 1], {
					extrapolateLeft: "clamp",
					extrapolateRight: "clamp",
				}) * (0.35 + 0.65 * fall)}
				lightY={880}
				grain={0.4}
			/>

			{/* A modern delivery photograph if one arrived: held far back, always
			    moving, and gone before the mark lands. */}
			<PhotoIF
				image={imageAtIF(9, 0)}
				start={6}
				durationInFrames={Math.max(1, cStart - 6)}
				zoomFrom={1.1}
				zoomTo={1.3}
				panY={-50}
				fadeIn={22}
				fadeOut={16}
				opacity={0.46}
				tintCyan={0.45}
			/>
			<PhotoIF
				image={imageAtIF(9, 1)}
				start={cStart}
				durationInFrames={Math.max(1, markAt - cStart)}
				zoomFrom={1.16}
				zoomTo={1.3}
				panX={40}
				fadeIn={12}
				fadeOut={14}
				opacity={0.34}
				tintCyan={0.45}
			/>

			{/* A — out of the dark: a courier moving. Nothing else in the frame. */}
			<CutIF
				start={0}
				durationInFrames={bStart + 3}
				fadeIn={18}
				fadeOut={4}
				zoomFrom={1.14}
				zoomTo={1.0}
				panX={-40}
				entryBlur={18}
			>
				<GlyphIF
					kind="scooter"
					x={W / 2}
					y={1060}
					size={620}
					p={scooterDraw}
					color={IF.white}
					strokeWidth={2.8}
					anim={(frame % 38) / 38}
				/>
			</CutIF>

			{/* B — the door it arrives at. The last object in the film that is a thing
			    rather than a word. */}
			<CutIF
				start={bStart}
				durationInFrames={cStart - bStart + 3}
				fadeIn={4}
				fadeOut={4}
				zoomFrom={1.02}
				zoomTo={1.12}
				panY={-24}
				entryBlur={10}
			>
				<GlyphIF kind="person" x={W / 2} y={1000} size={580} p={doorDraw} color={IF.grey} strokeWidth={2.8} />
				<GlyphIF
					kind="mobile"
					x={780}
					y={1440}
					size={280}
					p={doorDraw}
					color={IF.cyan}
					strokeWidth={2.6}
					opacity={0.8}
				/>
			</CutIF>

			{/* C — "mudando a forma como um pedido era feito": the handwritten slip of
			    2011 and the app occupy the same point on screen, and one replaces the
			    other. The film's first image and its last object, superimposed. */}
			<CutIF
				start={cStart}
				durationInFrames={markAt - cStart + 6}
				fadeIn={4}
				fadeOut={10}
				zoomFrom={1.0}
				zoomTo={1.08}
			>
				<GlyphIF
					kind="ticket"
					x={W / 2}
					y={1000}
					size={520}
					p={1}
					color={IF.paper}
					strokeWidth={2.8}
					opacity={(1 - morph) * 0.9 * fall}
					rotate={-4 + morph * 4}
				/>
				<GlyphIF
					kind="mobile"
					x={W / 2}
					y={1000}
					size={520}
					p={morph}
					color={IF.cyan}
					strokeWidth={3}
					opacity={morph * 0.95 * fall}
					rotate={4 - morph * 4}
				/>
			</CutIF>

			{/* D — the mark, alone, and then the air. */}
			<AbsoluteFill style={{alignItems: "center", justifyContent: "center"}}>
				<MarkIF start={markAt} />
			</AbsoluteFill>

			<CaptionIF cue={lSmall} emphasis={["grande", "não"]} />
			<CaptionIF cue={lChanged} emphasis={["mudando", "forma", "pedido"]} />
			{/* The last line gets no caption: "Essa foi a virada." is the mark on
			    screen, and a subtitle under it would crowd the film's last frame. */}
			<CaptionIF cue={lTurn} emphasis={["virada"]} offset={0} style={{opacity: 0}} />
		</AbsoluteFill>
	);
};
