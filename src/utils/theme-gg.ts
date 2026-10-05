import {loadFont as loadDisplay} from "@remotion/google-fonts/BebasNeue";
import {loadFont as loadSans} from "@remotion/google-fonts/Inter";

/**
 * "Google" — documentário rápido para TikTok. Canvas quase preto, acento
 * azul do próprio Google (é o sujeito do vídeo, não uma marca alheia); os
 * quatro tons da marca aparecem só como pontos discretos na cena 3 (teia).
 */
export const DISPLAY_GG = loadDisplay("normal", {weights: ["400"]}).fontFamily;
export const SANS_GG = loadSans("normal", {weights: ["400", "600", "700", "800", "900"], subsets: ["latin", "latin-ext"]}).fontFamily;

export const GG = {
	background: "#07080C",
	panel: "#12141A",
	panelBorder: "rgba(255,255,255,0.10)",
	white: "#F3F5F7",
	grey: "#8B93A3",
	/** Azul do Google — acento principal da peça. */
	blue: "#4285F4",
	red: "#EA4335",
	yellow: "#FBBC05",
	green: "#34A853",
	accent: "#4285F4",
} as const;

/** Valor de mercado exibido nas cenas 1 e 8 — ver relatório final para a fonte. */
export const MARKET_CAP_GG = "3.000.000.000.000";
