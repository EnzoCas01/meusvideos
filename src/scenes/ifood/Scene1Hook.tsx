import React from "react";
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from "remotion";
import {BackgroundIF} from "../../components/ifood/BackgroundIF";
import {Hand} from "../../components/ifood/Hand";
import {GuideCover, OpenGuide, TableTop} from "../../components/ifood/PrintedGuide";
import {Shot, Stage} from "../../components/ifood/Shot";
import {DisplayIF} from "../../components/ifood/TextIF";
import {cueForIF} from "../../utils/cue-if";
import {H, W} from "../../utils/layout";
import {IF, TYPE_IF} from "../../utils/theme-if";

const cue = cueForIF(0);

/**
 * Scene 1 — THE HOOK.
 *
 * "Before it was the app you order food with, iFood was... a piece of paper."
 *
 * The scene is the object: a printed restaurant guide on a table, found by the
 * camera in the dark, opened, leafed through by a hand. On the dramatic pause
 * the room drops to almost nothing; then the camera is inside the paper and
 * the word PAPEL is stamped on the frame exactly as it is spoken.
 *
 * Every beat below is derived from the narration JSON, never typed in.
 */
export const Scene1Hook: React.FC = () => {
	const frame = useCurrentFrame();
	const l = cue("01-gancho");

	/** The held silence in the middle of the line — the "..." */
	const pause = Math.round(l.at(0.63));
	/** The frame the word "papel" lands on. The impact sound goes here. */
	const papel = Math.round(l.at(0.8));

	// One lamp, and the scene's whole grammar of light: it comes up as the
	// camera finds the guide, collapses in the pause, and flares on the word.
	const lamp =
		interpolate(frame, [0, 42], [0, 0.78], {
			extrapolateLeft: "clamp",
			extrapolateRight: "clamp",
			easing: Easing.out(Easing.cubic),
		}) *
		interpolate(
			frame,
			[pause - 10, pause + 4, pause + 22, papel - 2, papel + 3, papel + 26],
			[1, 0.16, 0.6, 0.62, 1.5, 0.85],
			{extrapolateLeft: "clamp", extrapolateRight: "clamp"},
		);

	const turn = interpolate(frame, [118, 152], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.inOut(Easing.quad),
	});
	// The hand comes in from the bottom right, pinches, sweeps the page left.
	const handIn = interpolate(frame, [96, 120], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.out(Easing.cubic),
	});
	const handOut = interpolate(frame, [pause - 8, pause + 2], [1, 0], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});
	// It has to land ON the page — a hand floating below the book is a shape,
	// not a gesture.
	const handX = 1160 - handIn * 320 - turn * 300;
	const handY = 1560 - handIn * 380 + turn * 40;

	// The stamp darkens what is behind it: the word is the frame for a second.
	const stamp = interpolate(frame, [papel - 1, papel + 4], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	return (
		<AbsoluteFill>
			<BackgroundIF lamp={lamp} lampY={42} vignette={1.05} />

			{/* 1 — the guide found in the dark, closed, camera pushing in. */}
			<Shot from={0} durationInFrames={94} fade={8} zoomFrom={1.02} zoomTo={1.16} panY={-30}>
				<Stage>
					<TableTop width={W} height={H} />
					<g transform="translate(90 520) rotate(-1.6 451 306)">
						<GuideCover />
					</g>
				</Stage>
			</Shot>

			{/* 2 — open on the table; a hand turns a page. */}
			<Shot
				from={88}
				durationInFrames={pause - 84}
				fade={6}
				zoomFrom={1.05}
				zoomTo={1.2}
				panX={-26}
				panY={20}
			>
				<Stage>
					<TableTop width={W} height={H} />
					<g transform="translate(90 600)">
						<OpenGuide turn={turn} />
					</g>
					{handOut > 0.01 ? (
						<g transform={`translate(${handX} ${handY}) rotate(-34) scale(1.02)`} opacity={handOut}>
							<Hand curl={Math.min(1, handIn * 0.4 + turn * 1.2)} />
						</g>
					) : null}
				</Stage>
			</Shot>

			{/* 3 — inside the paper. The camera is close enough to read nothing. */}
			<Shot
				from={pause + 16}
				durationInFrames={249 - (pause + 16)}
				fade={7}
				zoomFrom={1.08}
				zoomTo={1.3}
				panY={-40}
				origin="46% 42%"
			>
				<Stage>
					<TableTop width={W} height={H} />
					<g transform="translate(0 168) scale(2.3)">
						<OpenGuide />
					</g>
					{/* This close, the lamp only reaches part of the page: without
					    this the macro is a flat beige wall. */}
					<rect width={W} height={H} fill="#0A0703" opacity={0.3} />
					<rect width={W} height={H} fill="url(#if-macro-pool)" />
					<defs>
						<radialGradient id="if-macro-pool" cx="44%" cy="40%" r="52%">
							<stop offset="0%" stopColor="rgba(232,164,90,0.2)" />
							<stop offset="100%" stopColor="rgba(0,0,0,0)" />
						</radialGradient>
					</defs>
				</Stage>
			</Shot>

			{/* The word, stamped on the frame as it is spoken. */}
			<AbsoluteFill style={{backgroundColor: "#070603", opacity: stamp * 0.68}} />
			<AbsoluteFill
				style={{
					backgroundColor: IF.accent,
					opacity: interpolate(frame, [papel - 1, papel + 1, papel + 8], [0, 0.16, 0], {
						extrapolateLeft: "clamp",
						extrapolateRight: "clamp",
					}),
					mixBlendMode: "screen",
				}}
			/>
			<DisplayIF
				start={papel}
				fontSize={TYPE_IF.huge}
				top={820}
				underline
				underlineWidth={560}
				letterSpacing={14}
			>
				PAPEL
			</DisplayIF>
		</AbsoluteFill>
	);
};
