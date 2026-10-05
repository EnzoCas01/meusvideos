import React from "react";
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from "remotion";
import {BackgroundIF} from "../../components/ifood/BackgroundIF";
import {CityMap, Courier, MapPin, MapRoute, mapRoutePoint} from "../../components/ifood/MapProps";
import {TableTop} from "../../components/ifood/PrintedGuide";
import {Shot, Stage} from "../../components/ifood/Shot";
import {DisplayIF} from "../../components/ifood/TextIF";
import {cueForIF} from "../../utils/cue-if";
import {H, W} from "../../utils/layout";
import {IF, TYPE_IF} from "../../utils/theme-if";

const cue = cueForIF(6);

/** One restaurant → hub → courier → customer chain, the shape the whole scene repeats. */
type Chain = {restaurant: {x: number; y: number}; hub: {x: number; y: number}; courier: {x: number; y: number}; client: {x: number; y: number}};

const CHAIN: Chain = {
	restaurant: {x: 260, y: 480},
	hub: {x: 480, y: 640},
	courier: {x: 700, y: 480},
	client: {x: 480, y: 900},
};

/** Smaller, faster echoes of the same chain, scattered across the city for the pull-back. */
const ECHOES: {origin: {x: number; y: number}; scale: number}[] = [
	{origin: {x: -420, y: -520}, scale: 0.42},
	{origin: {x: 420, y: -460}, scale: 0.36},
	{origin: {x: -520, y: 480}, scale: 0.4},
	{origin: {x: 520, y: 520}, scale: 0.34},
	{origin: {x: 0, y: -760}, scale: 0.3},
];

const chainAt = (c: {x: number; y: number}, origin: {x: number; y: number}, scale: number) => ({
	x: origin.x + c.x * scale,
	y: origin.y + c.y * scale,
});

/**
 * Scene 7 — THE TURN (2018). The strongest beat in the film.
 *
 * "In 2018, iFood consolidated its logistics model and began connecting
 * restaurants, customers and couriers within the platform."
 *
 * The year lands hard, then the map builds itself in front of the camera:
 * restaurant, iFood, courier, customer — four points that light up and wire
 * together — and then the camera pulls back to show the same chain repeating
 * across the whole city, at once. This is the moment the film has been
 * building the printed guide, the phone, the CRT toward.
 */
