import React from "react";
import {Easing, interpolate, useCurrentFrame} from "remotion";
import {AmbienceCC} from "../../components/cocacola/AmbienceCC";
import {GradedPhoto} from "../../components/cocacola/GradedPhoto";
import {SceneShell} from "../../components/cocacola/SceneShell";
import {RuleCC, TextCC} from "../../components/cocacola/TextCC";
import {cueForCC} from "../../utils/cue-cc";
import {IMG_CC} from "../../utils/imagens-cc";
import {CC} from "../../utils/theme-cc";
import {sceneDurationCC} from "../../utils/timeline-cc";

const cueFor = cueForCC(4);

const GRADE_LOGO = {brightness: 1, saturate: 1, sepia: 0, contrast: 1.02};
const GRADE_ECHO = {brightness: 1.35, saturate: 0, sepia: 0, contrast: 1};
const GRADE_PATENT = {brightness: 0.97, saturate: 0.85, sepia: 0.12, contrast: 1.06};

/** Where the visible grey copies land — clear of the main logo band
 * (y ~570..950, full width), the rule (1000), the year (1052..1177) and the
 * caption band. Four copies, large enough to actually read on #050505. */
const ECHOES = [
	{x: 230, y: 300, width: 300},
	{x: 850, y: 270, width: 280},
	{x: 220, y: 1370, width: 290},
	{x: 860, y: 1340, width: 300},
];

/** A grey copy of the logo popping in somewhere else — "reconhecível em qualquer lugar". */
const EchoLogo: React.FC<{at: number; out: number; x: number; y: number; width: number}> = ({
	at,
	out,
	x,
	y,
	width,
}) => (
	<div style={{position: "absolute", inset: 0, opacity: 0.85}}>
		<GradedPhoto
			image={IMG_CC._01_COCA_COLA_LOGO_SVG}
			width={width}
			centerX={x}
			centerY={y}
			zoom={[1.35, 1]}
			range={[at, at + 16]}
			ease="out"
			showFrom={at}
			showTo={out}
			fadeIn={6}
			fadeOut={8}
			feather={0}
			grade={GRADE_ECHO}
		/>
	</div>
);

/** The 1915 patent rises as THE foreground: a large light document under the year, no card on a photo. */
const PatentSheet: React.FC<{at: number; out: number}> = ({at, out}) => {
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
				image={IMG_CC._02_COKE_BOTTLE_PATENT_PNG}
				width={620}
				centerY={975}
				zoom={[1, 1.05]}
				range={[at, out]}
				showFrom={at}
				showTo={out}
				fadeIn={0}
				fadeOut={0}
				feather={0}
				shadow
				grade={GRADE_PATENT}
			/>
		</div>
	);
};

/**
 * 05 — THE IDENTITY. The spencerian logo (1887) holds the first beat large and
 * centred; at "reconhecível em qualquer lugar" faint grey copies pop in around
 * the frame. The museum advertisement is gone (its panel mixed eras). At
 * "quinze" the 1915 patent rises as the foreground document while 1915 /
 * A GARRAFA land on the dark canvas above it.
 */
export const Scene5: React.FC = () => {
	const ident = cueFor("10-identidade");
	const bottle = cueFor("11-garrafa");
	const dur = sceneDurationCC(4);

	const yearIn = ident.wordStart(/^identidade$/);
	const echoIn = ident.wordStart(/^reconhecível$/);
	const p15 = bottle.wordStart(/^quinze$/);
	const patentIn = bottle.wordStart(/^garrafa$/);
	const logoOut = p15;

	return (
		<SceneShell index={4}>
			<AmbienceCC />
			<GradedPhoto
				image={IMG_CC._01_COCA_COLA_LOGO_SVG}
				width={1000}
				centerY={760}
				zoom={[1.04, 1.12]}
				range={[8, logoOut]}
				showFrom={8}
				showTo={logoOut}
				fadeIn={16}
				fadeOut={12}
				feather={0}
				grade={GRADE_LOGO}
			/>
			{ECHOES.map((e, i) => (
				<EchoLogo key={i} at={echoIn + i * 7} out={logoOut} x={e.x} y={e.y} width={e.width} />
			))}
			<RuleCC start={26} end={logoOut} top={1000} width={500} />
			<TextCC start={yearIn} end={logoOut} top={1052} size={110} color={CC.amber} scrim={false}>
				1887
			</TextCC>

			<PatentSheet at={p15} out={dur} />

			{/* 1915 / A GARRAFA: the year first, the label as the patent rises. Both sit
			    entirely above the document — the patent's top edge is ~y 440 at max zoom. */}
			<TextCC start={p15} end={dur - 10} top={96} size={140} color={CC.amber} scrim={false}>
				1915
			</TextCC>
			<TextCC start={patentIn} end={dur - 10} top={240} size={100} color={CC.white} scrim={false}>
				A GARRAFA
			</TextCC>
		</SceneShell>
	);
};
