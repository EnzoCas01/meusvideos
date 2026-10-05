import React from "react";
import {AbsoluteFill, Sequence} from "remotion";
import {CaptionsDF} from "./components/disney/CaptionsDF";
import {NarrationDF} from "./components/disney/NarrationDF";
import {SoundtrackDF} from "./components/disney/SoundtrackDF";
import {Scene1} from "./scenes/disney/Scene1";
import {Scene2} from "./scenes/disney/Scene2";
import {Scene3} from "./scenes/disney/Scene3";
import {Scene4} from "./scenes/disney/Scene4";
import {Scene5} from "./scenes/disney/Scene5";
import {Scene6} from "./scenes/disney/Scene6";
import {Scene7} from "./scenes/disney/Scene7";
import {END_DF, FPS_DF, SCENE_STARTS_DF, sceneDurationDF} from "./utils/timeline-df";
import {DF} from "./utils/theme-df";

export {FPS_DF};

/**
 * "Disney" — "Você sabia que Walt Disney perdeu um personagem?" (v2). Real
 * 1927-1930 material as lit cards over coloured rooms: curtain wine for the
 * Oswald years, steel blue for the loss, dawn for starting over, warm light for
 * Mickey, teal and gold for Steamboat Willie. Every start comes from
 * src/narration-disney.json; every caption and impact word uses the measured
 * word times.
 */
export const SCENES_DF = [
	Scene1, // hook — the question + a glimpse of what came after
	Scene2, // 1927 — Oswald created, a hit, 26 shorts
	Scene3, // the loss — not his, the distributor's, carried out
	Scene4, // start over — dawn at the studio
	Scene5, // the need + Mickey is born with Ub Iwerks
	Scene6, // lost one → created another → Steamboat Willie
	Scene7, // the hold — the 1928 poster, then dark
].map((component, i) => ({
	component,
	from: SCENE_STARTS_DF[i],
	durationInFrames: sceneDurationDF(i),
}));

/** Derived from the last spoken word plus the JSON tail — never hardcoded. */
export const TOTAL_FRAMES_DF = END_DF;

export const Disney: React.FC = () => (
	<AbsoluteFill style={{backgroundColor: DF.night}}>
		<SoundtrackDF />
		<NarrationDF />
		{SCENES_DF.map((scene, i) => {
			const Component = scene.component;
			return (
				<Sequence key={i} from={scene.from} durationInFrames={scene.durationInFrames}>
					<Component />
				</Sequence>
			);
		})}
		<CaptionsDF />
	</AbsoluteFill>
);
