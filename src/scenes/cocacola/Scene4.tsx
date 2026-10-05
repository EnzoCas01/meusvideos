import React from "react";
import {AmbienceCC} from "../../components/cocacola/AmbienceCC";
import {GradedPhoto} from "../../components/cocacola/GradedPhoto";
import {SceneShell} from "../../components/cocacola/SceneShell";
import {TextCC} from "../../components/cocacola/TextCC";
import {cueForCC} from "../../utils/cue-cc";
import {IMG_CC} from "../../utils/imagens-cc";
import {CC} from "../../utils/theme-cc";
import {sceneDurationCC} from "../../utils/timeline-cc";

const cueFor = cueForCC(3);

const GRADE_PORTRAIT = {brightness: 0.92, saturate: 0.55, sepia: 0.18, contrast: 1.12};
const GRADE_PLANT = {brightness: 0.95, saturate: 0.45, sepia: 0.16, contrast: 1.1};

/**
 * 04 — THE BUSINESS GROWS. Candler's studio portrait holds the first beat as a
 * card (the 1888 date stays on the dark canvas above it — the photo's era is
 * unknown, so it is never stamped). When the company is born, the 1926
 * Bottling Works photograph takes over as the expansion beat — a document of
 * its own era, so 1892 stays as type on the dark canvas above it, never on it.
 */
export const Scene4: React.FC = () => {
	const candler = cueFor("08-candler");
	const company = cueFor("09-companhia");
	const dur = sceneDurationCC(3);

	const yearIn = candler.wordStart(/^oito$/);
	const nameIn = candler.wordStart(/^candler$/);
	const plantIn = company.start - 3;
	const portraitOut = plantIn + 2;
	const y1892 = company.wordStart(/^dois$/);
	const firmIn = company.wordStart(/^company$/);

	return (
		<SceneShell index={3}>
			<AmbienceCC />
			<GradedPhoto
				image={IMG_CC._01_ASA_G_C_JPG}
				width={620}
				centerY={680}
				zoom={[1.02, 1.14]}
				pan={[
					[0, 14],
					[0, -14],
				]}
				range={[0, portraitOut]}
				showFrom={0}
				showTo={portraitOut}
				fadeIn={0}
				fadeOut={16}
				feather={0}
				shadow
				grade={GRADE_PORTRAIT}
			/>
			<GradedPhoto
				image={IMG_CC._05_COCA_COLA_BOTTLING_WORKS_PHOTOGRAPH_DPLA_8CEF949405119AB28}
				width={1000}
				centerY={855}
				zoom={[1.04, 1.15]}
				pan={[
					[-10, 0],
					[10, 0],
				]}
				range={[plantIn, dur]}
				showFrom={plantIn}
				showTo={dur}
				fadeIn={16}
				fadeOut={0}
				feather={0}
				shadow
				grade={GRADE_PLANT}
			/>

			{/* Beat 1: the year sits on the canvas above the portrait, never on it. */}
			<TextCC start={yearIn} end={plantIn} top={120} size={150} color={CC.amber} scrim={false}>
				1888
			</TextCC>
			<TextCC start={nameIn} end={plantIn} top={1180} size={92} color={CC.white} scrim={false}>
				ASA CANDLER
			</TextCC>
			<TextCC start={nameIn + 8} end={plantIn} top={1282} size={34} font="sans" weight={400} spacing={0.3} color={CC.grey} scrim={false}>
				FARMACÊUTICO E EMPRESÁRIO
			</TextCC>

			{/* Beat 2: 1892 entirely above the enlarged photo (photo top ~y 405 at max
			    zoom); the labels drop BELOW the photo (bottom ~y 1305), clear of the
			    caption band 1560-1720. */}
			<TextCC start={y1892} end={dur - 10} top={120} size={150} color={CC.amber} scrim={false}>
				1892
			</TextCC>
			<TextCC start={firmIn} top={1330} size={84} color={CC.white} scrim={false}>
				THE COCA-COLA COMPANY
			</TextCC>
			<TextCC start={firmIn + 8} top={1436} size={34} font="sans" weight={400} spacing={0.3} color={CC.grey} scrim={false}>
				FUNDADA EM ATLANTA
			</TextCC>
		</SceneShell>
	);
};
