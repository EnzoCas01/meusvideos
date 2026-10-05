import React from "react";
import {IF} from "../../utils/theme-if";

/**
 * A hand in silhouette, drawn as the shapes a hand actually is — forearm,
 * palm, four fingers, thumb — lit only by a thin rim from the lamp above.
 *
 * It exists to give the paper scale and to be the thing that turns the page.
 * It is never a character: no skin tone, no detail, no face anywhere near it.
 *
 * Local origin is the wrist; the hand reaches up and to the left.
 */
export const Hand: React.FC<{
	/** 0 = fingers straight, 1 = curled, as when a page is pinched. */
	curl?: number;
	opacity?: number;
}> = ({curl = 0, opacity = 1}) => {
	const fingers = [
		{x: -74, len: 128, tilt: -9},
		{x: -26, len: 142, tilt: -3},
		{x: 22, len: 136, tilt: 3},
		{x: 68, len: 116, tilt: 9},
	];

	return (
		<g opacity={opacity}>
			<g fill="url(#if-hand)" fillOpacity={0.99}>
				<defs>
					<linearGradient id="if-hand" x1="0" y1="0" x2="0.3" y2="1">
						<stop offset="0%" stopColor="#3A2C1D" />
						<stop offset="45%" stopColor="#1E1710" />
						<stop offset="100%" stopColor="#0C0906" />
					</linearGradient>
				</defs>
				<rect x={-78} y={96} width={156} height={360} rx={70} />
				<ellipse cx={0} cy={78} rx={104} ry={112} />
				{fingers.map((f) => (
					<rect
						key={f.x}
						x={f.x - 23}
						y={20 - f.len + curl * 46}
						width={46}
						height={f.len}
						rx={23}
						transform={`rotate(${f.tilt + curl * -8} ${f.x} ${40})`}
					/>
				))}
				<rect
					x={-160}
					y={30}
					width={44}
					height={150}
					rx={22}
					transform={`rotate(${34 - curl * 14} -120 150)`}
				/>
			</g>

			{/* Rim light: the lamp catching the top edge of the knuckles. */}
			<g
				fill="none"
				stroke={IF.accent}
				strokeOpacity={0.26}
				strokeWidth={3.5}
				strokeLinecap="round"
			>
				<path d={`M -98 ${44 + curl * 20} C -60 ${-6 + curl * 26}, 60 ${-6 + curl * 26}, 98 ${44 + curl * 20}`} />
				<path d="M -150 92 C -140 60, -126 48, -118 44" />
			</g>
		</g>
	);
};
