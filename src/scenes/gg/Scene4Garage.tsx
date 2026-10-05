import React from "react";
import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame} from "remotion";
import {Impact} from "../../components/gg/Impact";
import {cueLocalGG} from "../../utils/timeline-gg";
import {GG} from "../../utils/theme-gg";

const SCENE = 3;

/** O interior real da garagem: sem escritório, sem grana — só o computador e a teimosia. */
export const Scene4Garage: React.FC = () => {
	const frame = useCurrentFrame();
	const teimosia = cueLocalGG(SCENE, "04-sem-nada", /^teimosia$/);

	const zoom = interpolate(frame, [0, 200], [1.06, 1.24], {easing: Easing.out(Easing.sin)});
	const pan = interpolate(frame, [0, 200], ["30%", "22%"], {easing: Easing.out(Easing.sin)});

	return (
		<AbsoluteFill style={{backgroundColor: GG.background}}>
			<Img
				src={staticFile("images/gg/garagem-foto/05.png")}
				style={{
					width: "100%",
					height: "100%",
					objectFit: "cover",
					objectPosition: `${pan} 46%`,
					transform: `scale(${zoom})`,
					filter: "saturate(0.75) brightness(0.62) contrast(1.08)",
				}}
			/>
			<AbsoluteFill
				style={{background: "linear-gradient(to bottom, rgba(7,8,12,0.78) 0%, transparent 32%, transparent 66%, rgba(7,8,12,0.6) 100%)"}}
			/>

			<Impact at={teimosia} lines={["SÓ", "TEIMOSIA"]} size={128} y={310} color={GG.blue} />
		</AbsoluteFill>
	);
};
