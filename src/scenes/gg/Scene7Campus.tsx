import React from "react";
import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame} from "remotion";
import {Impact} from "../../components/gg/Impact";
import {cueLocalGG} from "../../utils/timeline-gg";
import {GG} from "../../utils/theme-gg";

const SCENE = 6;

/** A garagem virou um dos campi mais icônicos do planeta — zoom out revela a escala. */
export const Scene7Campus: React.FC = () => {
	const frame = useCurrentFrame();
	const hoje = cueLocalGG(SCENE, "07-hoje", /^Hoje,$/);

	const zoom = interpolate(frame, [0, 194], [1.34, 1.04], {easing: Easing.out(Easing.sin)});
	const pan = interpolate(frame, [0, 194], ["58%", "50%"], {easing: Easing.out(Easing.sin)});

	return (
		<AbsoluteFill style={{backgroundColor: GG.background}}>
			<Img
				src={staticFile("images/gg/aerea-cc/02.jpg")}
				style={{
					width: "100%",
					height: "100%",
					objectFit: "cover",
					objectPosition: `${pan} 48%`,
					transform: `scale(${zoom})`,
					filter: "saturate(1.05) brightness(0.9)",
				}}
			/>
			<AbsoluteFill style={{background: "linear-gradient(to bottom, rgba(7,8,12,0.62) 0%, transparent 30%, transparent 70%, rgba(7,8,12,0.4) 100%)"}} />

			<Impact at={hoje + 4} lines={["HOJE"]} size={200} y={320} color={GG.white} />
		</AbsoluteFill>
	);
};
