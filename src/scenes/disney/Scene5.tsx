import React from "react";
import {AbsoluteFill, interpolate, useCurrentFrame} from "remotion";
import {CardDF} from "../../components/disney/CardDF";
import {DustDF, SpotlightDF, WashDF} from "../../components/disney/GroundDF";
import {RuleDF, TextDF} from "../../components/disney/TextDF";
import {cueForDF} from "../../utils/cue-df";
import {IMG_DF} from "../../utils/imagens-df";
import {DF, GRADE_DF} from "../../utils/theme-df";

const cue = cueForDF(4);

const INK = "#3A332B";

/** One pencil line drawing itself across the paper between `from` and `to`. */
const Stroke: React.FC<{d: string; from: number; to: number; width?: number}> = ({d, from, to, width = 3.5}) => {
	const f = useCurrentFrame();
	const drawn = interpolate(f, [from, to], [1, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
	return (
		<path
			d={d}
			fill="none"
			stroke={INK}
			strokeWidth={width}
			strokeLinecap="round"
			pathLength={1}
			strokeDasharray={1}
			strokeDashoffset={drawn}
			opacity={0.88}
		/>
	);
};

/**
 * The animator's desk under a warm lamp: rough passes and spacing marks taking
 * shape on the paper while the voice explains the need. On "Mickey" the earliest
 * concept sheet itself is revealed, with Ub Iwerks' signature on the page.
 */
export const Scene5: React.FC = () => {
	const f = useCurrentFrame();
	const born = cue("09-mickey-nasce").wordStart("Mickey");
	const iwerks = cue("09-mickey-nasce").wordStart("Iwerks");
	const paperOut = born - 4;
	const paperFade = interpolate(f, [paperOut - 18, paperOut], [1, 0], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	return (
		<AbsoluteFill>
			<WashDF
				css={{
					background:
						"radial-gradient(ellipse 60% 40% at 50% 10%, #8A5518 0%, rgba(0,0,0,0) 60%), radial-gradient(ellipse 46% 34% at 4% 58%, rgba(190,58,44,0.28) 0%, rgba(0,0,0,0) 70%), radial-gradient(ellipse 80% 50% at 84% 82%, #4A1F10 0%, rgba(0,0,0,0) 66%), linear-gradient(180deg, #33200A 0%, #221305 55%, #150A04 100%)",
				}}
			/>
			<SpotlightDF color="rgba(240, 195, 119, 0.2)" width={1000} />
			<DustDF count={24} seed={67} opacity={0.42} />

			{/* The desk: a sheet of punched animation paper, rough pass drawing itself. */}
			<div
				style={{
					position: "absolute",
					left: 540 - 420,
					top: 790 - 315,
					width: 840,
					height: 630,
					borderRadius: 5,
					background: "linear-gradient(178deg, #EADDC2 0%, #DFD1B4 70%, #D5C6A8 100%)",
					boxShadow: "0 40px 90px rgba(0,0,0,0.66), 0 0 80px rgba(240,195,119,0.1), inset 0 0 60px rgba(120,96,60,0.18)",
					opacity: paperFade,
				}}
			>
				<svg width={840} height={630} viewBox="0 0 840 630">
					{/* animator's rough pass: horizon, action arc, spacing marks */}
					<Stroke d="M 90 452 C 260 430, 580 430, 756 458" from={16} to={62} width={4} />
					<Stroke d="M 130 330 C 270 190, 540 186, 716 322" from={40} to={98} />
					<circle cx={176} cy={318} r={9} fill={INK} opacity={interpolate(f, [96, 112], [0, 0.85], {extrapolateLeft: "clamp", extrapolateRight: "clamp"})} />
					<circle cx={422} cy={222} r={11} fill={INK} opacity={interpolate(f, [106, 122], [0, 0.85], {extrapolateLeft: "clamp", extrapolateRight: "clamp"})} />
					<circle cx={668} cy={318} r={9} fill={INK} opacity={interpolate(f, [116, 132], [0, 0.85], {extrapolateLeft: "clamp", extrapolateRight: "clamp"})} />
					<Stroke d="M 168 360 L 186 356" from={124} to={138} />
					<Stroke d="M 660 360 L 678 356" from={130} to={144} />
					{/* the new character taking shape between the marks: head, then ears */}
					<Stroke d="M 422 264 A 46 46 0 1 1 421.9 264" from={140} to={172} width={4} />
					<Stroke d="M 380 230 A 20 20 0 1 1 379.9 230" from={156} to={176} />
					<Stroke d="M 464 230 A 20 20 0 1 1 463.9 230" from={160} to={180} />
					{/* two peg holes at the bottom edge of the sheet */}
					<rect x={310} y={596} width={64} height={17} rx={8} fill="#2A241C" opacity={0.8} />
					<rect x={466} y={596} width={64} height={17} rx={8} fill="#2A241C" opacity={0.8} />
				</svg>
			</div>

			{/* The earliest sketches of the new character — the reveal. */}
			<CardDF
				image={IMG_DF.mickeyConcept}
				width={900}
				center={[540, 765]}
				anchor={[0.5, 0.42]}
				zoom={[1.06, 1.15]}
				range={[born, 290]}
				grade={GRADE_DF.photoBright}
				glow="0 0 100px rgba(240,195,119,0.16)"
				showFrom={born}
				showTo={310}
				fadeIn={18}
				fadeOut={0}
			/>
			<CardDF
				image={IMG_DF.iwerksSignature}
				width={340}
				center={[712, 1058]}
				grade={{brightness: 1, saturate: 0, sepia: 0, contrast: 1.1}}
				flat
				reveal={false}
				showFrom={iwerks + 2}
				showTo={310}
				fadeIn={14}
				fadeOut={0}
			/>

			<TextDF start={born} top={215} size={124} color={DF.white}>
				MICKEY MOUSE
			</TextDF>
			<RuleDF start={born + 12} top={392} width={210} color={DF.yellow} />
			<TextDF start={iwerks} top={1168} size={46} font="sans" weight={700} spacing={0.26} color={DF.goldText} scrim={false}>
				UB IWERKS
			</TextDF>
		</AbsoluteFill>
	);
};
