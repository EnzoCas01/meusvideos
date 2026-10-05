import React from "react";
import {Img, interpolate, staticFile, useCurrentFrame} from "remotion";
import {GradedPhoto} from "../../components/netflix/GradedPhoto";
import {SceneShell} from "../../components/netflix/SceneShell";
import {TextNF} from "../../components/netflix/TextNF";
import {cueForNF} from "../../utils/cue-nf";
import {IMG} from "../../utils/imagens-nf";
import {NF} from "../../utils/theme-nf";
import {sceneDurationNF} from "../../utils/timeline-nf";

const cueFor = cueForNF(1);

/**
 * 02 — 1997, then 1998. Two images, each held 4 s or more: the original logo
 * (the only real 1997 artefact) drifting on black, then the red mailer.
 * No modern photo carries a period date here.
 */
export const Scene2: React.FC = () => {
	const frame = useCurrentFrame();
	const cue = cueFor("02-comeco");
	const dur = sceneDurationNF(1);
	const swap = cue.at(0.41);
	const say1998 = swap + 4;
	const sayDvd = cue.at(0.6);

	const logoScale = interpolate(frame, [0, swap + 16], [0.94, 1.08], {extrapolateRight: "clamp"});
	const logoDrift = interpolate(frame, [0, swap + 16], [-24, 24], {extrapolateRight: "clamp"});
	const logoOpacity = interpolate(frame, [swap, swap + 16], [1, 0], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});
	const logoW = 780;
	const logoH = (logoW * IMG.logo1997.height) / IMG.logo1997.width;

	return (
		<SceneShell index={1}>
			{frame < swap + 17 ? (
				<div style={{position: "absolute", inset: 0, opacity: logoOpacity}}>
					<div
						style={{
							position: "absolute",
							left: 0,
							right: 0,
							top: 900 - 520,
							height: 1040,
							background: "radial-gradient(ellipse 55% 50% at 50% 50%, rgba(196,20,28,0.26), rgba(5,5,5,0) 100%)",
						}}
					/>
					<Img
						src={staticFile(IMG.logo1997.path)}
						style={{
							position: "absolute",
							left: 540 - logoW / 2,
							top: 900 - logoH / 2,
							width: logoW,
							height: logoH,
							transform: `translateX(${logoDrift}px) scale(${logoScale})`,
							boxShadow: "0 0 140px rgba(196,20,28,0.4), 0 30px 60px rgba(0,0,0,0.7)",
						}}
					/>
				</div>
			) : null}
			<TextNF start={cue.start + 4} end={swap - 2} top={270} size={320} spacing={0.06}>
				1997
			</TextNF>
			<TextNF
				start={cue.start + 30}
				end={swap - 2}
				top={1190}
				size={34}
				font="sans"
				weight={600}
				spacing={0.28}
				color={NF.grey}
				scrim={false}
			>
				A EMPRESA É FUNDADA
			</TextNF>

			<GradedPhoto
				image={IMG.envelopeArt}
				width={1500}
				anchor={[0.5, 0.635]}
				centerY={1010}
				cropTop={0.27}
				zoom={[1, 1.14]}
				focus={[0.5, 0.65]}
				target={[540, 1010]}
				range={[swap, dur]}
				showFrom={swap}
				showTo={dur}
				fadeIn={16}
				fadeOut={0}
				backdropDim={0.22}
			/>
			<TextNF start={say1998} top={180} size={300} spacing={0.06}>
				1998
			</TextNF>
			<TextNF start={sayDvd} top={470} size={140} color={NF.accentText} spacing={0.08} scrim={false}>
				DVD
			</TextNF>
		</SceneShell>
	);
};
