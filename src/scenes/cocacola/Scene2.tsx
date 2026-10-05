import React from "react";
import {Easing, interpolate, useCurrentFrame} from "remotion";
import {AmbienceCC} from "../../components/cocacola/AmbienceCC";
import {GradedPhoto} from "../../components/cocacola/GradedPhoto";
import {SceneShell} from "../../components/cocacola/SceneShell";
import {TextCC} from "../../components/cocacola/TextCC";
import {cueForCC} from "../../utils/cue-cc";
import {IMG_CC} from "../../utils/imagens-cc";
import {CC} from "../../utils/theme-cc";
import {sceneDurationCC} from "../../utils/timeline-cc";

const cueFor = cueForCC(1);

const GRADE_ENGRAVING = {brightness: 0.94, saturate: 0.5, sepia: 0.2, contrast: 1.12};
const GRADE_MAP = {brightness: 0.96, saturate: 0.55, sepia: 0.22, contrast: 1.1};

/** The 1888 Atlanta map slides in as a card from the right when the city is named. */
const MapCard: React.FC<{at: number; out: number}> = ({at, out}) => {
	const frame = useCurrentFrame();
	if (frame < at || frame > out) return null;
	const p = interpolate(frame - at, [0, 26], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.bezier(0.16, 1, 0.3, 1),
	});
	return (
		<div
			style={{
				position: "absolute",
				inset: 0,
				opacity: Math.min(1, (frame - at) / 8),
				transform: `translateX(${(1 - p) * 340}px) rotate(${(1 - p) * 3}deg)`,
			}}
		>
			<GradedPhoto
				image={IMG_CC._02_ATLANTA_STREET_MAP_1888_JPG}
				width={310}
				centerX={800}
				centerY={620}
				zoom={[1.02, 1.1]}
				range={[at, out]}
				showFrom={at}
				showTo={out}
				fadeIn={0}
				fadeOut={0}
				feather={0}
				shadow
				grade={GRADE_MAP}
			/>
		</div>
	);
};

/**
 * 02 — 1886. The date lands as amber type on the dark canvas, the marble
 * draught stand (where the first glass was served) holds the frame, Pemberton
 * is named in type, and Atlanta arrives as a map card on the spoken city.
 */
export const Scene2: React.FC = () => {
	const cue = cueFor("04-1886");
	const dur = sceneDurationCC(1);
	const dateIn = cue.wordEnd(/^seis$/);
	const pemberton = cue.wordStart(/^pemberton$/);
	const atlanta = cue.wordStart(/^atlanta$/);

	return (
		<SceneShell index={1}>
			<AmbienceCC />
			<GradedPhoto
				image={IMG_CC._01_MARBLE_DRAUGHT_STAND_HARPER_S_ENGRAVING_PNG}
				width={820}
				centerY={800}
				zoom={[1.03, 1.16]}
				pan={[
					[0, 18],
					[0, -18],
				]}
				range={[0, dur]}
				showFrom={0}
				showTo={dur}
				fadeIn={0}
				fadeOut={0}
				feather={0}
				shadow
				grade={GRADE_ENGRAVING}
			/>
			<MapCard at={atlanta} out={dur} />

			{/* Dates sit on the dark canvas, beside the period image — never stamped on it. */}
			<TextCC start={dateIn} end={dur - 10} top={120} size={140} color={CC.amber} scrim={false}>
				8 MAIO 1886
			</TextCC>
			<TextCC start={atlanta + 4} end={dur - 10} top={272} size={120} color={CC.white} scrim={false}>
				ATLANTA
			</TextCC>

			<TextCC start={pemberton} end={dur - 10} top={1250} size={56} font="sans" weight={600} spacing={0.14} scrim={false}>
				JOHN PEMBERTON
			</TextCC>
			<TextCC start={pemberton + 6} end={dur - 10} top={1325} size={34} font="sans" weight={400} spacing={0.3} color={CC.grey} scrim={false}>
				FARMACÊUTICO
			</TextCC>
		</SceneShell>
	);
};
