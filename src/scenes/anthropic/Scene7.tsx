import React from "react";
import {AbsoluteFill, interpolate, useCurrentFrame} from "remotion";
import {SceneShell} from "../../components/anthropic/SceneShell";
import {TextAT} from "../../components/anthropic/TextAT";
import {BlurBackdropAT, GlowAT, WordmarkAT} from "../../components/anthropic/MarksAT";
import {cueForAT} from "../../utils/cue-at";
import {IMG} from "../../utils/imagens-at";
import {AT} from "../../utils/theme-at";
import {sceneDurationAT} from "../../utils/timeline-at";

const cueFor = cueForAT(6);

/**
 * 07 — THE ANSWER, THE CARD. The hook's question closes as a chain that builds
 * word by word over Dario's blurred figure: 2021 → 5 ANOS → US$ 380 BI. Then
 * the chain yields to the mark: asterisk and wordmark breathing in coral light,
 * sinking cleanly to black as the film ends.
 */
export const Scene7: React.FC = () => {
	const frame = useCurrentFrame();
	const fim = cueFor("11-final");
	const fecho = cueFor("12-fecho");
	const dur = sceneDurationAT(6);
	const close = fecho.start; // "E essa história..."
	const chainEnd = close - 6;
	const mark = close + 8;
	const darken = interpolate(frame, [dur - 95, dur - 8], [0, 0.88], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});

	return (
		<SceneShell index={6}>
			<BlurBackdropAT image={IMG.darioPalco} pos="35% 30%" />
			<TextAT start={fim.wordStart(/^vinte$/)} end={chainEnd} top={380} size={200} spacing={0.05}>
				2021
			</TextAT>
			<TextAT start={fim.wordStart(/^cinco$/)} end={chainEnd} top={780} size={200} spacing={0.05} color={AT.accentText}>
				5 ANOS
			</TextAT>
			<TextAT start={fim.wordStart(/^trezentos$/)} end={chainEnd} top={580} size={200} spacing={0.03}>
				US$ 380 BI
			</TextAT>
			<GlowAT top={560} size={780} start={mark} breath={0.07} />
			<WordmarkAT image={IMG.claudeIcone} width={190} top={465} start={mark} breath={0.04} />
			<WordmarkAT image={IMG.marcaAnthropic} width={640} top={720} start={mark + 10} invert breath={0.04} />
			<AbsoluteFill style={{backgroundColor: AT.background, opacity: darken, pointerEvents: "none"}} />
		</SceneShell>
	);
};
