import React from "react";
import {COUNTRIES_NF, MAP_VIEWBOX_NF} from "../../utils/mapa-nf";

const LAND = "#161412";
const COAST = "#2f2b27";

/** Land only: dark warm grey, hairline coast. Ocean is the film's own black. */
const Land: React.FC = () => (
	<>
		{COUNTRIES_NF.map((c) => (
			<path key={c.id} d={c.d} fill={LAND} stroke={COAST} strokeWidth={1} vectorEffect="non-scaling-stroke" />
		))}
	</>
);

export const LandNF = React.memo(Land);

/** Static, framed world map (viewBox of the source SVG) for small uses. */
export const WorldMapStaticNF: React.FC<{width: number; children?: React.ReactNode}> = ({width, children}) => {
	const v = MAP_VIEWBOX_NF;
	return (
		<svg width={width} height={(width * v.h) / v.w} viewBox={`${v.x} ${v.y} ${v.w} ${v.h}`}>
			<LandNF />
			{children}
		</svg>
	);
};
