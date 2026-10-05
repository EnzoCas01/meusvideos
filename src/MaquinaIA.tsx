import React from "react";
import {AbsoluteFill, Sequence} from "remotion";
import {CaptionsStyled} from "./components/captions/CaptionsStyled";
import {NarrationMQ} from "./components/mq/NarrationMQ";
import {SceneWipe} from "./components/mq/SceneWipe";
import {SoundtrackMQ} from "./components/mq/SoundtrackMQ";
import {Scene1Gancho} from "./scenes/mq/Scene1Gancho";
import {Scene2Revelacao} from "./scenes/mq/Scene2Revelacao";
import {Scene3Lista} from "./scenes/mq/Scene3Lista";
import {Scene4Sistema} from "./scenes/mq/Scene4Sistema";
import {Scene5VideoPronto} from "./scenes/mq/Scene5VideoPronto";
import {Scene6Escala} from "./scenes/mq/Scene6Escala";
import {Scene7CTA} from "./scenes/mq/Scene7CTA";
import {SCENE_DUR_MQ, SCENE_STARTS_MQ, TOTAL_FRAMES_MQ} from "./utils/timeline-mq";
import {MQ, SANS_MQ} from "./utils/theme-mq";
import {NARRATION_MQ} from "./utils/narration-mq";

export const FPS_MQ = 30;
export {TOTAL_FRAMES_MQ};

const SCENES_MQ = [
	Scene1Gancho,
	Scene2Revelacao,
	Scene3Lista,
	Scene4Sistema,
	Scene5VideoPronto,
	Scene6Escala,
	Scene7CTA,
];

export const MaquinaIA: React.FC = () => (
	<AbsoluteFill style={{backgroundColor: MQ.background, overflow: "hidden"}}>
		{SCENES_MQ.map((Scene, i) => (
			<Sequence key={i} from={SCENE_STARTS_MQ[i]} durationInFrames={SCENE_DUR_MQ[i]}>
				<Scene />
			</Sequence>
		))}
		<NarrationMQ />
		<SoundtrackMQ />
		{/* corte com intenção entre cenas: barra de acento varrendo, alternando o lado */}
		{SCENE_STARTS_MQ.slice(1).map((start, i) => (
			<Sequence key={`wipe-${i}`} from={start - 7} durationInFrames={16} layout="none">
				<SceneWipe dir={i % 2 === 0 ? 1 : -1} />
			</Sequence>
		))}
		{/* legenda rápida embaixo, por cima de todas as cenas */}
		<CaptionsStyled
			style="rapido"
			posicao="baixo"
			lines={NARRATION_MQ.lines.map(({frame, words}) => ({frame, words}))}
			accent={MQ.accent}
			onAccent={MQ.background}
			text={MQ.white}
			fontFamily={SANS_MQ}
		/>
	</AbsoluteFill>
);
