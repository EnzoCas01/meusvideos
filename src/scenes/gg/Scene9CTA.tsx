import React from "react";
import {AbsoluteFill, Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from "remotion";
import {cueLocalGG} from "../../utils/timeline-gg";
import {DISPLAY_GG, GG} from "../../utils/theme-gg";

const SCENE = 8;

/** Chamada final: "comenta EU QUERO" pulsando sobre o Googleplex. */
export const Scene9CTA: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const quero = cueLocalGG(SCENE, "09-cta", /^quero$/);

	const zoom = interpolate(frame, [0, 242], [1.1, 1.22], {easing: Easing.out(Easing.sin)});
	const enter = spring({frame: frame - 12, fps, config: {damping: 15, mass: 0.9}, durationInFrames: 18});
	const pulse = 1 + 0.045 * Math.sin(frame * 0.14);
	const bump = spring({frame: frame - quero, fps, config: {damping: 10, mass: 0.6}, durationInFrames: 14});
	const bumpScale = frame >= quero ? interpolate(bump, [0, 1], [1.18, 1]) : 1;

	return (
		<AbsoluteFill style={{backgroundColor: GG.background}}>
			<Img
				src={staticFile("images/gg/aerea-cc/02.jpg")}
				style={{
					width: "100%",
					height: "100%",
					objectFit: "cover",
					objectPosition: "50% 45%",
					transform: `scale(${zoom})`,
					filter: "saturate(1) brightness(0.55)",
				}}
			/>
			<AbsoluteFill style={{background: "linear-gradient(to bottom, rgba(7,8,12,0.55) 0%, rgba(7,8,12,0.35) 40%, rgba(7,8,12,0.75) 100%)"}} />

			<div
				style={{
					position: "absolute",
					top: 720,
					left: 0,
					width: "100%",
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					opacity: Math.min(1, enter * 1.4),
					transform: `translateY(${(1 - enter) * 30}px) scale(${pulse * bumpScale})`,
				}}
			>
				<div style={{fontFamily: DISPLAY_GG, fontSize: 118, color: GG.white, lineHeight: 0.95, textShadow: "0 10px 44px rgba(0,0,0,0.7)"}}>
					COMENTA
				</div>
				<div style={{fontFamily: DISPLAY_GG, fontSize: 118, color: GG.blue, lineHeight: 1.05, textShadow: "0 10px 44px rgba(0,0,0,0.7)"}}>
					&quot;EU QUERO&quot; 👇
				</div>
			</div>
		</AbsoluteFill>
	);
};