export const Scene7Turn: React.FC = () => {
	const frame = useCurrentFrame();
	const l = cue("07-2018");

	const year = Math.round(l.at(0.16));
	const nodesStart = Math.round(l.at(0.42));
	const logistics = Math.round(l.at(0.92));

	const pinP = (delay: number) =>
		interpolate(frame, [nodesStart + delay, nodesStart + delay + 20], [0, 1], {
			extrapolateLeft: "clamp",
			extrapolateRight: "clamp",
			easing: Easing.out(Easing.cubic),
		});
	const restaurantP = pinP(0);
	const hubP = pinP(14);
	const courierP = pinP(28);
	const clientP = pinP(42);

	const route1 = interpolate(frame, [nodesStart + 18, nodesStart + 50], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});
	const route2 = interpolate(frame, [nodesStart + 42, nodesStart + 74], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});
	const route3 = interpolate(frame, [nodesStart + 66, nodesStart + 98], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});
	const rideT = interpolate(frame, [nodesStart + 90, nodesStart + 140], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.inOut(Easing.quad),
	});
	const ride1 = mapRoutePoint(CHAIN.restaurant, CHAIN.hub, Math.min(1, rideT * 2), 40);
	const ride2 = mapRoutePoint(CHAIN.courier, CHAIN.client, Math.max(0, rideT * 2 - 1), -40);

	const pullBack = interpolate(frame, [188, 238], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.inOut(Easing.cubic),
	});

	return (
		<AbsoluteFill>
			<BackgroundIF lamp={0.66} lampY={30} cool />

			{/* 1 — the city, waiting; the year hits. */}
			<Shot from={0} durationInFrames={70} fade={6} zoomFrom={1.3} zoomTo={1.5} origin="46% 40%">
				<Stage>
					<TableTop width={W} height={H} />
					<g transform="translate(60 260)">
						<CityMap opacity={0.7} />
					</g>
				</Stage>
			</Shot>

			{/* 2 — the chain forms: restaurant, iFood, courier, customer, wired. */}
			<Shot from={62} durationInFrames={128} fade={6} zoomFrom={1.5} zoomTo={1.66} panX={-16} panY={-40}>
				<Stage>
					<TableTop width={W} height={H} />
					<g transform="translate(60 260)">
						<CityMap opacity={0.55} />
						<MapRoute from={CHAIN.restaurant} to={CHAIN.hub} progress={route1} color={IF.accent} bow={30} />
						<MapRoute from={CHAIN.hub} to={CHAIN.courier} progress={route2} color={IF.accent} bow={30} />
						<MapRoute from={CHAIN.courier} to={CHAIN.client} progress={route3} color={IF.accent} bow={-40} />
						{rideT > 0.01 && rideT < 0.5 ? (
							<g transform={`translate(${ride1.x} ${ride1.y})`}>
								<Courier scale={1.1} angle={20} />
							</g>
						) : null}
						{rideT >= 0.5 && rideT < 0.99 ? (
							<g transform={`translate(${ride2.x} ${ride2.y})`}>
								<Courier scale={1.1} angle={-20} />
							</g>
						) : null}
						<MapPin x={CHAIN.restaurant.x} y={CHAIN.restaurant.y} label="RESTAURANTE" progress={restaurantP} />
						<MapPin x={CHAIN.hub.x} y={CHAIN.hub.y} label="IFOOD" color={IF.white} progress={hubP} />
						<MapPin x={CHAIN.courier.x} y={CHAIN.courier.y} label="ENTREGADOR" progress={courierP} />
						<MapPin x={CHAIN.client.x} y={CHAIN.client.y} label="CLIENTE" progress={clientP} />
					</g>
				</Stage>
			</Shot>

			{/* 3 — pulled back: the same chain, repeating across the whole city at once. */}
			<Shot from={182} durationInFrames={94} fade={7} zoomFrom={1.66} zoomTo={0.78} origin="50% 44%">
				<Stage>
					<TableTop width={W} height={H} />
					<g transform="translate(60 260)">
						<CityMap />
						<MapRoute from={CHAIN.restaurant} to={CHAIN.hub} progress={1} color={IF.accent} bow={30} />
						<MapRoute from={CHAIN.hub} to={CHAIN.courier} progress={1} color={IF.accent} bow={30} />
						<MapRoute from={CHAIN.courier} to={CHAIN.client} progress={1} color={IF.accent} bow={-40} />
						<MapPin x={CHAIN.restaurant.x} y={CHAIN.restaurant.y} label="RESTAURANTE" progress={1} />
						<MapPin x={CHAIN.hub.x} y={CHAIN.hub.y} label="IFOOD" color={IF.white} progress={1} />
						<MapPin x={CHAIN.courier.x} y={CHAIN.courier.y} label="ENTREGADOR" progress={1} />
						<MapPin x={CHAIN.client.x} y={CHAIN.client.y} label="CLIENTE" progress={1} />

						{ECHOES.map((e, i) => {
							const p = interpolate(pullBack, [i * 0.08, i * 0.08 + 0.3], [0, 1], {
								extrapolateLeft: "clamp",
								extrapolateRight: "clamp",
							});
							if (p <= 0.01) return null;
							const r = chainAt(CHAIN.restaurant, e.origin, e.scale);
							const h = chainAt(CHAIN.hub, e.origin, e.scale);
							const c = chainAt(CHAIN.courier, e.origin, e.scale);
							const cl = chainAt(CHAIN.client, e.origin, e.scale);
							return (
								<g key={i} opacity={p}>
									<MapRoute from={r} to={h} progress={1} color={IF.grey} bow={16} width={2.4} />
									<MapRoute from={h} to={c} progress={1} color={IF.grey} bow={16} width={2.4} />
									<MapRoute from={c} to={cl} progress={1} color={IF.grey} bow={-16} width={2.4} />
									<circle cx={r.x} cy={r.y} r={7} fill={IF.accent} opacity={0.8} />
									<circle cx={h.x} cy={h.y} r={7} fill={IF.white} opacity={0.8} />
									<circle cx={c.x} cy={c.y} r={7} fill={IF.accent} opacity={0.8} />
									<circle cx={cl.x} cy={cl.y} r={7} fill={IF.accent} opacity={0.8} />
								</g>
							);
						})}
					</g>
				</Stage>
			</Shot>

			<DisplayIF start={year} end={nodesStart - 4} fontSize={TYPE_IF.huge} top={460} letterSpacing={16}>
				2018
			</DisplayIF>
			<DisplayIF
				start={logistics}
				fontSize={90}
				top={1220}
				color={IF.accent}
				letterSpacing={10}
				underline
				underlineWidth={420}
			>
				LOGÍSTICA
			</DisplayIF>
		</AbsoluteFill>
	);
};
