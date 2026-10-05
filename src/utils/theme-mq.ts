import {loadFont as loadDisplay} from "@remotion/google-fonts/BebasNeue";
import {loadFont as loadSans} from "@remotion/google-fonts/Inter";

/**
 * "MaquinaIA" — promo tech. Canvas quase preto, UM acento: verde-dinheiro.
 * Bebas Neue para as palavras de impacto, Inter para todo o resto.
 */
export const DISPLAY_MQ = loadDisplay("normal", {weights: ["400"]}).fontFamily;
export const SANS_MQ = loadSans("normal", {weights: ["400", "600", "700", "800"], subsets: ["latin", "latin-ext"]}).fontFamily;

export const MQ = {
	/** Near-black com fundo azul-frio de tela tech. */
	background: "#0B0D12",
	/** Painel de cartão. */
	panel: "#12151D",
	panelBorder: "rgba(255,255,255,0.09)",
	white: "#F2F5F7",
	grey: "#8A93A3",
	/** Verde-dinheiro — o único acento da peça. */
	accent: "#3DFF8A",
	/** Mesmo verde, escurecido para bordas/glow discreto. */
	accentDim: "rgba(61,255,138,0.35)",
} as const;
