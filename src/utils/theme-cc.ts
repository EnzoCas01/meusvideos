import {loadFont as loadDisplay} from "@remotion/google-fonts/BebasNeue";
import {loadFont as loadSans} from "@remotion/google-fonts/Inter";

/**
 * "Coca-Cola" — a photographic mini-documentary. Warm near-black canvas so the
 * historical material (mostly sepia and black and white) sits on something with
 * colour, ONE red — the brand's own — for accents and impact numbers, and a warm
 * cream for type. Two faces: Bebas Neue for the few big words, Inter for
 * everything small.
 */
export const DISPLAY_CC = loadDisplay("normal", {weights: ["400"]}).fontFamily;
export const SANS_CC = loadSans("normal", {weights: ["400", "600"], subsets: ["latin", "latin-ext"]}).fontFamily;

export const CC = {
	/** Warm near-black: the sepia material never sits on a cold grey. */
	background: "#0C0708",
	white: "#F7F1E8",
	grey: "#A99C95",
	/** The brand red, for shapes, light and impact numbers. */
	accent: "#E0142B",
	/** Same red lifted enough to read as small text on the dark canvas. */
	accentText: "#FF6B73",
	/** Amber of the soda fountain era — secondary accent for the 1886 half. */
	amber: "#E0A458",
} as const;

export const TYPE_CC = {
	huge: 260,
	big: 190,
	mid: 120,
	small: 92,
	label: 32,
	caption: 44,
} as const;

/** Expo-out-ish: what every reveal lands on. */
export const EASE_CC = [0.16, 1, 0.3, 1] as const;
