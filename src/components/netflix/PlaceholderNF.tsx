import React from "react";
import {AbsoluteFill} from "remotion";
import {NF, SANS_NF} from "../../utils/theme-nf";
import {SceneShell} from "./SceneShell";

/** Stand-in for scenes not yet built: dark ground and a label. */
export const PlaceholderNF: React.FC<{index: number; label: string}> = ({index, label}) => (
	<SceneShell index={index} overlay={false}>
		<AbsoluteFill style={{alignItems: "center", justifyContent: "center"}}>
			<div style={{fontFamily: SANS_NF, fontWeight: 600, fontSize: 40, letterSpacing: 6, color: NF.grey}}>
				{label}
			</div>
		</AbsoluteFill>
	</SceneShell>
);
