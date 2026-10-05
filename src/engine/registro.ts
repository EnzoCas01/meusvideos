import type {FC} from "react";
import type {ComponenteProps} from "../../biblioteca/componentes/types";
import {PostLayout1} from "../../biblioteca/componentes/post_layout_1/PostLayout1";
import {PostLayout2} from "../../biblioteca/componentes/post_layout_2/PostLayout2";
import {PostDesign} from "../../biblioteca/componentes/post_design/PostDesign";
import {Icone} from "../../biblioteca/componentes/icone/Icone";
import {SlideCarrossel} from "../../biblioteca/componentes/slide_carrossel/SlideCarrossel";
import {TextoTitulo} from "../../biblioteca/componentes/texto_titulo/TextoTitulo";
import {TextoCta} from "../../biblioteca/componentes/texto_cta/TextoCta";
import {LogoMarca} from "../../biblioteca/componentes/logo_marca/LogoMarca";
import {CaptionRapido} from "../../biblioteca/componentes/caption_rapido/CaptionRapido";
import {CaptionKaraoke} from "../../biblioteca/componentes/caption_karaoke/CaptionKaraoke";
import {CaptionSimples} from "../../biblioteca/componentes/caption_simples/CaptionSimples";
import {TransicaoFade} from "../../biblioteca/componentes/transicao_fade/TransicaoFade";
import {MidiaFotoKenburns} from "../../biblioteca/componentes/midia_foto_kenburns/MidiaFotoKenburns";
import {MidiaClipe} from "../../biblioteca/componentes/midia_clipe/MidiaClipe";

/**
 * The library registry: id → component. To add a component to the library,
 * create its folder under biblioteca/componentes/ (meta.json + TSX), add one
 * line here and run `node tools/catalog.mjs`.
 */
export const COMPONENTES: Record<string, FC<ComponenteProps>> = {
	post_layout_1: PostLayout1,
	post_layout_2: PostLayout2,
	post_design: PostDesign,
	icone: Icone,
	slide_carrossel: SlideCarrossel,
	texto_titulo: TextoTitulo,
	texto_cta: TextoCta,
	logo_marca: LogoMarca,
	caption_rapido: CaptionRapido,
	caption_karaoke: CaptionKaraoke,
	caption_simples: CaptionSimples,
	transicao_fade: TransicaoFade,
	midia_foto_kenburns: MidiaFotoKenburns,
	midia_clipe: MidiaClipe,
};
