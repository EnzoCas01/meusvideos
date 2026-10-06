/**
 * Palette for "iFood — a virada". Separate from theme.ts and theme-cp.ts so
 * that touching this film can never shift a pixel of the other two.
 *
 * The brief asks for a modern business/tech mini-documentary: dark, sophisticated,
 * cinematic. Red is a brand-adjacent accent and is used SPARINGLY — on impact
 * beats and dates only, never as a wash, and never as a logo or wordmark.
 */
export const IF = {
	/** Base canvas — matches the AbsoluteFill in Ifood.tsx. */
	background: "#08070A",
	/** Lifted panel black, for photo cards sitting on the canvas. */
	panel: "#111014",

	white: "#F5F3F2",
	grey: "#A8A3A0",
	dim: "rgba(245,243,242,0.40)",
	faint: "rgba(245,243,242,0.12)",

	/** The accent. Impact beats, dates, the 2018 reveal. Used sparingly. */
	red: "#EA1D2C",
	redDeep: "#8E0E18",
	redSoft: "rgba(234,29,44,0.26)",

	/** Cold tech tone for interfaces, maps, routes — balances the red. */
	cyan: "#6FD6E0",
	cyanSoft: "rgba(111,214,224,0.22)",

	/** Warm paper tone — the 2011 era: print guide, desk lamp, phone room. */
	paper: "#D8C7A6",
	paperDeep: "#6B5C42",

	line: "rgba(245,243,242,0.18)",
} as const;

/** Expo-out: the deceleration the whole film lands on. */
export const EASE_IF = [0.16, 1, 0.3, 1] as const;

/** Sharp in-out, for the fast cuts the brief asks for. */
export const EASE_IF_CUT = [0.65, 0, 0.35, 1] as const;
