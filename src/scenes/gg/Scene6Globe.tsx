import React from "react";
import {AbsoluteFill, Easing, OffthreadVideo, interpolate, staticFile, useCurrentFrame} from "remotion";
import {Impact} from "../../components/gg/Impact";
import {cueLocalGG} from "../../utils/timeline-gg";
import {GG} from "../../utils/theme-gg";

const SCENE = 5;

/** O buscador se espalha: o globo gira, pontos de luz acendem pelo mundo. */
export const Scene6Globe: React.FC = () => {
	const frame = useCurrentFrame();
	const mundo = cueLocalGG(SCENE, "06-escala", /^mundo$/);

	const zoom = interpolate(frame, [0, 190], [1.1, 1.24], {easing: Easing.out(Easing.sin)});

	return (
		<AbsoluteFill style={{backgroundColor: GG.background}}>
			<OffthreadVideo
				src={staticFile("videos/gg/globo/clip-01.mp4")}
				muted
				style={{width: "100%", height: "100%", objectFit: "cover", transform: `scale(${zoom})`}}
			/>
			<AbsoluteFill style={{background: "linear-gradient(to bottom, rgba(7,8,12,0.6) 0%, transparent 26%, transparent 70%, rgba(7,8,12,0.5) 100%)"}} />

			<Impact at={mundo} lines={["O MUNDO", "INTEIRO"]} size={122} y={330} color={GG.blue} />
		</AbsoluteFill>
	);
};
