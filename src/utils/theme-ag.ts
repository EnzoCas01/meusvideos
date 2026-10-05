import {loadFont as loadDisplay} from "@remotion/google-fonts/BebasNeue";
import {loadFont as loadSans} from "@remotion/google-fonts/Inter";

/**
 * "Agentes" — an ad for the agent system itself. Cold near-black canvas so the
 * stock footage pops, ONE money green for everything that means "this pays off",
 * and a violet for the machine side (agents, prompt, render). Two faces: Bebas
 * Neue for the few huge words, Inter for labels and captions.
 */
export const DISPLAY_AG = loadDisplay("normal", {weights: ["400"]}).fontFamily;
export const SANS_AG = loadSans("normal", {
	weights: ["400", "600", "700", "900"],
	subsets: ["latin", "latin-ext"],
}).fontFamily;

export const AG = {
	/** Cold near-black: the footage is the only light source. */
	background: "#05070D",
	panel: "#0D1220",
	white: "#FFFFFF",
	grey: "#93A0B8",
	/** Money green — the promise of the hook. */
	accent: "#22E06B",
	/** The machine side: agents, prompt, render. */
	violet: "#7C5CFF",
	/** Text that sits on top of the accent. */
	onAccent: "#04140A",
} as const;

export const TYPE_AG = {
	huge: 230,
	big: 160,
	mid: 110,
	small: 76,
	label: 34,
	caption: 46,
} as const;

/** Expo-out-ish: what every reveal lands on. */
export const EASE_AG = [0.16, 1, 0.3, 1] as const;
