import React from "react";
import {AbsoluteFill} from "remotion";
import {COMPONENTES} from "./registro";
import type {CenaSpec} from "./spec";
import type {Tema} from "../../biblioteca/temas/types";

export type CenaCustom = React.FC<{cena: CenaSpec; tema: Tema; dims: [number, number]}>;

const ehClipe = (arquivo: string) => /\.(mp4|mov|webm)$/i.test(arquivo);

const resolve = (id: string, cena: CenaSpec) => {
	const Comp = COMPONENTES[id];
	if (!Comp) throw new Error(`cena ${cena.n}: componente "${id}" não está registrado na biblioteca`);
	return Comp;
};

/**
 * Renders one scene from the spec: a full `layout` component if set, otherwise
 * the standard composition (media + impact text + CTA), wrapped by the scene's
 * transition when there is one. A `custom` scene renders a bespoke component
 * passed by the piece's wrapper.
 */
export const SceneRenderer: React.FC<{
	cena: CenaSpec;
	tema: Tema;
	dims: [number, number];
	customs?: Record<string, CenaCustom>;
}> = ({cena, tema, dims, customs}) => {
	if (cena.custom) {
		const Custom = customs?.[cena.custom];
		if (!Custom) throw new Error(`cena ${cena.n}: componente custom "${cena.custom}" não foi passado em customs`);
		return <Custom cena={cena} tema={tema} dims={dims} />;
	}

	const Layout = cena.layout ? resolve(cena.layout.componente, cena) : null;
	const Midia = !Layout && cena.midia ? resolve(ehClipe(cena.midia.arquivo) ? "midia_clipe" : "midia_foto_kenburns", cena) : null;
	const Texto = !Layout && cena.texto ? resolve(cena.texto.componente, cena) : null;
	const Cta = !Layout && cena.cta ? resolve(cena.cta.componente, cena) : null;
	const Transicao = cena.transicao ? resolve(cena.transicao, cena) : null;

	const corpo = (
		<AbsoluteFill style={{backgroundColor: cena.fundo ?? tema.fundo}}>
			{Layout && cena.layout ? <Layout params={cena.layout.params ?? {}} tema={tema} dims={dims} /> : null}
			{Midia && cena.midia ? <Midia params={cena.midia as unknown as Record<string, unknown>} tema={tema} dims={dims} /> : null}
			{Texto && cena.texto ? <Texto params={cena.texto.params ?? {}} tema={tema} dims={dims} /> : null}
			{Cta && cena.cta ? <Cta params={cena.cta.params ?? {}} tema={tema} dims={dims} /> : null}
		</AbsoluteFill>
	);

	return Transicao ? (
		<Transicao params={{}} tema={tema} dims={dims}>
			{corpo}
		</Transicao>
	) : (
		corpo
	);
};
