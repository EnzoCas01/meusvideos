import React from "react";
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from "remotion";
import {CaptionIF} from "../../components/ifood/CaptionIF";
import {CutIF} from "../../components/ifood/CutIF";
import {FrameIF} from "../../components/ifood/FrameIF";
import {GlyphIF} from "../../components/ifood/GlyphIF";
import {PhotoIF} from "../../components/ifood/PhotoIF";
import {TextIF} from "../../components/ifood/TextIF";
import {YearIF} from "../../components/ifood/YearIF";
import {seededRandom} from "../../utils/bezier";
import {cueForIF} from "../../utils/cue-if";
import {imageAtIF} from "../../utils/images-if";
import {W} from "../../utils/layout";
import {IF} from "../../utils/theme-if";

const cue = cueForIF(3);

const END = 210;

/**
 * A delivery interface being assembled, row by row.
 *
 * Generic on purpose: a search field, a list of restaurant rows, a cart bar.
 * No third-party UI is reproduced and no platform badge appears — the brief
 * names Android and iPhone in the narration, but neither mark may be drawn.
 */
const PhoneUI: React.FC<{x: number; y: number; h: number; build: number; frame: number}> = ({
	x,
	y,
	h,
	build,
	frame,
}) => {
	const w = h * 0.49;
	const rows = 5;
	const shell = Math.max(0, Math.min(1, build / 0.28));
	return (
		<div
			style={{
				position: "absolute",
				left: x - w / 2,
				top: y - h / 2,
				width: w,
				height: h,
				borderRadius: h * 0.075,
				border: `3px solid rgba(111,214,224,${0.55 * shell})`,
				background: "rgba(8,7,10,0.72)",
				boxShadow: `0 0 ${70 * shell}px rgba(111,214,224,0.16)`,
				overflow: "hidden",
				opacity: shell,
			}}
		>
			{/* Search field. */}
			<div
				style={{
					position: "absolute",
					left: w * 0.08,
					top: h * 0.07,
					width: w * 0.84 * Math.max(0, Math.min(1, (build - 0.2) / 0.16)),
					height: h * 0.05,
					borderRadius: h * 0.025,
					background: IF.cyanSoft,
				}}
			/>
			{/* Restaurant rows: thumbnail, name, rating bar. */}
			{Array.from({length: rows}, (_, i) => {
				const a = Math.max(0, Math.min(1, (build - 0.34 - i * 0.1) / 0.12));
				if (a <= 0.01) return null;
				const top = h * (0.17 + i * 0.13);
				return (
					<div key={i} style={{position: "absolute", left: w * 0.08, top, opacity: a}}>
						<div
							style={{
								position: "absolute",
								width: h * 0.085,
								height: h * 0.085,
								borderRadius: 6,
								background: "rgba(245,243,242,0.13)",
							}}
						/>
						<div
							style={{
								position: "absolute",
								left: h * 0.11,
								top: h * 0.012,
								width: w * (0.42 + seededRandom(i * 9 + 1) * 0.22),
								height: 7,
								borderRadius: 4,
								background: "rgba(245,243,242,0.42)",
							}}
						/>
						<div
							style={{
								position: "absolute",
								left: h * 0.11,
								top: h * 0.045,
								width: w * 0.24,
								height: 5,
								borderRadius: 3,
								background: IF.cyanSoft,
							}}
						/>
					</div>
				);
			})}
			{/* Cart bar: the last thing to arrive, and it pulses. */}
			<div
				style={{
					position: "absolute",
					left: w * 0.08,
					bottom: h * 0.05,
					width: w * 0.84,
					height: h * 0.062,
					borderRadius: h * 0.031,
					background: IF.red,
					opacity: Math.max(0, Math.min(1, (build - 0.86) / 0.12)) * (0.72 + 0.28 * Math.sin(frame / 7)),
				}}
			/>
		</div>
	);
};

/** Orders raining into the restaurant at the end of the scene. */
const INCOMING = Array.from({length: 10}, (_, i) => ({
	x: 130 + seededRandom(i * 17 + 3) * 820,
	y: 520 + seededRandom(i * 11 + 7) * 1000,
	size: 150 + seededRandom(i * 5 + 13) * 90,
	rotate: (seededRandom(i * 23 + 2) - 0.5) * 40,
}));

/**
 * Scene 4 — THE APP ARRIVES (0:17 - 0:24).
 *
 * "Em 2012, chegaram o site e os aplicativos para Android e iPhone."
 *
 * The image is the thing being made: an interface assembling itself, field by
 * field, row by row, in front of the viewer — the opposite of scene 2's paper
 * slips. Then the other end of the wire: a restaurant, and orders arriving at
 * it without a phone ringing.
 *
 * Five beats in seven seconds, the shortest in the film so far (1.2 - 1.8s
 * each), which is where the brief asks the pace to pick up.
 */
