import React from "react";
import {AbsoluteFill} from "remotion";
import {Background} from "../components/Background";
import {Hourglass} from "../components/Hourglass";
import {AnimatedText} from "../components/AnimatedText";
import {Particles} from "../components/Particles";
import {W, H} from "../utils/layout";
import {COLORS} from "../utils/theme";

/**
 * Scene 1 — Time. An hourglass runs in the dark. Nothing about it is hurried,
 * but it is unmistakably passing, which is exactly the feeling the opening
 * lines describe.
 */
export const Scene1Time: React.FC = () => {
	return (
		<AbsoluteFill>
			<Background />

			<svg
				width={W}
				height={H}
				viewBox={`0 0 ${W} ${H}`}
				style={{position: "absolute", top: 0, left: 0}}
			>
				<Particles
					count={9}
					seedOffset={5}
					areaWidth={W}
					areaHeight={H}
					delay={40}
					durationInFrames={160}
					color={COLORS.dim}
				/>

				<Hourglass cx={540} cy={1150} size={290} delay={4} durationInFrames={176} />
			</svg>

			<AbsoluteFill
				style={{
					alignItems: "center",
					justifyContent: "flex-start",
					paddingTop: 300,
					flexDirection: "column",
					gap: 26,
				}}
			>
				<AnimatedText delay={38} durationInFrames={44} fontSize={58} fontWeight={300}>
					Às vezes...
				</AnimatedText>

				<AnimatedText
					delay={92}
					durationInFrames={60}
					fontSize={52}
					fontWeight={300}
					color={COLORS.greyText}
					maxWidth={760}
				>
					parece que todo mundo está avançando.
				</AnimatedText>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};
