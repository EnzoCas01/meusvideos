import {loadFont as loadDisplay} from "@remotion/google-fonts/BebasNeue";
import {loadFont as loadSans} from "@remotion/google-fonts/Inter";

/**
 * "Burger King" — documentário rápido. Canvas quase preto, acento dourado de
 * chama (flame-grilled) e vermelho quente reservado aos momentos de guerra.
 * Burger King é o próprio sujeito do vídeo, então os tons da marca podem
 * aparecer — com parcimônia.
 */
export const DISPLAY_BK = loadDisplay("normal", {weights: ["400"]}).fontFamily;
export const SANS_BK = loadSans("normal", {weights: ["400", "600", "700", "800", "900"], subsets: ["latin", "latin-ext"]}).fontFamily;

export const BK = {
	background: "#070708",
	white: "#F5F1E8",
	grey: "#9A938A",
	/** Dourado de chama — acento principal da peça. */
	gold: "#FFAE00",
	goldDeep: "#E08A00",
	/** Vermelho quente, só nos momentos de guerra/queda. */
	red: "#D62300",
	accent: "#FFAE00",
} as const;
