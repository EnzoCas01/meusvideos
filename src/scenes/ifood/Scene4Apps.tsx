import React from "react";
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from "remotion";
import {BackgroundIF} from "../../components/ifood/BackgroundIF";
import {BrowserWindow, NotificationBadge} from "../../components/ifood/DigitalProps";
import {Hand} from "../../components/ifood/Hand";
import {CrtMonitor, EarlyPhone} from "../../components/ifood/PeriodProps";
import {TableTop} from "../../components/ifood/PrintedGuide";
import {Shot, Stage} from "../../components/ifood/Shot";
import {DisplayIF} from "../../components/ifood/TextIF";
import {cueForIF} from "../../utils/cue-if";
import {H, W} from "../../utils/layout";
import {IF} from "../../utils/theme-if";

const cue = cueForIF(3);

/**
 * Scene 4 — SITE + APPS (2012).
 *
 * "In 2012, the site and the Android and iPhone apps arrived."
 *
 * Four shots: the phone screen lighting up with the app being built row by
 * row, the site next to it, a hand tapping an order in, and the restaurant's
 * screen lighting up with the orders that come back — several at once. The
 * scene's whole point is speed: the interface exists now, so it multiplies.
 */
export const Scene4Apps: React.FC = () => {
	const frame = useCurrentFrame();
	const l = cue("04-2012");

	const year = Math.round(l.at(0.28));
	const label = Math.round(l.at(0.56));

	const phoneOn = interpolate(frame, [0, 40], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.out(Easing.quad),
	});
	const siteOn = interpolate(frame, [40, 86], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.out(Easing.quad),
	});
	const tap = interpolate(frame, [92, 108], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.out(Easing.cubic),
	});
	const crtOn = interpolate(frame, [122, 146], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.out(Easing.quad),
	});

	const badges = [
		{x: 470, y: 140, d: 0},
		{x: 320, y: 210, d: 6},
		{x: 600, y: 200, d: 12},
		{x: 420, y: 280, d: 18},
	];

	return (
		<AbsoluteFill>
			<BackgroundIF lamp={0.68} lampY={36} />

			{/* 1 — the phone, interface building itself row by row. */}
			<Shot from={0} durationInFrames={44} fade={5} zoomFrom={1.15} zoomTo={1.02} panY={-10}>
				<Stage>
					<TableTop width={W} height={H} />
					<g transform="translate(360 640) scale(1.15)">
						<EarlyPhone on={phoneOn} rows={6} />
					</g>
				</Stage>
			</Shot>

			{/* 2 — the site, next to it: the same story on a bigger screen. */}
			<Shot from={40} durationInFrames={50} fade={5} zoomFrom={1.04} zoomTo={1.16} panX={-24}>
				<Stage>
					<TableTop width={W} height={H} />
					<g transform="translate(190 700)">
						<BrowserWindow on={siteOn} rows={5} />
					</g>
				</Stage>
			</Shot>

			{/* 3 — a finger taps the order in. */}
			<Shot from={88} durationInFrames={38} fade={4} zoomFrom={1.1} zoomTo={1.24} origin="60% 55%">
				<Stage>
					<TableTop width={W} height={H} />
					<g transform="translate(340 560) scale(1.3)">
						<EarlyPhone on={1} rows={4} />
					</g>
					<g
						transform={`translate(${760 - tap * 220} ${1360 - tap * 340}) rotate(-30) scale(0.9)`}
						opacity={interpolate(tap, [0, 0.15, 1], [0, 1, 1])}
					>
						<Hand curl={tap} />
					</g>
				</Stage>
			</Shot>

			{/* 4 — the restaurant's screen, several orders landing at once. */}
			<Shot from={120} durationInFrames={44} fade={5} zoomFrom={1.06} zoomTo={1.2} panY={-18}>
				<Stage>
					<TableTop width={W} height={H} />
					<g transform="translate(160 660)">
						<CrtMonitor on={crtOn} rows={7} />
					</g>
					{badges.map((b, i) => (
						<NotificationBadge
							key={i}
							x={160 + b.x}
							y={660 + b.y}
							pop={interpolate(frame, [128 + b.d, 140 + b.d], [0, 1], {
								extrapolateLeft: "clamp",
								extrapolateRight: "clamp",
							})}
						/>
					))}
				</Stage>
			</Shot>

			<DisplayIF start={year} fontSize={150} top={330} letterSpacing={18}>
				2012
			</DisplayIF>
			<DisplayIF
				start={label}
				fontSize={80}
				top={1220}
				color={IF.accent}
				letterSpacing={10}
				underline
				underlineWidth={420}
			>
				SITE + APP
			</DisplayIF>
		</AbsoluteFill>
	);
};
