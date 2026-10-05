import React from "react";
import {AbsoluteFill} from "remotion";
import {CaptionsStyled, CaptionLine, CaptionStyle} from "./components/captions/CaptionsStyled";

export const FPS_CPV = 30;
export const TOTAL_FRAMES_CPV = 150;

/** Sample sentence with word timings (frames), same shape as narration-*.json. */
const SAMPLE: CaptionLine[] = [
	{
		frame: 6,
		words: [
			{w: "Tudo", s: 0, e: 12},
			{w: "começou", s: 12, e: 30},
			{w: "com", s: 30, e: 38},
			{w: "uma", s: 38, e: 46},
			{w: "ideia", s: 46, e: 62},
			{w: "simples,", s: 62, e: 84},
			{w: "e", s: 90, e: 96},
			{w: "ninguém", s: 96, e: 110},
			{w: "acreditou", s: 110, e: 124},
			{w: "na", s: 124, e: 128},
			{w: "transformação.", s: 128, e: 144},
		],
	},
];

/** Preview only: how each caption style looks, over a stand-in for a photo. */
export const CaptionPreview: React.FC<{style: CaptionStyle}> = ({style}) => (
	<AbsoluteFill style={{background: "linear-gradient(160deg,#3a5a7a 0%,#1c2b3a 55%,#0d141c 100%)"}}>
		<CaptionsStyled style={style} lines={SAMPLE} />
	</AbsoluteFill>
);
