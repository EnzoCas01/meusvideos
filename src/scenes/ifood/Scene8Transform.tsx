import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {BackgroundIF} from "../../components/ifood/BackgroundIF";
import {BrowserWindow, NotificationBadge} from "../../components/ifood/DigitalProps";
import {CityMap, Courier, MapRoute} from "../../components/ifood/MapProps";
import {CounterScene, CrtMonitor, EarlyPhone} from "../../components/ifood/PeriodProps";
import {GuideCover, TableTop} from "../../components/ifood/PrintedGuide";
import {Shot, Stage} from "../../components/ifood/Shot";
import {DisplayIF} from "../../components/ifood/TextIF";
import {cueForIF} from "../../utils/cue-if";
import {H, W} from "../../utils/layout";
import {IF} from "../../utils/theme-if";

const cue = cueForIF(7);

/**
 * Scene 8 — TRANSFORMATION.
 *
 * "And what had started with a printed guide had turned into a digital
 * platform in fast expansion."
 *
 * A rapid montage that reprises the whole film in fifteen quick cuts: paper,
 * counter, phone, screen, site, map, courier, orders — every image the story
 * has already shown, faster each time. The words PAPEL, APP and PLATAFORMA
 * land on top of it like a heartbeat speeding up.
 */
export const Scene8Transform: React.FC = () => {
	const frame = useCurrentFrame();
	const l = cue("08-transformacao");

	const wordPapel = Math.round(l.at(0.04));
	const wordApp = Math.round(l.at(0.46));
	const wordPlataforma = Math.round(l.at(0.79));

	const cuts = [16, 15, 15, 14, 14, 13, 13, 12, 12, 12, 12, 13, 15, 18];
	const starts: number[] = [];
	let acc = 0;
	for (const d of cuts) {
		starts.push(acc);
		acc += d;
	}

	const badgePop = (from: number) =>
		Math.min(1, Math.max(0, (frame - from) / 6));

	return (
		<AbsoluteFill>
			<BackgroundIF lamp={0.64} lampY={36} />

			<Shot from={starts[0]} durationInFrames={cuts[0]} fade={3} zoomFrom={1.02} zoomTo={1.16}>
				<Stage>
					<TableTop width={W} height={H} />
					<g transform="translate(90 560)">
						<GuideCover />
					</g>
				</Stage>
			</Shot>

			<Shot from={starts[1]} durationInFrames={cuts[1]} fade={3} zoomFrom={1.14} zoomTo={1.28} panY={20}>
				<Stage>
					<TableTop width={W} height={H} />
					<g transform="translate(0 640)">
						<CounterScene glow={0.9} />
					</g>
				</Stage>
			</Shot>

			<Shot from={starts[2]} durationInFrames={cuts[2]} fade={3} zoomFrom={1.08} zoomTo={1.22} panX={-20}>
				<Stage>
					<TableTop width={W} height={H} />
					<g transform="translate(340 660) scale(1.1)">
						<EarlyPhone on={1} rows={5} />
					</g>
				</Stage>
			</Shot>

			<Shot from={starts[3]} durationInFrames={cuts[3]} fade={3} zoomFrom={1.1} zoomTo={1.24} panY={-16}>
				<Stage>
					<TableTop width={W} height={H} />
					<g transform="translate(160 660)">
						<CrtMonitor on={1} rows={7} />
					</g>
				</Stage>
			</Shot>

			<Shot from={starts[4]} durationInFrames={cuts[4]} fade={3} zoomFrom={1.02} zoomTo={1.14} panX={16}>
				<Stage>
					<TableTop width={W} height={H} />
					<g transform="translate(190 700)">
						<BrowserWindow on={1} rows={5} />
					</g>
				</Stage>
			</Shot>

			<Shot from={starts[5]} durationInFrames={cuts[5]} fade={3} zoomFrom={0.9} zoomTo={1} origin="50% 40%">
				<Stage>
					<TableTop width={W} height={H} />
					<g transform="translate(80 320)">
						<CityMap opacity={0.8} />
						<MapRoute from={{x: 260, y: 480}} to={{x: 620, y: 780}} progress={1} bow={40} />
					</g>
				</Stage>
			</Shot>

			<Shot from={starts[6]} durationInFrames={cuts[6]} fade={3} zoomFrom={1.5} zoomTo={1.7}>
				<Stage>
					<TableTop width={W} height={H} />
					<g transform="translate(540 900)">
						<Courier scale={4} angle={-16} />
					</g>
				</Stage>
			</Shot>

			<Shot from={starts[7]} durationInFrames={cuts[7]} fade={3} zoomFrom={1.02} zoomTo={1.12}>
				<Stage>
					<TableTop width={W} height={H} />
					<g transform="translate(90 560)">
						<GuideCover />
					</g>
				</Stage>
			</Shot>

			<Shot from={starts[8]} durationInFrames={cuts[8]} fade={3} zoomFrom={1.02} zoomTo={1.14} panX={-16}>
				<Stage>
					<TableTop width={W} height={H} />
					<g transform="translate(340 660) scale(1.1)">
						<EarlyPhone on={1} rows={5} />
					</g>
				</Stage>
			</Shot>

			<Shot from={starts[9]} durationInFrames={cuts[9]} fade={3} zoomFrom={0.94} zoomTo={1.04}>
				<Stage>
					<TableTop width={W} height={H} />
					<g transform="translate(190 700)">
						<BrowserWindow on={1} rows={6} />
					</g>
					{[0, 4, 8].map((d, i) => (
						<NotificationBadge key={i} x={550 + i * 80} y={720} pop={badgePop(starts[9] + d)} />
					))}
				</Stage>
			</Shot>

			<Shot from={starts[10]} durationInFrames={cuts[10]} fade={3} zoomFrom={0.9} zoomTo={1} origin="50% 40%">
				<Stage>
					<TableTop width={W} height={H} />
					<g transform="translate(80 320)">
						<CityMap opacity={0.85} />
						{[
							{x: 200, y: 400},
							{x: 500, y: 620},
							{x: 780, y: 340},
						].map((p, i) => (
							<NotificationBadge key={i} x={p.x} y={p.y} pop={badgePop(starts[10] + i * 4)} />
						))}
					</g>
				</Stage>
			</Shot>

			<Shot from={starts[11]} durationInFrames={cuts[11]} fade={3} zoomFrom={1.5} zoomTo={1.66}>
				<Stage>
					<TableTop width={W} height={H} />
					<g transform="translate(540 900)">
						<Courier scale={4.2} angle={12} />
					</g>
				</Stage>
			</Shot>

			<Shot from={starts[12]} durationInFrames={cuts[12]} fade={4} zoomFrom={1} zoomTo={1.1}>
				<Stage>
					<TableTop width={W} height={H} />
					<g transform="translate(190 700)">
						<BrowserWindow on={1} rows={7} />
					</g>
				</Stage>
			</Shot>

			<Shot from={starts[13]} durationInFrames={cuts[13]} fade={5} zoomFrom={0.92} zoomTo={1.02} origin="50% 40%">
				<Stage>
					<TableTop width={W} height={H} />
					<g transform="translate(80 320)">
						<CityMap />
						<MapRoute from={{x: 200, y: 380}} to={{x: 620, y: 260}} progress={1} bow={30} />
						<MapRoute from={{x: 620, y: 260}} to={{x: 500, y: 780}} progress={1} bow={-30} />
						<MapRoute from={{x: 200, y: 900}} to={{x: 700, y: 900}} progress={1} bow={20} color={IF.grey} />
					</g>
				</Stage>
			</Shot>

			<DisplayIF start={wordPapel} end={wordApp - 4} fontSize={130} top={760} letterSpacing={14} color={IF.grey}>
				PAPEL
			</DisplayIF>
			<DisplayIF start={wordApp} end={wordPlataforma - 4} fontSize={140} top={760} letterSpacing={14}>
				APP
			</DisplayIF>
			<DisplayIF
				start={wordPlataforma}
				fontSize={112}
				top={760}
				letterSpacing={10}
				color={IF.accent}
				underline
				underlineWidth={560}
			>
				PLATAFORMA
			</DisplayIF>
		</AbsoluteFill>
	);
};
