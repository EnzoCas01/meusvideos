import React from "react";
import {interpolate, useCurrentFrame, Easing} from "remotion";
import {COLORS} from "../utils/theme";

export type Column = {
	/** Where the column stands, in composition pixels. */
	x: number;
	/** Height it reaches, as a fraction of `maxHeight`. */
	reach: number;
	/** Frames before it starts climbing. */
	delay: number;
	/** Frames it takes to climb. */
	climb: number;
	/** The viewer's own column — stays lit while the others dim. */
	isYou?: boolean;
};

type Props = {
	columns: Column[];
	baselineY: number;
	maxHeight: number;
	width?: number;
	/** 0 = everyone equally lit, 1 = only "you" is lit. */
	focus?: number;
};

/**
 * Columns of light climbing from a shared floor at different speeds. It reads
 * instantly as "everyone is getting ahead" without a single word — and the one
 * that stays short is the one the film is about.
 */
export const ProgressColumns: React.FC<Props> = ({
	columns,
	baselineY,
	maxHeight,
	width = 26,
	focus = 0,
}) => {
	const frame = useCurrentFrame();

	return (
		<g>
			{/* The floor everyone starts from. */}
			<line
				x1={70}
				y1={baselineY}
				x2={1010}
				y2={baselineY}
				stroke={COLORS.line}
				strokeWidth={1}
				opacity={0.5}
			/>

			{columns.map((col, i) => {
				const local = frame - col.delay;
				const grow = interpolate(local, [0, col.climb], [0, 1], {
					extrapolateLeft: "clamp",
					extrapolateRight: "clamp",
					easing: Easing.out(Easing.cubic),
				});
				const h = maxHeight * col.reach * grow;
				const dim = col.isYou ? 1 : 1 - focus * 0.82;
				const topY = baselineY - h;

				return (
					<g key={i} opacity={dim}>
						{/* The column itself, brightest at its tip. */}
						<defs>
							<linearGradient id={`col-${i}`} x1="0" y1="1" x2="0" y2="0">
								<stop offset="0%" stopColor={COLORS.white} stopOpacity={0.05} />
								<stop offset="100%" stopColor={COLORS.white} stopOpacity={col.isYou ? 0.5 : 0.3} />
							</linearGradient>
						</defs>
						<rect
							x={col.x - width / 2}
							y={topY}
							width={width}
							height={h}
							fill={`url(#col-${i})`}
							rx={width / 2}
						/>
						{h > 4 && (
							<circle
								cx={col.x}
								cy={topY}
								r={col.isYou ? 5 : 3.5}
								fill={col.isYou ? COLORS.white : COLORS.greyText}
								style={
									col.isYou
										? {filter: "drop-shadow(0 0 12px rgba(242,242,240,0.9))"}
										: undefined
								}
							/>
						)}
					</g>
				);
			})}
		</g>
	);
};
