import React from "react";
import {Easing, interpolate, useCurrentFrame} from "remotion";
import {GradedPhoto, GRADES} from "../../components/netflix/GradedPhoto";
import {SceneShell} from "../../components/netflix/SceneShell";
import {TextNF} from "../../components/netflix/TextNF";
import {cueForNF} from "../../utils/cue-nf";
import {IMG} from "../../utils/imagens-nf";
import {DISPLAY_NF, NF} from "../../utils/theme-nf";
import {sceneDurationNF} from "../../utils/timeline-nf";

const cueFor = cueForNF(6);
const SIZE = 150;
const TOP = 1190;

/** One word that changes in place: the old one leaves upward, the new one rises into the same slot. */
const WordMorph: React.FC<{steps: {word: string; at: number; color?: string}[]}> = ({steps}) => {
	const frame = useCurrentFrame();
	const first = steps[0].at;
	if (frame < first - 1) return null;
	const T = 18;
	return (
		<div
			style={{
				position: "absolute",
				left: 0,
				width: 1080,
				top: TOP,
				height: SIZE * 1.1,
				overflow: "hidden",
			}}
		>
			{steps.map((s, i) => {
				const inP = interpolate(frame - s.at, [0, T], [0, 1], {
					extrapolateLeft: "clamp",
					extrapolateRight: "clamp",
					easing: Easing.bezier(0.16, 1, 0.3, 1),
				});
				const next = steps[i + 1];
				const outP = next
					? interpolate(frame - next.at, [0, T], [0, 1], {
							extrapolateLeft: "clamp",
							extrapolateRight: "clamp",
							easing: Easing.bezier(0.7, 0, 0.84, 0),
						})
					: 0;
				const y = (1 - inP) * 110 - outP * 110;
				if (inP <= 0 || outP >= 1) return null;
				return (
					<div
						key={s.word}
						style={{
							position: "absolute",
							left: 0,
							right: 0,
							textAlign: "center",
							fontFamily: DISPLAY_NF,
							fontSize: SIZE,
							lineHeight: 1.05,
							letterSpacing: "0.05em",
							color: s.color ?? NF.white,
							transform: `translateY(${y}%)`,
							textShadow: "0 4px 30px rgba(0,0,0,0.85)",
						}}
					>
						{s.word}
					</div>
				);
			})}
		</div>
	);
};

/**
 * 07 — originals. Two real photos of the 2013 press visit to a set, one per
 * sentence half, each held 4 s+. The word under them changes in place:
 * ALUGAR -> TRANSMITIR -> PRODUZIR.
 */
export const Scene7: React.FC = () => {
	const cue = cueFor("07-originais");
	const dur = sceneDurationNF(6);
	const year = cue.atText("Em dois mil");
	const swap = cue.start + 112; // photo A holds 4 s+
	const orig = cue.atText("próprias");

	return (
		<SceneShell index={6}>
			<GradedPhoto
				image={IMG.hocSet1}
				width={1250}
				centerY={880}
				zoom={[1, 1.2]}
				focus={[0.62, 0.45]}
				target={[560, 860]}
				lock={0.6}
				pan={[
					[30, 0],
					[-30, 0],
				]}
				range={[0, swap + 14]}
				showFrom={0}
				showTo={swap + 14}
				fadeIn={0}
				fadeOut={14}
				grade={GRADES.warm}
				backdropDim={0.22}
			/>
			<GradedPhoto
				image={IMG.hocSet2}
				width={1250}
				centerY={880}
				zoom={[1.18, 1]}
				focus={[0.55, 0.5]}
				target={[540, 860]}
				lock={0.4}
				pan={[
					[-30, 0],
					[30, 0],
				]}
				range={[swap, dur]}
				showFrom={swap}
				showTo={dur}
				fadeIn={14}
				fadeOut={0}
				grade={GRADES.warm}
				backdropDim={0.22}
			/>

			<TextNF start={year + 4} top={110} size={200} spacing={0.08}>
				2013
			</TextNF>
			<TextNF start={orig} top={330} size={120} spacing={0.06} color={NF.accentText}>
				ORIGINAIS
			</TextNF>

			<WordMorph
				steps={[
					{word: "ALUGAR", at: cue.start + 8, color: NF.grey},
					{word: "TRANSMITIR", at: cue.atText("terminado de mudar")},
					{word: "PRODUZIR", at: cue.atText("produzir"), color: NF.accentText},
				]}
			/>
		</SceneShell>
	);
};
