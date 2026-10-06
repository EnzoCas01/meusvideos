import {loadFont} from "@remotion/google-fonts/Inter";

/**
 * Palette for "AlvoManage — vídeo de produto nº 1". Separate from every other
 * film's theme so touching this one can never shift a pixel of the others.
 *
 * Dark UI like the app itself: near-black canvas, the app's #1A1A1A panels,
 * amber/yellow and blue from the logo. Green appears ONLY on "Pronta" and on
 * the automatic message bubble (scene 6), as the script asks.
 */
export const AM = {
	background: "#0C0D10",
	/** The app's own panel grey, sampled from the screenshots (26,26,26). */
	appPanel: "#1A1A1A",
	panel: "#16181D",
	panelHi: "#20232A",

	white: "#F4F4F5",
	grey: "#A1A1AA",
	dim: "rgba(244,244,245,0.45)",
	faint: "rgba(244,244,245,0.10)",
	line: "rgba(244,244,245,0.16)",

	yellow: "#FFC107",
	yellowDeep: "#E5B005",
	yellowSoft: "rgba(255,193,7,0.22)",

	blue: "#3D7BF7",
	blueSoft: "rgba(61,123,247,0.25)",

	green: "#22C55E",
	greenSoft: "rgba(34,197,94,0.22)",

	paper: "#E9E4D8",
	postit: "#F7D35C",
} as const;

export const {fontFamily: FONT_AM} = loadFont("normal", {
	weights: ["500", "700", "800"],
	// Latin covers every Portuguese glyph; all 7 subsets meant 21 font fetches per tab.
	subsets: ["latin"],
});

/** Expo-out: the landing curve of the whole film. */
export const EASE_AM = [0.16, 1, 0.3, 1] as const;

/** Frames of a transition between scenes / beats. The plan asks for 6-8. */
export const TRANSITION_AM = 7;
