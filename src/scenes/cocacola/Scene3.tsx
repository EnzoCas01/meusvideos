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

const cueFor = cueForCC(2);

const GRADE_STORE = {brightness: 0.9, saturate: 0.6, sepia: 0.16, contrast: 1.12};
const GRADE_POSTER = {brightness: 0.96, saturate: 0.85, sepia: 0.08, contrast: 1.1};
const GRADE_COUPON = {brightness: 0.98, saturate: 0.8, sepia: 0.1, contrast: 1.08};

/** The free-glass coupon rises as a wide card when the voice names the cupons. */
const CouponCard: React.FC<{at: number; out: number}> = ({at, out}) => {
	const frame = useCurrentFrame();
	if (frame < at || frame > out) return null;
	const p = interpolate(frame - at, [0, 28], [0, 1], {
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
				transform: `translateY(${(1 - p) * 280}px)`,
			}}
		>
			<GradedPhoto
				image={IMG_CC._03_19TH_CENTURY_COCA_COLA_COUPON_JPG}
				width={940}
				centerY={820}
				zoom={[1, 1.05]}
				range={[at, out]}
				showFrom={at}
				showTo={out}
				fadeIn={0}
				fadeOut={0}
				feather={0}
				shadow
				grade={GRADE_COUPON}
			/>
		</div>
	);
};

/**
 * 03 — GETTING KNOWN. The local soda-fountain store holds the "novidade local";
 * when the first ad is spoken, the era's chromolithograph takes over with the
 * 29 MAY 1886 date as type on the dark band; the free-glass coupon closes.
 */
export const Scene3: React.FC = () => {
	const anu = cueFor("06-anuncio");
	const cup = cueFor("07-cupons");
	const dur = sceneDurationCC(2);
	const adIn = anu.wordStart(/^anúncio$/);
	const couponIn = cup.wordStart(/^cupons$/);
	const gratis = cup.wordStart(/^grátis$/);
	const posterIn = adIn - 6;
	const posterOut = couponIn + 10;

	return (
		<SceneShell index={2}>
			<AmbienceCC />
			<GradedPhoto
				image={IMG_CC._02_COSTONS_STORE_SODA_FOUNTAIN_1909_3200492358_JPG}
				width={980}
				centerY={620}
				zoom={[1.04, 1.17]}
				pan={[
					[0, 16],
					[0, -16],
				]}
				range={[0, adIn + 8]}
				showFrom={0}
				showTo={adIn + 8}
				fadeIn={0}
				fadeOut={16}
				feather={70}
				grade={GRADE_STORE}
			/>
			<GradedPhoto
				image={IMG_CC._02_DRINK_COCA_COLA_5_CENTS_LCCN2004671509_JPG}
				width={700}
				centerY={800}
				zoom={[1.03, 1.15]}
				pan={[
					[0, -20],
					[0, 20],
				]}
				range={[posterIn, posterOut]}
				showFrom={posterIn}
				showTo={posterOut}
				fadeIn={16}
				fadeOut={18}
				feather={0}
				shadow
				grade={GRADE_POSTER}
			/>
			<CouponCard at={couponIn} out={dur} />

			{/* The date of the first ad is typography on the dark band, not a caption on the poster. */}
			<TextCC start={adIn} end={couponIn - 4} top={120} size={105} color={CC.white} scrim={false}>
				PRIMEIRO ANÚNCIO
			</TextCC>
			<TextCC start={adIn + 8} end={couponIn - 4} top={228} size={110} color={CC.amber} scrim={false}>
				29 MAIO 1886
			</TextCC>

			<TextCC start={couponIn} end={dur - 10} top={130} size={150} color={CC.white} scrim={false}>
				1887
			</TextCC>
			<TextCC start={couponIn + 8} end={dur - 10} top={292} size={110} color={CC.amber} scrim={false}>
				CUPONS
			</TextCC>
			<TextCC start={gratis} end={dur - 10} top={1110} size={40} font="sans" weight={600} spacing={0.28} color={CC.grey} scrim={false}>
				UM COPO GRÁTIS
			</TextCC>
		</SceneShell>
	);
};
