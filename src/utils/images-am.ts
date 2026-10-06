/**
 * Every screen capture "AlvoManage" puts on screen, in ONE place.
 *
 * The `navegador` agent is re-capturing at zoom 100% with the cash register
 * open. When the new files land, change the entries here (src, size, rects)
 * and no scene has to be rebuilt: scenes only speak in terms of these named
 * rects ("the OS header", "the LINK DO CLIENTE strip"...).
 *
 * Coordinates are in the image's own pixels. `masks` are painted over the
 * image in the app's own panel colour, so things that must NEVER be on screen
 * stay hidden even when a camera move passes over them:
 *   - the red "Caixa fechado" pill / banner (dashboard, PDV)
 *   - the WhatsApp button on the OS page (the feature's screen never appears)
 *   - stray mouse cursors baked into the capture
 */

export type RectAM = {x: number; y: number; w: number; h: number};
export type MaskAM = RectAM & {color: string};

export type ScreenAM = {
	/** Path relative to public/, ready for staticFile(). */
	src: string;
	width: number;
	height: number;
	masks: MaskAM[];
};

const BASE = "images/alvomanage";
const APP = "#1A1A1A";
const r = (x: number, y: number, w: number, h: number): RectAM => ({x, y, w, h});
const m = (x: number, y: number, w: number, h: number, color = APP): MaskAM => ({x, y, w, h, color});

/* ------------------------------------------------------------------ */
/* Scene 3 — the OS page with the customer link strip (zoom 100%)       */
/* ------------------------------------------------------------------ */
export const OS_LINK: ScreenAM = {
	src: `${BASE}/os_aberta_link_100.png`,
	width: 1366,
	height: 577,
	masks: [
		// WhatsApp button in the OS header (the feature's screen never appears).
		m(1040, 132, 120, 38),
		// "Ver" button + the baked-in cursor next to "Copiar".
		m(1216, 200, 76, 41),
		m(1236, 240, 44, 26),
	],
};
export const OS_LINK_RECTS = {
	header: r(160, 132, 300, 46),
	badge: r(236, 139, 80, 22),
	strip: r(109, 193, 1193, 49),
	url: r(238, 207, 478, 22),
	copiar: r(1128, 204, 85, 28),
	/** The official wordmark in the app header — used by the closing logo. */
	wordmark: r(98, 6, 236, 46),
};

/* ------------------------------------------------------------------ */
/* Scenes 4 & 5 — the customer page on a phone (390x844 @2x, full page) */
/* ------------------------------------------------------------------ */
export const CLIENT_PHONE: ScreenAM = {
	src: `${BASE}/link_cliente_celular.png`,
	width: 780,
	height: 4712,
	masks: [],
};
export const CLIENT_PHONE_RECTS = {
	/** The official "A" mark at the top of the page — used by the closing logo. */
	logoMark: r(300, 40, 180, 180),
	statusBox: r(38, 425, 704, 124),
	stepAberto: r(54, 575, 92, 92),
	stepPronto: r(332, 575, 92, 92),
	stepEntregue: r(642, 575, 92, 92),
	defeito: r(0, 1236, 780, 140),
	valor: r(470, 1995, 280, 50),
	garantia: r(0, 2096, 780, 110),
	/** Inner dashed "Assine aqui" area and the Confirmar button. */
	signature: r(84, 4095, 612, 250),
	confirmar: r(400, 4372, 300, 70),
};
/** Scroll stops (top Y of the visible window, in image px). */
export const CLIENT_PHONE_SCROLL = {
	top: 0,
	stepper: 230,
	defeito: 1100,
	valor: 1560,
	garantia: 1980,
	assinatura: 3420,
};

/**
 * Real recording of the customer page (390x844, 30 fps). Scene 5 uses the PNG
 * above with a scroll driven by the voice (each section lands on its word);
 * this stays here for the re-recorded clip. NOT used by any scene: the file is
 * a WebM (VP9, no duration) renamed .mp4 — re-encode to H.264 (see
 * videos/leve/) before ever mounting it in <OffthreadVideo>.
 */
export const CLIENT_PHONE_VIDEO = `${BASE}/videos/link-celular_2026-10-05-19-59.mp4`;


