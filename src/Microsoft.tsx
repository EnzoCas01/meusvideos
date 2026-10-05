import React from "react";
import {AbsoluteFill, Sequence} from "remotion";
import {CaptionsMS} from "./components/microsoft/CaptionsMS";
import {NarrationMS} from "./components/microsoft/NarrationMS";
import {SoundtrackMS} from "./components/microsoft/SoundtrackMS";
import {Scene1} from "./scenes/microsoft/Scene1";
import {Scene2} from "./scenes/microsoft/Scene2";
import {Scene3} from "./scenes/microsoft/Scene3";
import {Scene4} from "./scenes/microsoft/Scene4";
import {Scene5} from "./scenes/microsoft/Scene5";
import {Scene6} from "./scenes/microsoft/Scene6";
import {END_MS, FPS_MS, SCENE_STARTS_MS, sceneDurationMS} from "./utils/timeline-ms";
import {MS} from "./utils/theme-ms";

export {FPS_MS};

export const SCENES_MS = [
	Scene1,
	Scene2,
	Scene3,
	Scene4,
	Scene5,
	Scene6,
].map((component, i) => ({
	component,
	from: SCENE_STARTS_MS[i],
	durationInFrames: sceneDurationMS(i),
}));

/** Derived from the last spoken word plus the JSON tail — never hardcoded. */
export const TOTAL_FRAMES_MS = END_MS;

export const Microsoft: React.FC = () => (
	<AbsoluteFill style={{backgroundColor: MS.background}}>
		<SoundtrackMS />
		<NarrationMS />
		{SCENES_MS.map((scene, i) => {
			const Component = scene.component;
			return (
				<Sequence key={i} from={scene.from} durationInFrames={scene.durationInFrames}>
					<Component />
				</Sequence>
			);
		})}
		<CaptionsMS />
	</AbsoluteFill>
);
