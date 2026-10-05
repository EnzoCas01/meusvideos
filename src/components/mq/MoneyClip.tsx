import React from "react";
import {OffthreadVideo, staticFile} from "remotion";
import {MQ} from "../../utils/theme-mq";

type Props = {
	/** Punch-in; never below 1.15 — that is what keeps the machine panel out of frame. */
	zoom?: number;
	startFrom?: number;
	/** Horizontal object-position (parallax inside the clip, still sharp). */
	panX?: string;
	/** Fraction of the box height taken by the solid bar. */
	band?: number;
	/** Gold hairline on top of the bar (full-bleed use only). */
	line?: boolean;
};

/**
 * The money-counter clip, brand-safe. The third-party brand ("PERCONTA") is
 * printed on the machine's control panel, always below ~55% of the source
 * frame. The video is anchored to the top, zoomed in enough that only the
 * coins stay visible, and a SOLID bar (never a blur) covers the lower band.
 */
export const MoneyClip: React.FC<Props> = ({zoom = 1.15, startFrom, panX = "50%", band = 0.42, line = false}) => (
	<div style={{position: "absolute", inset: 0, overflow: "hidden"}}>
		<OffthreadVideo
			src={staticFile("videos/mq-dinheiro/clip-01.mp4")}
			muted
			startFrom={startFrom}
			style={{
				width: "100%",
				height: "100%",
				objectFit: "cover",
				objectPosition: `${panX} top`,
				transform: `scale(${zoom})`,
				transformOrigin: "50% 0%",
			}}
		/>
		<div
			style={{
				position: "absolute",
				left: 0,
				right: 0,
				bottom: 0,
				height: `${band * 100}%`,
				background: MQ.background,
			}}
		/>
		{line && (
			<div
				style={{
					position: "absolute",
					left: 0,
					right: 0,
					bottom: `${band * 100}%`,
					height: 2,
					background: MQ.accent,
					opacity: 0.5,
				}}
			/>
		)}
	</div>
);
