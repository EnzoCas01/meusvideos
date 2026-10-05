import React from "react";
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from "remotion";
import {GradedPhoto, GRADES} from "../../components/netflix/GradedPhoto";
import {SceneShell} from "../../components/netflix/SceneShell";
import {RuleNF, TextNF} from "../../components/netflix/TextNF";
import {cueForNF} from "../../utils/cue-nf";
import {IMG} from "../../utils/imagens-nf";
import {NF} from "../../utils/theme-nf";

const cueFor = cueForNF(4);
const CY = 820;

const N_STREAKS = 26;

/**
 * Light streaks spreading out of one point: the "internet" as pure light, no
 * interface. Deterministic (index-derived), never Math.random.
 */
const Streaks: React.FC<{start: number}> = ({start}) => {
	const frame = useCurrentFrame();
	const t = frame - start;
	if (t < 0) return null;
	const spread = interpolate(t, [0, 34], [0, 1], {
		extrapolateRight: "clamp",
		easing: Easing.out(Easing.cubic),
	});
	const on = interpolate(t, [0, 10], [0, 1], {extrapolateRight: "clamp"});
	return (
		<AbsoluteFill style={{pointerEvents: "none"}}>
			<div
				style={{
					position: "absolute",
					left: 0,
					right: 0,
					top: CY - 500,
					height: 1000,
					opacity: on * 0.9,
					background: `radial-gradient(ellipse ${40 + spread * 30}% ${16 + spread * 26}% at 50% 50%, rgba(196,20,28,0.30), rgba(5,5,5,0) 100%)`,
				}}
			/>
			{Array.from({length: N_STREAKS}, (_, i) => {
				const off = (i - (N_STREAKS - 1) / 2) * 44;
				const y = CY + off * spread;
				const speed = 0.7 + ((i * 37) % 10) / 12;
				const w = 260 + ((i * 53) % 420);
				const x = ((t * speed * 34 + i * 173) % 2500) - 700;
				const red = i % 6 === 0;
				return (
					<div
						key={i}
						style={{
							position: "absolute",
							left: x,
							top: y,
							width: w,
							height: red ? 4 : 3,
							opacity: on * (0.35 + (((i * 29) % 7) / 7) * 0.6),
							background: `linear-gradient(to right, rgba(0,0,0,0), ${red ? NF.accentText : NF.white}, rgba(0,0,0,0))`,
						}}
					/>
				);
			})}
		</AbsoluteFill>
	);
};

/**
 * 05 — the question, as ONE continuous move: the disc turns; an iris opens
 * from its centre onto a real late-2000s computer; the camera pushes into its
 * dark screen and the screen becomes light — streaks and a word, no interface.
 */
export const Scene5: React.FC = () => {
	const frame = useCurrentFrame();
	const cue = cueFor("05-pergunta");
	const iris = cue.at(0.6);
	const irisEnd = iris + 26;
	const pushStart = irisEnd + 4;
	const dark = cue.at(0.86);
	const sayNet = cue.at(0.88);

	const r = interpolate(frame, [iris, irisEnd], [0, 1500], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.bezier(0.5, 0, 0.2, 1),
	});
	const zoomFn = (f: number) =>
		f < pushStart
			? interpolate(f, [iris, pushStart], [1, 1.1], {extrapolateLeft: "clamp"})
			: interpolate(f, [pushStart, dark + 8], [1.1, 6.5], {
					extrapolateRight: "clamp",
					easing: Easing.in(Easing.cubic),
				});

	return (
		<SceneShell index={4}>
			<div
				style={{
					position: "absolute",
					inset: 0,
					background: `radial-gradient(ellipse 60% 30% at 50% ${(CY / 1920) * 100}%, rgba(196,20,28,0.18), rgba(5,5,5,0) 100%)`,
				}}
			/>
			<GradedPhoto
				image={IMG.disc}
				width={700}
				anchor={[0.505, 0.511]}
				centerX={540}
				centerY={CY}
				circle={[0.505, 0.511, 0.465]}
				shadow
				backdrop={false}
				grade={GRADES.disc}
				zoom={[1, 1.12]}
				rotate={[0, 110]}
				range={[0, irisEnd]}
				showFrom={0}
				showTo={irisEnd + 2}
				fadeIn={0}
				fadeOut={0}
			/>

			{/* The iris opens from the disc's centre; the photo inside keeps moving. */}
			{frame >= iris ? (
				<AbsoluteFill style={{clipPath: `circle(${r}px at 540px ${CY}px)`}}>
					<GradedPhoto
						image={IMG.imac}
						width={1500}
						centerY={CY}
						focus={[0.66, 0.5]}
						target={[540, CY]}
						lock={1}
						zoomFn={zoomFn}
						showFrom={iris}
						showTo={dark + 14}
						fadeIn={0}
						fadeOut={8}
						grade={GRADES.screen}
						cropTop={0.24}
						backdropDim={0.2}
					/>
				</AbsoluteFill>
			) : null}

			<Streaks start={dark - 6} />

			<TextNF start={cue.start + 6} end={cue.at(0.44)} top={190} size={190} spacing={0.05}>
				E SE…
			</TextNF>
			<TextNF start={cue.at(0.47)} end={iris - 6} top={170} size={120} spacing={0.04}>
				NÃO FOSSE
				<br />
				PELO CORREIO
				<span style={{color: NF.accentText}}>?</span>
			</TextNF>
			<TextNF start={sayNet} top={CY - 110} size={210} spacing={0.12}>
				INTERNET
			</TextNF>
			<RuleNF start={sayNet + 8} top={CY + 120} width={320} />
		</SceneShell>
	);
};
