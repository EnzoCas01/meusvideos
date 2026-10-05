import React from "react";
import {Easing, interpolate, useCurrentFrame} from "remotion";
import {GradedPhoto, GRADES} from "../../components/anthropic/GradedPhoto";
import {SceneShell} from "../../components/anthropic/SceneShell";
import {TextAT} from "../../components/anthropic/TextAT";
import {cueForAT} from "../../utils/cue-at";
import {IMG} from "../../utils/imagens-at";
import {AT} from "../../utils/theme-at";
import {sceneDurationAT} from "../../utils/timeline-at";

const cueFor = cueForAT(5);

const BAR_W = 760;

/**
 * The growth bar: 183/380 of it fills under the first figure, and it completes
 * itself when the 2026 figure lands. The track never moves.
 */
const GrowthBar: React.FC<{start: number; extendAt: number; top: number}> = ({start, extendAt, top}) => {
	const frame = useCurrentFrame();
	if (frame < start) return null;
	const grow1 = interpolate(frame - start, [0, 24], [0, 0.48], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.out(Easing.cubic),
	});
	const grow2 = interpolate(frame - extendAt, [0, 26], [0, 0.52], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.out(Easing.cubic),
	});
	return (
		<div style={{position: "absolute", left: 140, top, width: BAR_W, height: 12, background: "rgba(240,238,230,0.14)"}}>
			<div style={{width: (grow1 + grow2) * BAR_W, height: "100%", background: AT.accent}} />
		</div>
	);
};

/**
 * 06 — THE PEAK. The 2025 aerial pushes in under "US$ 183 BILHÕES"; then the
 * swap to the skyline band and a bigger, harder-pushing figure for February
 * 2026, while the bar completes 183 → 380. The emotional high point.
 */
export const Scene6: React.FC = () => {
	const c183 = cueFor("09-183");
	const c380 = cueFor("10-380");
	const dur = sceneDurationAT(5);
	const swap = c380.start; // "E em fevereiro..."
	const at380 = c380.wordStart(/^trezentos$/);
	// The 12-frame exit completes the frame the 2026 figure enters: never both on screen.
	const out183 = at380 - 12;

	return (
		<SceneShell index={5}>
			<GradedPhoto
				image={IMG.sfAerea}
				width={1950}
				centerY={700}
				zoom={[1, 1.16]}
				range={[0, 190]}
				pan={[
					[0, 40],
					[0, -30],
				]}
				showFrom={0}
				showTo={190}
				fadeIn={0}
				fadeOut={18}
				backdropDim={0.3}
			/>
			<GradedPhoto
				image={IMG.sfSkyline}
				width={2100}
				centerY={860}
				grade={GRADES.dim}
				zoom={[1.08, 1.26]}
				range={[swap, dur]}
				pan={[
					[130, 0],
					[-110, 0],
				]}
				ease="out"
				showFrom={swap}
				showTo={dur}
				fadeIn={22}
				fadeOut={16}
				backdropDim={0.28}
			/>
			<TextAT start={c183.wordStart(/^cinco$/)} end={swap - 2} top={130} size={110} color={AT.grey} spacing={0.08}>
				2025
			</TextAT>
			<TextAT
				start={c183.wordStart("avaliada")}
				end={swap - 2}
				top={268}
				size={38}
				font="sans"
				weight={600}
				spacing={0.3}
				color={AT.grey}
				scrim={false}
			>
				AVALIAÇÃO
			</TextAT>
			<TextAT start={c183.wordStart(/^três$/)} end={out183} top={390} size={190} spacing={0.04}>
				US$ 183
			</TextAT>
			<TextAT
				start={c183.wordStart(/^bilhões$/)}
				end={out183}
				top={575}
				size={190}
				spacing={0.04}
				scrimOpacity={0.9}
				arriveFrames={10}
			>
				BILHÕES
			</TextAT>
			<GrowthBar start={c183.wordStart("dólares.")} extendAt={at380} top={940} />
			<TextAT
				start={c380.wordStart("fevereiro")}
				top={268}
				size={40}
				font="sans"
				weight={600}
				spacing={0.24}
				color={AT.accentText}
				scrim={false}
			>
				FEVEREIRO DE 2026
			</TextAT>
			<TextAT start={at380} top={350} size={280} spacing={0.03}>
				US$ 380
			</TextAT>
			<TextAT
				start={c380.wordStart(/^bilhões$/)}
				top={630}
				size={280}
				spacing={0.03}
				scrimOpacity={0.9}
				arriveFrames={10}
			>
				BILHÕES
			</TextAT>
		</SceneShell>
	);
};
