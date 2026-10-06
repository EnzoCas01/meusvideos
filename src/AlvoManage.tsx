import React from "react";
import {AbsoluteFill, Sequence} from "remotion";
import {NarrationAM} from "./components/alvomanage/NarrationAM";
import {SoundtrackAM} from "./components/alvomanage/SoundtrackAM";
import {Scene01Hook} from "./scenes/alvomanage/Scene01Hook";
import {Scene02Mess} from "./scenes/alvomanage/Scene02Mess";
import {Scene03OsLink} from "./scenes/alvomanage/Scene03OsLink";
import {Scene04Phone} from "./scenes/alvomanage/Scene04Phone";
import {Scene05ClientView} from "./scenes/alvomanage/Scene05ClientView";
import {Scene06Notify} from "./scenes/alvomanage/Scene06Notify";
import {Scene07Quiet} from "./scenes/alvomanage/Scene07Quiet";
import {Scene08Whole} from "./scenes/alvomanage/Scene08Whole";
import {Scene09Dashboard} from "./scenes/alvomanage/Scene09Dashboard";
import {Scene10Sales} from "./scenes/alvomanage/Scene10Sales";
import {Scene11Cash} from "./scenes/alvomanage/Scene11Cash";
import {Scene12Stores} from "./scenes/alvomanage/Scene12Stores";
import {Scene13Close} from "./scenes/alvomanage/Scene13Close";
import {AM} from "./utils/theme-am";
import {FPS_AM, SCENE_DURATIONS_AM, SCENE_STARTS_AM, TOTAL_FRAMES_AM} from "./utils/timing-am";

export {FPS_AM, TOTAL_FRAMES_AM};

/**
 * "AlvoManage — vídeo de produto nº 1". One scene per spoken line am01..am13
 * (docs/alvomanage-roteiro.md). Scene lengths and starts are NOT written here:
 * they come from src/narration-alvomanage.json via utils/timing-am.ts, so once
 * the voice is measured the whole film re-times itself.
 */
const SCENES = [
	Scene01Hook,
	Scene02Mess,
	Scene03OsLink,
	Scene04Phone,
	Scene05ClientView,
	Scene06Notify,
	Scene07Quiet,
	Scene08Whole,
	Scene09Dashboard,
	Scene10Sales,
	Scene11Cash,
	Scene12Stores,
	Scene13Close,
] as const;

export const AlvoManage: React.FC = () => {
	return (
		<AbsoluteFill style={{backgroundColor: AM.background}}>
			{SCENES.map((Component, i) => (
				<Sequence
					key={i}
					name={`am${String(i + 1).padStart(2, "0")}`}
					from={SCENE_STARTS_AM[i]}
					durationInFrames={SCENE_DURATIONS_AM[i]}
				>
					<Component />
				</Sequence>
			))}
			<SoundtrackAM />
			<NarrationAM />
		</AbsoluteFill>
	);
};
