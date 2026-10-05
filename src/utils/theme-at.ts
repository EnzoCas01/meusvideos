import {loadFont as loadDisplay} from "@remotion/google-fonts/BebasNeue";
import {loadFont as loadSans} from "@remotion/google-fonts/Inter";

/**
 * "Netflix" — a photographic mini-documentary. Near-black canvas, warm white
 * type, ONE deep red (the mailer envelope) used sparingly. Two faces: Bebas
 * Neue for the few big words, Inter for everything small.
 */
export const DISPLAY_AT = loadDisplay("normal", {weights: ["400"]}).fontFamily;
export const SANS_AT = loadSans("normal", {weights: ["400", "600"], subsets: ["latin", "latin-ext"]}).fontFamily;

export const AT = {
	background: "#080706",
	white: "#F0EEE6",
	grey: "#A39E93",
	/** The envelope red, for shapes and light. */
	accent: "#D97757",
	/** Same red lifted enough to read as small text on black. */
	accentText: "#EE9A7A",
} as const;

export const TYPE_AT = {
	huge: 260,
	big: 190,
	mid: 120,
	small: 92,
	label: 32,
	caption: 44,
} as const;

/** Expo-out-ish: what every reveal lands on. */
export const EASE_AT = [0.16, 1, 0.3, 1] as const;
