import React from "react";
import {useCurrentFrame} from "remotion";
import {BeatAM, SceneAM} from "../../components/alvomanage/SceneAM";
import {WindowAM} from "../../components/alvomanage/FramesAM";
import {HighlightAM, ScreenCropAM} from "../../components/alvomanage/ScreenCropAM";
import {TextAM} from "../../components/alvomanage/TextAM";
import {CursorAM} from "../../components/alvomanage/CursorAM";
import {clampRect, fitRect, kfRect, ramp} from "../../components/alvomanage/motion-am";
import {AM, FONT_AM} from "../../utils/theme-am";
import {PDV, PDV_RECTS, PRODUCTS, PRODUCTS_RECTS as P} from "../../utils/images-am";
import {SCENE_DURATIONS_AM, cueAM} from "../../utils/timing-am";

const I = 9;
const VW = 960;
const VH = 600;
const AS = VW / VH;

/**
 * am10 — "Tem o PDV pro balcão. Produtos com preço, custo, lucro e estoque na
 * mesma tela."
 * A: PDV crop (product list + cart, below the masked "caixa fechado" banner);
 *    the cursor adds "Bateria iPhone 11" on "balcão".
 * B: products table, camera pans across PREÇO / CUSTO / LUCRO / ESTOQUE on
 *    the "Bateria iPhone 11" row — echo of the hook's iPhone — each column
 *    lighting on its word; pulls back to the whole table on "mesma tela".
 */
export const Scene10Sales: React.FC = () => {
	const frame = useCurrentFrame();
	const D = SCENE_DURATIONS_AM[I];
	const c = cueAM(I, "am10");
	const tPdv = c.word("PDV");
	const tBalcao = c.word("balcão");
	const tProd = c.word("Produtos");
	const tPreco = c.word("preço");
	const tCusto = c.word("custo");
	const tLucro = c.word("lucro");
	const tEst = c.word("estoque");
	const tMesma = c.word("mesma tela");

	const pdvCam = kfRect(
		frame,
		[0, tBalcao - 4, tBalcao + 6],
		[fitRect(PDV_RECTS.area, AS, 1.02), fitRect(PDV_RECTS.area, AS, 1.02), fitRect({x: 96, y: 150, w: 420, h: 200}, AS, 1)],
	);

	const colCam = (q: {x: number; w: number}) => fitRect({x: q.x + q.w / 2 - 170, y: 284, w: 340, h: 105}, AS, 1.05);
	const tableCam = clampRect(fitRect({x: 101, y: 284, w: 1209, h: 293}, AS, 1.0), PRODUCTS.width, PRODUCTS.height);
	const prodCam = kfRect(
		frame,
		[tProd, tPreco - 4, tCusto - 4, tLucro - 4, tEst - 4, tMesma - 4, tMesma + 8],
		[colCam(P.colProduto), colCam(P.colPreco), colCam(P.colCusto), colCam(P.colLucro), colCam(P.colEstoque), colCam(P.colEstoque), tableCam],
	);

	const cols: [number, string][] = [
		[tPreco, "preço"],
		[tCusto, "custo"],
		[tLucro, "lucro"],
		[tEst, "estoque"],
	];

	return (
		<SceneAM duration={D} entry="wipe">
			<BeatAM from={0} to={tProd - 2} zoomFrom={1.04} zoomTo={1}>
				<WindowAM x={540} y={960} width={VW} height={VH}>
					<ScreenCropAM screen={PDV} width={VW} height={VH} camera={pdvCam}>
						<HighlightAM rect={PDV_RECTS.plusBateria} at={tBalcao} stroke={2} pad={3} />
						<CursorAM
							frames={[tPdv, tBalcao - 4]}
							xs={[300, 470]}
							ys={[360, 206]}
							clickAt={tBalcao}
							size={22}
						/>
					</ScreenCropAM>
				</WindowAM>
				<TextAM at={tPdv} y={360} size={88} mode="pop">
					<span style={{color: AM.yellow}}>PDV</span> no balcão
				</TextAM>
			</BeatAM>

			<BeatAM from={tProd - 2} to={D} zoomFrom={1.04} zoomTo={1} blurIn={6}>
				<WindowAM x={540} y={960} width={VW} height={VH}>
					<ScreenCropAM screen={PRODUCTS} width={VW} height={VH} camera={prodCam}>
						<HighlightAM rect={P.colPreco} at={tPreco} until={tMesma} stroke={2} pad={1} />
						<HighlightAM rect={P.colCusto} at={tCusto} until={tMesma} stroke={2} pad={1} />
						<HighlightAM rect={P.colLucro} at={tLucro} until={tMesma} stroke={2} pad={1} />
						<HighlightAM rect={P.colEstoque} at={tEst} until={tMesma} stroke={2} pad={1} />
						<HighlightAM rect={P.row} at={tMesma + 6} stroke={2} pad={1} />
					</ScreenCropAM>
				</WindowAM>
				<TextAM at={tProd} y={360} size={88} mode="rise" until={tMesma - 2}>
					produtos
				</TextAM>
				<TextAM at={tMesma} y={360} size={84} mode="rise">
					na <span style={{color: AM.yellow}}>mesma tela</span>
				</TextAM>
				{/* the four words, each lighting on its word */}
				<div
					style={{
						position: "absolute",
						left: 60,
						right: 60,
						top: 1350,
						display: "flex",
						justifyContent: "center",
						gap: 26,
						flexWrap: "wrap",
						fontFamily: FONT_AM,
						fontWeight: 800,
						fontSize: 58,
					}}
				>
					{cols.map(([t, w]) => {
						const on = ramp(frame, t, 6);
						return (
							<span
								key={w}
								style={{
									color: on > 0.5 ? "#1A1400" : AM.dim,
									background: on > 0.5 ? AM.yellow : "transparent",
									border: `3px solid ${on > 0.5 ? AM.yellow : AM.line}`,
									borderRadius: 999,
									padding: "10px 26px",
									transform: `scale(${0.9 + 0.1 * on})`,
									opacity: 0.4 + 0.6 * ramp(frame, tProd, 8),
								}}
							>
								{w}
							</span>
						);
					})}
				</div>
			</BeatAM>
		</SceneAM>
	);
};
