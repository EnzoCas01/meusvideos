import React from "react";
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from "remotion";
import {BackgroundIF} from "../../components/ifood/BackgroundIF";
import {mapRoutePoint, MapRoute} from "../../components/ifood/MapProps";
import {Shot, Stage} from "../../components/ifood/Shot";
import {DisplayIF} from "../../components/ifood/TextIF";
import {cueForIF} from "../../utils/cue-if";
import {IF} from "../../utils/theme-if";

const cue = cueForIF(8);

const FROM = {x: 260, y: 660};
const TO = {x: 820, y: 1360};

/**
 * Scene 9 — THE CLOSE.
 *
 * "iFood didn't start big. It started by changing the way an order was made."
 * "That was the turn."
 *
 * Everything the film has shown is stripped away. What is left: one point,
 * moving along one simple route, quiet. No map grid, no counter, no
 * notifications — the image the whole story compresses into. No call to
 * action; the film just lets the sentence land and holds.
 */
export const Scene9Final: React.FC = () => {
	const frame = useCurrentFrame();
	const b = cue("10-final-b");

	const travel = interpolate(frame, [10, 250], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.inOut(Easing.cubic),
	});
	const dot = mapRoutePoint(FROM, TO, travel, 90);
	const pulse = 1 + Math.sin(frame * 0.12) * 0.08;

	const turnWord = Math.round(b.at(0.5));

	return (
		<AbsoluteFill>
			<BackgroundIF lamp={0.5} lampY={44} vignette={1.1} />

			<Shot from={0} durationInFrames={296} fade={10} zoomFrom={1.12} zoomTo={0.98} origin="50% 46%">
				<Stage>
					<MapRoute from={FROM} to={TO} progress={Math.min(1, travel + 0.04)} color={IF.line} bow={90} width={3} />
					<g transform={`translate(${dot.x} ${dot.y})`}>
						<circle r={26 * pulse} fill={IF.accent} opacity={0.16} />
						<circle r={10} fill={IF.accent} />
						<circle r={10} fill="none" stroke={IF.accent} strokeOpacity={0.4} strokeWidth={2} />
					</g>
				</Stage>
			</Shot>

			<DisplayIF
				start={turnWord}
				fontSize={130}
				top={780}
				color={IF.white}
				letterSpacing={10}
				underline
				underlineWidth={480}
			>
				A VIRADA
			</DisplayIF>

			{/* Hold on black after the last word — the close, not a fade to nothing abrupt. */}
			<AbsoluteFill
				style={{
					backgroundColor: "#050403",
					opacity: interpolate(frame, [b.end + 18, 296], [0, 1], {
						extrapolateLeft: "clamp",
						extrapolateRight: "clamp",
					}),
				}}
			/>
		</AbsoluteFill>
	);
};
