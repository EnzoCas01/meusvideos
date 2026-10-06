import manifest from "../../public/images/ifood/fontes.json";

/**
 * How an image may be treated on screen.
 *
 * `registro`    — a real photographic record of the thing being narrated.
 * `ilustrativa` — a stand-in that merely illustrates the idea.
 *
 * Editorial rule the director enforces for THIS film: nothing on Wikimedia
 * Commons is a record of iFood's history. Every photo here is `ilustrativa`
 * (a period-plausible reconstruction) and therefore must NEVER be dressed as
 * an archival document: no aged-photo filter, no "arquivo" frame, no caption
 * that implies the photo itself is from that year. The year card may sit in
 * the SCENE; it may not sit on the PHOTO.
 */
export type ImageNatureIF = "registro" | "ilustrativa";

export type ImageEntryIF = {
	/** File name inside `public/images/ifood/cena<N>/`. */
	arquivo: string;
	cena: number;
	natureza: ImageNatureIF;
	/**
	 * Which era the photo actually depicts ("2010s", "moderna", "indefinida").
	 * Exists because a genuine photo in the wrong scene still tells a lie —
	 * a 2024 phone under a "2011" card is a false statement, licence be damned.
	 */
	epoca?: string;
	urlOriginal?: string;
	fonte?: string;
	autor?: string;
	licenca?: string;
	dataDaConsulta?: string;
	/** Free-text note from the `imagem` agent's mandatory visual check. */
	conferidaVisualmente?: boolean;
};

/** What a scene actually consumes: a ready `staticFile` path plus its nature. */
export type SceneImageIF = {
	/** Path relative to public/, ready for `staticFile()`. */
	src: string;
	natureza: ImageNatureIF;
	/** True when the image may be treated as a historical record. */
	isRecord: boolean;
	epoca?: string;
	autor?: string;
	fonte?: string;
	licenca?: string;
};

type ManifestIF = {imagens?: unknown};

/**
 * Brand assets — wordmarks, logotypes, vector marks — are excluded at the
 * source so no scene can put a third-party mark on screen by accident. This is
 * a piece ABOUT a real public company, not a piece FOR it. Scene 9's "logo"
 * beat is drawn in code as a neutral mark, not a downloaded trademark file.
 */
const isBrandMark = (arquivo: string): boolean => {
	const f = arquivo.toLowerCase();
	return f.endsWith(".svg") || f.includes("logo") || f.includes("logotipo") || f.includes("marca");
};

/**
 * The manifest is written by the `imagem` agent and can arrive late, empty, or
 * half-filled while the film is being built. Everything below is defensive on
 * purpose: a missing file, a missing field or a wrong type degrades to "this
 * scene has no photo" rather than breaking the render.
 */
const parse = (): ImageEntryIF[] => {
	const raw = (manifest as ManifestIF).imagens;
	if (!Array.isArray(raw)) return [];

	const out: ImageEntryIF[] = [];
	for (const item of raw) {
		if (typeof item !== "object" || item === null) continue;
		const rec = item as Record<string, unknown>;
		const arquivo = rec.arquivo;
		const cena = Number(rec.cena);
		if (typeof arquivo !== "string" || arquivo.length === 0) continue;
		if (!Number.isFinite(cena) || cena < 1) continue;
		if (isBrandMark(arquivo)) continue;
		// An image is only usable once a human-equivalent visual check passed.
		// Commons has already returned grossly inappropriate results for a
		// generic query on this machine, so "downloaded" is not "approved".
		if (rec.conferidaVisualmente !== true) continue;
		// Anything not explicitly marked as a record is treated as illustrative:
		// the conservative direction, since it forbids archival treatment.
		const natureza: ImageNatureIF = rec.natureza === "registro" ? "registro" : "ilustrativa";
		out.push({
			arquivo,
			cena: Math.round(cena),
			natureza,
			epoca: typeof rec.epoca === "string" ? rec.epoca : undefined,
			urlOriginal: typeof rec.urlOriginal === "string" ? rec.urlOriginal : undefined,
			fonte: typeof rec.fonte === "string" ? rec.fonte : undefined,
			autor: typeof rec.autor === "string" ? rec.autor : undefined,
			licenca: typeof rec.licenca === "string" ? rec.licenca : undefined,
			conferidaVisualmente: true,
		});
	}
	return out;
};

const ENTRIES = parse();

const BASE = "images/ifood";

const toSceneImage = (e: ImageEntryIF): SceneImageIF => ({
	src: `${BASE}/cena${e.cena}/${e.arquivo}`,
	natureza: e.natureza,
	isRecord: e.natureza === "registro",
	epoca: e.epoca,
	autor: e.autor,
	fonte: e.fonte,
	licenca: e.licenca,
});

/**
 * Every image the manifest lists for a scene, in manifest order.
 * Empty array when the photos have not been downloaded yet — scenes MUST
 * compose fine without them (the film has to stay renderable at all times).
 */
export const imagesForIF = (cena: number): SceneImageIF[] =>
	ENTRIES.filter((e) => e.cena === cena).map(toSceneImage);

/**
 * Picks the nth image of a scene, wrapping around so a scene asking for four
 * cuts still works when only two photos arrived. `undefined` when there are none.
 */
export const imageAtIF = (cena: number, index: number): SceneImageIF | undefined => {
	const list = imagesForIF(cena);
	if (list.length === 0) return undefined;
	return list[((index % list.length) + list.length) % list.length];
};

/** True when a scene has at least one photo to work with. */
export const hasImagesIF = (cena: number): boolean => imagesForIF(cena).length > 0;

/** Total count, useful for logging / sanity checks in the Studio. */
export const IMAGE_COUNT_IF = ENTRIES.length;
