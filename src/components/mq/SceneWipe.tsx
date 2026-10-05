import React from "react";
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from "remotion";
import {MQ} from "../../utils/theme-mq";

const LEN = 16;

/**
 * Intentional cut between scenes: a hard accent bar sweeps the frame once
 * (with a short dark trail), never a bare dry cut. Alternates direction.
 * Lives inside a 16-frame Sequence; `frame` here is local (0..LEN).
 */
export const SceneWipe: React.FC<{dir?: 1 | -1}> = ({dir = 1}) => {
	const frame = useCurrentFrame();
	if (frame >= LEN) return null;

	const p = interpolate(frame, [0, 12], [0, 1], {easing: Easing.inOut(Easing.quad)});
	const veil = interpolate(frame, [0, 3, 10, LEN], [0, 0.35, 0.12, 0], {
		extrapolateRight: "clamp",
	});

	// leading edge crosses the frame (+ its own width of margin)
	const raw = interpolate(p, [0, 1], dir === 1 ? [-140, 1220] : [1220, -140]);
	const x = dir === 1 ? raw : 1080 - raw; // leading edge, left-origin px

	return (
		<AbsoluteFill style={{pointerEvents: "none"}}>
			{/* dark veil that pulls the eye through the cut */}
			<AbsoluteFill style={{background: MQ.background, opacity: veil}} />
			{/* bright leading edge + fading trail on the side it came from */}
			<AbsoluteFill
				style={{
					background:
						dir === 1
							? `linear-gradient(90deg, transparent ${Math.max(0, x - 150)}px, rgba(61,255,138,0.12) ${Math.max(0, x - 80)}px, ${MQ.accent} ${x}px, transparent ${x + 26}px)`
							: `linear-gradient(90deg, transparent ${x}px, ${MQ.accent} ${x}px, rgba(61,255,138,0.12) ${Math.min(1080, x + 80)}px, transparent ${Math.min(1080, x + 150)}px)`,
				}}
			/>
		</AbsoluteFill>
	);
};
