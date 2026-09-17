import React from "react";
import {Particle} from "./Particle";
import {COLORS} from "../utils/theme";

type Props = {
	count?: number;
	seedOffset?: number;
	areaWidth: number;
	areaHeight: number;
	delay?: number;
	durationInFrames?: number;
	color?: string;
};

/** A small, restrained field of drifting particles. */
export const Particles: React.FC<Props> = ({
	count = 14,
	seedOffset = 0,
	areaWidth,
	areaHeight,
	delay = 0,
	durationInFrames = 240,
	color = COLORS.white,
}) => {
	return (
		<>
			{Array.from({length: count}).map((_, i) => (
				<Particle
					key={i}
					seed={seedOffset + i * 17.3}
					areaWidth={areaWidth}
					areaHeight={areaHeight}
					delay={delay + i * 3}
					durationInFrames={durationInFrames}
					color={color}
				/>
			))}
		</>
	);
};
