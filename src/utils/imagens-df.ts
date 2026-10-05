import type {ImageNF} from "./imagens-nf";

export type ImageDF = ImageNF;

/**
 * Every image used in "Disney", all 1927-1930 material. Each entry carries its
 * credit (tools/creditos.mjs reads this file) and the scenes it appears in.
 */
const img = (
	file: string,
	width: number,
	height: number,
	author: string,
	license: string,
	source: string,
	scenes: number[],
	note?: string,
): ImageDF => ({
	path: `images/disney/${file}`,
	width,
	height,
	author,
	license,
	source,
	scenes,
	note,
});

export const IMG_DF = {
	/** "UNIVERSAL presents OSWALD THE LUCKY RABBIT in Hungry Hobos" — real title card. */
	intertitleOswald: img(
		"01-oswald/06-hungry-hoboes-1928-intertitle-png.png",
		1800,
		1331,
		"Walt Disney",
		"Public domain",
		"https://commons.wikimedia.org/wiki/File:Hungry_Hoboes_(1928)_Intertitle.png",
		[1],
	),
	/** Oswald clipped from the Trolley Troubles title card — the rabbit itself, no background. */
	oswaldCut: img(
		"01-oswald/17-oswald1927-no-background-png.png",
		1800,
		2209,
		"Ub Iwerks / Walt Disney",
		"Public domain",
		"https://commons.wikimedia.org/wiki/File:Oswald1927_-_no_background.png",
		[3, 6],
	),
	/** Earliest sketches of Mickey and Minnie — the fragment in the hook, the reveal at the birth. */
	mickeyConcept: img(
		"04-mickey-1928/17-mickey-mouse-concept-art-clear-version-webp.webp",
		1800,
		1364,
		"Ub Iwerks",
		"Public domain",
		"https://commons.wikimedia.org/wiki/File:Mickey_Mouse_concept_art_(clear_version).webp",
		[1, 5],
	),
	/** Trolley Troubles poster, 1927 — Oswald's debut. */
	posterTrolley: img(
		"01-oswald/13-trolley-troubles-poster-jpg.jpg",
		1920,
		2954,
		"Ub Iwerks",
		"Public domain",
		"https://commons.wikimedia.org/wiki/File:Trolley_Troubles_poster.jpg",
		[2],
	),
	/** The Film Daily, 1928 — the trade press page carrying the Oswald ad. */
	filmDaily: img(
		"09-oswald-mais/02-the-film-daily-1928-featuring-oswald-the-lucky-rabbit-jpg.jpg",
		1920,
		2499,
		"Winkler Productions, Universal, The Film Daily",
		"Public domain",
		"https://commons.wikimedia.org/wiki/File:The_Film_Daily_(1928)_featuring_Oswald_the_Lucky_Rabbit.jpg",
		[2],
	),
	/** Universal's own 1927 ad — the distributor that owned the rabbit. */
	adUniversal: img(
		"09-oswald-mais/03-oswald-the-lucky-rabbit-ad-jpg.jpg",
		784,
		1031,
		"Universal Pictures Corporation",
		"Public domain",
		"https://commons.wikimedia.org/wiki/File:Oswald_the_Lucky_Rabbit_ad.jpg",
		[3],
	),
	/** The team in front of the Walt Disney Studio — where Walt started over. */
	studio: img(
		"07-estudio-1920s/02-disney-first-studio-jpg.jpg",
		1800,
		1367,
		"Disney",
		"Public domain",
		"https://commons.wikimedia.org/wiki/File:Disney_first_studio.jpg",
		[4],
	),
	/** Ub Iwerks' signature, ink on the paper. */
	iwerksSignature: img(
		"03-ub-iwerks/02-ub-iwerks-signature-png.png",
		1800,
		279,
		"Ub Iwerks / United States Patent Office",
		"Public domain",
		"https://commons.wikimedia.org/wiki/File:Ub_Iwerks_Signature.png",
		[5],
	),
	/** Plane Crazy production drawing, auction strip already cropped out. */
	drawingPlane: img(
		"04-mickey-1928/05-plane-crazy-mickey-and-minnie-mouse-animation-drawing-crop.jpg",
		1920,
		1045,
		"Ub Iwerks / Walt Disney",
		"Public domain",
		"https://commons.wikimedia.org/wiki/File:Plane_Crazy_Mickey_and_Minnie_Mouse_Animation_Drawing_(Walt_Disney,_1928)_1-1.jpg",
		[6],
	),
	/** Real Steamboat Willie frame (Mickey and Peg Leg Pete), side bars to crop off. */
	frameSteamboat: img(
		"05-steamboat-willie/14-steamboat-willie-1928-78-jpg.jpg",
		1800,
		1012,
		"Walt Disney and Ub Iwerks",
		"Public domain",
		"https://commons.wikimedia.org/wiki/File:Steamboat_Willie_(1928)_78.jpg",
		[6],
	),
	/** Steamboat Willie 1928 poster — the image the film ends on. */
	posterSteamboat: img(
		"10-mickey-primeiros/01-steamboat-willie-1928-poster-png.png",
		1920,
		2803,
		"Walt Disney / Ub Iwerks",
		"Public domain",
		"https://commons.wikimedia.org/wiki/File:Steamboat_Willie_1928_Poster.png",
		[7],
	),
	/** Red theatre curtain — color and texture under the hook, never the subject. */
	texCurtain: img(
		"13-cor-textura/06-closed-red-curtain-at-the-coolidge-corner-theatre-portrait.jpg",
		768,
		1024,
		"brokentrinkets",
		"CC BY 2.0",
		"https://www.flickr.com/photos/45795292@N00/3074887475",
		[1],
	),
	/** 35mm reels and cans — warm texture under the Oswald success. */
	texReels: img(
		"13-cor-textura/05-35mm-reels-and-boxes-jpg.jpg",
		1920,
		1440,
		"christian razukas",
		"CC BY-SA 2.0",
		"https://commons.wikimedia.org/wiki/File:35mm_reels_and_boxes.jpg",
		[2],
	),
} as const;

export const ALL_IMAGES_DF: ImageNF[] = Object.values(IMG_DF);
