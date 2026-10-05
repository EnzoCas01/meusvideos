import React from "react";
import {AbsoluteFill, Sequence} from "remotion";
import {CaptionsAT} from "./components/anthropic/CaptionsAT";
import {NarrationAT} from "./components/anthropic/NarrationAT";
import {SoundtrackAT} from "./components/anthropic/SoundtrackAT";
import {Scene1} from "./scenes/anthropic/Scene1";
import {Scene2} from "./scenes/anthropic/Scene2";
import {Scene3} from "./scenes/anthropic/Scene3";
import {Scene4} from "./scenes/anthropic/Scene4";
import {Scene5} from "./scenes/anthropic/Scene5";
import {Scene6} from "./scenes/anthropic/Scene6";
import {Scene7} from "./scenes/anthropic/Scene7";
import {END_AT, FPS_AT, SCENE_STARTS_AT, sceneDurationAT} from "./utils/timeline-at";
import {AT} from "./utils/theme-at";

export {FPS_AT};

export const SCENES_AT = [
	Scene1,
	Scene2,
	Scene3,
	Scene4,
	Scene5,
	Scene6,
	Scene7,
].map((component, i) => ({
	component,
	from: SCENE_STARTS_AT[i],
	durationInFrames: sceneDurationAT(i),
}));

/** Derived from the last spoken word plus the JSON tail — never hardcoded. */
export const TOTAL_FRAMES_AT = END_AT;

export const Anthropic: React.FC = () => (
	<AbsoluteFill style={{backgroundColor: AT.background}}>
		<SoundtrackAT />
		<NarrationAT />
		{SCENES_AT.map((scene, i) => {
			const Component = scene.component;
			return (
				<Sequence key={i} from={scene.from} durationInFrames={scene.durationInFrames}>
					<Component />
				</Sequence>
			);
		})}
		<CaptionsAT />
	</AbsoluteFill>
);
