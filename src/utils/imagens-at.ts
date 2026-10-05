/** Every real image the film uses (this list becomes the credits via tools/creditos.mjs). */
export type ImageAT = {
	/** Path under public/, for staticFile(). */
	path: string;
	width: number;
	height: number;
	author: string;
	license: string;
	source: string;
	/** Scenes (1-based) where it appears. */
	scenes: number[];
	note?: string;
};

const img = (
	file: string,
	width: number,
	height: number,
	author: string,
	license: string,
	source: string,
	scenes: number[],
	note?: string,
): ImageAT => ({
	path: `images/anthropic/${file}`,
	width,
	height,
	author,
	license,
	source,
	scenes,
	note,
});

/**
 * Images for "Anthropic" (series "Você sabia"). Everything here has a known,
 * reusable licence — Commons CC0 / public domain / CC BY / CC BY-SA, checked
 * file by file on the description page. Dimensions are the real size of the
 * file on disk (already resized to 1920px wide at most by
 * tools/fetch-anthropic.mjs).
 */
export const IMG = {
	/** Dario Amodei on the TechCrunch Disrupt 2023 stage, talking, dark backdrop. The best full-figure shot: blue shirt, microphone, gesturing. */
	darioPalco: img(
		"dario/01-dario-amodei-at-techcrunch-disrupt-2023-02.jpg",
		1920,
		2880,
		"TechCrunch",
		"CC BY 2.0",
		"https://commons.wikimedia.org/wiki/File:Dario_Amodei_at_TechCrunch_Disrupt_2023_02.jpg",
		[2, 7],
		"Backdrop is dark and out of focus on the left; a white block sits at the right edge, crop it out. Source is a 2:3 vertical, ideal for 1080x1920.",
	),
	/** Dario Amodei, close portrait — same session, face fills the frame against black. */
	darioRetrato: img(
		"dario/02-dario-amodei-at-techcrunch-disrupt-2023-01-cropped-2.jpg",
		1884,
		2436,
		"TechCrunch",
		"CC BY 2.0",
		"https://commons.wikimedia.org/wiki/File:Dario_Amodei_at_TechCrunch_Disrupt_2023_01_(cropped_2).jpg",
		[2],
		"Almost black background, very easy to blend over #050505. His right hand is blurred in front of the chest at the bottom edge.",
	),
	/** The 2023 Downing Street meeting: Dario Amodei (left) beside Sam Altman (centre) and Rishi Sunak. The two companies in one frame, on the scene about leaving OpenAI. */
	darioComAltman: img(
		"dario/09-the-prime-minister-meets-with-ai-developers.jpg",
		1920,
		1280,
		"UK Prime Minister",
		"CC BY 2.0",
		"https://commons.wikimedia.org/wiki/File:The_Prime_Minister_meets_with_AI_developers.jpg",
		[3],
		"Identified people only: Amodei, Altman, Sunak and a fourth attendee. Landscape 3:2 — needs a pan or a crop for vertical. Do not caption it as an Anthropic event.",
	),
	/** ANTHROPIC wordmark, black on white. */
	marcaAnthropic: img(
		"marcas/01-anthropic-logo-2.png",
		800,
		90,
		"Brandfetch (uploaded to Commons)",
		"CC0",
		"https://commons.wikimedia.org/wiki/File:Anthropic_Logo_2.webp",
		[7],
		"Wordmark, white background, no alpha — invert with a CSS filter to sit it on the dark stage. 800px wide is enough for a title-card size use, do not blow it up full screen.",
	),
	/** The Claude web app, dark theme — the product itself, matching the film's palette. */
	claudeTela: img(
		"marcas/02-claude-ai-website-screenshot.png",
		1290,
		614,
		"VulcanSphere (screenshot of Anthropic PBC software)",
		"Public domain",
		"https://commons.wikimedia.org/wiki/File:Claude_AI_website_screenshot.webp",
		[5],
		"The greeting line carries the uploader's handle (\"Good evening, VulcanSphere\") — crop above or below it so no name shows. Dark UI, blends with #050505.",
	),
	/** The Claude mark (the orange burst) alone, transparent PNG. */
	claudeIcone: img(
		"marcas/04-claude-icon.png",
		415,
		413,
		"Logoover23",
		"CC0",
		"https://commons.wikimedia.org/wiki/File:Claude_icon.png",
		[3, 5, 7],
		"415px square: use it small (icon size), never full screen.",
	),
	/** OpenAI wordmark, white on black — same palette as the film. */
	marcaOpenAI: img(
		"marcas/06-openai.png",
		1600,
		900,
		"OpenAI",
		"Public domain",
		"https://commons.wikimedia.org/wiki/File:OpenAI.png",
		[1],
		"White mark over pure black; drop the black with a screen blend or key it, it is not alpha.",
	),
	/** OpenAI wordmark, black on white, February 2025 version. */
	openaiMarca2025: img(
		"marcas/05-openai-logo-since-february-2025.png",
		607,
		164,
		"OpenAI",
		"Public domain",
		"https://commons.wikimedia.org/wiki/File:OpenAI_Logo_Since_February_2025.png",
		[],
		"Modern (2025) mark — safe to use next to the 2025/2026 valuation figures. White background, invert it for the dark stage.",
	),
	/** Inside Anthropic's San Francisco office: the wooden A-frames and the tree in the lobby. */
	escritorioAnthropic: img(
		"escritorio/01-secretary-of-state-peter-kyle-visits-anthropic-in-san-franci.jpg",
		1920,
		1281,
		"Department for Science, Innovation and Technology",
		"CC BY 2.0",
		"https://commons.wikimedia.org/wiki/File:Secretary_of_State_Peter_Kyle_visits_Anthropic_in_San_Francisco._(54098999333).jpg",
		[4],
		"Bright interior — it needs grading or a tight crop to live on #050505. Only Peter Kyle (UK Secretary of State) is identified; the second person is an Anthropic staff member, do not label them.",
	),
	/** Same visit, handshake in the lobby — the office as a working place, not a stock room. */
	visitaAnthropic: img(
		"escritorio/02-secretary-of-state-peter-kyle-visits-anthropic-in-san-franci.jpg",
		1920,
		1281,
		"Department for Science, Innovation and Technology",
		"CC BY 2.0",
		"https://commons.wikimedia.org/wiki/File:Secretary_of_State_Peter_Kyle_visits_Anthropic_in_San_Francisco._(54099081629).jpg",
		[4],
		"Bright interior, same grading note. Second person not identified.",
	),
	/** The Pioneer Building, San Francisco — where OpenAI started, before the move. */
	pioneerBuilding: img(
		"escritorio/03-pioneer-building-san-francisco-2019-1.jpg",
		1920,
		965,
		"HaeB",
		"CC BY-SA 4.0",
		"https://commons.wikimedia.org/wiki/File:Pioneer_Building,_San_Francisco_(2019)_-1.jpg",
		[],
		"Wide 2:1 daylight street shot, blue sky — a pan works better than a crop. Historic building, shot in 2019: do not stamp an earlier date on it.",
	),
	/** The same building from the corner, facade and blooming trees — closer, more graphic. */
	sedeOpenAI: img(
		"escritorio/04-pioneer-building-san-francisco-2019-3.jpg",
		1920,
		1679,
		"HaeB",
		"CC BY-SA 4.0",
		"https://commons.wikimedia.org/wiki/File:Pioneer_Building,_San_Francisco_(2019)_-3.jpg",
		[1],
		"Shot in 2019 (cars and licence plates from the period are visible) — never use it to illustrate a later date.",
	),
	/** Sam Altman, November 2022 — the OpenAI era, portrait against soft green. */
	altman: img(
		"openai/03-sam-altman-november-2022.jpg",
		1920,
		2885,
		"Village Global",
		"CC BY 2.0",
		"https://commons.wikimedia.org/wiki/File:Sam_Altman_November_2022.jpg",
		[],
		"2:3 vertical, face centred — good for a slow push-in. Olive/yellow background, needs a grade to sit with the cold scenes.",
	),
	/** A hand holding an OpenAI sticker against black cloth — cheap, dark, and it reads as the company's mark. */
	openaiAdesivo: img(
		"openai/02-person-holding-the-openai-icon.jpg",
		1280,
		1707,
			"FoxTPNL",
		"CC BY 4.0",
		"https://commons.wikimedia.org/wiki/File:Person_holding_the_OpenAI_icon.jpg",
		[],
		"Amateur shot but dark and vertical, with no face and no watermark. 1280px wide: keep it at or below full height, do not upscale.",
	),
	/** San Francisco skyline from Ina Coolbrith Park — the city both companies work in. */
	sfSkyline: img(
		"sf/01-view-of-san-francisco-from-ina-coolbrith-park-01445.jpg",
		1920,
		828,
		"Frank Schulenburg",
		"CC BY-SA 4.0",
		"https://commons.wikimedia.org/wiki/File:View_of_San_Francisco_from_Ina_Coolbrith_Park-01445.jpg",
		[6],
		"Very wide 2.3:1 and bright daylight; use as a band or a slow pan, and grade it down.",
	),
	/** Downtown San Francisco swallowed by fog — grey, low contrast, the quiet before the closing. */
	sfNevoeiro: img(
		"sf/02-mist-over-downtown-san-francisco-ca-usa-9482055226-2.jpg",
		1920,
		1080,
		"l0da_ralta",
		"CC BY 2.0",
		"https://commons.wikimedia.org/wiki/File:Mist_over_downtown_San_Francisco,_CA,_USA_(9482055226)_(2).jpg",
		[],
		"The skyline is tiny in the frame, all cloud and water — a mood layer, not a landmark shot. Fits the dark stage without grading.",
	),
	/** San Francisco from above, August 2025, with Salesforce Tower and the Bay Bridge — the modern city, at the valuation beat. */
	sfAerea: img(
		"sf/05-san-francisco-downtown-aerial-august-2025.jpg",
		1920,
		1080,
		"Spicypepper999",
		"CC0",
		"https://commons.wikimedia.org/wiki/File:San_Francisco_Downtown_Aerial,_August_2025.jpg",
		[6],
		"CC0. Bright blue daylight — grade it down. Recent (2025), so it is honest next to the 2025/2026 numbers.",
	),
} satisfies Record<string, ImageAT>;
