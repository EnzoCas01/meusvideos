import React from "react";
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from "remotion";
import {LandNF} from "../../components/netflix/WorldMapNF";
import {SceneShell} from "../../components/netflix/SceneShell";
import {RuleNF, TextNF} from "../../components/netflix/TextNF";
import {cueForNF} from "../../utils/cue-nf";
import {COUNTRIES_NF, LOS_GATOS_NF} from "../../utils/mapa-nf";
import {NF} from "../../utils/theme-nf";

const cueFor = cueForNF(7);

const UNIT = 3; // px per map unit when the whole world spans the frame width
const CX = 540;
const CY = 720;
const ZOOM_IN = 4.4;
/** Countries Netflix did not serve at the time get no light (no claim about which of the rest). */
const DARK = new Set(["CHN", "PRK", "SYR"]);

const DOTS = COUNTRIES_NF.filter((c) => !DARK.has(c.id) && c.area > 0.05).map((c, i) => {
	const dist = Math.hypot(c.cx - LOS_GATOS_NF.x, c.cy - LOS_GATOS_NF.y);
	return {id: c.id, x: c.cx, y: c.cy, dist, jitter: (i * 37) % 11};
});
const MAX_DIST = Math.max(...DOTS.map((d) => d.dist));

/**
 * 08 — the world. One point pulses in Los Gatos; on "cento e trinta" the
 * camera pulls back and light spreads outward in waves — the scale is the
 * point, no country is named or picked out.
 */
export const Scene8: React.FC = () => {
	const frame = useCurrentFrame();
	const cue = cueFor("08-mundo");
	const wave = cue.atText("cento e trinta") - 6;
	const subs = cue.atText("noventa e quatro");
	const y2016 = cue.atText("janeiro");
	const naquele = cue.atText("Naquele ano");

	const pull = interpolate(frame, [wave, wave + 70], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.bezier(0.5, 0, 0.15, 1),
	});
	// slow push-in on the single point until the pull-back
	const creep = interpolate(frame, [0, wave], [3.7, ZOOM_IN], {extrapolateRight: "clamp"});
	const s = pull > 0 ? ZOOM_IN + (1 - ZOOM_IN) * pull : creep;
	const fx = LOS_GATOS_NF.x * (1 - pull);
	const fy = LOS_GATOS_NF.y * (1 - pull);
	const k = UNIT * s;

	// unit-space sizes that stay a constant number of screen px regardless of zoom
	const u = (px_: number) => px_ / k;

	const pulse = ((frame + 20) % 44) / 44;
	const settle = interpolate(frame, [0, 24], [0, 1], {extrapolateRight: "clamp"});

	return (
		<SceneShell index={7}>
			<AbsoluteFill>
				<svg width={1080} height={1920} viewBox="0 0 1080 1920">
					<g transform={`translate(${CX} ${CY}) scale(${k}) translate(${-fx} ${-fy})`}>
						<LandNF />
						{/* waves from Los Gatos */}
						{[0, 1, 2].map((i) => {
							const t = (frame - wave - i * 16) / 80;
							if (t < 0 || t > 1) return null;
							return (
								<circle
									key={i}
									cx={LOS_GATOS_NF.x}
									cy={LOS_GATOS_NF.y}
									r={t * 300}
									fill="none"
									stroke={NF.accentText}
									strokeWidth={1.4}
									vectorEffect="non-scaling-stroke"
									opacity={(1 - t) * 0.7}
								/>
							);
						})}
						{DOTS.map((d) => {
							const local = frame - (wave + 6 + (d.dist / MAX_DIST) * 64 + d.jitter);
							if (local < 0) return null;
							const grow = interpolate(local, [0, 14], [0, 1], {
								extrapolateRight: "clamp",
								easing: Easing.out(Easing.cubic),
							});
							const flash = interpolate(local, [0, 6, 30], [1.9, 1.5, 1], {extrapolateRight: "clamp"});
							return (
								<g key={d.id} opacity={grow}>
									<circle cx={d.x} cy={d.y} r={u(11) * flash} fill={NF.accentText} opacity={0.13} />
									<circle cx={d.x} cy={d.y} r={u(4.5)} fill={NF.white} opacity={0.95} />
								</g>
							);
						})}
						{/* Los Gatos: the one point */}
						<circle
							cx={LOS_GATOS_NF.x}
							cy={LOS_GATOS_NF.y}
							r={u(10 + pulse * 62 * (pull > 0 ? 0.3 : 1))}
							fill="none"
							stroke={NF.accentText}
							strokeWidth={2}
							vectorEffect="non-scaling-stroke"
							opacity={(1 - pulse) * 0.8 * settle}
						/>
						<circle cx={LOS_GATOS_NF.x} cy={LOS_GATOS_NF.y} r={u(20)} fill={NF.accent} opacity={0.3 * settle} />
						<circle cx={LOS_GATOS_NF.x} cy={LOS_GATOS_NF.y} r={u(8)} fill={NF.accentText} opacity={settle} />
					</g>
				</svg>
			</AbsoluteFill>

			<TextNF start={y2016} top={120} size={200} spacing={0.1}>
				2016
			</TextNF>
			<TextNF start={wave + 8} end={naquele + 10} top={1130} size={185} spacing={0.04}>
				+130 PAÍSES
			</TextNF>
			<TextNF start={subs} top={1110} size={195} spacing={0.04}>
				94 MILHÕES
			</TextNF>
			<TextNF start={subs + 8} top={1320} size={36} font="sans" weight={600} spacing={0.3} color={NF.grey} scrim={false}>
				DE ASSINANTES
			</TextNF>
			<RuleNF start={subs + 14} top={1395} width={300} />
		</SceneShell>
	);
};
