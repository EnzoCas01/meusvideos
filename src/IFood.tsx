import React from "react";
import {AbsoluteFill, Sequence} from "remotion";
import {CaptionsIF} from "./components/ifood/CaptionsIF";
import {NarrationIF} from "./components/ifood/NarrationIF";
import {SoundtrackIF} from "./components/ifood/SoundtrackIF";
import {Scene1Hook} from "./scenes/ifood/Scene1Hook";
import {Scene2Start} from "./scenes/ifood/Scene2Start";
import {Scene3Shift} from "./scenes/ifood/Scene3Shift";
import {Scene4Apps} from "./scenes/ifood/Scene4Apps";
import {Scene5Invest} from "./scenes/ifood/Scene5Invest";
import {Scene6Challenge} from "./scenes/ifood/Scene6Challenge";
import {Scene7Turn} from "./scenes/ifood/Scene7Turn";
import {Scene8Transform} from "./scenes/ifood/Scene8Transform";
import {Scene9Final} from "./scenes/ifood/Scene9Final";
import {END_IF, FPS_IF, SCENE_STARTS_IF, sceneDurationIF} from "./utils/timeline-if";
import {IF} from "./utils/theme-if";

export {FPS_IF};

/**
 * "IFood" — the edit, in one place.
 *
 * Nine beats of a business documentary: the hook, 2011, the shift, the site
 * and the apps, the investment, the delivery problem, 2018, what it became,
 * the close. The voice was recorded and measured first, so the cuts are not a
 * matter of taste: SCENE_STARTS_IF comes straight from the narration JSON and
 * every scene overlaps the next by OVERLAP_IF frames so the cut dissolves.
 */
export const SCENES_IF = [
	{id: "hook", component: Scene1Hook}, //           0:00 HOOK — "era um papel"
	{id: "start", component: Scene2Start}, //         0:08 2011, Disk Cook
	{id: "shift", component: Scene3Shift}, //         0:17 off the page
	{id: "apps", component: Scene4Apps}, //           0:23 2012 site + apps
	{id: "invest", component: Scene5Invest}, //       0:28 2013 Movile
	{id: "challenge", component: Scene6Challenge}, // 0:34 the delivery problem
	{id: "turn", component: Scene7Turn}, //           0:40 2018 logistics
	{id: "transform", component: Scene8Transform}, // 0:49 what it became
	{id: "final", component: Scene9Final}, //         0:55 the close
].map((scene, i) => ({
	...scene,
	from: SCENE_STARTS_IF[i],
	durationInFrames: sceneDurationIF(i),
}));

/** Derived from the last spoken word plus the closing hold — never hardcoded. */
export const TOTAL_FRAMES_IF = END_IF;

export const IFood: React.FC = () => {
	return (
		<AbsoluteFill style={{backgroundColor: IF.background}}>
			<SoundtrackIF />
			<NarrationIF />

			{SCENES_IF.map((scene) => {
				const Component = scene.component;
				return (
					<Sequence key={scene.id} from={scene.from} durationInFrames={scene.durationInFrames}>
						<Component />
					</Sequence>
				);
			})}

			{/* Subtitles ride above every scene, on the composition's own timeline. */}
			<CaptionsIF />
		</AbsoluteFill>
	);
};
