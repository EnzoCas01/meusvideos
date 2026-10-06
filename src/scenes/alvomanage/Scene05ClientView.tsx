import React from "react";
import {useCurrentFrame} from "remotion";
import {SceneAM} from "../../components/alvomanage/SceneAM";
import {PhoneAM} from "../../components/alvomanage/FramesAM";
import {HighlightAM, ScreenCropAM} from "../../components/alvomanage/ScreenCropAM";
import {TextAM} from "../../components/alvomanage/TextAM";
import {clampRect, kfRect, ramp} from "../../components/alvomanage/motion-am";
import {AM} from "../../utils/theme-am";
import {CLIENT_PHONE, CLIENT_PHONE_RECTS as R, CLIENT_PHONE_SCROLL as S} from "../../utils/images-am";
import {SCENE_DURATIONS_AM, cueAM} from "../../utils/timing-am";

const I = 4;
const SW = 600;
const SH = 1240;
const AS = SW / SH;

/** A signature, drawn in image coordinates inside the "Assine aqui" box. */
const SIGN =
	"M150 4250 C170 4170 210 4150 220 4210 C230 4280 190 4300 200 4240 C215 4170 270 4180 280 4230 C290 4270 300 4200 330 4200 C360 4200 350 4260 380 4250 C410 4240 400 4180 440 4190 C480 4200 450 4270 500 4250 C540 4235 560 4190 620 4215";

/**
 * am05 — "Ele vê se tá em aberto, pronto ou entregue. O defeito, o valor, a
 * garantia. E assina o recebimento ali mesmo."
 * One continuous shot inside the phone: the real customer page scrolls and
 * each section lands on its word; the stepper steps light one by one; a
 * signature is drawn over the box and "Confirmar" lights up.
 */
export const Scene05ClientView: React.FC = () => {
	const frame = useCurrentFrame();
	const D = SCENE_DURATIONS_AM[I];
	const c = cueAM(I, "am05");
	const tAb = c.word("aberto");
	const tPr = c.word("pronto");
	const tEn = c.word("entregue");
	const tDef = c.word("defeito");
	const tVal = c.word("valor");
	const tGar = c.word("garantia");
	const tAss = c.word("assina");
	const tAli = c.word("ali mesmo");

	const H = (w: number) => w / AS;
	const top = {x: 0, y: 0, w: 780, h: H(780)};
	const step = {x: 70, y: 200, w: 640, h: H(640)};
	const def = {x: 0, y: S.defeito, w: 780, h: H(780)};
	const val = {x: 220, y: S.valor + 120, w: 560, h: H(560)};
	const gar = {x: 0, y: S.garantia, w: 780, h: H(780)};
	const ass = clampRect({x: 0, y: S.assinatura, w: 780, h: H(780)}, 780, CLIENT_PHONE.height);
	// Scroll travel scales with the gap to the previous word (max 8 frames):
	// with ~14-frame gaps between "valor"/"garantia" a fixed 8-frame move left
	// each section on screen for only 6 frames.
	const mv = (from: number, to: number) => Math.min(8, Math.max(4, Math.round((to - from) * 0.35)));
	const camera = kfRect(
		frame,
		[
			0,
			tAb - 8,
			tAb,
			tDef - mv(tEn, tDef),
			tDef,
			tVal - mv(tDef, tVal),
			tVal,
			tGar - mv(tVal, tGar),
			tGar,
			tAss - mv(tGar, tAss) - 2,
			tAss - 1,
		],
		[top, top, step, step, def, def, val, val, gar, gar, ass],
	);

	const sign = ramp(frame, tAss, Math.max(12, tAli - tAss));
	const enter = ramp(frame, 0, 10);

	const words: [number, number, string][] = [
		[tAb, tDef - 2, "aberto · pronto · entregue"],
		[tDef, tVal - 2, "o defeito"],
		[tVal, tGar - 2, "o valor"],
		[tGar, tAss - 2, "a garantia"],
		[tAss, D + 1, "assina ali mesmo"],
	];

	return (
		<SceneAM duration={D} entry="blur" drift={0.02}>
			<div style={{position: "absolute", inset: 0, transform: `translateY(${(1 - enter) * 60}px)`}}>
				<PhoneAM x={540} y={930} screenW={SW} screenH={SH} glow={1}>
					<ScreenCropAM screen={CLIENT_PHONE} width={SW} height={SH} camera={camera} background="#fff">
						<HighlightAM rect={R.stepAberto} at={tAb} until={tDef - 4} stroke={6} pad={6} fill={false} />
						<HighlightAM rect={R.stepPronto} at={tPr} until={tDef - 4} stroke={6} pad={6} fill={false} />
						<HighlightAM rect={R.stepEntregue} at={tEn} until={tDef - 4} stroke={6} pad={6} fill={false} />
						<HighlightAM rect={{...R.defeito, x: 20, w: 740}} at={tDef + 1} until={tVal - 2} stroke={5} />
						<HighlightAM rect={R.valor} at={tVal + 1} until={tGar - 2} stroke={5} pad={10} />
						<HighlightAM rect={{...R.garantia, x: 20, w: 740}} at={tGar + 1} until={tAss - 4} stroke={5} />
						<svg
							width={CLIENT_PHONE.width}
							height={CLIENT_PHONE.height}
							style={{position: "absolute", left: 0, top: 0, overflow: "visible"}}
						>
							{frame >= tAss && (
								<path
									d={SIGN}
									fill="none"
									stroke="#1D2A6B"
									strokeWidth={7}
									strokeLinecap="round"
									strokeLinejoin="round"
									pathLength={1}
									strokeDasharray={1}
									strokeDashoffset={1 - sign}
								/>
							)}
						</svg>
						<HighlightAM rect={R.confirmar} at={tAli} stroke={6} pad={4} color={AM.green} />
					</ScreenCropAM>
				</PhoneAM>
			</div>
			{words.map(([a, b, w]) => (
				<TextAM key={w} at={a} until={b} y={1640} size={w.length > 18 ? 56 : 80} mode="rise">
					{w}
				</TextAM>
			))}
		</SceneAM>
	);
};
