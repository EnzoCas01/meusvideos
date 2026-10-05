/**
 * Palette and type scale for "IFood" — a short business documentary about how
 * a printed restaurant guide became a digital platform.
 *
 * Kept apart from `theme.ts` and `theme-cp.ts` so this film can never shift a
 * pixel of the other two. The look is archival rather than futuristic: near
 * black, warm tungsten light, aged paper, one ember accent. No colour here is
 * ever used as a logo, a wordmark or any third-party brand asset.
 */
export const IF = {
	/** Base canvas — matches the AbsoluteFill in IFood.tsx. */
	background: "#0A0907",
	/** Lifted black for surfaces sitting on the canvas (tables, screens). */
	panel: "#16120D",
	/** Deep brown of a room lit by one lamp. */
	room: "#241B12",

	white: "#F3EEE3",
	grey: "#A39A88",
	dim: "rgba(243,238,227,0.44)",
	faint: "rgba(243,238,227,0.13)",
	line: "rgba(243,238,227,0.20)",

	/** The single warm accent: lamp light, ember, the word that matters. */
	accent: "#E8843A",
	accentDeep: "#8E4415",
	accentSoft: "rgba(232,132,58,0.26)",

	/** Printed matter. */
	paper: "#E4D7B8",
	paperShade: "#C9B792",
	paperEdge: "#A8966F",
	ink: "#1D1810",

	/** Period screens: CRT phosphor and early LCD. */
	screen: "#0E1A14",
	phosphor: "#9FE6B4",
} as const;

/** Expo-out: the deceleration everything in this film lands on. */
export const EASE_IF = [0.16, 1, 0.3, 1] as const;

/** Display sizes. Short words, set large — the piece is nearly all image. */
export const TYPE_IF = {
	huge: 188,
	big: 150,
	mid: 96,
	caption: 46,
	label: 34,
} as const;
