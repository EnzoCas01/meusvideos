import {loadFont} from "@remotion/google-fonts/Archivo";
import {loadFont as loadDisplay} from "@remotion/google-fonts/Limelight";
import type {Tema} from "../types";

const sans = loadFont("normal", {weights: ["400", "500", "600", "700"]});
const display = loadDisplay("normal", {weights: ["400"]});

/** Gold on near-black: premium, luxury, celebration. */
export const tema: Tema = {
	id: "luxo_dourado",
	fundo: "#0B0907",
	cores: {
		texto: "#F5EFE3",
		subtitulo: "#C8BCA5",
		accent: "#D9A24B",
		accentTexto: "#1A1208",
		botao: "#D9A24B",
		botaoTexto: "#1A1208",
		sombra: "rgba(0,0,0,0.6)",
	},
	fontes: {
		display: `${display.fontFamily}, "Limelight", serif`,
		sans: `${sans.fontFamily}, "Archivo", sans-serif`,
	},
};
