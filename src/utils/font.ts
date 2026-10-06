import {loadFont} from "@remotion/google-fonts/Inter";

export const {fontFamily} = loadFont("normal", {
	weights: ["300", "400", "500", "600"],
	// Latin only: all 7 subsets meant 28 font fetches in EVERY render (Root imports all films).
	subsets: ["latin"],
});
