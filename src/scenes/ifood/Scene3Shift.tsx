import React from "react";
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from "remotion";
import {BackgroundIF} from "../../components/ifood/BackgroundIF";
import {CrtMonitor, EarlyPhone} from "../../components/ifood/PeriodProps";
import {OpenGuide, TableTop} from "../../components/ifood/PrintedGuide";
import {Shot, Stage} from "../../components/ifood/Shot";
import {DisplayIF} from "../../components/ifood/TextIF";
import {cueForIF} from "../../utils/cue-if";
import {H, W} from "../../utils/layout";
import {IF} from "../../utils/theme-if";

const cue = cueForIF(2);

/**
 * Scene 3 — THE SHIFT.
 *
 * "But the world was changing. And they realised that model had to come off
 * the page."
 *
 * One idea, carried by the edit rather than by a graphic: the SAME list of
 * menu entries appears on paper, then on a CRT, then on a phone, and the cuts
 * get shorter each time — 58 frames, 50, 42, then three flashes of eight —
 * until the image lands on the phone and the two lines of type arrive with the
 * words "off the page".
 */
export const Scene3Shift: React.FC = () => {
	const frame = useCurrentFrame();
	const l = cue("03-mudando");

	const offPaper = Math.round(l.at(0.84));
	const toDigital = offPaper + 16;

	// The guide flips its own pages, faster and faster: the world changing
	// without anyone's hand on it.
	const flutter =
		interpolate(frame, [0, 58], [0, 2.6], {
			extrapolateLeft: "clamp",
			extrapolateRight: "clamp",
			easing: Easing.in(Easing.quad),
		}) + Math.max(0, frame - 58) * 0.075;
	const turn = flutter % 1;

	const paper = (
		<Stage>
			<TableTop width={W} height={H} />
			<g transform="translate(90 660) scale(1.02)">
				<OpenGuide turn={turn} />
			</g>
		</Stage>
	);
	const crt = (
		<Stage>
			<TableTop width={W} height={H} />
			<g transform="translate(180 700) scale(1.02)">
				<CrtMonitor on={1} rows={9} />
			</g>
		</Stage>
	);
	const phone = (
		<Stage>
			<TableTop width={W} height={H} />
			<g transform="translate(342 720) scale(1.1)">
				<EarlyPhone on={1} rows={6} />
			</g>
		</Stage>
	);

	return (
		<AbsoluteFill>
			<BackgroundIF
				lamp={0.7}
				lampY={38}
				// The light cools as the story leaves paper behind.
				cool={frame > 104}
			/>

			<Shot from={0} durationInFrames={58} fade={6} zoomFrom={1.04} zoomTo={1.18} panY={-20}>
				{paper}
			</Shot>
			<Shot from={54} durationInFrames={50} fade={4} zoomFrom={1.16} zoomTo={1.02} panY={14}>
				{crt}
			</Shot>
			<Shot from={100} durationInFrames={42} fade={4} zoomFrom={0.94} zoomTo={1.06}>
				{phone}
			</Shot>

			{/* The edit breaking into a sprint, then landing. */}
			<Shot from={140} durationInFrames={8} fade={2} zoomFrom={1.3} zoomTo={1.34}>
				{paper}
			</Shot>
			<Shot from={148} durationInFrames={8} fade={2} zoomFrom={1.3} zoomTo={1.34}>
				{crt}
			</Shot>
			<Shot from={156} durationInFrames={51} fade={3} zoomFrom={1.02} zoomTo={1.12} panY={-16}>
				{phone}
			</Shot>

			<DisplayIF start={offPaper} fontSize={88} top={300} letterSpacing={12} color={IF.grey}>
				DO PAPEL
			</DisplayIF>
			<DisplayIF start={toDigital} fontSize={88} top={430} letterSpacing={12} color={IF.accent}>
				PARA O DIGITAL
			</DisplayIF>
		</AbsoluteFill>
	);
};
