import React from "react";
import {Freeze, OffthreadVideo, Sequence, staticFile, useCurrentFrame} from "remotion";
import {BeatAM, SceneAM} from "../../components/alvomanage/SceneAM";
import {WindowAM} from "../../components/alvomanage/FramesAM";
import {HighlightAM, ScreenCropAM} from "../../components/alvomanage/ScreenCropAM";
import {TextAM} from "../../components/alvomanage/TextAM";
import {CursorAM} from "../../components/alvomanage/CursorAM";
import {fitRect, kfRect, land} from "../../components/alvomanage/motion-am";
import {AM, FONT_AM} from "../../utils/theme-am";
import {SIDEBAR, SIDEBAR_RECTS as R, SIDEBAR_VIDEO} from "../../utils/images-am";
import {SCENE_DURATIONS_AM, cueAM} from "../../utils/timing-am";

const I = 7;
const VW = 600;
const VH = 1180;

const TILES = ["PDV", "Produtos", "Estoque", "Clientes", "OS", "Caixa", "Painel", "Contas", "Lojas"];

/**
 * am08 — "Mas o AlvoManage não é só OS. É o sistema da loja inteira."
 * A: the OS tile is one tile among many — the whole shop grows around it.
 * B: the real side menu; the cursor arrives from the left edge and the groups
 *    (Cadastro, Vendas, Ordem de Serviço, Estoque) light up one by one.
 *    With SIDEBAR_VIDEO: the real recording of the menu opening and scrolling
 *    down to Financeiro, sped up so the whole menu passes inside the beat.
 */
export const Scene08Whole: React.FC = () => {
	const frame = useCurrentFrame();
	const D = SCENE_DURATIONS_AM[I];
	const c = cueAM(I, "am08");
	const tNao = c.word("não é só");
	const tSist = c.word("É o sistema");
	const tLoja = c.word("loja inteira");
	const span = Math.max(12, D - tSist - 6);
	const beatB = tSist - 2;
	// Whole recorded menu (open -> Financeiro) inside the beat, landing a few
	// frames before the cut. Clamped so a long beat never plays it slow-mo.
	const videoRate = SIDEBAR_VIDEO
		? Math.min(6, Math.max(1, SIDEBAR_VIDEO.frames / Math.max(1, D - beatB - 4)))
		: 1;
	// Local frame of the last safe source frame; past it the clip holds still
	// (never asks the decoder for a frame beyond the file).
	const clipEnd = SIDEBAR_VIDEO ? Math.floor((SIDEBAR_VIDEO.frames - 2) / videoRate) : 0;

	const aspect = VW / VH;
	const wide = fitRect(R.menu, aspect, 1.02);
	const close = fitRect({x: 0, y: 130, w: 182, h: 300}, aspect, 1.0);
	const camera = kfRect(frame, [tSist, tSist + span * 0.5, tSist + span], [wide, close, wide]);

	return (
		<SceneAM duration={D} entry="push">
			<BeatAM from={0} to={tSist - 2} zoomFrom={1.15} zoomTo={1}>
				{TILES.map((name, i) => {
					const col = i % 3;
					const row = Math.floor(i / 3);
					const isOs = name === "OS";
					const s = isOs ? 1 : land(frame, tNao + (Math.abs(col - 1) + Math.abs(row - 1)) * 3, 12);
					return (
						<div
							key={name}
							style={{
								position: "absolute",
								left: 150 + col * 270,
								top: 640 + row * 270,
								width: 240,
								height: 240,
								borderRadius: 36,
								background: isOs ? AM.yellow : AM.panelHi,
								border: isOs ? "none" : `2px solid ${AM.line}`,
								color: isOs ? "#1A1400" : AM.white,
								fontFamily: FONT_AM,
								fontWeight: 800,
								fontSize: isOs ? 80 : 40,
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								transform: `scale(${s})`,
								opacity: s,
							}}
						>
							{name}
						</div>
					);
				})}
				<TextAM at={tNao - 2} y={300} size={92} mode="pop">
					não é só <span style={{color: AM.yellow}}>OS</span>
				</TextAM>
			</BeatAM>

			<BeatAM from={beatB} to={D} zoomFrom={1.06} zoomTo={1} blurIn={6}>
				<WindowAM x={540} y={1180} width={VW} height={VH}>
					{SIDEBAR_VIDEO ? (
						<Sequence from={beatB} layout="none">
							<Freeze frame={clipEnd} active={frame - beatB > clipEnd}>
								<OffthreadVideo
									src={staticFile(SIDEBAR_VIDEO.src)}
									muted
									playbackRate={videoRate}
									style={{display: "block", width: VW, height: VH, objectFit: "cover"}}
								/>
							</Freeze>
						</Sequence>
					) : (
						<ScreenCropAM screen={SIDEBAR} width={VW} height={VH} camera={camera}>
							{[R.cadastro, R.vendas, R.os, R.estoque].map((rect, k) => (
								<HighlightAM key={k} rect={rect} at={tSist + 4 + k * Math.round(span / 5)} stroke={2} pad={2} />
							))}
							<CursorAM
								frames={[tSist, tSist + 10, tSist + span]}
								xs={[-30, 60, 70]}
								ys={[300, 270, 500]}
								size={18}
							/>
						</ScreenCropAM>
					)}
				</WindowAM>
				<TextAM at={tSist} y={200} size={84} mode="rise">
					o sistema da
				</TextAM>
				<TextAM at={tLoja} y={300} size={92} mode="pop" color={AM.yellow}>
					loja inteira
				</TextAM>
			</BeatAM>
		</SceneAM>
	);
};
