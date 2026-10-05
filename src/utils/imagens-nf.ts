/**
 * Every real image the film uses: file, size on disk, credit, and the scenes it
 * appears in. This list becomes the credits. Sizes are the files in public/,
 * not the originals (those were downscaled to 1920 px wide).
 */
export type ImageNF = {
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

const DIR = "images/netflix";

export const IMG = {
	envelope: {
		path: `${DIR}/05-envelope-vermelho/01-netflix-envelope-2655128664-jpg.jpg`,
		width: 1920,
		height: 1280,
		author: "Marit & Toomas Hinnosaar",
		license: "CC BY 2.0",
		source: "https://commons.wikimedia.org/wiki/File:Netflix_envelope_(2655128664).jpg",
		scenes: [1, 3],
		note: "Modern photo (Flickr 2008) of a red mailer; never date-stamped.",
	},
	envelopeArt: {
		path: `${DIR}/05-envelope-vermelho/46-netflix-dvds-1998-2023.jpg`,
		width: 1024,
		height: 694,
		author: "Ron Cogswell",
		license: "CC BY 2.0",
		source: "https://www.flickr.com/photos/22711505@N05/52856273027",
		scenes: [2],
		note: "2023 anniversary mailer art; cropped to the red illustration, printed years hidden.",
	},
	returnMailer: {
		path: `${DIR}/05-envelope-vermelho/21-netflix-envelope-and-dvd.jpg`,
		width: 1024,
		height: 683,
		author: "Marit & Toomas Hinnosaar",
		license: "CC BY 2.0",
		source: "https://www.flickr.com/photos/27519540@N04/2654302987",
		scenes: [4, 9],
		note: "Prepaid return mailer with a disc; Openverse, max 1024 px (inset only).",
	},
	logo1997: {
		path: `${DIR}/01-netflix-historia/14-original-netflix-logo-png.png`,
		width: 1920,
		height: 895,
		author: "Netflix",
		license: "Public domain",
		source: "https://commons.wikimedia.org/wiki/File:Original_Netflix_Logo.png",
		scenes: [2],
		note: "Original logo, the only 1997 artefact found.",
	},
	disc: {
		path: `${DIR}/04-dvd/01-dvd-video-bottom-side-jpg.jpg`,
		width: 1510,
		height: 1582,
		author: "Ocrho",
		license: "Public domain",
		source: "https://commons.wikimedia.org/wiki/File:DVD-Video_bottom-side.jpg",
		scenes: [1, 5, 6, 9],
		note: "Cut out with a circular mask.",
	},
	dvdStack: {
		path: `${DIR}/04-dvd/03-dvd-stack-jpg.jpg`,
		width: 1920,
		height: 3449,
		author: "RadioKAOS",
		license: "CC BY-SA 3.0",
		source: "https://commons.wikimedia.org/wiki/File:DVD_Stack.JPG",
		scenes: [4],
		note: "Generic DVDs as texture behind '2003 / 1 milhão'; not a record of 2003.",
	},
	rentalStore: {
		path: `${DIR}/06-correio/03-scarecrow-video-movie-rental-store-interior-jpg.jpg`,
		width: 1920,
		height: 1440,
		author: "D Coetzee",
		license: "CC0",
		source: "https://commons.wikimedia.org/wiki/File:Scarecrow_Video_movie_rental_store_interior.jpg",
		scenes: [3],
		note: "Video rental store interior (Scarecrow Video, Seattle); not a Blockbuster.",
	},
	imac: {
		path: `${DIR}/08-streaming-2007/09-24-inch-imac-monitor-jpeg.jpg`,
		width: 1920,
		height: 1440,
		author: "Robert Nelson from Brooksville, Florida, USA",
		license: "CC BY 2.0",
		source: "https://commons.wikimedia.org/wiki/File:24_inch_iMac_monitor.jpeg",
		scenes: [5],
		note: "Late-2000s desktop computer.",
	},
	appleTvTv: {
		path: `${DIR}/08-streaming-2007/19-apple-tv-and-sony-flatscreen-tv-at-macworld-2007-01-10-jpg.jpg`,
		width: 1800,
		height: 1350,
		author: "solgrundy (Flickr)",
		license: "CC BY-SA 2.0",
		source: "https://commons.wikimedia.org/wiki/File:Apple_TV_and_Sony_flatscreen_TV_at_Macworld-2007-01-10.jpg",
		scenes: [6, 9],
		note: "Apple TV beside a flat TV: 'technology reaching the living room'. Not a Netflix screen; no date stamped on it.",
	},
	hocSet1: {
		path: `${DIR}/09-house-of-cards/01-governor-tours-the-house-of-cards-set-8774090860-jpg.jpg`,
		width: 1920,
		height: 1493,
		author: "Maryland GovPics",
		license: "CC BY 2.0",
		source: "https://commons.wikimedia.org/wiki/File:Governor_Tours_the_House_of_Cards_Set_(8774090860).jpg",
		scenes: [7, 9],
		note: "Official press visit to the House of Cards set (2013). Real record, not a promotional still; no names on screen.",
	},
	hocSet2: {
		path: `${DIR}/09-house-of-cards/03-governor-tours-the-house-of-cards-set-8769364051-jpg.jpg`,
		width: 1920,
		height: 1265,
		author: "Maryland GovPics",
		license: "CC BY 2.0",
		source: "https://commons.wikimedia.org/wiki/File:Governor_Tours_the_House_of_Cards_Set_(8769364051).jpg",
		scenes: [7],
		note: "Same visit; second half of the sentence.",
	},
	phone2018: {
		path: `${DIR}/10-logo-expansao/06-netflix-2018-jpg.jpg`,
		width: 1920,
		height: 1280,
		author: "Stock Catalog (Flickr)",
		license: "CC BY 2.0",
		source: "https://commons.wikimedia.org/wiki/File:Netflix_2018.jpg",
		scenes: [10],
		note: "Phone showing the Netflix logo on a laptop; the closing image. Modern photo, no date stamped.",
	},
	logomark: {
		path: `${DIR}/10-logo-expansao/11-netflix-logomark-png.png`,
		width: 1800,
		height: 756,
		author: "Netflix Inc.",
		license: "Public domain",
		source: "https://commons.wikimedia.org/wiki/File:Netflix_Logomark.png",
		scenes: [10],
		note: "Red wordmark with alpha, shown small only at the very end.",
	},
	worldMap: {
		path: `${DIR}/11-mapa/05-blank-world-map-robinson-projection-svg.svg`,
		width: 2048,
		height: 1039,
		author: "Justinkunimune",
		license: "CC0 1.0",
		source: "https://commons.wikimedia.org/wiki/File:Blank_world_map_Robinson_projection.svg",
		scenes: [8, 9],
		note: "Vector, Robinson. Not loaded at runtime: path data was extracted to src/utils/mapa-nf.ts (ocean, Antarctica and small-country circles dropped).",
	},
} satisfies Record<string, ImageNF>;

export const ALL_IMAGES_NF: ImageNF[] = Object.values(IMG);
