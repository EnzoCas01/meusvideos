import React from "react";
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from "remotion";
import {CaptionIF} from "../../components/ifood/CaptionIF";
import {CityMapIF} from "../../components/ifood/CityMapIF";
import {CutIF} from "../../components/ifood/CutIF";
import {FrameIF} from "../../components/ifood/FrameIF";
import {GlyphIF} from "../../components/ifood/GlyphIF";
import {PhotoIF} from "../../components/ifood/PhotoIF";
import {TextIF} from "../../components/ifood/TextIF";
import {seededRandom} from "../../utils/bezier";
import {cueForIF} from "../../utils/cue-if";
import {imageAtIF} from "../../utils/images-if";
import {W} from "../../utils/layout";
import {IF} from "../../utils/theme-if";

const cue = cueForIF(5);

const END = 270;

/**
 * The orders piling up at once — the shape of the problem, not a decoration.
 * Seeded, so the same twelve land in the same twelve places every render.
 */
const SIMULTANEOUS = Array.from({length: 12}, (_, i) => ({
	x: 130 + seededRandom(i * 29 + 4) * 820,
	y: 540 + seededRandom(i * 13 + 17) * 960,
	size: 130 + seededRandom(i * 7 + 23) * 80,
	rotate: (seededRandom(i * 37 + 11) - 0.5) * 44,
	pin: seededRandom(i * 19 + 5) > 0.55,
}));

/**
 * Scene 6 — THE PROBLEM (0:31 - 0:40).
 *
 * "Mas o grande desafio ainda estava pela frente." / "Como fazer o pedido
 * chegar até a porta do cliente?"
 *
 * This is the film's tension scene, so it is cut FASTER than anything before it
 * — six beats of 36-46 frames where scenes 1-5 ran 45-120. Each beat is one end
 * of the same unsolved problem: the kitchen that is ready, the customer who is
 * waiting, the courier who cannot find the address, and a city whose routes go
 * crooked (`CityMapIF` at full `tangle` — the component's dramatic axis, red
 * and overlapping rather than clean).
 *
 * The last thing that happens is deliberately NOTHING: after the question the
 * frame empties to a single pulsing address and the tangle freezes. That held
 * breath is the setup scene 7 resolves, and it is why the beats are clamped to
 * leave at least 44 frames of air at the end however the narration remeasures.
 */
