import React from "react";
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from "remotion";

type Props = {
	children: React.ReactNode;
	/** Local frame the beat comes in on. */
	start: number;
	/** How long the beat is held, in frames. The brief asks for 1.5-4s beats. */
	durationInFrames: number;
	/** Frames of handle on each end. Small = a cut; larger = a dissolve. */
	fadeIn?: number;
	fadeOut?: number;
	/** Camera push across the beat's life: scale at the head and at the tail. */
	zoomFrom?: number;
	zoomTo?: number;
	/** Lateral / vertical drift across the beat, in px. Parallax comes from
	 *  giving nested Cuts different values. */
	panX?: number;
	panY?: number;
	/** Extra blur at the head of the beat, resolving as focus finds the subject. */
	entryBlur?: number;
	opacity?: number;
	style?: React.CSSProperties;
};

/**
 * One internal beat of a scene.
 *
 * The brief's hardest rule for this film is that nothing sits still and nothing
 * lingers: every scene is 3-6 of these, each 45-120 frames, each with its own
 * push. Rendering `null` outside its window is what makes the boundaries read
 * as cuts rather than as a pile of cross-fading layers.
 */
export const CutIF: React.FC<Props> = ({
	children,
	start,
	durationInFrames,
	fadeIn = 6,
	fadeOut = 6,
	zoomFrom = 1,
	zoomTo = 1.06,
	panX = 0,
	panY = 0,
	entryBlur = 0,
	opacity = 1,
	style,
}) => {
	const frame = useCurrentFrame();
	const local = frame - start;

	if (local < 0 || local > durationInFrames) return null;

	const life = interpolate(local, [0, Math.max(1, durationInFrames)], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.inOut(Easing.ease),
	});

	const appear = interpolate(local, [0, Math.max(1, fadeIn)], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});
	const leave = interpolate(
		local,
		[durationInFrames - Math.max(1, fadeOut), durationInFrames],
		[1, 0],
		{extrapolateLeft: "clamp", extrapolateRight: "clamp"},
	);

	const alpha = Math.min(appear, leave) * opacity;
	if (alpha <= 0.002) return null;

	const scale = zoomFrom + (zoomTo - zoomFrom) * life;
	const tx = panX * (life - 0.5);
	const ty = panY * (life - 0.5);
	const blur = (1 - appear) * entryBlur;

	return (
		<AbsoluteFill
			style={{
				opacity: alpha,
				transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
				filter: blur > 0.01 ? `blur(${blur}px)` : undefined,
				...style,
			}}
		>
			{children}
		</AbsoluteFill>
	);
};
