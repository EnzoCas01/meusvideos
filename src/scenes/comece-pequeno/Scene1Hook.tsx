import React from "react";
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from "remotion";
import {BackgroundCP} from "../../components/comece-pequeno/BackgroundCP";
import {CardGlyph} from "../../components/comece-pequeno/CardGlyph";
import {PhotoCard} from "../../components/comece-pequeno/PhotoCard";
import {TextCP} from "../../components/comece-pequeno/TextCP";
import {seededRandom} from "../../utils/bezier";
import {cueFor} from "../../utils/cue-cp";
import {imageAt} from "../../utils/images-cp";
import {W, H} from "../../utils/layout";
import {CP} from "../../utils/theme-cp";

const cue = cueFor(0);

/** Four columns, three rows — twelve, and readable as twelve at a glance. */
const CARD_W = 170;
const COLS = [231, 437, 643, 849];
const ROWS = [1030, 1180, 1330];
const GRID_CX = 540;
const GRID_CY = 1180;

const CARDS = ROWS.flatMap((cy, r) =>
	COLS.map((cx, c) => ({
		cx,
		cy,
		// Deterministic tilt so the twelve read as objects, not as a table.
		rotate: (seededRandom(r * 4 + c + 7) - 0.5) * 9,
		order: r * 4 + c,
	})),
);

/**
 * Scene 1 — THE HOOK.
 *
 * "In 2013 it started with a small team and just twelve cards." The image is
 * literal: twelve cards land one by one, exactly across the half of the line
 * where he counts them. Then, under "today you probably know the name", the
 * twelve shrink until they are almost nothing against the frame — which is the
 * whole point of the piece.
 *
 * Every frame below is derived from the narration JSON via `cue()`.
 */
export const Scene1Hook: React.FC = () => {
	const frame = useCurrentFrame();

	const l1 = cue("01-em-2013"); // "Em dois mil e treze... apenas doze cartões."
	const l2 = cue("02-hoje-conhece"); // "Hoje, você provavelmente conhece o nome."

	const photo = imageAt(1, 0);

	// The twelve start landing halfway through the first line — where the count
	// arrives — and the last one lands as the line ends.
	const dealStart = Math.round(l1.at(0.46));
	const dealSpan = Math.max(24, l1.end - dealStart);
	const step = dealSpan / (CARDS.length - 1);

	// Under the second line the grid recedes: one object shrinking away from the
	// viewer, not twelve things fading out.
	const recede = interpolate(frame, [l2.start, l2.at(1.05)], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.inOut(Easing.cubic),
	});
	const gridScale = 1 - 0.87 * recede;
	const gridOpacity = 1 - 0.62 * recede;

	// The year is typography, never a caption pinned to a photograph.
	const yearIn = interpolate(frame, [l1.start, l1.start + 34], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.out(Easing.cubic),
	});
	// It never leaves entirely: it is the top anchor of the closing composition,
	// which would otherwise be a speck at the bottom of an empty frame.
	const yearOut = interpolate(frame, [dealStart, dealStart + 40], [1, 0.55], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	const closeStart = Math.round(l2.end - 20);

	return (
		<AbsoluteFill>
			<BackgroundCP glow={0.45 + 0.35 * (1 - recede)} glowY={58} />

			{/* 2013, set large and dim: the date as type, sitting behind the story. */}
			<AbsoluteFill style={{alignItems: "center", justifyContent: "flex-start"}}>
				<div
					style={{
						marginTop: 90,
						fontSize: 250,
						fontWeight: 200,
						letterSpacing: 18,
						color: CP.white,
						opacity: 0.13 * yearIn * yearOut,
						transform: `translateY(${(1 - yearIn) * 30}px)`,
						filter: `blur(${(1 - yearIn) * 16}px)`,
						fontVariantNumeric: "tabular-nums",
					}}
				>
					2013
				</div>
			</AbsoluteFill>

			{/* The room it started in. Archival grade is requested but the PhotoCard
			    only honours it when the manifest marked the shot as a record. */}
			<PhotoCard
				image={photo}
				start={0}
				durationInFrames={l2.start + 40}
				x={170}
				y={370}
				width={740}
				height={470}
				zoomFrom={1.04}
				zoomTo={1.22}
				panX={-54}
				panY={26}
				fadeIn={28}
				fadeOut={36}
				opacity={0.92}
				grade="record"
				tint={0.22}
			/>

			<svg
				width={W}
				height={H}
				viewBox={`0 0 ${W} ${H}`}
				style={{position: "absolute", top: 0, left: 0}}
			>
				<g
					transform={`translate(${GRID_CX} ${GRID_CY}) scale(${gridScale}) translate(${-GRID_CX} ${-GRID_CY})`}
					opacity={gridOpacity}
				>
					{CARDS.map((c) => (
						<CardGlyph
							key={c.order}
							cx={c.cx}
							cy={c.cy}
							width={CARD_W}
							rotate={c.rotate}
							start={Math.round(dealStart + c.order * step)}
						/>
					))}
				</g>
			</svg>

			{/* The turn of the scene, written rather than spoken. */}
			<AbsoluteFill style={{alignItems: "center", justifyContent: "flex-start"}}>
				<div
					style={{
						position: "absolute",
						top: 860,
						width: "100%",
						display: "flex",
						justifyContent: "center",
					}}
				>
					<TextCP start={closeStart} fontSize={60} fontWeight={300} maxWidth={820} inFrames={38}>
						Mas quase ninguém lembra
						<br />
						de como começou.
					</TextCP>
				</div>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};