export const Scene6Logistics: React.FC = () => {
	const frame = useCurrentFrame();
	const lChallenge = cue("10-desafio");
	const lDoor = cue("11-ate-a-porta");

	// Fixed, fast cadence for the first half; the second half is pinned to the
	// question so the map is at its worst exactly while it is being asked.
	const b1 = 0; //   the kitchen, ready
	const b2 = 38; //  the customer, waiting
	const b3 = 74; //  the courier, lost
	const b4 = 110; // the city, tangled
	const b5 = 154; // everything at once
	const b6 = 192; // the question

	// The breath. Clamped so it survives a remeasure in either direction.
	const breath = Math.max(b6 + 22, Math.min(END - 44, Math.round(lDoor.end + 8)));

	const labelAt = Math.round(lChallenge.end + 4);
	const labelEnd = breath - 12;

	const tick = (frame % 60) / 60;
	const fast = (frame % 42) / 42;

	const storeDraw = interpolate(frame, [b1 + 3, b1 + 26], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.out(Easing.cubic),
	});
	const personDraw = interpolate(frame, [b2 + 3, b2 + 26], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.out(Easing.cubic),
	});
	const scooterDraw = interpolate(frame, [b3 + 3, b3 + 24], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.out(Easing.cubic),
	});
	const mapGrid = interpolate(frame, [b4 + 2, b4 + 30], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.out(Easing.cubic),
	});
	const mapRoutes = interpolate(frame, [b4 + 12, b5 + 26], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.out(Easing.cubic),
	});
	// The breath: the tangle drains out of the frame rather than cutting away.
	const settle = interpolate(frame, [breath, breath + 26], [1, 0.34], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.out(Easing.cubic),
	});

	return (
		<AbsoluteFill>
			{/* The one scene where the key light is allowed to go red, and it climbs
			    through the scene — then drops back for the breath. */}
			<FrameIF
				tone="red"
				intensity={
					frame < breath ? 0.34 + 0.34 * Math.min(1, frame / Math.max(1, b5)) : 0.26 * settle + 0.1
				}
				lightY={1080 - 380 * Math.min(1, frame / END)}
				grain={0.55}
			/>

			<PhotoIF
				image={imageAtIF(6, 0)}
				start={b1}
				durationInFrames={b3 - b1}
				zoomFrom={1.12}
				zoomTo={1.3}
				panX={60}
				fadeIn={10}
				fadeOut={8}
				opacity={0.4}
				tintRed={0.45}
			/>
			<PhotoIF
				image={imageAtIF(6, 1)}
				start={b3}
				durationInFrames={b4 - b3}
				zoomFrom={1.14}
				zoomTo={1.32}
				panY={40}
				fadeIn={8}
				fadeOut={8}
				opacity={0.38}
				tintRed={0.4}
			/>

			{/* A — the kitchen: the order is ready and it is going nowhere. */}
			<CutIF
				start={b1}
				durationInFrames={b2 - b1 + 3}
				fadeIn={3}
				fadeOut={3}
				zoomFrom={1.04}
				zoomTo={1.16}
				panX={-40}
				entryBlur={12}
			>
				<GlyphIF kind="store" x={W / 2} y={880} size={640} p={storeDraw} color={IF.white} strokeWidth={2.8} />
				<GlyphIF
					kind="ticket"
					x={300}
					y={1400}
					size={260}
					p={storeDraw}
					color={IF.red}
					rotate={-14}
					glow={0.35}
				/>
				<GlyphIF kind="ticket" x={740} y={1440} size={230} p={storeDraw} color={IF.white} opacity={0.5} rotate={11} />
			</CutIF>

			{/* B — the other end: somebody behind a door, and a clock running. */}
			<CutIF
				start={b2}
				durationInFrames={b3 - b2 + 3}
				fadeIn={3}
				fadeOut={3}
				zoomFrom={1.02}
				zoomTo={1.13}
				panY={-30}
				entryBlur={10}
			>
				<GlyphIF kind="person" x={W / 2} y={920} size={600} p={personDraw} color={IF.grey} strokeWidth={2.8} />
				<GlyphIF
					kind="clock"
					x={W / 2}
					y={1460}
					size={300}
					p={personDraw}
					color={IF.red}
					strokeWidth={3}
					anim={tick}
					glow={0.3}
				/>
			</CutIF>

			{/* C — the courier, and three addresses that all look the same. */}
			<CutIF
				start={b3}
				durationInFrames={b4 - b3 + 3}
				fadeIn={3}
				fadeOut={3}
				zoomFrom={1.06}
				zoomTo={1.18}
				panX={70}
				entryBlur={12}
			>
				<GlyphIF
					kind="scooter"
					x={W / 2}
					y={1180}
					size={640}
					p={scooterDraw}
					color={IF.white}
					strokeWidth={2.8}
					anim={fast}
				/>
				{[
					{x: 250, y: 640, s: 210, d: 0},
					{x: 560, y: 540, s: 240, d: 6},
					{x: 860, y: 660, s: 200, d: 12},
				].map((pin, i) => {
					const a = interpolate(frame, [b3 + 8 + pin.d, b3 + 22 + pin.d], [0, 1], {
						extrapolateLeft: "clamp",
						extrapolateRight: "clamp",
					});
					// They blink out of step: which one is it?
					const flick = 0.35 + 0.65 * ((Math.sin((frame + i * 9) / 5) + 1) / 2);
					return (
						<GlyphIF
							key={i}
							kind="pin"
							x={pin.x}
							y={pin.y}
							size={pin.s}
							p={a}
							color={IF.red}
							opacity={a * flick}
							strokeWidth={3}
						/>
					);
				})}
			</CutIF>

			{/* D — the city as the problem: routes that double back on themselves. */}
			<CutIF
				start={b4}
				durationInFrames={b5 - b4 + 3}
				fadeIn={3}
				fadeOut={3}
				zoomFrom={1.0}
				zoomTo={1.1}
				panY={-26}
			>
				<CityMapIF
					x={W / 2}
					y={1060}
					width={840}
					height={1140}
					gridP={mapGrid}
					routeP={mapRoutes}
					routes={7}
					anim={fast}
					tangle={1}
				/>
			</CutIF>

			{/* E — and it is not one delivery. It is all of them, at once. */}
			<CutIF
				start={b5}
				durationInFrames={b6 - b5 + 3}
				fadeIn={3}
				fadeOut={3}
				zoomFrom={1.14}
				zoomTo={1.0}
			>
				<CityMapIF
					x={W / 2}
					y={1060}
					width={840}
					height={1140}
					gridP={1}
					routeP={1}
					routes={7}
					anim={fast}
					tangle={1}
					opacity={0.5}
				/>
				{SIMULTANEOUS.map((o, i) => {
					const a = interpolate(frame, [b5 + i * 2, b5 + 9 + i * 2], [0, 1], {
						extrapolateLeft: "clamp",
						extrapolateRight: "clamp",
						easing: Easing.out(Easing.cubic),
					});
					const beat = 0.5 + 0.5 * ((Math.sin((frame + i * 7) / 4.5) + 1) / 2);
					return (
						<GlyphIF
							key={i}
							kind={o.pin ? "pin" : "ticket"}
							x={o.x}
							y={o.y}
							size={o.size}
							p={a}
							color={o.pin ? IF.red : IF.white}
							opacity={a * (o.pin ? beat : 0.55)}
							rotate={o.rotate}
							strokeWidth={2.4}
						/>
					);
				})}
			</CutIF>

			{/* F — the question, asked over the worst version of the map. */}
			<CutIF
				start={b6}
				durationInFrames={breath - b6 + 3}
				fadeIn={3}
				fadeOut={4}
				zoomFrom={1.04}
				zoomTo={1.16}
				panX={-50}
				entryBlur={8}
			>
				<CityMapIF
					x={W / 2}
					y={1060}
					width={860}
					height={1160}
					gridP={1}
					routeP={1}
					routes={7}
					anim={fast}
					tangle={1}
					opacity={0.8}
				/>
				<GlyphIF
					kind="pin"
					x={W / 2}
					y={1060}
					size={300}
					p={1}
					color={IF.red}
					strokeWidth={4}
					glow={0.6}
				/>
			</CutIF>

			{/* G — THE BREATH. Nothing is answered. The tangle drains, one address
			    keeps pulsing, and the film holds still for a second and a half. */}
			<CutIF
				start={breath}
				durationInFrames={END - breath}
				fadeIn={8}
				fadeOut={6}
				zoomFrom={1.0}
				zoomTo={1.05}
			>
				<CityMapIF
					x={W / 2}
					y={1060}
					width={860}
					height={1160}
					gridP={1}
					routeP={1}
					routes={7}
					anim={0.5}
					tangle={1}
					opacity={settle * 0.5}
				/>
				<GlyphIF
					kind="pin"
					x={W / 2}
					y={1060}
					size={320}
					p={1}
					color={IF.red}
					strokeWidth={4}
					opacity={0.5 + 0.5 * ((Math.sin((frame - breath) / 9) + 1) / 2)}
					glow={0.5}
				/>
			</CutIF>

			{/* "O PROBLEMA:" / "LOGÍSTICA" — 21 chars would be 894px on one line at
			    76px, a hair from the edge. Two lines at 94px instead: the widest line
			    is 11 chars ≈ 580px, clear of both margins and twice as loud. */}
			<AbsoluteFill style={{alignItems: "center", justifyContent: "flex-start"}}>
				<div style={{marginTop: 330}}>
					<TextIF
						start={labelAt}
						end={labelEnd}
						fontSize={94}
						fontWeight={600}
						letterSpacing={7}
						mode="rise"
						inFrames={12}
						outFrames={8}
						lineHeight={1.12}
					>
						<span style={{color: IF.grey, fontWeight: 400}}>O PROBLEMA:</span>
						<br />
						<span style={{color: IF.red}}>LOGÍSTICA</span>
					</TextIF>
				</div>
			</AbsoluteFill>

			<CaptionIF cue={lChallenge} emphasis={["desafio", "grande"]} />
			<CaptionIF cue={lDoor} emphasis={["porta", "cliente", "chegar"]} />
		</AbsoluteFill>
	);
};
