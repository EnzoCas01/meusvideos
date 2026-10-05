import React from "react";
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from "remotion";
import {AmbienceCC} from "../../components/cocacola/AmbienceCC";
import {GradedPhoto} from "../../components/cocacola/GradedPhoto";
import {SceneShell} from "../../components/cocacola/SceneShell";
import {RuleCC, TextCC} from "../../components/cocacola/TextCC";
import {cueForCC} from "../../utils/cue-cc";
import {IMG_CC} from "../../utils/imagens-cc";
import {CC} from "../../utils/theme-cc";
import {sceneDurationCC} from "../../utils/timeline-cc";

const cueFor = cueForCC(6);

const GRADE_1937 = {brightness: 0.88, saturate: 0.4, sepia: 0.16, contrast: 1.16};
const GRADE_NIGHT = {brightness: 0.95, saturate: 1.1, sepia: 0, contrast: 1.06};
const GRADE_LOGO = {brightness: 1, saturate: 1.05, sepia: 0, contrast: 1};

/** The logo only ever appears here, settling in over the silent tail. */
const LogoFinal: React.FC<{at: number}> = ({at}) => {
	const frame = useCurrentFrame();
	if (frame < at) return null;
	const p = interpolate(frame - at, [0, 24], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.bezier(0.16, 1, 0.3, 1),
	});
	return (
		<div style={{position: "absolute", inset: 0, opacity: p, transform: `scale(${0.94 + 0.06 * p})`}}>
			<GradedPhoto
				image={IMG_CC._01_COCA_COLA_LOGO_SVG}
				width={700}
				centerY={1505}
				zoom={[1, 1]}
				showFrom={at}
				showTo={100000}
				fadeIn={0}
				fadeOut={0}
				feather={0}
				grade={GRADE_LOGO}
			/>
		</div>
	);
};

/**
 * 07 — THE CLOSE. Ben Shahn's 1937 painted sign opens (the one photo here that
 * may carry its year); on "marcas" the night shot of the Olympia Building sign
 * takes over as the final image; the logo settles in only over the voiceless
 * tail, and the film fades.
 */
export const Scene7: React.FC = () => {
	const frame = useCurrentFrame();
	const fecho = cueFor("14-fecho");
	const dur = sceneDurationCC(6);

	const olympiaIn = fecho.wordStart(/^marcas$/) - 4;
	const shahnOut = olympiaIn + 2;
	const logoAt = fecho.end + 4;

	return (
		<SceneShell index={6}>
			<AmbienceCC />
			<GradedPhoto
				image={IMG_CC._02_CROSSVILLESIGN_EDIT_PNG}
				width={880}
				centerY={620}
				zoom={[1.04, 1.15]}
				pan={[
					[0, -14],
					[0, 14],
				]}
				range={[0, shahnOut]}
				showFrom={0}
				showTo={shahnOut}
				fadeIn={14}
				fadeOut={16}
				feather={80}
				grade={GRADE_1937}
			/>
			<GradedPhoto
				image={IMG_CC._01_COCA_COLA_SIGN_OLYMPIA_BUILDING_ATLANTA_GA_46559099455_JPG}
				width={920}
				centerY={660}
				zoom={[1.02, 1.16]}
				range={[olympiaIn, dur]}
				showFrom={olympiaIn}
				showTo={dur}
				fadeIn={20}
				fadeOut={0}
				feather={70}
				grade={GRADE_NIGHT}
			/>

			<TextCC start={26} end={olympiaIn} top={130} size={40} font="sans" weight={400} spacing={0.34} color={CC.grey} scrim={false}>
				1937
			</TextCC>

			<RuleCC start={fecho.end} top={1352} width={220} />
			<LogoFinal at={logoAt} />

			<AbsoluteFill style={{backgroundColor: "#000000", opacity: interpolate(frame, [dur - 14, dur - 2], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"})}} />
		</SceneShell>
	);
};
