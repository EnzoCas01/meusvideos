import manifest from "../../public/images/comece-pequeno/fontes.json";

/**
 * How an image may be treated on screen.
 *
 * `registro`   — a real photographic record of the thing being narrated. May
 *                carry a year, an archival frame, a period grade.
 * `ilustrativa` — a stand-in that merely illustrates the idea. Editorial rule
 *                the director enforces: it must NEVER be dressed as a record —
 *                no "2013" caption, no archive frame, no aged-photo filter.
 */
export type ImageNature = "registro" | "ilustrativa";

export type ImageEntry = {
	/** File name inside `public/images/comece-pequeno/cena<N>/`. */
	arquivo: string;
	cena: number;
	natureza: ImageNature;
	urlOriginal?: string;
	fonte?: string;
	autor?: string;
	licenca?: string;
	dataDaConsulta?: string;
};

/** What a scene actually consumes: a ready `staticFile` path plus its nature. */
export type SceneImage = {
	/** Path relative to public/, ready for `staticFile()`. */
	src: string;
	natureza: ImageNature;
	/** True when the image may be treated as a historical record. */
	isRecord: boolean;
	autor?: string;
	fonte?: string;
	licenca?: string;
};

type Manifest = {imagens?: unknown};

/**
 * The manifest is written by the `imagem` agent and can arrive late, empty, or
 * half-filled while the film is being built. Everything below is defensive on
 * purpose: a missing file, a missing field or a wrong type degrades to "this
 * scene has no photo" rather than breaking the render.
 */
/**
 * Files that are brand assets rather than photographs — wordmarks, logotypes,
 * vector marks. They are excluded here, at the source, so no scene can put a
 * third-party mark on screen by accident: this is a piece ABOUT a real public
 * company, not a piece FOR it. The `imagem` agent downloads what it finds; the
 * editorial filter lives on this side.
 */
const isBrandMark = (arquivo: string): boolean => {
	const f = arquivo.toLowerCase();
	return f.endsWith(".svg") || f.includes("logo") || f.includes("logotipo") || f.includes("marca");
};

const parse = (): ImageEntry[] => {
	const raw = (manifest as Manifest).imagens;
	if (!Array.isArray(raw)) return [];

	const out: ImageEntry[] = [];
	for (const item of raw) {
		if (typeof item !== "object" || item === null) continue;
		const rec = item as Record<string, unknown>;
		const arquivo = rec.arquivo;
		// The manifest has been seen writing this as either a bare number (3) or
		// a folder-style string ("cena3") — accept both rather than silently
		// dropping every image because of a formatting mismatch.
		const cenaRaw = rec.cena;
		const cena =
			typeof cenaRaw === "string"
				? Number(cenaRaw.replace(/[^0-9]/g, ""))
				: Number(cenaRaw);
		if (typeof arquivo !== "string" || arquivo.length === 0) continue;
		if (!Number.isFinite(cena) || cena < 1) continue;
		if (isBrandMark(arquivo)) continue;
		// Anything not explicitly marked as a record is treated as illustrative:
		// the conservative direction, since it forbids archival treatment.
		const natureza: ImageNature = rec.natureza === "registro" ? "registro" : "ilustrativa";
		out.push({
			arquivo,
			cena: Math.round(cena),
			natureza,
			urlOriginal: typeof rec.urlOriginal === "string" ? rec.urlOriginal : undefined,
			fonte: typeof rec.fonte === "string" ? rec.fonte : undefined,
			autor: typeof rec.autor === "string" ? rec.autor : undefined,
			licenca: typeof rec.licenca === "string" ? rec.licenca : undefined,
		});
	}
	return out;
};

const ENTRIES = parse();

const BASE = "images/comece-pequeno";

// `arquivo` already comes as "cenaN/filename.ext" (the manifest writes the
// folder into the name), so it is joined onto BASE as-is — prefixing another
// "cenaN/" on top of it doubled the path and 404'd every single image.
const toSceneImage = (e: ImageEntry): SceneImage => ({
	src: `${BASE}/${e.arquivo}`,
	natureza: e.natureza,
	isRecord: e.natureza === "registro",
	autor: e.autor,
	fonte: e.fonte,
	licenca: e.licenca,
});

/**
 * Every image the manifest lists for a scene, in manifest order.
 * Empty array when the photos have not been downloaded yet — scenes must
 * compose fine without them.
 */
export const imagesFor = (cena: number): SceneImage[] =>
	ENTRIES.filter((e) => e.cena === cena).map(toSceneImage);

/**
 * Picks the nth image of a scene, wrapping around so a scene asking for four
 * cuts still works when only two photos arrived. `undefined` when there are none.
 */
export const imageAt = (cena: number, index: number): SceneImage | undefined => {
	const list = imagesFor(cena);
	if (list.length === 0) return undefined;
	return list[((index % list.length) + list.length) % list.length];
};

/** True when a scene has at least one photo to work with. */
export const hasImages = (cena: number): boolean => imagesFor(cena).length > 0;

/** Total count, useful for logging / sanity checks in the Studio. */
export const IMAGE_COUNT_CP = ENTRIES.length;
