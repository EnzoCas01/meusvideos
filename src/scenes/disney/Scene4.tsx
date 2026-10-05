import React from "react";
import {AbsoluteFill, interpolate, useCurrentFrame} from "remotion";
import {CardDF} from "../../components/disney/CardDF";
import {DustDF, WashDF} from "../../components/disney/GroundDF";
import {RuleDF, TextDF} from "../../components/disney/TextDF";
import {cueForDF} from "../../utils/cue-df";
import {IMG_DF} from "../../utils/imagens-df";
import {DF, GRADE_DF} from "../../utils/theme-df";

const cue = cueForDF(3);

/** A pale sun coming up behind the studio while Walt starts over. */
const RisingSun: React.FC = () => {
	const f = useCurrentFrame();
	const rise = interpolate(f, [0, 100], [70, -30], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
	return (
		<div
			style={{
				position: "absolute",
				left: 540 - 460,
				top: 980 + rise,
				width: 920,
				height: 700,
				background: "radial-gradient(ellipse 50% 42% at 50% 50%, rgba(240,180,138,0.5), rgba(240,180,138,0) 68%)",
				mixBlendMode: "screen",
			}}
		/>
	);
};

/**
 * Start over — dawn. Teal night lifting into peach behind the team photo: the
 * studio still stands, the people are still there, the sun is coming up.
 */
export const Scene4: React.FC = () => {
	const restart = cue("07-recomeco").wordStart("recomeçar");

	return (
		<AbsoluteFill>
			<WashDF
				css={{
					background:
						"radial-gradient(ellipse 90% 60% at 50% 28%, #14494A 0%, rgba(0,0,0,0) 66%), radial-gradient(ellipse 70% 46% at 50% 84%, #A05C3B 0%, rgba(0,0,0,0) 60%), linear-gradient(180deg, #0D3336 0%, #12403D 42%, #5E3A2C 78%, #7A4A34 100%)",
				}}
			/>
			<RisingSun />
			<DustDF count={16} seed={51} opacity={0.32} />

			<CardDF
				image={IMG_DF.studio}
				width={880}
				center={[540, 775]}
				zoom={[1.0, 1.08]}
				range={[4, 104]}
				grade={GRADE_DF.photoWarm}
				glow="0 0 90px rgba(240,195,119,0.14)"
				showFrom={4}
				showTo={130}
				fadeIn={16}
				fadeOut={0}
			/>

			<RuleDF start={restart + 4} top={188} width={170} />
			<TextDF start={restart} top={228} size={132} color={DF.white}>
				RECOMEÇAR
			</TextDF>
		</AbsoluteFill>
	);
};
