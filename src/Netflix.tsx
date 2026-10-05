import React from "react";
import {AbsoluteFill, Sequence} from "remotion";
import {CaptionsNF} from "./components/netflix/CaptionsNF";
import {NarrationNF} from "./components/netflix/NarrationNF";
import {SoundtrackNF} from "./components/netflix/SoundtrackNF";
import {Scene1} from "./scenes/netflix/Scene1";
import {Scene2} from "./scenes/netflix/Scene2";
import {Scene3} from "./scenes/netflix/Scene3";
import {Scene4} from "./scenes/netflix/Scene4";
import {Scene5} from "./scenes/netflix/Scene5";
import {Scene6} from "./scenes/netflix/Scene6";
import {Scene7} from "./scenes/netflix/Scene7";
import {Scene8} from "./scenes/netflix/Scene8";
import {Scene9} from "./scenes/netflix/Scene9";
import {Scene10} from "./scenes/netflix/Scene10";
import {END_NF, FPS_NF, SCENE_STARTS_NF, sceneDurationNF} from "./utils/timeline-nf";
import {NF} from "./utils/theme-nf";

export {FPS_NF};

/**
 * "Netflix" — a photographic mini-documentary ("Você sabia" series). One
 * spoken line per scene; every start comes from src/narration-netflix.json.
 */
export const SCENES_NF = [
	Scene1, // hook — envelope + DVD
	Scene2, // 1997 / 1998
	Scene3, // the problem, the turn
	Scene4, // subscription, 1 million
	Scene5, // the question: DVD -> computer -> internet
	Scene6, // streaming
	Scene7, // originals
	Scene8, // the world
	Scene9, // transformation
	Scene10, // final
].map((component, i) => ({
	component,
	from: SCENE_STARTS_NF[i],
	durationInFrames: sceneDurationNF(i),
}));

/** Derived from the last spoken word plus the closing hold — never hardcoded. */
export const TOTAL_FRAMES_NF = END_NF;

export const Netflix: React.FC = () => (
	<AbsoluteFill style={{backgroundColor: NF.background}}>
		<SoundtrackNF />
		<NarrationNF />
		{SCENES_NF.map((scene, i) => {
			const Component = scene.component;
			return (
				<Sequence key={i} from={scene.from} durationInFrames={scene.durationInFrames}>
					<Component />
				</Sequence>
			);
		})}
		<CaptionsNF />
	</AbsoluteFill>
);
