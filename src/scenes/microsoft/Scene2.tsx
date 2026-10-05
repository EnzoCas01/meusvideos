import React from "react";
import {Easing, Img, interpolate, staticFile, useCurrentFrame} from "remotion";
import {AmbienceMS} from "../../components/microsoft/AmbienceMS";
import {GradedPhoto} from "../../components/microsoft/GradedPhoto";
import {SceneShell} from "../../components/microsoft/SceneShell";
import {TextMS} from "../../components/microsoft/TextMS";
import {cueForMS} from "../../utils/cue-ms";
import {IMG} from "../../utils/imagens-ms";
import {MS, SANS_MS} from "../../utils/theme-ms";
import {sceneDurationMS} from "../../utils/timeline-ms";

const cueFor = cueForMS(1);

const GRADE_1970 = {brightness: 0.82, saturate: 0.72, sepia: 0.2, contrast: 1.1};
const GRADE_ALTAIR = {brightness: 0.85, saturate: 0.85, sepia: 0.05, contrast: 1.12};

/** The BASIC paper tape as a small photo card, settling onto the machine shot. */
const TapeInset: React.FC<{at: number; out: number}> = ({at, out}) => {
	const frame = useCurrentFrame();
	const t = frame - at;
	if (t < 0) return null;
	const outFade = interpolate(frame, [out, out + 12], [1, 0], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});
	if (outFade <= 0.002) return null;
	const inP = interpolate(t, [0, 22], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.bezier(0.16, 1, 0.3, 1),
	});
	return (
		<div
			style={{
				position: "absolute",
				left: 80,
				top: 950,
				width: 350,
				opacity: Math.min(1, t / 10) * outFade,
				transform: `translateY(${(1 - inP) * 40}px) scale(${0.94 + inP * 0.06})`,
			}}
		>
			<div
				style={{
					width: "100%",
					height: 265,
					overflow: "hidden",
					border: "2px solid rgba(243,244,246,0.28)",
					boxShadow: "0 24px 50px rgba(0,0,0,0.7)",
				}}
			>
				<Img
					src={staticFile(IMG.altairBasicTape.path)}
					style={{
						width: "100%",
						height: "100%",
						objectFit: "cover",
						filter: "brightness(0.8) saturate(0.8) contrast(1.1)",
						transform: "scale(1.15)",
					}}
				/>
			</div>
			<div
				style={{
					marginTop: 14,
					fontFamily: SANS_MS,
					fontWeight: 600,
					fontSize: 30,
					letterSpacing: "0.25em",
					color: MS.accentText,
				}}
			>
				BASIC 8K
			</div>
		</div>
	);
};

/**
 * 02 — THE TWO. The Lakeside photo of Allen and Gates pushes in while each
 * founder is named with his age; when the Altair is named the photo dissolves
 * with movement into the machine, and the tape they wrote appears as a card.
 */
export const Scene2: React.FC = () => {
	const c75 = cueFor("02-1975");
	const cAllen = cueFor("03-allen");
	const cAlt = cueFor("04-altair");
	const dur = sceneDurationMS(1);
	const year = c75.wordStart(/^cinco/);
	const bill = c75.wordStart("Bill");
	const age19 = c75.wordStart(/^dezenove$/);
	const paul = cAllen.wordStart("Paul");
	const age22 = cAllen.wordStart(/^vinte$/);
	const altair = cAlt.wordStart(/^altair$/);
	const tape = cAlt.wordStart(/^8800/);

	return (
		<SceneShell index={1}>
			<AmbienceMS />
			{/* Blurred, the photo is only the 1970 room as an environmental texture:
			    the ages on screen are carried by the type cards, never the faces. */}
			<GradedPhoto
				image={IMG.lakeside1970}
				width={1650}
				centerY={690}
				zoom={[1.02, 1.2]}
				focus={[0.48, 0.5]}
				target={[540, 690]}
				range={[0, cAlt.start + 20]}
				showFrom={0}
				showTo={cAlt.start + 20}
				fadeIn={0}
				fadeOut={20}
				grade={GRADE_1970}
				backdropDim={0.4}
				blur={14}
			/>
			<GradedPhoto
				image={IMG.altair8800}
				width={1150}
				centerY={700}
				zoom={[1.06, 1.2]}
				pan={[
					[0, 24],
					[0, -24],
				]}
				range={[cAlt.start, dur]}
				showFrom={cAlt.start}
				showTo={dur}
				fadeIn={16}
				fadeOut={0}
				grade={GRADE_ALTAIR}
				backdropDim={0.35}
			/>
			<TapeInset at={tape} out={cAlt.end - 8} />

			<TextMS start={year} end={altair - 10} top={150} size={240} spacing={0.06}>
				1975
			</TextMS>
			<TextMS start={bill} end={cAllen.start - 4} top={1030} size={120} spacing={0.05}>
				BILL GATES
			</TextMS>
			<TextMS start={age19} end={cAllen.start - 4} top={1150} size={40} font="sans" weight={600} spacing={0.28} color={MS.grey} scrim={false}>
				19 ANOS
			</TextMS>
			<TextMS start={paul} end={cAlt.start - 8} top={1030} size={120} spacing={0.05}>
				PAUL ALLEN
			</TextMS>
			<TextMS start={age22} end={cAlt.start - 8} top={1150} size={40} font="sans" weight={600} spacing={0.28} color={MS.grey} scrim={false}>
				22 ANOS
			</TextMS>
			<TextMS start={altair} end={cAlt.end - 8} top={150} size={170} spacing={0.04}>
				ALTAIR 8800
			</TextMS>
		</SceneShell>
	);
};
