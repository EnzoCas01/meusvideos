import React from "react";
import {AM} from "../../utils/theme-am";

/**
 * Generic phone, drawn in code — no brand, no real model. Used both as the
 * customer's phone (screen = real page capture) and as a drawn object
 * (cracked iPhone at the counter, the shop owner's ringing phone).
 * `x`,`y` are the CENTRE of the phone.
 */
export const PhoneAM: React.FC<{
	x: number;
	y: number;
	/** Screen width; the body adds a bezel around it. */
	screenW: number;
	screenH: number;
	children?: React.ReactNode;
	rotate?: number;
	scale?: number;
	screenBg?: string;
	glow?: number;
	opacity?: number;
}> = ({x, y, screenW, screenH, children, rotate = 0, scale = 1, screenBg = "#05060A", glow = 0.6, opacity = 1}) => {
	const bezel = Math.round(screenW * 0.045);
	const bodyW = screenW + bezel * 2;
	const bodyH = screenH + bezel * 2;
	const radius = screenW * 0.14;
	return (
		<div
			style={{
				position: "absolute",
				left: x - bodyW / 2,
				top: y - bodyH / 2,
				width: bodyW,
				height: bodyH,
				borderRadius: radius + bezel,
				background: "linear-gradient(160deg, #2A2D35, #111216 60%, #1D1F25)",
				boxShadow: `0 0 0 3px #3A3D46, 0 40px 90px rgba(0,0,0,0.6), 0 0 120px rgba(61,123,247,${0.18 * glow})`,
				transform: `rotate(${rotate}deg) scale(${scale})`,
				opacity,
			}}
		>
			<div
				style={{
					position: "absolute",
					left: bezel,
					top: bezel,
					width: screenW,
					height: screenH,
					borderRadius: radius,
					overflow: "hidden",
					background: screenBg,
				}}
			>
				{children}
			</div>
			{/* Camera pill — generic, centred. */}
			<div
				style={{
					position: "absolute",
					left: bodyW / 2 - screenW * 0.15,
					top: bezel + screenW * 0.035,
					width: screenW * 0.3,
					height: screenW * 0.075,
					borderRadius: 999,
					background: "#000",
				}}
			/>
		</div>
	);
};

/** Dark rounded window around a desktop capture (never a full desktop shrunk). */
export const WindowAM: React.FC<{
	x: number;
	y: number;
	width: number;
	height: number;
	children: React.ReactNode;
	title?: string;
	opacity?: number;
	scale?: number;
}> = ({x, y, width, height, children, opacity = 1, scale = 1}) => {
	const bar = 46;
	return (
		<div
			style={{
				position: "absolute",
				left: x - width / 2,
				top: y - (height + bar) / 2,
				width,
				height: height + bar,
				borderRadius: 28,
				overflow: "hidden",
				background: "#111216",
				boxShadow: `0 0 0 2px ${AM.line}, 0 50px 120px rgba(0,0,0,0.65), 0 0 140px ${AM.blueSoft}`,
				opacity,
				transform: `scale(${scale})`,
			}}
		>
			<div style={{height: bar, display: "flex", alignItems: "center", gap: 12, paddingLeft: 24}}>
				{[0, 1, 2].map((i) => (
					<div key={i} style={{width: 14, height: 14, borderRadius: 7, background: AM.faint}} />
				))}
			</div>
			{children}
		</div>
	);
};
