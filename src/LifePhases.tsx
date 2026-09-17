import React from "react";
import {AbsoluteFill, Sequence} from "remotion";
import {Background} from "./components/Background";
import {CinematicTransition} from "./components/CinematicTransition";
import {Soundtrack} from "./components/Soundtrack";
import {Narration} from "./components/Narration";
import {Scene1Time} from "./scenes/Scene1Time";
import {Scene2Comparison} from "./scenes/Scene2Comparison";
import {Scene3Answer} from "./scenes/Scene3Answer";
import {Scene4Phases} from "./scenes/Scene4Phases";
import {Scene5Paths} from "./scenes/Scene5Paths";
import {Scene6Message} from "./scenes/Scene6Message";
import {Scene7Final} from "./scenes/Scene7Final";

export const FPS = 30;

/**
 * The edit, in one place. `from` values overlap the previous scene slightly so
 * the cuts read as dissolves. Change a duration here and the whole film
 * re-times itself — TOTAL_FRAMES is derived, never hardcoded.
 */
export const SCENES = [
	{id: "time", component: Scene1Time, durationInFrames: 180, zoom: true}, //        0:00 - 0:06
	{id: "comparison", component: Scene2Comparison, durationInFrames: 210}, //        0:06 - 0:13
	{id: "answer", component: Scene3Answer, durationInFrames: 210, zoom: true}, //    0:13 - 0:20
	{id: "phases", component: Scene4Phases, durationInFrames: 330}, //                0:20 - 0:31
	{id: "paths", component: Scene5Paths, durationInFrames: 240}, //                  0:31 - 0:39
	{id: "message", component: Scene6Message, durationInFrames: 330, zoom: true}, //  0:39 - 0:50
	{id: "final", component: Scene7Final, durationInFrames: 300}, //                  0:50 - 1:00
] as const;

/** Frames of overlap between consecutive scenes, for the dissolve. */
const OVERLAP = 14;

export const SCENE_STARTS = SCENES.reduce<number[]>((acc, scene, i) => {
	const previousEnd = i === 0 ? 0 : acc[i - 1] + SCENES[i - 1].durationInFrames;
	acc.push(i === 0 ? 0 : previousEnd - OVERLAP);
	return acc;
}, []);

export const TOTAL_FRAMES =
	SCENE_STARTS[SCENES.length - 1] + SCENES[SCENES.length - 1].durationInFrames;

export const LifePhases: React.FC = () => {
	return (
		<AbsoluteFill>
			{/* A permanent black floor, so the dissolves never reveal white. */}
			<Background glow={false} />

			<Soundtrack />
			<Narration />

			{SCENES.map((scene, i) => {
				const Component = scene.component;
				return (
					<Sequence
						key={scene.id}
						from={SCENE_STARTS[i]}
						durationInFrames={scene.durationInFrames}
					>
						<CinematicTransition
							durationInFrames={scene.durationInFrames}
							fadeInFrames={i === 0 ? 40 : OVERLAP + 8}
							fadeOutFrames={i === SCENES.length - 1 ? 2 : OVERLAP + 8}
							zoom={"zoom" in scene ? scene.zoom : false}
							zoomFrom={1}
							zoomTo={1.05}
						>
							<Component />
						</CinematicTransition>
					</Sequence>
				);
			})}
		</AbsoluteFill>
	);
};
