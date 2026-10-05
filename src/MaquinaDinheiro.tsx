import React from "react";
import {AbsoluteFill, Sequence} from "remotion";
import {CaptionsStyled} from "./components/captions/CaptionsStyled";
import {NarrationMDD} from "./components/mdd/NarrationMDD";
import {Scene1Maquina} from "./scenes/mdd/Scene1Maquina";
import {Scene2Rede} from "./scenes/mdd/Scene2Rede";
import {Scene3Agentes} from "./scenes/mdd/Scene3Agentes";
import {Scene4Prova} from "./scenes/mdd/Scene4Prova";
import {Scene5Escala} from "./scenes/mdd/Scene5Escala";
import {Scene6Meta} from "./scenes/mdd/Scene6Meta";
import {Scene7CTA} from "./scenes/mdd/Scene7CTA";
import {SCENE_DUR_MDD, SCENE_STARTS_MDD, TOTAL_FRAMES_MDD} from "./utils/timeline-mdd";
import {MDD, SANS_MDD} from "./utils/theme-mdd";
import {NARRATION_MDD} from "./utils/narration-mdd";

export const FPS_MDD = 30;
export {TOTAL_FRAMES_MDD};

const SCENES_MDD = [
	Scene1Maquina,
	Scene2Rede,
	Scene3Agentes,
	Scene4Prova,
	Scene5Escala,
	Scene6Meta,
	Scene7CTA,
];

export const MaquinaDinheiro: React.FC = () => (
	<AbsoluteFill style={{backgroundColor: MDD.background, overflow: "hidden"}}>
		{SCENES_MDD.map((Scene, i) => (
			<Sequence key={i} from={SCENE_STARTS_MDD[i]} durationInFrames={SCENE_DUR_MDD[i]}>
				<Scene />
			</Sequence>
		))}
		<NarrationMDD />
		{/* legenda rápida embaixo, por cima de todas as cenas */}
		<CaptionsStyled
			style="rapido"
			posicao="baixo"
			lines={NARRATION_MDD.lines.map(({frame, words}) => ({frame, words}))}
			accent={MDD.accent}
			onAccent={MDD.background}
			text={MDD.white}
			fontFamily={SANS_MDD}
		/>
	</AbsoluteFill>
);
