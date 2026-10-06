import React from "react";
import {useCurrentFrame} from "remotion";
import {AM} from "../../utils/theme-am";
import {kf, ramp} from "./motion-am";

/**
 * Mouse arrow (the plan asks for a plain arrow, not a hand). Travels through
 * `path` points (screen px) at `frames`, and clicks at `clickAt`: the arrow
 * dips and a yellow ring expands. The ring sits in an SVG box larger than its
 * biggest radius so the viewport never clips it.
 */
export const CursorAM: React.FC<{
	frames: number[];
	xs: number[];
	ys: number[];
	clickAt?: number;
	size?: number;
	from?: number;
	until?: number;
}> = ({frames, xs, ys, clickAt, size = 64, from = -Infinity, until = Infinity}) => {
	const frame = useCurrentFrame();
	if (frame < from || frame > until) return null;
	const x = kf(frame, frames, xs);
	const y = kf(frame, frames, ys);
	const click = clickAt === undefined ? 0 : ramp(frame, clickAt, 12);
	const pressed = clickAt !== undefined && frame >= clickAt && frame < clickAt + 5 ? 0.85 : 1;
	const BOX = size * 3;
	return (
		<>
			{clickAt !== undefined && frame >= clickAt && click < 1 && (
				<svg
					width={BOX}
					height={BOX}
					style={{position: "absolute", left: x - BOX / 2, top: y - BOX / 2, overflow: "hidden"}}
				>
					<circle
						cx={BOX / 2}
						cy={BOX / 2}
						r={8 + click * (BOX / 2 - 12)}
						fill="none"
						stroke={AM.yellow}
						strokeWidth={5}
						opacity={1 - click}
					/>
				</svg>
			)}
			<svg
				width={size}
				height={size}
				viewBox="0 0 24 24"
				style={{
					position: "absolute",
					left: x - size * 0.2,
					top: y - size * 0.1,
					transform: `scale(${pressed})`,
					transformOrigin: "20% 10%",
					filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.6))",
				}}
			>
				<path
					d="M5 2.5 L5 19 L9.3 15 L12.2 21.5 L15 20.3 L12.1 13.9 L18 13.9 Z"
					fill="#FFFFFF"
					stroke="#000"
					strokeWidth={1.3}
					strokeLinejoin="round"
				/>
			</svg>
		</>
	);
};
