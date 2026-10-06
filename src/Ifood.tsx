import React from "react";
import {AbsoluteFill} from "remotion";
import {Sequence} from "remotion";
import {NarrationIF} from "./components/ifood/NarrationIF";
import {SoundtrackIF} from "./components/ifood/SoundtrackIF";
import {Scene1Paper} from "./scenes/ifood/Scene1Paper";
import {Scene2DiskCook} from "./scenes/ifood/Scene2DiskCook";
import {Scene3Shift} from "./scenes/ifood/Scene3Shift";
import {Scene4Apps} from "./scenes/ifood/Scene4Apps";
import {Scene5Investment} from "./scenes/ifood/Scene5Investment";
import {Scene6Logistics} from "./scenes/ifood/Scene6Logistics";
import {Scene7Network} from "./scenes/ifood/Scene7Network";
import {Scene8Montage} from "./scenes/ifood/Scene8Montage";
import {Scene9Close} from "./scenes/ifood/Scene9Close";

export const FPS_IF = 30;

/**
 * "iFood — a virada" — the edit, in one place.
 *
 * Nine beats, following the brief's arc: HOOK -> UNEXPECTED ORIGIN ->
 * PROBLEM/TRANSFORMATION -> THE TURN -> GROWTH -> CLOSE.
 *
 * Unlike the other two films in this project, the cuts here are HARD, not
 * dissolves: the brief asks for a fast modern documentary, so OVERLAP_IF is
 * deliberately tiny (a handful of frames, just enough to avoid a black flash).
 * Pace inside a scene is the scene's job — this file only owns the boundaries.
 *
 * Target from the brief: 55-65s. Change a duration here and the whole film
 * re-times itself; TOTAL_FRAMES_IF is derived, never hardcoded.
 */
export const SCENES_IF = [
	{id: "paper", component: Scene1Paper, durationInFrames: 120}, //      0:00 - 0:04  hook: "um papel"
	{id: "diskcook", component: Scene2DiskCook, durationInFrames: 180}, // 0:04 - 0:10  2011 / Disk Cook
	{id: "shift", component: Scene3Shift, durationInFrames: 210}, //      0:10 - 0:17  do papel -> digital
	{id: "apps", component: Scene4Apps, durationInFrames: 210}, //        0:17 - 0:24  2012 / site + app
	{id: "investment", component: Scene5Investment, durationInFrames: 210}, // 0:24 - 0:31  2013 / Movile
	{id: "logistics", component: Scene6Logistics, durationInFrames: 270}, //   0:31 - 0:40  o problema
	{id: "network", component: Scene7Network, durationInFrames: 270}, //  0:40 - 0:49  2018 / a virada
	{id: "montage", component: Scene8Montage, durationInFrames: 270}, //  0:49 - 0:58  crescimento
	// Runs a little long on purpose: the last line ("Essa foi a virada.") must
	// land with air after it, not two frames before the film ends.
	{id: "close", component: Scene9Close, durationInFrames: 225}, //      0:58 - 1:04  fechamento
] as const;

/**
 * Frames of overlap between consecutive scenes. Small on purpose: these are
 * cuts, not dissolves. Whooshes and match-cuts live inside the scenes.
 */
export const OVERLAP_IF = 5;

export const SCENE_STARTS_IF = SCENES_IF.reduce<number[]>((acc, _scene, i) => {
	const previousEnd = i === 0 ? 0 : acc[i - 1] + SCENES_IF[i - 1].durationInFrames;
	acc.push(i === 0 ? 0 : previousEnd - OVERLAP_IF);
	return acc;
}, []);

export const TOTAL_FRAMES_IF =
	SCENE_STARTS_IF[SCENES_IF.length - 1] + SCENES_IF[SCENES_IF.length - 1].durationInFrames;

export const Ifood: React.FC = () => {
	return (
		<AbsoluteFill style={{backgroundColor: "#08070A"}}>
			<SoundtrackIF />
			<NarrationIF />

			{SCENES_IF.map((scene, i) => {
				const Component = scene.component;
				return (
					<Sequence
						key={scene.id}
						from={SCENE_STARTS_IF[i]}
						durationInFrames={scene.durationInFrames}
					>
						<Component />
					</Sequence>
				);
			})}
		</AbsoluteFill>
	);
};
