import React from "react";
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from "remotion";
import {BackgroundIF} from "../../components/ifood/BackgroundIF";
import {BrowserWindow, GrowthChart, Skyline} from "../../components/ifood/DigitalProps";
import {OrderPad} from "../../components/ifood/PeriodProps";
import {TableTop} from "../../components/ifood/PrintedGuide";
import {Shot, Stage} from "../../components/ifood/Shot";
import {DisplayIF} from "../../components/ifood/TextIF";
import {cueForIF} from "../../utils/cue-if";
import {H, W} from "../../utils/layout";
import {IF} from "../../utils/theme-if";

const cue = cueForIF(4);

/**
 * Scene 5 — INVESTMENT (2013).
 *
 * "The following year came an important decision: Movile invested in the
 * business."
 *
 * No number is shown — none was given. The scene reads the decision through
 * its consequences: paper being signed, a line starting to climb, a skyline
 * filling in, the site scaling up. Warmer and steadier than scene 4 — this is
 * a company gaining ground, not a rush.
 */
export const Scene5Invest: React.FC = () => {
	const frame = useCurrentFrame();
	const l = cue("05-2013");

	const year = Math.round(l.at(0.04));
	const label = Math.round(l.at(0.8));

	const signed = interpolate(frame, [4, 46], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.out(Easing.quad),
	});
	const chart = interpolate(frame, [46, 98], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.out(Easing.cubic),
	});
	const skyline = interpolate(frame, [92, 138], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.out(Easing.cubic),
	});
	const siteScale = interpolate(frame, [134, 167], [0.86, 1.06], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.out(Easing.cubic),
	});

	return (
		<AbsoluteFill>
			<BackgroundIF lamp={0.74} lampY={34} />

			{/* 1 — the decision, on paper: a document signed. */}
			<Shot from={0} durationInFrames={46} fade={5} zoomFrom={1.02} zoomTo={1.16} panY={-16}>
				<Stage>
					<TableTop width={W} height={H} />
					<g transform="translate(340 700) scale(1.1)">
						<OrderPad written={signed} />
					</g>
				</Stage>
			</Shot>

			{/* 2 — the line starting to climb. */}
			<Shot from={42} durationInFrames={52} fade={5} zoomFrom={1.1} zoomTo={1.22} panX={20}>
				<Stage>
					<TableTop width={W} height={H} />
					<g transform="translate(240 760)">
						<GrowthChart progress={chart} />
					</g>
				</Stage>
			</Shot>

			{/* 3 — the city, filling in behind the business. */}
			<Shot from={90} durationInFrames={46} fade={5} zoomFrom={1.14} zoomTo={1.0} panY={12}>
				<Stage>
					<TableTop width={W} height={H} />
					<g transform="translate(220 900)">
						<Skyline progress={skyline} />
					</g>
				</Stage>
			</Shot>

			{/* 4 — the platform itself, gaining scale. */}
			<Shot from={132} durationInFrames={35} fade={5} zoomFrom={1} zoomTo={1.08}>
				<Stage>
					<TableTop width={W} height={H} />
					<g transform={`translate(190 700) scale(${siteScale})`}>
						<BrowserWindow on={1} rows={6} />
					</g>
				</Stage>
			</Shot>

			<DisplayIF start={year} fontSize={150} top={320} letterSpacing={18}>
				2013
			</DisplayIF>
			<DisplayIF
				start={label}
				fontSize={80}
				top={1220}
				color={IF.accent}
				letterSpacing={8}
				underline
				underlineWidth={520}
			>
				INVESTIMENTO
			</DisplayIF>
		</AbsoluteFill>
	);
};
