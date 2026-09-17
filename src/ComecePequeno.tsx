import React from "react";
import {AbsoluteFill, Sequence} from "remotion";
import {NarrationCP} from "./components/comece-pequeno/NarrationCP";
import {SoundtrackCP} from "./components/comece-pequeno/SoundtrackCP";
import {Scene1Hook} from "./scenes/comece-pequeno/Scene1Hook";
import {Scene2Risk} from "./scenes/comece-pequeno/Scene2Risk";
import {Scene3Turn} from "./scenes/comece-pequeno/Scene3Turn";
import {Scene4Lesson} from "./scenes/comece-pequeno/Scene4Lesson";
import {Scene5Final} from "./scenes/comece-pequeno/Scene5Final";

export const FPS_CP = 30;

/**
 * "Comece Pequeno" — the edit, in one place.
 *
 * Five beats: the hook, the risk, the turn, the lesson, the close. `from`
 * values overlap the previous scene slightly so the cuts read as dissolves.
 * Change a duration here and the whole film re-times itself —
 * TOTAL_FRAMES_CP is derived, never hardcoded.
 */
export const SCENES_CP = [
	{id: "hook", component: Scene1Hook, durationInFrames: 360}, //     0:00 - 0:12
	{id: "risk", component: Scene2Risk, durationInFrames: 330}, //     0:11 - 0:22
	{id: "turn", component: Scene3Turn, durationInFrames: 390}, //     0:22 - 0:35
	{id: "lesson", component: Scene4Lesson, durationInFrames: 690}, // 0:34 - 0:57
	{id: "final", component: Scene5Final, durationInFrames: 450}, //   0:57 - 1:12
] as const;

/** Frames of overlap between consecutive scenes, for the dissolve. */
export const OVERLAP_CP = 14;

export const SCENE_STARTS_CP = SCENES_CP.reduce<number[]>((acc, _scene, i) => {
	const previousEnd = i === 0 ? 0 : acc[i - 1] + SCENES_CP[i - 1].durationInFrames;
	acc.push(i === 0 ? 0 : previousEnd - OVERLAP_CP);
	return acc;
}, []);

export const TOTAL_FRAMES_CP =
	SCENE_STARTS_CP[SCENES_CP.length - 1] + SCENES_CP[SCENES_CP.length - 1].durationInFrames;

export const ComecePequeno: React.FC = () => {
	return (
		<AbsoluteFill style={{backgroundColor: "#07060B"}}>
			<SoundtrackCP />
			<NarrationCP />

			{SCENES_CP.map((scene, i) => {
				const Component = scene.component;
				return (
					<Sequence
						key={scene.id}
						from={SCENE_STARTS_CP[i]}
						durationInFrames={scene.durationInFrames}
					>
						<Component />
					</Sequence>
				);
			})}
		</AbsoluteFill>
	);
};
