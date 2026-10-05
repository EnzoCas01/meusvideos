export type Tema = {
	id: string;
	/** Base background colour of the whole piece. */
	fundo: string;
	/** Named colours: texto, subtitulo, accent, accentTexto, botao, botaoTexto, sombra. */
	cores: Record<string, string>;
	/** Loaded font families (display = titles, sans = body/captions). */
	fontes: {display: string; sans: string};
};
