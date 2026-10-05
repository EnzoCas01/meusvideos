import React from "react";
import {Easing, interpolate, useCurrentFrame} from "remotion";
import {GradedPhoto} from "../../components/cocacola/GradedPhoto";
import {SceneShell} from "../../components/cocacola/SceneShell";
import {TextCC} from "../../components/cocacola/TextCC";
import {cueForCC} from "../../utils/cue-cc";
import {IMG_CC} from "../../utils/imagens-cc";
import {CC} from "../../utils/theme-cc";
import {sceneDurationCC} from "../../utils/timeline-cc";

const cueFor = cueForCC(0);

const GRADE_BOTTLE = {brightness: 1, saturate: 0.95, sepia: 0, contrast: 1.05};

/** The brand-red plate that turns the whole frame when the voice says "bilhões". */
const RedPlate: React.FC<{at: number}> = ({at}) => {
	const frame = useCurrentFrame();
	const p = interpolate(frame - at, [0, 22], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.bezier(0.16, 1, 0.3, 1),
	});
	if (p <= 0) return null;
	return (
		<div style={{position: "absolute", inset: 0, transform: `translateY(${(1 - p) * 100}%)`}}>
			<div style={{position: "absolute", inset: 0, background: CC.accent}} />
			<div
				style={{
					position: "absolute",
					inset: 0,
					background: "radial-gradient(ellipse 85% 55% at 50% 26%, rgba(255,255,255,0.16), transparent 70%)",
				}}
			/>
		</div>
	);
};

/**
 * 01 — HOOK. One idea only: the contour bottle sharp and full-frame, pushing in
 * slowly. "Nove" lands the giant 9 (labelled POR DIA / 1886); at "bilhões" the
 * frame turns brand red and the number becomes 2,1+ BILHÕES — HOJE.
 */
export const Scene1: React.FC = () => {
	const cue = cueFor("01-gancho");
	const hoje = cueFor("02-hoje");
	const dur = sceneDurationCC(0);
	const nine = cue.wordStart(/^nove$/);
	const redIn = hoje.wordStart(/^bilhões$/);
	const doses = hoje.wordStart(/^doses$/);

	return (
		<SceneShell index={0}>
			<GradedPhoto
				image={IMG_CC._01_COCACOLAGLASSBOTTLE_JPG}
				width={1120}
				zoom={[1, 1.2]}
				range={[0, dur]}
				showFrom={0}
				showTo={dur}
				fadeIn={0}
				fadeOut={0}
				feather={0}
				grade={GRADE_BOTTLE}
			/>

			{/* 1886: nine drinks a day — the numeral GIGANTE in the TOP HALF, where the
			    bottle's dark liquid backs the red. 1886 rides a solid dark plate: the
			    bottle's printed white script runs just below this band (~y 930+). */}
			<TextCC start={nine} end={redIn - 6} top={24} size={780} stretch={1.4} color={CC.accent} scrim={false}>
				9
			</TextCC>
			<TextCC start={nine + 8} end={redIn - 6} top={790} size={42} font="sans" weight={600} spacing={0.32}>
				POR DIA
			</TextCC>
			<TextCC start={nine + 14} end={redIn - 6} top={868} size={66} color={CC.amber} plate>
				1886
			</TextCC>

			<RedPlate at={redIn - 2} />

			{/* HOJE: the same shelf, now in billions, on the brand red. */}
			<TextCC start={redIn} end={dur - 10} top={440} size={300} color={CC.white} scrim={false}>
				2,1+
			</TextCC>
			<TextCC start={redIn + 6} end={dur - 10} top={780} size={150} color={CC.white} scrim={false}>
				BILHÕES
			</TextCC>
			<TextCC start={redIn + 14} end={dur - 10} top={975} size={44} font="sans" weight={600} spacing={0.32} color={CC.white} scrim={false}>
				POR DIA
			</TextCC>
			<TextCC start={doses} end={dur - 10} top={1060} size={44} font="sans" weight={400} spacing={0.02} color="rgba(247,241,232,0.88)" scrim={false}>
				doses das bebidas da companhia, hoje
			</TextCC>
		</SceneShell>
	);
};
