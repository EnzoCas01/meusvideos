import React from "react";
import {AbsoluteFill, Sequence} from "remotion";
import {CaptionsStyled} from "./components/captions/CaptionsStyled";
import {NarrationBK} from "./components/bk/NarrationBK";
import {SceneWipeBK} from "./components/bk/SceneWipeBK";
import {Scene1Balcao} from "./scenes/bk/Scene1Balcao";
import {Scene2Mundo} from "./scenes/bk/Scene2Mundo";
import {Scene3Caminho} from "./scenes/bk/Scene3Caminho";
import {Scene4Queda} from "./scenes/bk/Scene4Queda";
import {Scene5Rival} from "./scenes/bk/Scene5Rival";
import {Scene6Guerra} from "./scenes/bk/Scene6Guerra";
import {Scene7Falencia} from "./scenes/bk/Scene7Falencia";
import {Scene8Grelha} from "./scenes/bk/Scene8Grelha";
import {Scene9Vendas} from "./scenes/bk/Scene9Vendas";
import {Scene10Contador} from "./scenes/bk/Scene10Contador";
import {Scene11Loja} from "./scenes/bk/Scene11Loja";
import {Scene12CTA} from "./scenes/bk/Scene12CTA";
import {NARRATION_BK} from "./utils/narration-bk";
import {SCENE_DUR_BK, SCENE_STARTS_BK, TOTAL_FRAMES_BK} from "./utils/timeline-bk";
import {BK, SANS_BK} from "./utils/theme-bk";

export const FPS_BK = 30;
export {TOTAL_FRAMES_BK};

const SCENES_BK = [
	Scene1Balcao,
	Scene2Mundo,
	Scene3Caminho,
	Scene4Queda,
	Scene5Rival,
	Scene6Guerra,
	Scene7Falencia,
	Scene8Grelha,
	Scene9Vendas,
	Scene10Contador,
	Scene11Loja,
	Scene12CTA,
];

export const BurgerKing: React.FC = () => (
	<AbsoluteFill style={{backgroundColor: BK.background, overflow: "hidden"}}>
		{SCENES_BK.map((Scene, i) => (
			<Sequence key={i} from={SCENE_STARTS_BK[i]} durationInFrames={SCENE_DUR_BK[i]}>
				<Scene />
			</Sequence>
		))}
		<NarrationBK />
		{/* transição de cena para cena — nunca corte seco: a abertura fecha em
		    shutter (o único corte de contraste do começo), o resto varre o quadro */}
		{SCENE_STARTS_BK.slice(1).map((start, i) => (
			<Sequence key={`wipe-${i}`} from={start - 9} durationInFrames={19} layout="none">
				<SceneWipeBK mode={i === 0 ? "shutter" : "sweep"} dir={i % 2 === 0 ? 1 : -1} />
			</Sequence>
		))}
		{/* legenda rápida embaixo, por cima de todas as cenas. Na linha do
		    contador o número sai da legenda: a cena já mostra 1.000.000.000
		    gigante — dois números na tela ao mesmo tempo viraria ruído */}
		<CaptionsStyled
			style="rapido"
			posicao="baixo"
			lines={NARRATION_BK.lines.map((l) => ({
				frame: l.frame,
				words: l.id === "10-numero" ? l.words.filter((w) => !/^\d/.test(w.w)) : l.words,
			}))}
			accent={BK.gold}
			onAccent="#151005"
			text={BK.white}
			fontFamily={SANS_BK}
		/>
	</AbsoluteFill>
);
