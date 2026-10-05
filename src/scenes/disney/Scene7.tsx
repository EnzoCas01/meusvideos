import React from "react";
import {AbsoluteFill, interpolate, useCurrentFrame} from "remotion";
import {CardDF} from "../../components/disney/CardDF";
import {DustDF, SpotlightDF, WashDF} from "../../components/disney/GroundDF";
import {LabelDF} from "../../components/disney/TextDF";
import {IMG_DF} from "../../utils/imagens-df";
import {DF, GRADE_DF} from "../../utils/theme-df";

/**
 * The hold — no one is speaking. The 1928 Steamboat Willie poster under a
 * spotlight, at the score's peak, then the light goes out cleanly. No logo, no
 * call to action, no last sentence: the image is the reward.
 */
export const Scene7: React.FC = () => {
	const f = useCurrentFrame();
	const out = interpolate(f, [64, 128], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});

	return (
		<AbsoluteFill>
			<WashDF
				css={{
					background:
						"radial-gradient(ellipse 70% 46% at 50% 8%, #5C3E12 0%, rgba(0,0,0,0) 60%), radial-gradient(ellipse 90% 60% at 70% 90%, #0B3138 0%, rgba(0,0,0,0) 70%), linear-gradient(180deg, #1C2830 0%, #0C252B 55%, #071A1F 100%)",
				}}
			/>
			<SpotlightDF color="rgba(240, 195, 119, 0.26)" width={980} />
			<DustDF count={18} seed={97} opacity={0.34} />

			<CardDF
				image={IMG_DF.posterSteamboat}
				width={860}
				center={[540, 815]}
				zoom={[1.0, 1.05]}
				range={[2, 140]}
				grade={GRADE_DF.photoBright}
				glow="0 0 110px rgba(240,195,119,0.2)"
				showFrom={2}
				showTo={150}
				fadeIn={14}
				fadeOut={0}
			/>

			<LabelDF start={22} end={120} top={1516} size={32} spacing={0.15} color={DF.goldText}>
				STEAMBOAT WILLIE — 18 DE NOVEMBRO DE 1928
			</LabelDF>

			{/* Clean ending: the room goes dark around the poster. */}
			<div style={{position: "absolute", inset: 0, background: "#040203", opacity: out}} />
		</AbsoluteFill>
	);
};
