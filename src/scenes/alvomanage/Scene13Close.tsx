import React from "react";
import {useCurrentFrame} from "remotion";
import {SceneAM} from "../../components/alvomanage/SceneAM";
import {ScreenCropAM} from "../../components/alvomanage/ScreenCropAM";
import {TextAM} from "../../components/alvomanage/TextAM";
import {kf, land, ramp} from "../../components/alvomanage/motion-am";
import {AM, FONT_AM} from "../../utils/theme-am";
import {CLIENT_PHONE, CLIENT_PHONE_RECTS, OS_LINK, OS_LINK_RECTS} from "../../utils/images-am";
import {SCENE_DURATIONS_AM, cueAM} from "../../utils/timing-am";

const I = 12;
/** The app header's own grey, so the official wordmark crop sits seamlessly. */
const PLATE = "#262626";

/**
 * am13 — "AlvoManage. Pra você cuidar do conserto, e não da bagunça."
 * The film's objects (phone, paper, store) collapse into the centre; the
 * OFFICIAL logo enters on "AlvoManage." — the "A" mark cropped from the
 * customer page and the wordmark cropped from the app header (not redrawn),
 * on a plate of the header's own grey. Signature + URL, then 1.5 s hold.
 */
export const Scene13Close: React.FC = () => {
	const frame = useCurrentFrame();
	const D = SCENE_DURATIONS_AM[I];
	const c = cueAM(I, "am13");
	const tLogo = Math.max(4, c.word("AlvoManage") - 2);
	const tPra = c.word("Pra você");
	const tNao = c.word("e não");
	const tBag = c.word("bagunça");

	const collapse = ramp(frame, 0, Math.max(8, tLogo));
	const plate = land(frame, tLogo, 13);
	const mark = land(frame, tLogo + 4, 10);
	const word = ramp(frame, tLogo + 6, 10);

	const objects = [
		{x: 160, y: 380, label: "phone"},
		{x: 920, y: 420, label: "paper"},
		{x: 170, y: 1560, label: "store"},
		{x: 900, y: 1500, label: "paper"},
	];

	const mk = CLIENT_PHONE_RECTS.logoMark;
	const wm = OS_LINK_RECTS.wordmark;
	const WM_W = 560;
	const WM_H = (WM_W * wm.h) / wm.w;

	return (
		<SceneAM duration={D} entry="blur" drift={0.04}>
			{objects.map((o, i) => {
				const x = o.x + (540 - o.x) * collapse;
				const y = o.y + (760 - o.y) * collapse;
				const s = 1 - collapse;
				if (s <= 0.02) return null;
				return (
					<div
						key={i}
						style={{
							position: "absolute",
							left: x - 70,
							top: y - 90,
							width: o.label === "store" ? 160 : 140,
							height: o.label === "phone" ? 220 : 180,
							borderRadius: o.label === "phone" ? 28 : 10,
							background: o.label === "paper" ? AM.paper : o.label === "store" ? AM.yellow : "#2A2D35",
							border: o.label === "phone" ? "4px solid #3A3D46" : "none",
							transform: `scale(${s}) rotate(${(1 - s) * 180}deg)`,
							opacity: s,
						}}
					/>
				);
			})}

			{/* Logo plate */}
			<div
				style={{
					position: "absolute",
					left: 90,
					top: 560,
					width: 900,
					height: 400,
					borderRadius: 48,
					background: PLATE,
					boxShadow: `0 40px 120px rgba(0,0,0,0.6), 0 0 160px ${AM.blueSoft}`,
					transform: `scale(${0.7 + 0.3 * plate})`,
					opacity: Math.min(1, plate * 1.4),
				}}
			>
				<div
					style={{
						position: "absolute",
						left: 450 - 95,
						top: 40,
						width: 190,
						height: 190,
						borderRadius: 44,
						overflow: "hidden",
						transform: `scale(${mark}) rotate(${(1 - mark) * -20}deg)`,
					}}
				>
					<ScreenCropAM screen={CLIENT_PHONE} width={190} height={190} camera={mk} background="#FFFFFF" />
				</div>
				<div
					style={{
						position: "absolute",
						left: 450 - WM_W / 2,
						top: 260,
						opacity: word,
						clipPath: `inset(0 ${(1 - word) * 100}% 0 0)`,
					}}
				>
					<ScreenCropAM screen={OS_LINK} width={WM_W} height={WM_H} camera={wm} background={PLATE} />
				</div>
			</div>

			<TextAM at={tPra} y={1080} size={80} mode="rise">
				Cuide do conserto.
			</TextAM>
			<TextAM at={tNao} y={1180} size={80} mode="rise" color={AM.yellow}>
				Não da bagunça.
			</TextAM>
			<div
				style={{
					position: "absolute",
					left: 0,
					right: 0,
					top: 1420,
					textAlign: "center",
					fontFamily: FONT_AM,
					fontWeight: 700,
					fontSize: 54,
					color: AM.white,
					letterSpacing: 1,
					opacity: ramp(frame, tBag, 10),
					transform: `translateY(${kf(frame, [tBag, tBag + 12], [24, 0])}px)`,
				}}
			>
				app.alvomanage.com
			</div>
		</SceneAM>
	);
};
