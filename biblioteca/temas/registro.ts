import {tema as escuroClean} from "./escuro_clean/tema";
import {tema as luxoDourado} from "./luxo_dourado/tema";
import {tema as energiaViva} from "./energia_viva/tema";
import {tema as editorialClaro} from "./editorial_claro/tema";
import type {Tema} from "./types";

/** All themes available to the engine, keyed by spec `tema`. */
export const TEMAS: Record<string, Tema> = {
	escuro_clean: escuroClean,
	luxo_dourado: luxoDourado,
	energia_viva: energiaViva,
	editorial_claro: editorialClaro,
};

/** Safe fallback when the spec names an unknown theme. */
export const TEMA_PADRAO = TEMAS.escuro_clean;
