import React from "react";
import {useCurrentFrame} from "remotion";
import {BeatAM, SceneAM} from "../../components/alvomanage/SceneAM";
import {WindowAM} from "../../components/alvomanage/FramesAM";
import {HighlightAM, ScreenCropAM} from "../../components/alvomanage/ScreenCropAM";
import {TextAM} from "../../components/alvomanage/TextAM";
import {CursorAM} from "../../components/alvomanage/CursorAM";
import {OsCardAM} from "../../components/alvomanage/OsCardAM";
import {fitRect, kfRect, ramp} from "../../components/alvomanage/motion-am";
import {PAPERS_AM, PaperAMView} from "./Scene02Mess";
import {AM} from "../../utils/theme-am";
import {OS_LINK, OS_LINK_RECTS} from "../../utils/images-am";
import {SCENE_DURATIONS_AM, cueAM} from "../../utils/timing-am";

const I = 2;
const VIEW_W = 980;
const VIEW_H = 560;
const ASPECT = VIEW_W / VIEW_H;

/**
 * am03 — "No AlvoManage, cada conserto vira uma ordem de serviço. E toda OS
 * tem um link só dela."
 * A: match cut — the scattered papers of scene 2 align and become ONE OS card.
 * B: real OS page (os_aberta_link) — camera lands on "OS #13 · Em Aberto".
 * C: pan along LINK DO CLIENTE; URL highlighted on "link"; cursor clicks
 *    "Copiar" on "só dela". The WhatsApp button is masked (images-am.ts).
 */
export const Scene03OsLink: React.FC = () => {
	const frame = useCurrentFrame();
	const D = SCENE_DURATIONS_AM[I];
	const c = cueAM(I, "am03");
	const tCada = c.word("cada");
	const tOrdem = c.word("ordem");
	const tToda = c.word("E toda");
	const tLink = c.word("link");
	const tDela = c.word("só dela");
	// "link" and "só dela" are ~7 frames apart in the measured voice: too short
	// for camera pan + ring + click. The URL ring lands as soon as the strip is
	// on screen (no later than "link"); the Copiar click waits until there is
	// room for the pan. audio-am.ts uses the same tCopy for its tick.
	const tUrl = Math.min(tLink, tToda + 8);
	const tCopy = Math.max(tDela, tUrl + 24);

	const gather = ramp(frame, 2, Math.max(10, tCada - 2));
	const card = ramp(frame, Math.max(8, tCada - 6), 10);

	const full = {x: 60, y: 300 - 1290 / ASPECT / 2, w: 1290, h: 1290 / ASPECT};
	const head = fitRect(OS_LINK_RECTS.header, ASPECT, 1.12);
	const camB = kfRect(frame, [tOrdem - 4, tOrdem + 8], [full, head]);

	const stripL = fitRect({x: 110, y: 192, w: 600, h: 52}, ASPECT, 1.0);
	const stripR = fitRect({x: 690, y: 192, w: 600, h: 52}, ASPECT, 1.0);
	const camC = kfRect(frame, [tToda - 2, tUrl, tCopy - 8, tCopy], [head, stripL, stripL, stripR]);

	return (
		<SceneAM duration={D} entry="push">
			<BeatAM from={0} to={tOrdem - 4} zoomFrom={1} zoomTo={1}>
				{PAPERS_AM.slice(0, 8).map((p, i) => (
					<PaperAMView
						key={i}
						p={p}
						style={{
							transform: `translate(${(540 - p.x) * gather}px, ${(980 - p.y) * gather}px) rotate(${p.rot * (1 - gather)}deg) scale(${1 - 0.2 * gather})`,
							opacity: 1 - card,
						}}
					/>
				))}
				<OsCardAM x={540} y={980} scale={0.85 + 0.15 * card} opacity={card} />
				<TextAM at={tCada} y={300} size={84} mode="pop">
					1 conserto = <span style={{color: AM.yellow}}>1 OS</span>
				</TextAM>
			</BeatAM>

			<BeatAM from={tOrdem - 4} to={tToda - 1} zoomFrom={1.04} zoomTo={1}>
				<WindowAM x={540} y={960} width={VIEW_W} height={VIEW_H}>
					<ScreenCropAM screen={OS_LINK} width={VIEW_W} height={VIEW_H} camera={camB}>
						<HighlightAM rect={OS_LINK_RECTS.badge} at={tOrdem + 6} stroke={2} pad={3} />
					</ScreenCropAM>
				</WindowAM>
				<TextAM at={tOrdem} y={440} size={80} mode="rise">
					ordem de serviço
				</TextAM>
			</BeatAM>

			<BeatAM from={tToda - 1} to={D} zoomFrom={1} zoomTo={1.03} fadeIn={3}>
				<WindowAM x={540} y={960} width={VIEW_W} height={VIEW_H}>
					<ScreenCropAM screen={OS_LINK} width={VIEW_W} height={VIEW_H} camera={camC}>
						<HighlightAM rect={OS_LINK_RECTS.url} at={tUrl} stroke={2} pad={3} until={tCopy - 6} />
						<HighlightAM rect={OS_LINK_RECTS.copiar} at={tCopy} stroke={2} pad={3} />
						<CursorAM
							frames={[tUrl, tCopy - 8, tCopy - 2]}
							xs={[700, 1140, 1165]}
							ys={[280, 226, 218]}
							clickAt={tCopy}
							size={30}
							from={tUrl - 2}
						/>
					</ScreenCropAM>
				</WindowAM>
				<TextAM at={tToda + 2} y={440} size={84} mode="rise">
					cada OS, <span style={{color: AM.yellow}}>um link</span>
				</TextAM>
				<TextAM at={tDela + 2} y={1330} size={54} color={AM.grey} weight={700} mode="reveal">
					só dela
				</TextAM>
			</BeatAM>
		</SceneAM>
	);
};
