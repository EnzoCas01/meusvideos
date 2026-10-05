import React from "react";
import {AbsoluteFill, Sequence} from "remotion";
import {CaptionsStyled} from "./components/captions/CaptionsStyled";
import {NarrationGG} from "./components/gg/NarrationGG";
import {SceneWipeGG} from "./components/gg/SceneWipeGG";
import {Scene1Split} from "./scenes/gg/Scene1Split";
import {Scene2Founders} from "./scenes/gg/Scene2Founders";
import {Scene3Web} from "./scenes/gg/Scene3Web";
import {Scene4Garage} from "./scenes/gg/Scene4Garage";
import {Scene5Invest} from "./scenes/gg/Scene5Invest";
import {Scene6Globe} from "./scenes/gg/Scene6Globe";
import {Scene7Campus} from "./scenes/gg/Scene7Campus";
import {Scene8Value} from "./scenes/gg/Scene8Value";
import {Scene9CTA} from "./scenes/gg/Scene9CTA";
import {NARRATION_GG} from "./utils/narration-gg";
import {SCENE_DUR_GG, SCENE_STARTS_GG, TOTAL_FRAMES_GG} from "./utils/timeline-gg";
import {GG, SANS_GG} from "./utils/theme-gg";
import {SoundtrackGG} from "./components/gg/SoundtrackGG";

export const FPS_GG = 30;
export {TOTAL_FRAMES_GG};

const SCENES_GG = [
	Scene1Split,
	Scene2Founders,
	Scene3Web,
	Scene4Garage,
	Scene5Invest,
	Scene6Globe,
	Scene7Campus,
	Scene8Value,
	Scene9CTA,
];

export const Google: React.FC = () => (
	<AbsoluteFill style={{backgroundColor: GG.background, overflow: "hidden"}}>
		{SCENES_GG.map((Scene, i) => (
			<Sequence key={i} from={SCENE_STARTS_GG[i]} durationInFrames={SCENE_DUR_GG[i]}>
				<Scene />
			</Sequence>
		))}
		<SoundtrackGG />
		<NarrationGG />
		{/* corte ágil entre cenas, sem tempo morto — ritmo de TikTok */}
		{SCENE_STARTS_GG.slice(1).map((start, i) => (
			<Sequence key={`wipe-${i}`} from={start - 6} durationInFrames={14} layout="none">
				<SceneWipeGG dir={i % 2 === 0 ? 1 : -1} />
			</Sequence>
		))}
		{/* legenda rápida embaixo, por cima de todas as cenas */}
		<CaptionsStyled
			style="rapido"
			posicao="baixo"
			lines={NARRATION_GG.lines.map(({frame, words}) => ({frame, words}))}
			accent={GG.blue}
			onAccent={GG.background}
			text={GG.white}
			fontFamily={SANS_GG}
		/>
	</AbsoluteFill>
);
