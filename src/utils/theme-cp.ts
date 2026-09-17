/**
 * Palette for "Comece Pequeno". Deliberately separate from `theme.ts` so that
 * touching this film can never shift a pixel of LifePhases.
 *
 * The violet is a design choice for a piece about a fintech that started in a
 * small room — it is never used as a logo, a wordmark, or any brand asset.
 */
export const CP = {
	/** Base canvas — matches the AbsoluteFill in ComecePequeno.tsx. */
	background: "#07060B",
	/** Slightly lifted panel black, for cards sitting on the canvas. */
	panel: "#100C18",
	white: "#F4F2F7",
	grey: "#B6B1C2",
	dim: "rgba(244,242,247,0.42)",
	faint: "rgba(244,242,247,0.14)",

	/** The card violet. */
	violet: "#8B3DFF",
	violetDeep: "#5320A8",
	violetSoft: "rgba(139,61,255,0.28)",

	/** Warm highlight, used sparingly — the "growth" colour in scenes 3 and 5. */
	warm: "#E8C77A",

	line: "rgba(244,242,247,0.20)",
} as const;

/** Expo-out: the deceleration the whole film lands on. */
export const EASE_CP = [0.16, 1, 0.3, 1] as const;
