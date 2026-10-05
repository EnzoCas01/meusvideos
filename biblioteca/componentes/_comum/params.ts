/** Small param helpers: every component reads params defensively, defaults never break the render. */
export const str = (v: unknown, padrao = ""): string => (typeof v === "string" && v ? v : padrao);

export const num = (v: unknown, padrao: number): number =>
	typeof v === "number" && Number.isFinite(v) ? v : padrao;

export const flag = (v: unknown, padrao = false): boolean => (typeof v === "boolean" ? v : padrao);

export const cor = (v: unknown, padrao: string): string => str(v, padrao);

/** Media path relative to public/, tolerating a leading `public/`. */
export const arq = (v: unknown, padrao = ""): string => str(v, padrao).replace(/^public\//, "");
