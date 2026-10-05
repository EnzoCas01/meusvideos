import React from "react";
import {AbsoluteFill, Sequence} from "remotion";
import {TEMAS, TEMA_PADRAO} from "../../biblioteca/temas/registro";
import {COMPONENTES} from "./registro";
import {SceneRenderer, type CenaCustom} from "./SceneRenderer";
import type {Spec} from "./spec";

/** Resolves each scene's place on the timeline: spec values win, otherwise cumulative with a per-format default. */
export const cenaFrames = (spec: Spec): {from: number; durationInFrames: number}[] => {
	const padrao = spec.formato === "video" ? 90 : 60;
	let t = 0;
	return spec.cenas.map((c) => {
		const from = c.from ?? t;
		const dur = c.durationInFrames ?? padrao;
		t = from + dur;
		return {from, durationInFrames: dur};
	});
};

/** Total length of the piece, derived from the scene frames — never hardcoded. */
export const totalFrames = (spec: Spec): number => {
	const cs = cenaFrames(spec);
	return cs.length ? cs[cs.length - 1].from + cs[cs.length - 1].durationInFrames : 0;
};

/**
 * The generic render engine: reads a spec (data) and renders it with library
 * components. Remotion is only the renderer here — the director's spec is the
 * brain. `customs` lets a piece hand in bespoke scene components.
 */
export const Motor: React.FC<{spec: Spec; customs?: Record<string, CenaCustom>}> = ({spec, customs}) => {
	const tema = TEMAS[spec.tema] ?? TEMA_PADRAO;
	const dims = spec.dims;
	const cs = cenaFrames(spec);
	const Logo = spec.logo ? COMPONENTES.logo_marca : null;

	return (
		<AbsoluteFill style={{backgroundColor: tema.fundo}}>
			{cs.map((f, i) => {
				const cena = spec.cenas[i];
				const temaCena = (cena.tema && TEMAS[cena.tema]) || tema;
				return (
					<Sequence key={i} from={f.from} durationInFrames={f.durationInFrames} premountFor={10}>
						<SceneRenderer cena={cena} tema={temaCena} dims={dims} customs={customs} />
					</Sequence>
				);
			})}
			{Logo ? <Logo params={{}} tema={tema} dims={dims} /> : null}
		</AbsoluteFill>
	);
};
