import React from "react";
import {AbsoluteFill, Sequence} from "remotion";
import {CaptionsCC} from "./components/cocacola/CaptionsCC";
import {NarrationCC} from "./components/cocacola/NarrationCC";
import {SoundtrackCC} from "./components/cocacola/SoundtrackCC";
import {Scene1} from "./scenes/cocacola/Scene1";
import {Scene2} from "./scenes/cocacola/Scene2";
import {Scene3} from "./scenes/cocacola/Scene3";
import {Scene4} from "./scenes/cocacola/Scene4";
import {Scene5} from "./scenes/cocacola/Scene5";
import {Scene6} from "./scenes/cocacola/Scene6";
import {Scene7} from "./scenes/cocacola/Scene7";
import {END_CC, FPS_CC, SCENE_STARTS_CC, sceneDurationCC} from "./utils/timeline-cc";
import {CC} from "./utils/theme-cc";

export {FPS_CC};

export const SCENES_CC = [
	Scene1,
	Scene2,
	Scene3,
	Scene4,
	Scene5,
	Scene6,
	Scene7,
].map((component, i) => ({
	component,
	from: SCENE_STARTS_CC[i],
	durationInFrames: sceneDurationCC(i),
}));

/** Derived from the last spoken word plus the JSON tail — never hardcoded. */
export const TOTAL_FRAMES_CC = END_CC;

export const CocaCola: React.FC = () => (
	<AbsoluteFill style={{backgroundColor: CC.background}}>
		<SoundtrackCC />
		<NarrationCC />
		{SCENES_CC.map((scene, i) => {
			const Component = scene.component;
			return (
				<Sequence key={i} from={scene.from} durationInFrames={scene.durationInFrames}>
					<Component />
				</Sequence>
			);
		})}
		<CaptionsCC />
	</AbsoluteFill>
);