/* ------------------------------------------------------------------ */
/* Scene 8 — side menu (from the PDV capture; Financeiro not visible)   */
/* ------------------------------------------------------------------ */
export const SIDEBAR: ScreenAM = {
	src: `${BASE}/historico/vendas_pdv_2026-10-05-zoom067.png`,
	width: 1366,
	height: 633,
	masks: [
		// Yellow mouse dot baked into the capture.
		m(4, 189, 28, 28),
		// PDV header pill "Caixa Fechado" + red banner, in case the camera drifts.
		m(248, 76, 92, 22, "#1C1C1C"),
		m(184, 106, 1182, 42),
	],
};
export const SIDEBAR_RECTS = {
	menu: r(0, 116, 182, 476),
	visaoGeral: r(8, 116, 166, 26),
	cadastro: r(8, 144, 166, 26),
	vendas: r(8, 252, 166, 26),
	os: r(8, 360, 166, 26),
	estoque: r(8, 494, 166, 26),
};
/**
 * Real recording of the side menu opening and scrolling from Cadastro down to
 * Financeiro (Caixa, Contas a Pagar). Cut from
 * videos/menu_lateral_2026-10-05-20-46.mp4 (3.4 s .. 11.3 s; the source is a
 * WebM without duration/cues renamed .mp4 — never point Remotion at it) and
 * re-encoded as a light H.264 crop of the menu column: 294x576, 30 fps, no
 * audio, keyframe every 15 frames so seeking during render stays cheap.
 * `frames` is the clip length; Scene 8 speeds it up to fit its beat.
 */
export const SIDEBAR_VIDEO: {src: string; width: number; height: number; frames: number} | null = {
	src: `${BASE}/videos/leve/menu_lateral_menu.mp4`,
	width: 294,
	height: 576,
	frames: 237,
};

/* ------------------------------------------------------------------ */
/* Scene 9 — OS dashboard + "Visão Geral" stale-OS alert (zoom 100%,    */
/* cash register open: no red "Caixa fechado" anywhere)                 */
/* ------------------------------------------------------------------ */
export const DASHBOARD: ScreenAM = {
	src: `${BASE}/os_dashboard_100.png`,
	width: 1366,
	height: 577,
	masks: [
		// Baked-in mouse cursor over the OS list.
		m(461, 403, 32, 44, "#1C1C1C"),
	],
};
export const DASHBOARD_RECTS = {
	counters: r(108, 237, 787, 52),
	emAndamento: r(108, 237, 148, 52),
	list: r(108, 326, 709, 251),
	firstOs: r(111, 376, 705, 60),
};

/** Real "3 OS em andamento há mais de 5 dias" alert (Visão Geral). */
export const STALE_ALERT: (ScreenAM & {focus: RectAM}) | null = {
	src: `${BASE}/os_alerta_parada_100.png`,
	width: 1366,
	height: 577,
	masks: [
		// Baked-in cursor: part over the orange alert bar, part below it.
		m(703, 166, 28, 20, "#461901"),
		m(703, 189, 28, 20),
		// "Ao vivo" badge on the revenue card: the customer page is NOT live,
		// so the film never shows the words "ao vivo" anywhere.
		m(356, 228, 72, 26, "#1C2534"),
	],
	focus: r(108, 146, 420, 42),
};

/* ------------------------------------------------------------------ */
/* Scene 10 — PDV and products (zoom 100%, cash register open)          */
/* ------------------------------------------------------------------ */
export const PDV: ScreenAM = {
	src: `${BASE}/vendas_pdv_100.png`,
	width: 1366,
	height: 577,
	masks: [
		// Baked-in cursor over the search box / first item.
		m(294, 146, 28, 22, "#1C1C1C"),
		m(294, 168, 28, 26, "#1C1C1C"),
	],
};
export const PDV_RECTS = {
	/** Product list + cart (the red "Fechar Caixa" button stays outside). */
	area: r(96, 137, 706, 433),
	list: r(96, 137, 398, 433),
	plusBateria: r(458, 194, 22, 22),
	cart: r(506, 137, 296, 433),
};

export const PRODUCTS: ScreenAM = {
	src: `${BASE}/produtos_100.png`,
	width: 1366,
	height: 577,
	masks: [],
};
export const PRODUCTS_RECTS = {
	table: r(101, 284, 1209, 293),
	/** Header + "Bateria iPhone 11" row. */
	row: r(101, 284, 1209, 105),
	colProduto: r(101, 286, 359, 103),
	colPreco: r(460, 286, 130, 103),
	colCusto: r(590, 286, 129, 103),
	colLucro: r(719, 286, 129, 103),
	colEstoque: r(958, 286, 112, 103),
};
