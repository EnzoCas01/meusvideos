import type {Tema} from "../temas/types";

/** What every library component receives from the engine. */
export type ComponenteProps = {
	params: Record<string, unknown>;
	tema: Tema;
	dims: [number, number];
	children?: React.ReactNode;
};
