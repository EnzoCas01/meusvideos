import React from "react";
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from "remotion";
import {BackgroundIF} from "../../components/ifood/BackgroundIF";
import {CounterScene, CrtMonitor, DeskPhone, OrderPad} from "../../components/ifood/PeriodProps";
import {GuideCover, OpenGuide, TableTop} from "../../components/ifood/PrintedGuide";
import {Shot, Stage} from "../../components/ifood/Shot";
import {DisplayIF} from "../../components/ifood/TextIF";
import {cueForIF} from "../../utils/cue-if";
import {H, W} from "../../utils/layout";
import {IF, TYPE_IF} from "../../utils/theme-if";

const cue = cueForIF(1);

/**
 * Scene 2 — THE BEGINNING (2011).
 *
 * "In 2011 the company started with Disk Cook, a printed menu guide. Orders
 * were placed by telephone."
 *
 * Five shots in nine seconds, all of them moving: the guide, the pages, the
 * counter at night, an order written by hand, the telephone. The point of the
 * cut is that every single step is done by a person — there is no screen in
 * this scene except one that is switched off in the background.
 */
export const Scene2Start: React.FC = () => {
	const frame = useCurrentFrame();
	const l = cue("02-2011");

	/** "Em dois mil e onze" and "Disk Cook", as fractions of the spoken line. */
	const year = Math.round(l.at(0.155));
	const brand = Math.round(l.at(0.38));

	const written = interpolate(frame, [188, 228], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.out(Easing.quad),
	});
	const lift = interpolate(frame, [230, 248], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.out(Easing.cubic),
	});

	return (
		<AbsoluteFill>
			<BackgroundIF lamp={0.72} lampY={40} />

			{/* 1 — the guide, as an object on the counter. */}
			<Shot from={0} durationInFrames={62} fade={6} zoomFrom={1.18} zoomTo={1.04} panY={20}>
				<Stage>
					<TableTop width={W} height={H} />
					<g transform="translate(90 560)">
						<GuideCover />
					</g>
				</Stage>
			</Shot>

			{/* 2 — inside it: columns of menus, page after page. */}
			<Shot from={58} durationInFrames={70} fade={5} zoomFrom={1.5} zoomTo={1.72} panX={60} panY={-30}>
				<Stage>
					<TableTop width={W} height={H} />
					<g transform="translate(90 660)">
						<OpenGuide turn={interpolate(frame, [62, 118], [0, 0.9], {extrapolateLeft: "clamp", extrapolateRight: "clamp"})} />
					</g>
				</Stage>
			</Shot>

			{/* 3 — the room the orders came into. */}
			<Shot from={124} durationInFrames={64} fade={5} zoomFrom={1.1} zoomTo={1.24} panX={-50}>
				<Stage>
					<TableTop width={W} height={H} />
					<g transform="translate(0 620)">
						<CounterScene glow={0.9} />
					</g>
				</Stage>
			</Shot>

			{/* 4 — the order, written by hand. A dead CRT sits behind it. */}
			<Shot from={184} durationInFrames={44} fade={5} zoomFrom={1.06} zoomTo={1.2} panY={-24}>
				<Stage>
					<TableTop width={W} height={H} />
					<g transform="translate(300 300) scale(0.8)" opacity={0.4} style={{filter: "blur(7px)"}}>
						<CrtMonitor on={0} cursorOn={false} />
					</g>
					<g transform="translate(330 780) scale(1.05)">
						<OrderPad written={written} />
					</g>
				</Stage>
			</Shot>

			{/* 5 — and the telephone, which was the whole interface. */}
			<Shot from={224} durationInFrames={44} fade={5} zoomFrom={1.04} zoomTo={1.18} panX={30}>
				<Stage>
					<TableTop width={W} height={H} />
					<g transform="translate(230 820) scale(1.45)">
						<DeskPhone lift={lift} cordPhase={frame * 0.11} />
					</g>
				</Stage>
			</Shot>

			<DisplayIF start={year} end={year + 62} fontSize={TYPE_IF.big} top={360} letterSpacing={20}>
				2011
			</DisplayIF>
			<DisplayIF
				start={brand}
				end={brand + 66}
				fontSize={TYPE_IF.mid}
				top={1240}
				color={IF.accent}
				letterSpacing={12}
			>
				DISK COOK
			</DisplayIF>
		</AbsoluteFill>
	);
};
