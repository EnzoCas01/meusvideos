import React from "react";
import {CinematicTransition} from "../../../src/components/CinematicTransition";
import {num} from "../_comum/params";
import type {ComponenteProps} from "../types";

/** Soft fade in/out at the scene edges, so cuts feel like dissolves. */
export const TransicaoFade: React.FC<ComponenteProps> = ({params, children}) => {
	const duracao = num(params.duracao, 24);
	return <CinematicTransition durationInFrames={duracao} fadeInFrames={duracao} fadeOutFrames={duracao}>{children}</CinematicTransition>;
};
