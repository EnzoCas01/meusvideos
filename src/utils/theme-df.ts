import {loadFont as loadDisplay} from "@remotion/google-fonts/Limelight";
import {loadFont as loadSans} from "@remotion/google-fonts/Archivo";
import {SCENE_STARTS_DF} from "./timeline-df";

/**
 * "Disney" — a 1927-1928 mini-documentary. The photos stay honest black & white
 * paper; the COLOR lives in the ground and the light around them, one dominant
 * accent per movement of the story. Display face is a 1920s marquee deco
 * (Limelight); captions are a robust grotesque (Archivo) so subtitles never read
 * as automatic social captions.
 */
export const DISPLAY_DF = `${loadDisplay("normal", {weights: ["400"], subsets: ["latin", "latin-ext"]}).fontFamily}, Georgia, serif`;
export const SANS_DF = `${loadSans("normal", {weights: ["400", "500", "600", "700"], subsets: ["latin", "latin-ext"]}).fontFamily}, Helvetica, sans-serif`;

export const DF = {
	night: "#0A0607",
	white: "#F5EFE3",
	grey: "#B7A99A",
	/** Archive gold — the film's through-line accent. */
	gold: "#D9A24B",
	goldText: "#F0C377",
	/** Curtain wine (hook + the Oswald years). */
	wine: "#6E1B2C",
	wineDeep: "#1E090F",
	ember: "#C9722E",
	amberDeep: "#1F1004",
	/** Cold light (the loss) — colored, never grey. */
	ice: "#A9C7E8",
	iceDeep: "#0B1526",
	steel: "#3C5F86",
	/** Dawn (start over). */
	dawn: "#F0B48A",
	tealDeep: "#08262B",
	teal: "#1C5450",
	red: "#BE3A2C",
	yellow: "#E9B23C",
} as const;

export const TYPE_DF = {
	huge: 240,
	big: 165,
	mid: 140,
	small: 110,
	credit: 46,
	caption: 58,
} as const;

export type GradeDF = {brightness: number; saturate: number; sepia: number; contrast: number};

/** Mild grades only: the archive stays itself, the ground carries the color. */
export const GRADE_DF = {
	photoWarm: {brightness: 0.94, saturate: 0.9, sepia: 0.1, contrast: 1.06},
	photoBright: {brightness: 1.02, saturate: 0.95, sepia: 0.06, contrast: 1.04},
	photoDim: {brightness: 0.58, saturate: 0.7, sepia: 0.08, contrast: 1.12},
	photoCold: {brightness: 0.9, saturate: 0.5, sepia: 0, contrast: 1.08},
	ghost: {brightness: 0.8, saturate: 0.35, sepia: 0, contrast: 1.12},
	texture: {brightness: 0.8, saturate: 1, sepia: 0, contrast: 1.05},
} satisfies Record<string, GradeDF>;

/** Accent color of each scene, in scene order — captions key off this too. */
const ACCENTS_DF: string[] = [DF.goldText, DF.goldText, DF.ice, DF.dawn, DF.goldText, DF.goldText, DF.goldText];

/** The accent of the story movement a frame belongs to. */
export const accentAtDF = (frame: number): string => {
	let accent = ACCENTS_DF[0];
	for (let i = 0; i < SCENE_STARTS_DF.length; i++) {
		if (frame >= SCENE_STARTS_DF[i]) accent = ACCENTS_DF[i];
	}
	return accent;
};
