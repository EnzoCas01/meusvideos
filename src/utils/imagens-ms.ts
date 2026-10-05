/** Every real image the film uses (this list becomes the credits via tools/creditos.mjs). */
export type ImageMS = {
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

/**
 * Every image used in "Microsoft" (series "Você sabia"). All of it comes from
 * Wikimedia Commons with a stated, reusable licence (public domain, CC0, CC BY,
 * CC BY-SA) — nothing here is "unknown licence".
 *
 * Scenes are the six mounted scenes of src/utils/timeline-ms.ts:
 *   1 hook · 2 1975/Allen/Altair · 3 first year · 4 IBM comes looking · 5 1981 · 6 close
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
): ImageMS => ({
	path: `images/microsoft/${file}`,
	width,
	height,
	author,
	license,
	source,
	scenes,
	note,
});

export const IMG = {
	/** 1977 Albuquerque mugshot — the face of Gates the year Microsoft was getting going. */
	billGatesMugshot: img(
		"01-fundadores/01-bill-gates-mugshot-png.png",
		640,
		443,
		"Albuquerque, New Mexico Police Department",
		"Public domain",
		"https://commons.wikimedia.org/wiki/File:Bill_Gates_mugshot.png",
		[2],
		"Only 640px wide: use it small, as a photo card, never stretched full frame.",
	),
	/** "An Open Letter to Hobbyists", 3 Feb 1976 — Gates calling out Altair BASIC piracy. */
	letterToHobbyists: img(
		"01-fundadores/02-bill-gates-letter-to-hobbyists-jpg.jpg",
		1700,
		2200,
		"Bill Gates",
		"Public domain",
		"https://commons.wikimedia.org/wiki/File:Bill_Gates_Letter_to_Hobbyists.jpg",
		[2, 3],
		"Page 2 of the Homebrew Computer Club newsletter, the letter is legible at full size.",
	),
	/** Traf-O-Data machine (1972), the two founders' project before Microsoft. */
	trafOData: img(
		"01-fundadores/03-traf-o-data-computer-jpg.jpg",
		1604,
		982,
		"Michael Holley (Swtpc6800)",
		"Public domain",
		"https://commons.wikimedia.org/wiki/File:Traf-O-Data_Computer.jpg",
		[2],
		"The narration never mentions Traf-O-Data: background texture at most, no caption.",
	),
	/** Paul Allen (left) and Bill Gates at the Lakeside School teletypes, 1970. */
	lakeside1970: img(
		"01-fundadores/04-paul-allen-and-bill-gates-at-lakeside-school-in-1970-jpg.jpg",
		1200,
		811,
		"Bruce Burgess",
		"Public domain",
		"https://commons.wikimedia.org/wiki/File:Paul_Allen_and_Bill_Gates_at_Lakeside_School_in_1970.jpg",
		[2],
		"Who is who follows the Commons description: Allen on the left, Gates at the teletype.",
	),
	/** The original 8K BASIC paper tape for the Altair, dated July 1975. */
	altairBasicTape: img(
		"02-altair/01-altair-basic-paper-tape-jpg.jpg",
		1920,
		1440,
		"Michael Holley (Swtpc6800)",
		"Public domain",
		"https://commons.wikimedia.org/wiki/File:Altair_BASIC_Paper_Tape.jpg",
		[2],
		"The software the two wrote, in their hand — the tape is labelled \"BASIC 8K\".",
	),
	/** Altair 8800 with the acrylic lid open, boards showing, on dark cloth. */
	altair8800: img(
		"02-altair/03-altair-8800-computer-jpg.jpg",
		1495,
		1349,
		"Michael Holley (Swtpc6800)",
		"Public domain",
		"https://commons.wikimedia.org/wiki/File:Altair_8800_Computer.jpg",
		[2],
		"Best Altair for the dark set: blue front panel, black ground, boards lit from above.",
	),
	/** MITS ad, May 1975 — "Building your own computer won't be a piece of cake". */
	altairAd1975: img(
		"02-altair/04-altair-computer-ad-may-1975-jpg.jpg",
		1650,
		2200,
		"MITS staff",
		"Public domain",
		"https://commons.wikimedia.org/wiki/File:Altair_Computer_Ad_May_1975.jpg",
		[2],
		"Stands in for the Popular Electronics cover, which is under copyright: this one is free.",
	),
	/** Full front view of the Altair on a red studio background. */
	altair8800Front: img(
		"02-altair/06-mits-altair-8800-computer-1975-jpg.jpg",
		1920,
		1154,
		"Cromemco",
		"CC BY-SA 4.0",
		"https://commons.wikimedia.org/wiki/File:MITS_Altair_8800_Computer_(1975).jpg",
		[2],
		"Studio red ground: either crop tight on the machine or use the red as a colour block.",
	),
	/** Altair 8800 front panel — switches and LEDs, close. */
	altairPanel: img(
		"02-altair/07-mits-altair-8800-front-panel-jpg.jpg",
		1920,
		815,
		"Cromemco",
		"CC BY-SA 4.0",
		"https://commons.wikimedia.org/wiki/File:MITS_Altair_8800_Front_Panel.jpg",
		[2],
		"Wide and dark: good as a full-width band behind the impact text.",
	),
	/** Original kit-built Altair 8800 with its ASR-33 teletype. */
	altairTeletype: img(
		"02-altair/08-altair-8800-and-model-33-asr-teletype-jpg.jpg",
		1920,
		1440,
		"Tim Colegrove",
		"CC BY-SA 4.0",
		"https://commons.wikimedia.org/wiki/File:Altair_8800_and_Model_33_ASR_Teletype.jpg",
		[2],
		"A working desk of the time — machine on the left, printer terminal on the right.",
	),
	/** IBM 5150 with keyboard, shot dark inside a display case. */
	ibmPc5150Dark: img(
		"03-ibm-pc/01-ibm-pc-5150-no-monitor-jpg.jpg",
		1920,
		1440,
		"Marcin Wichary",
		"CC BY 2.0",
		"https://commons.wikimedia.org/wiki/File:IBM_PC_5150_no_monitor.jpg",
		[4, 5],
		"Dark ground already; there is a faint glass reflection on the left corner.",
	),
	/** IBM 5150, monitor and keyboard on white. */
	ibmPc5150: img(
		"03-ibm-pc/02-ibm-pc-5150-jpg.jpg",
		1920,
		1784,
		"Ruben de Rijcke",
		"CC BY-SA 3.0",
		"https://commons.wikimedia.org/wiki/File:Ibm_pc_5150.jpg",
		[4, 5],
		"White background: reads as a catalogue shot, so pair it with a colour panel.",
	),
	/** IBM 5150 cut out with alpha — drops straight onto #050505. */
	ibmPc5150Cut: img(
		"03-ibm-pc/05-ibm-pc-img-7271-transparent-png.png",
		1920,
		1280,
		"Rama & Musée Bolo",
		"CC BY-SA 2.0 fr",
		"https://commons.wikimedia.org/wiki/File:IBM_PC-IMG_7271_(transparent).png",
		[4, 5, 6],
		"Real transparency (RGBA). The cleanest way to put the IBM PC on the dark set.",
	),
	/** IBM 5150, monitor and keyboard on blue cloth, high resolution. */
	ibmPc5150Desk: img(
		"03-ibm-pc/07-ibm-5150-1-jpg.jpg",
		1920,
		1280,
		"Shelby Jueden",
		"CC BY-SA 4.0",
		"https://commons.wikimedia.org/wiki/File:Ibm-5150-1.jpg",
		[5, 6],
		"Sharpest of the set (source is 6000px), cool blue cloth background.",
	),
	/** IBM floppy drive open, a DOS disk in the slot and the controller board on top. */
	floppyWithDos: img(
		"04-dos/01-ibm-floppy-drive-with-dos-jpg.jpg",
		1920,
		1536,
		"Michael Holley (Swtpc6800)",
		"Public domain",
		"https://commons.wikimedia.org/wiki/File:IBM_Floppy_Drive_With_DOS.jpg",
		[4, 6],
		"Hardware detail: the disk the operating system was actually shipped on.",
	),
	/** The "Disk Operating System by Microsoft" DOS 1.1 binder and its 5.25" disk. */
	dosManual: img(
		"04-dos/03-ibm-dos-1-1-manual-and-disk-jpg.jpg",
		1920,
		2688,
		"Michael Holley (Swtpc6800)",
		"CC0",
		"https://commons.wikimedia.org/wiki/File:IBM_DOS_1.1_Manual_and_Disk.jpg",
		[4, 6],
		"The proof that Microsoft's software shipped with the IBM PC — \"by Microsoft\" on the cover.",
	),
	/** DOS binders and disks in the box, warm and dark. */
	dosPackage: img(
		"04-dos/05-ibm-pc-dos-1-0-7154387644-jpg.jpg",
		1920,
		2880,
		"Marcin Wichary",
		"CC BY 2.0",
		"https://commons.wikimedia.org/wiki/File:IBM_PC_DOS_1.0_(7154387644).jpg",
		[4, 6],
		"Careful: the binder visible in the box reads Version 2.00 — never caption this as DOS 1.0.",
	),
	/** IBM's first logo, 1924 — the globe with Business / International / Machines. */
	ibmLogo1924: img(
		"05-logos/01-original-ibm-logo-png.png",
		1920,
		1840,
		"OgilvyOne",
		"Public domain",
		"https://commons.wikimedia.org/wiki/File:Original_IBM_Logo.png",
		[4],
		"White lines on transparency: meant for a dark ground, no cutout needed.",
	),
	/** Paul Rand's "Eye Bee M" rebus, in colour on black. */
	ibmRebus: img(
		"05-logos/03-eye-bee-m-rebus-logo-jpg.jpg",
		1920,
		1084,
		"Paul Rand",
		"Public domain",
		"https://commons.wikimedia.org/wiki/File:Eye_Bee_M_Rebus_Logo.jpg",
		[4],
		"Black ground already, and the only colour accent among the logos.",
	),
	/** IBM System/360 manuals, black and white, real paper texture. */
	ibmManuals: img(
		"05-logos/04-the-evolution-of-the-logo-3250012320-jpg.jpg",
		1920,
		1278,
		"Marcin Wichary",
		"CC BY 2.0",
		"https://commons.wikimedia.org/wiki/File:The_evolution_of_the_logo_(3250012320).jpg",
		[4, 6],
		"Desaturated on purpose: use it as a cut-out layer, never as the whole frame.",
	),
	/** Microsoft's 1980 wordmark with the blibbet O, white on black. */
	msLogo1980: img(
		"05-logos/06-microsoft-logo-1980-png.png",
		1920,
		1080,
		"Microsoft",
		"Public domain",
		"https://commons.wikimedia.org/wiki/File:Microsoft_logo_(1980).png",
		[5, 6],
		"Full 1080p frame of white on black — ready to drop in without any treatment.",
	),
	/** The 1975 Microsoft logo, black lines on transparency. */
	msLogo1975: img(
		"05-logos/07-microsoft-logo-1975-svg.png",
		1920,
		799,
		"Microsoft / Simon Daniels",
		"Public domain",
		"https://commons.wikimedia.org/wiki/File:Microsoft_logo_(1975).svg",
		[2],
		"Black lines on transparency: invisible on #050505, use the white version instead.",
	),
	/** The 1975 logo with the lines inverted to white, for the dark set. */
	msLogo1975White: img(
		"05-logos/10-microsoft-logo-1975-linhas-brancas.png",
		1920,
		799,
		"Microsoft / Simon Daniels",
		"Public domain",
		"https://commons.wikimedia.org/wiki/File:Microsoft_logo_(1975).svg",
		[1, 2],
		"Same mark as msLogo1975, lines recoloured to white — that is the one to use on screen.",
	),
	/** IBM logo strip 1888-1972, black on white with the years under each mark. */
	ibmLogoHistory: img(
		"05-logos/08-ibm-logo-history-png.png",
		1920,
		364,
		"Great Brightstar",
		"Public domain",
		"https://commons.wikimedia.org/wiki/File:IBM_logo_history.png",
		[4],
		"Black on white and only 364px tall: sits as a light card, do not stretch it full width.",
	),
	/** IBM's Armonk headquarters with the logo on the building. */
	ibmArmonk: img(
		"06-ibm-sede/04-ibm-chq-oct-2014-jpg.jpg",
		1920,
		1440,
		"Treesmittenex",
		"CC BY-SA 4.0",
		"https://commons.wikimedia.org/wiki/File:IBM_CHQ_-_Oct_2014.jpg",
		[4],
		"Modest and grey, which suits the scene where IBM comes looking for the two.",
	),
	/** The Armonk campus walkway under the overhang. */
	ibmArmonkCampus: img(
		"06-ibm-sede/05-ibm-armonk-corporate-headquarters-unusual-view-jpg.jpg",
		1920,
		1150,
		"Mark Hillary",
		"CC BY 2.0",
		"https://commons.wikimedia.org/wiki/File:IBM_Armonk_corporate_headquarters_unusual_view.jpg",
		[4],
		"Quiet architectural shot — a place to breathe between two pieces of hardware.",
	),
	/** Sign with the current Microsoft wordmark on a campus. */
	microsoftSign: img(
		"06-ibm-sede/02-microsoft-sign-on-german-campus-jpg.jpg",
		1920,
		1387,
		"Johannes Hemmerlein",
		"Public domain",
		"https://commons.wikimedia.org/wiki/File:Microsoft_Sign_on_German_campus.jpg",
		[6],
		"Today's logo, not the 1975 one: only use it as the closing \"and that was only the start\".",
	),
	/** Museum case with the MICRO-SOFT binder, IBM manuals and early Microsoft items. */
	microsoftMemorabilia: img(
		"06-ibm-sede/06-microsoft-memorabilia-jpg.jpg",
		1920,
		2560,
		"Marcin Wichary",
		"CC BY 2.0",
		"https://commons.wikimedia.org/wiki/File:Microsoft_memorabilia.jpg",
		[2, 6],
		"The MICRO-SOFT binder next to the IBM manuals is the whole story in one photograph.",
	),
} as const satisfies Record<string, ImageMS>;

export const ALL_IMAGES_MS: ImageMS[] = Object.values(IMG);
