import React from "react";
import {Easing, interpolate, useCurrentFrame} from "remotion";
import {fontFamily} from "../../utils/font";
import {IF} from "../../utils/theme-if";

type Props = {
	/** "2011", "2012", "2013", "2018". */
	year: string;
	/** Local frame it lands on. */
	start: number;
	/** Local frame it starts leaving on. */
	end?: number;
	fontSize?: number;
	/** 0..1 — how much of the red accent the beat gets. 2018 is the loud one. */
	impact?: number;
	style?: React.CSSProperties;
};

/**
 * A date, set as the film's loudest piece of typography.
 *
 * EDITORIAL RULE (enforced by the director for this film): every photograph in
 * this piece is illustrative, none is a record of iFood's history. So the year
 * card belongs to the SCENE — free-standing type on the stage — and must never
 * be laid over a photograph as if captioning it. Keep it on its own beat, or in
 * clear space beside the imagery, never pinned to a frame edge of a photo.
 */
export const YearIF: React.FC<Props> = ({
	year,
	start,
	end,
	fontSize = 210,
	impact = 0.5,
	style,
}) => {
	const frame = useCurrentFrame();
	const local = frame - start;

	const arrive = interpolate(local, [0, 14], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.out(Easing.cubic),
	});
	// Settles a touch further after landing: the date keeps breathing.
	const settle = interpolate(local, [14, 90], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.out(Easing.cubic),
	});

	const leave =
		end === undefined
			? 1
			: interpolate(frame, [end, end + 10], [1, 0], {
					extrapolateLeft: "clamp",
					extrapolateRight: "clamp",
				});

	const opacity = Math.min(arrive, leave);
	if (opacity <= 0.002) return null;

	const scale = 1 + (1 - arrive) * 0.14 - settle * 0.02;
	// The red flash on the landing frame, decaying fast. This is the only place
	// in the film red is allowed to be loud.
	const flash = Math.max(0, 1 - local / 18) * impact;

	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				opacity,
				transform: `scale(${scale})`,
				...style,
			}}
		>
			<div
				style={{
					fontFamily,
					fontWeight: 600,
					fontSize,
					letterSpacing: Math.round(fontSize * 0.04),
					lineHeight: 1,
					color: IF.white,
					fontVariantNumeric: "tabular-nums",
					textShadow: `0 0 ${60 + 120 * flash}px rgba(234,29,44,${0.25 * impact + 0.55 * flash})`,
					filter: `blur(${(1 - arrive) * 16}px)`,
				}}
			>
				{year}
			</div>
			<div
				style={{
					marginTop: Math.round(fontSize * 0.09),
					height: 6,
					width: arrive * fontSize * (2.1 + impact),
					background: `linear-gradient(90deg, rgba(234,29,44,0) 0%, ${IF.red} 50%, rgba(234,29,44,0) 100%)`,
					boxShadow: `0 0 ${30 + 60 * flash}px rgba(234,29,44,${0.5 + 0.4 * flash})`,
				}}
			/>
		</div>
	);
};