export const Scene4Apps: React.FC = () => {
	const frame = useCurrentFrame();
	const l7 = cue("07-site-e-apps");

	// The date beat is pinned to the words "dois mil e doze"; the beats around it
	// are derived from it, so the whole scene slides together on a remeasure.
	const yearAt = Math.round(l7.at(0.05));
	const b3Start = yearAt - 5;
	const b4Start = b3Start + 48;
	const b5Start = b4Start + 42;

	const build = interpolate(frame, [30, 120], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.out(Easing.cubic),
	});
	const storeDraw = interpolate(frame, [b4Start + 2, b4Start + 28], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.out(Easing.cubic),
	});

	return (
		<AbsoluteFill>
			<FrameIF tone="cool" intensity={0.55} lightY={780} grain={0.45} />

			<PhotoIF
				image={imageAtIF(4, 0)}
				start={0}
				durationInFrames={b3Start}
				zoomFrom={1.12}
				zoomTo={1.28}
				panX={40}
				fadeIn={12}
				fadeOut={10}
				opacity={0.42}
				tintCyan={0.55}
			/>

			{/* A — the device arrives out of the dark, tilted, resolving from blur. */}
			<CutIF start={0} durationInFrames={48} fadeIn={10} fadeOut={3} zoomFrom={1.16} zoomTo={1.0} entryBlur={16}>
				<GlyphIF
					kind="mobile"
					x={W / 2}
					y={940}
					size={640}
					p={interpolate(frame, [2, 34], [0, 1], {
						extrapolateLeft: "clamp",
						extrapolateRight: "clamp",
						easing: Easing.out(Easing.cubic),
					})}
					color={IF.cyan}
					strokeWidth={3}
					rotate={-5}
				/>
			</CutIF>

			{/* B — the interface builds itself. */}
			<CutIF
				start={44}
				durationInFrames={b3Start - 44 + 3}
				fadeIn={4}
				fadeOut={4}
				zoomFrom={1.0}
				zoomTo={1.08}
				panY={-26}
			>
				<PhoneUI x={W / 2} y={960} h={1120} build={build} frame={frame} />
			</CutIF>

			{/* C — the date, as free-standing type on the stage, never over a photo. */}
			<CutIF start={b3Start} durationInFrames={b4Start - b3Start + 3} fadeIn={4} fadeOut={4} zoomFrom={1.0} zoomTo={1.05}>
				<PhoneUI x={W / 2} y={1320} h={760} build={1} frame={frame} />
				<AbsoluteFill style={{alignItems: "center", justifyContent: "flex-start"}}>
					<div style={{marginTop: 340}}>
						<YearIF year="2012" start={yearAt} fontSize={230} impact={0.45} />
					</div>
					<div style={{marginTop: 52}}>
						{/* "SITE + APP" — 10 chars at 92px ≈ 515px. */}
						<TextIF start={yearAt + 18} fontSize={92} fontWeight={500} letterSpacing={8} mode="wipe" inFrames={14}>
							SITE + APP
						</TextIF>
					</div>
				</AbsoluteFill>
			</CutIF>

			{/* D — the other end of the wire: the restaurant, and one order landing. */}
			<CutIF
				start={b4Start}
				durationInFrames={b5Start - b4Start + 3}
				fadeIn={3}
				fadeOut={3}
				zoomFrom={1.02}
				zoomTo={1.12}
				panX={-50}
				entryBlur={10}
			>
				<GlyphIF kind="store" x={W / 2} y={880} size={620} p={storeDraw} color={IF.white} strokeWidth={2.8} />
				<GlyphIF
					kind="ticket"
					x={760}
					y={1370}
					size={280}
					p={interpolate(frame, [b4Start + 18, b4Start + 34], [0, 1], {
						extrapolateLeft: "clamp",
						extrapolateRight: "clamp",
					})}
					color={IF.cyan}
					glow={0.4}
					rotate={9}
				/>
			</CutIF>

			{/* E — and then they do not stop arriving. */}
			<CutIF start={b5Start} durationInFrames={END - b5Start} fadeIn={3} fadeOut={6} zoomFrom={1.1} zoomTo={0.94}>
				{INCOMING.map((o, i) => {
					const a = interpolate(frame, [b5Start + i * 2, b5Start + 10 + i * 2], [0, 1], {
						extrapolateLeft: "clamp",
						extrapolateRight: "clamp",
						easing: Easing.out(Easing.cubic),
					});
					return (
						<GlyphIF
							key={i}
							kind="ticket"
							x={o.x}
							y={o.y}
							size={o.size}
							p={a}
							color={i % 3 === 0 ? IF.cyan : IF.white}
							opacity={0.3 + 0.55 * a}
							rotate={o.rotate}
							strokeWidth={2.4}
						/>
					);
				})}
			</CutIF>

			<CaptionIF cue={l7} emphasis={["site", "aplicativos"]} />
		</AbsoluteFill>
	);
};
