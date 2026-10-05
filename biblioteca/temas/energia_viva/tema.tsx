import {loadFont} from "@remotion/google-fonts/Archivo";
import {loadFont as loadSans} from "@remotion/google-fonts/Inter";
import type {Tema} from "../types";

const display = loadFont("normal", {weights: ["700", "800", "900"]});
const sans = loadSans("normal", {weights: ["400", "600", "700"]});

/** High-energy: deep blue room, electric cyan accent, heavy black display type. */
export const tema: Tema = {
	id: "energia_viva",
	fundo: "#0A1631",
	cores: {
		texto: "#FFFFFF",
		subtitulo: "#AFC3E8",
		accent: "#2EE6C8",
		accentTexto: "#062A24",
		botao: "#2EE6C8",
		botaoTexto: "#062A24",
		sombra: "rgba(0,0,0,0.6)",
	},
	fontes: {
		display: `${display.fontFamily}, "Archivo", sans-serif`,
		sans: `${sans.fontFamily}, "Inter", system-ui, sans-serif`,
	},
};
