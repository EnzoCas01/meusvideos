import React from "react";
import {Easing, Img, interpolate, staticFile, useCurrentFrame} from "remotion";
import {AmbienceMS} from "../../components/microsoft/AmbienceMS";
import {GradedPhoto} from "../../components/microsoft/GradedPhoto";
import {SceneShell} from "../../components/microsoft/SceneShell";
import {RuleMS, TextMS} from "../../components/microsoft/TextMS";
import {cueForMS} from "../../utils/cue-ms";
import {IMG} from "../../utils/imagens-ms";
import {MS} from "../../utils/theme-ms";
import {sceneDurationMS} from "../../utils/timeline-ms";

const cueFor = cueForMS(5);

const GRADE_1970 = {brightness: 0.82, saturate: 0.72, sepia: 0.2, contrast: 1.1};
const GRADE_PC = {brightness: 0.92, saturate: 0.85, sepia: 0.02, contrast: 1.1};
const EASE_LAND = [0.16, 1, 0.3, 1] as const;

/**
 * 06 — THE CHAIN AND THE CLOSE. The two revenues stack on a growing accent
 * spine, "O COMEÇO" lands as the payoff; then the film returns to the two boys
 * at Lakeside and the IBM PC rises over them, and everything settles into the
 * 1975 wordmark breathing once before the fade to black.
 */
export const Scene6: React.FC = () => {
	const frame = useCurrentFrame();
	const cF = cueFor("09-final");
	const cE = cueFor("10-fecho");
	const dur = sceneDurationMS(5);
	const first = cF.wordStart(/^dezesseis$/);
	const second = cF.wordStart(/^dezessete$/);
	const millions = cF.wordStart(/^milhões$/);
	const payoff = cF.wordStart(/^começo/) - 6;
	const boysIn = cE.start + 1;
	const pcIn = cE.wordStart(/^computadores/) - 4;
	const markAt = cE.wordEnd(/^ibm$/);

	const spineH = interpolate(frame, [first + 16, millions + 4], [0, 480], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.out(Easing.cubic),
	});
	const spineOut = interpolate(frame, [cE.start - 9, cE.start + 3], [1, 0], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});
	const markIn = interpolate(frame - markAt, [0, 16], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.bezier(...EASE_LAND),
	});
	const veil = interpolate(frame, [dur - 47, dur - 7], [0, 0.94], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	return (
		<SceneShell index={5}>
			<AmbienceMS intensity={0.6} />

			<div
				style={{
					position: "absolute",
					left: 537,
					top: 756,
					width: 5,
					height: spineH,
					background: MS.accent,
					opacity: 0.5 * spineOut,
				}}
			/>
			<TextMS start={first} end={cE.start - 5} top={600} size={170} spacing={0.03} color={MS.grey}>
				US$ 16 MIL
			</TextMS>
			<RuleMS start={first + 11} end={cE.start - 5} top={790} width={220} />
			<TextMS start={second} end={cE.start - 2} top={880} size={210} spacing={0.01}>
				US$ 17,3
			</TextMS>
			<TextMS start={millions} end={cE.start - 2} top={1090} size={170} spacing={0.04} color={MS.accentText}>
				MILHÕES
			</TextMS>
			<RuleMS start={millions + 11} end={cE.start - 2} top={1270} width={220} />
			<TextMS start={payoff} end={cE.start - 3} top={320} size={200} spacing={0.04} color={MS.accentText}>
				O COMEÇO
			</TextMS>

			<GradedPhoto
				image={IMG.lakeside1970}
				width={1650}
				centerY={660}
				zoom={[1.02, 1.16]}
				range={[boysIn, dur]}
				showFrom={boysIn}
				showTo={dur - 31}
				fadeIn={18}
				fadeOut={28}
				grade={GRADE_1970}
				backdropDim={0.3}
			/>
			<GradedPhoto
				image={IMG.ibmPc5150Cut}
				width={760}
				centerX={700}
				centerY={1110}
				zoom={[1, 1.06]}
				pan={[
					[0, 140],
					[0, 0],
				]}
				ease="out"
				range={[pcIn, dur - 29]}
				showFrom={pcIn}
				showTo={dur - 29}
				fadeIn={14}
				fadeOut={18}
				backdrop={false}
				feather={0}
				shadow
				grade={GRADE_PC}
			/>

			{frame >= markAt ? (
				<div style={{position: "absolute", inset: 0}}>
					<div
						style={{
							position: "absolute",
							left: 0,
							width: 1080,
							top: 560,
							height: 640,
							background: "radial-gradient(ellipse 55% 50% at 50% 50%, rgba(5,6,8,0.82), rgba(5,6,8,0) 100%)",
							opacity: markIn,
						}}
					/>
					<div style={{position: "absolute", left: 0, width: 1080, top: 720, display: "flex", justifyContent: "center"}}>
						<Img
							src={staticFile(IMG.msLogo1975White.path)}
							style={{
								width: 900,
								opacity: markIn * (0.82 + 0.1 * Math.sin(frame / 9)),
								transform: `translateY(${(1 - markIn) * 30}px) scale(${1 + 0.02 * Math.sin(frame / 9)})`,
								filter: "drop-shadow(0 10px 40px rgba(10,155,230,0.25))",
							}}
						/>
					</div>
				</div>
			) : null}

			<div style={{position: "absolute", inset: 0, background: MS.background, opacity: veil, pointerEvents: "none"}} />
		</SceneShell>
	);
};
