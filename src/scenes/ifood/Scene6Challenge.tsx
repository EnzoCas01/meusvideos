import React from "react";
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from "remotion";
import {BackgroundIF} from "../../components/ifood/BackgroundIF";
import {Clock, NotificationBadge} from "../../components/ifood/DigitalProps";
import {CityMap, Courier, MapPin, MapRoute} from "../../components/ifood/MapProps";
import {CounterScene, OrderPad} from "../../components/ifood/PeriodProps";
import {TableTop} from "../../components/ifood/PrintedGuide";
import {Shot, Stage} from "../../components/ifood/Shot";
import {DisplayIF} from "../../components/ifood/TextIF";
import {cueForIF} from "../../utils/cue-if";
import {H, W} from "../../utils/layout";
import {IF} from "../../utils/theme-if";

const cue = cueForIF(5);
const RESTAURANT = {x: 480, y: 420};

/**
 * Scene 6 — THE CHALLENGE.
 *
 * "But the great challenge was still ahead: how to get the order to the
 * customer's door?"
 *
 * The order exists now, digital and instant — but nothing yet moves it. The
 * edit gets faster and more nervous as the scene goes: order ready, a clock
 * ticking, a courier who has no route yet, then the city itself, too big for
 * one line to reach. It ends unresolved on purpose — the answer is scene 7.
 */
export const Scene6Challenge: React.FC = () => {
	const frame = useCurrentFrame();
	const l = cue("06-desafio");

	const challenge = Math.round(l.at(0.22));
	const logistics = Math.round(l.at(0.87));

	const tick = interpolate(frame, [30, 62], [-30, 60], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.inOut(Easing.quad),
	});
	const routeDraw = interpolate(frame, [112, 150], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.out(Easing.cubic),
	});
	const courierT = interpolate(frame, [116, 150], [0, 0.7], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});
	const far = {x: RESTAURANT.x + 600, y: RESTAURANT.y + 900};

	const scatter = [
		{x: 200, y: 540, d: 0},
		{x: 700, y: 300, d: 5},
		{x: 850, y: 700, d: 10},
		{x: 380, y: 850, d: 15},
		{x: 60, y: 220, d: 20},
	];

	return (
		<AbsoluteFill>
			<BackgroundIF lamp={0.6} lampY={40} vignette={1.05} />

			{/* 1 — the order, ready, waiting on the counter. */}
			<Shot from={0} durationInFrames={34} fade={4} zoomFrom={1.16} zoomTo={1.02} panY={-14}>
				<Stage>
					<TableTop width={W} height={H} />
					<g transform="translate(0 620)">
						<CounterScene glow={1} />
					</g>
					<g transform="translate(330 760) scale(1.05)">
						<OrderPad written={1} />
					</g>
				</Stage>
			</Shot>

			{/* 2 — the customer, waiting. */}
			<Shot from={30} durationInFrames={32} fade={4} zoomFrom={1.3} zoomTo={1.14}>
				<Stage>
					<TableTop width={W} height={H} />
					<g transform="translate(540 860)">
						<Clock hourAngle={tick * 0.4} minuteAngle={tick * 2.6} />
					</g>
				</Stage>
			</Shot>

			{/* 3 — a courier, standing by — no route drawn yet. */}
			<Shot from={60} durationInFrames={28} fade={4} zoomFrom={1.4} zoomTo={1.6} origin="50% 60%">
				<Stage>
					<TableTop width={W} height={H} />
					<g transform="translate(540 900)">
						<Courier scale={4.4} />
					</g>
				</Stage>
			</Shot>

			{/* 4 — pulled back: the city the order has to cross. */}
			<Shot from={86} durationInFrames={28} fade={4} zoomFrom={1.5} zoomTo={0.62} origin="42% 24%">
				<Stage>
					<TableTop width={W} height={H} />
					<g transform="translate(60 260)">
						<CityMap />
						<MapPin x={RESTAURANT.x} y={RESTAURANT.y} label="RESTAURANTE" progress={1} />
					</g>
				</Stage>
			</Shot>

			{/* 5 — a route reaching out, uncertain, too far to trust yet. */}
			<Shot from={110} durationInFrames={42} fade={4} zoomFrom={0.66} zoomTo={0.72} panX={-10}>
				<Stage>
					<TableTop width={W} height={H} />
					<g transform="translate(60 260)">
						<CityMap />
						<MapPin x={RESTAURANT.x} y={RESTAURANT.y} label="RESTAURANTE" progress={1} />
						<MapRoute from={RESTAURANT} to={far} progress={routeDraw} bow={-120} color={IF.grey} />
						{routeDraw > 0.02 ? (
							<g
								transform={`translate(${RESTAURANT.x + (far.x - RESTAURANT.x) * courierT} ${
									RESTAURANT.y + (far.y - RESTAURANT.y) * courierT
								})`}
							>
								<Courier scale={0.9} angle={30} />
							</g>
						) : null}
					</g>
				</Stage>
			</Shot>

			{/* 6 — every order in the city, all at once: the scale of the problem. */}
			<Shot from={150} durationInFrames={47} fade={5} zoomFrom={0.68} zoomTo={0.78} panY={-16}>
				<Stage>
					<TableTop width={W} height={H} />
					<g transform="translate(60 260)">
						<CityMap />
						{scatter.map((s, i) => (
							<NotificationBadge
								key={i}
								x={s.x}
								y={s.y}
								pop={interpolate(frame, [150 + s.d, 162 + s.d], [0, 1], {
									extrapolateLeft: "clamp",
									extrapolateRight: "clamp",
								})}
							/>
						))}
					</g>
				</Stage>
			</Shot>

			<DisplayIF start={challenge} fontSize={110} top={340} letterSpacing={12}>
				O DESAFIO
			</DisplayIF>
			<DisplayIF
				start={logistics}
				fontSize={80}
				top={1220}
				color={IF.accent}
				letterSpacing={10}
				underline
				underlineWidth={400}
			>
				LOGÍSTICA
			</DisplayIF>
		</AbsoluteFill>
	);
};
