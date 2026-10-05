import React from "react";
import {Easing, Img, interpolate, staticFile, useCurrentFrame} from "remotion";
import {GRADES} from "../../components/netflix/GradedPhoto";
import {SceneShell} from "../../components/netflix/SceneShell";
import {WorldMapStaticNF} from "../../components/netflix/WorldMapNF";
import {cueForNF} from "../../utils/cue-nf";
import {COUNTRIES_NF} from "../../utils/mapa-nf";
import {IMG, ImageNF} from "../../utils/imagens-nf";
import {DISPLAY_NF, NF} from "../../utils/theme-nf";

const cueFor = cueForNF(8);

const ROW_H = 245;
const TOP = 215;
const THUMB_W = 340;
const THUMB_H = 205;
const LINE_X = 50;

const filterOf = (g: typeof GRADES.warm) =>
	`brightness(${g.brightness}) saturate(${g.saturate}) sepia(${g.sepia}) contrast(${g.contrast})`;

/** A real photo cropped to the thumb, drifting slowly inside its frame. */
const Photo: React.FC<{image: ImageNF; pos: string; t: number; zoom?: [number, number]}> = ({image, pos, t, zoom = [1.05, 1.2]}) => (
	<Img
		src={staticFile(image.path)}
		style={{
			width: "100%",
			height: "100%",
			objectFit: "cover",
			objectPosition: pos,
			filter: filterOf(GRADES.warm),
			transform: `scale(${zoom[0] + (zoom[1] - zoom[0]) * Math.min(1, t / 150)})`,
		}}
	/>
);

const Disc: React.FC<{t: number}> = ({t}) => {
	const W = THUMB_H / (2 * 0.43);
	const H = W * (IMG.disc.height / IMG.disc.width);
	return (
		<div style={{width: THUMB_H, height: THUMB_H, borderRadius: "50%", overflow: "hidden", position: "relative", margin: `0 ${(THUMB_W - THUMB_H) / 2}px`}}>
			<Img
				src={staticFile(IMG.disc.path)}
				style={{
					position: "absolute",
					width: W,
					height: H,
					left: THUMB_H / 2 - 0.505 * W,
					top: THUMB_H / 2 - 0.511 * H,
					transformOrigin: `${0.505 * W}px ${0.511 * H}px`,
					transform: `rotate(${t * 2.2}deg)`,
					filter: filterOf(GRADES.disc),
				}}
			/>
		</div>
	);
};

const MiniMap: React.FC<{t: number}> = ({t}) => {
	const dots = COUNTRIES_NF.filter((c) => c.area > 3);
	return (
		<div style={{width: "100%", height: "100%", display: "flex", alignItems: "center", background: "#0b0a09"}}>
			<WorldMapStaticNF width={THUMB_W}>
				{dots.map((c, i) => (
					<circle
						key={c.id}
						cx={c.cx}
						cy={c.cy}
						r={2.2}
						fill={NF.white}
						opacity={interpolate(t - (i % 12) * 3, [0, 12], [0, 0.95], {extrapolateLeft: "clamp", extrapolateRight: "clamp"})}
					/>
				))}
			</WorldMapStaticNF>
		</div>
	);
};

/**
 * 09 — the recap builds as a vertical timeline: each stage enters and stays,
 * with material already seen in the film. The newest is bright, older ones
 * settle to grey.
 */
export const Scene9: React.FC = () => {
	const frame = useCurrentFrame();
	const cue = cueFor("09-transformacao");

	const stages = [
		{word: "DVD", at: cue.start + 4},
		{word: "ASSINATURA", at: cue.atText("Primeiro")},
		{word: "STREAMING", at: cue.atText("Depois")},
		{word: "ORIGINAIS", at: cue.atText("E então")},
		{word: "MUNDO", at: cue.atText("histórias") - 4},
	];

	const thumbs = [
		(t: number) => <Disc t={t} />,
		(t: number) => <Photo image={IMG.returnMailer} pos="50% 50%" t={t} />,
		(t: number) => <Photo image={IMG.appleTvTv} pos="30% 45%" t={t} />,
		(t: number) => <Photo image={IMG.hocSet1} pos="62% 40%" t={t} />,
		(t: number) => <MiniMap t={t} />,
	];

	const lineTo = stages.reduce((acc, s, i) => {
		const p = interpolate(frame - s.at, [0, 22], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic)});
		return i === 0 ? p * 0 : acc + p;
	}, 0);

	return (
		<SceneShell index={8}>
			<div
				style={{
					position: "absolute",
					left: LINE_X - 2,
					top: TOP + ROW_H / 2,
					width: 4,
					height: lineTo * ROW_H,
					background: NF.accent,
				}}
			/>
			{stages.map((s, i) => {
				const t = frame - s.at;
				if (t < 0) return null;
				const rise = interpolate(t, [0, 24], [0, 1], {extrapolateRight: "clamp", easing: Easing.bezier(0.16, 1, 0.3, 1)});
				const wipe = interpolate(t, [0, 20], [0, 1], {extrapolateRight: "clamp", easing: Easing.bezier(0.16, 1, 0.3, 1)});
				const nextAt = stages[i + 1]?.at ?? Infinity;
				const old = interpolate(frame - nextAt, [0, 20], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
				const y = TOP + i * ROW_H;
				return (
					<div key={s.word}>
						<div
							style={{
								position: "absolute",
								left: LINE_X - 11,
								top: y + ROW_H / 2 - 11,
								width: 22,
								height: 22,
								borderRadius: "50%",
								background: old > 0.5 ? NF.grey : NF.accentText,
								transform: `scale(${rise})`,
							}}
						/>
						<div
							style={{
								position: "absolute",
								left: 100,
								top: y + (ROW_H - THUMB_H) / 2,
								width: THUMB_W,
								height: THUMB_H,
								overflow: "hidden",
								clipPath: `inset(0 ${(1 - wipe) * 100}% 0 0)`,
								opacity: 1 - old * 0.45,
							}}
						>
							{thumbs[i](t)}
						</div>
						<div
							style={{
								position: "absolute",
								left: 100 + THUMB_W + 34,
								top: y + ROW_H / 2 - 75,
								height: 150,
								overflow: "hidden",
								display: "flex",
								alignItems: "center",
							}}
						>
							<div
								style={{
									fontFamily: DISPLAY_NF,
									fontSize: 132,
									lineHeight: 1,
									letterSpacing: "0.04em",
									whiteSpace: "nowrap",
									color: old > 0.5 ? NF.grey : NF.white,
									transform: `translateY(${(1 - rise) * 110}%)`,
								}}
							>
								{s.word}
							</div>
						</div>
					</div>
				);
			})}
		</SceneShell>
	);
};
