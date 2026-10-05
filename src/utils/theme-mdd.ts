import {loadFont as loadDisplay} from "@remotion/google-fonts/BebasNeue";
import {loadFont as loadSans} from "@remotion/google-fonts/Inter";

/**
 * "MaquinaDinheiro" — promo do pipeline de agentes. Canvas quase preto,
 * UM acento: dourado. Bebas Neue para impacto, Inter para o resto.
 */
export const DISPLAY_MDD = loadDisplay("normal", {weights: ["400"]}).fontFamily;
export const SANS_MDD = loadSans("normal", {weights: ["400", "600", "700", "800"], subsets: ["latin", "latin-ext"]}).fontFamily;

export const MDD = {
	background: "#070709",
	/** Cartão/painel. */
	panel: "#121218",
	panelBorder: "rgba(255,255,255,0.08)",
	white: "#F5F3EE",
	grey: "#98948B",
	/** Dourado — o único acento da peça. */
	accent: "#FFC531",
	accentDim: "rgba(255,197,49,0.35)",
} as const;
