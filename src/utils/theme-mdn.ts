import {loadFont as loadDisplay} from "@remotion/google-fonts/BebasNeue";
import {loadFont as loadSans} from "@remotion/google-fonts/Inter";

/**
 * "MaquinaDinheiroNova" — a vertical promo for the agent system itself.
 * Studio-machine look: graphite chassis, ONE lime accent for anything alive or
 * important, warm white for type. Bebas Neue (a real condensed face) carries
 * the few big words; Inter does labels. Kept apart from every other theme.
 */
export const DISPLAY_MDN = loadDisplay("normal", {weights: ["400"]}).fontFamily;
export const SANS_MDN = loadSans("normal", {
	weights: ["400", "600", "700", "800"],
	subsets: ["latin", "latin-ext"],
}).fontFamily;

export const MDN_THEME = {
	/** Graphite canvas, slightly warmer than black. */
	background: "#0E100E",
	panel: "#171B18",
	panelLight: "#20261F",
	steel: "#2A322B",
	/** Warm white type. */
	text: "#F5F7EF",
	grey: "#9AA59A",
	dim: "rgba(245,247,239,0.5)",
	faint: "rgba(245,247,239,0.14)",
	/** Lime — one accent, used where something matters. */
	accent: "#C6FF3A",
	onAccent: "#101713",
	accentSoft: "rgba(198,255,58,0.22)",
	/** Fonts. */
	display: DISPLAY_MDN,
	sans: SANS_MDN,
} as const;

/** Display sizes. Big words are few and short (Bebas ≈ 0.4em per char). */
export const TYPE_MDN = {
	huge: 190,
	big: 140,
	mid: 84,
	label: 40,
	small: 30,
} as const;

/** Expo-out: what every landing eases on. */
export const EASE_MDN = [0.16, 1, 0.3, 1] as const;

/** 30 fps. */
export const FPS_MDN = 30;
