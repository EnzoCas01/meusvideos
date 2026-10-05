import {loadFont} from "@remotion/google-fonts/Inter";
import {loadFont as loadDisplay} from "@remotion/google-fonts/Archivo";
import type {Tema} from "../types";

const sans = loadFont("normal", {weights: ["400", "500", "600", "700", "800"]});
const display = loadDisplay("normal", {weights: ["600", "700", "800"]});

/** Light editorial: off-white paper, ink text, calm accent. Reads like a magazine page. */
export const tema: Tema = {
	id: "editorial_claro",
	fundo: "#F4F1EA",
	cores: {
		texto: "#1B1F24",
		subtitulo: "#5A616B",
		accent: "#B4432C",
		accentTexto: "#FFF6F2",
		botao: "#1B1F24",
		botaoTexto: "#F4F1EA",
		sombra: "rgba(30,30,30,0.25)",
	},
	fontes: {
		display: `${display.fontFamily}, "Archivo", sans-serif`,
		sans: `${sans.fontFamily}, "Inter", system-ui, sans-serif`,
	},
};
