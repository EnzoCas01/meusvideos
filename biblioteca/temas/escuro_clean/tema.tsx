import {loadFont} from "@remotion/google-fonts/Inter";
import {loadFont as loadDisplay} from "@remotion/google-fonts/Archivo";
import type {Tema} from "../types";

const sans = loadFont("normal", {weights: ["400", "500", "600", "700", "800", "900"]});
const display = loadDisplay("normal", {weights: ["700", "800", "900"]});

/** Dark, clean, versatile: the safe default for informational and everyday posts. */
export const tema: Tema = {
	id: "escuro_clean",
	fundo: "#0E1116",
	cores: {
		texto: "#F4F6F8",
		subtitulo: "#A9B4C0",
		accent: "#FFD23F",
		accentTexto: "#15181C",
		botao: "#FFD23F",
		botaoTexto: "#15181C",
		sombra: "rgba(0,0,0,0.55)",
	},
	fontes: {
		display: `${display.fontFamily}, "Archivo", sans-serif`,
		sans: `${sans.fontFamily}, "Inter", system-ui, sans-serif`,
	},
};
