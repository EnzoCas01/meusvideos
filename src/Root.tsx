import "./index.css";
import {Composition} from "remotion";
import {LifePhases, FPS, TOTAL_FRAMES} from "./LifePhases";
import {ComecePequeno, FPS_CP, TOTAL_FRAMES_CP} from "./ComecePequeno";

export const RemotionRoot: React.FC = () => {
	return (
		<>
			{/* npx remotion render LifePhases out/life-phases.mp4 */}
			<Composition
				id="LifePhases"
				component={LifePhases}
				durationInFrames={TOTAL_FRAMES}
				fps={FPS}
				width={1080}
				height={1920}
			/>

			{/* npx remotion render ComecePequeno out/comece-pequeno.mp4 */}
			<Composition
				id="ComecePequeno"
				component={ComecePequeno}
				durationInFrames={TOTAL_FRAMES_CP}
				fps={FPS_CP}
				width={1080}
				height={1920}
			/>
		</>
	);
};
