// Sistemas de composição: conteúdo + marca + direção (escolhas do Jev) → slide do spec v2 (camadas com id).
// Posição só por zonas do grid (col/linha); a pilha de texto encolhe o título para caber na zona. Nada de coordenada solta.
// conteudo: {apoio, titulo (com **ênfase**), corpo, cta, nota (manuscrito), selo, pontos:[...], numero,
//            telas:[{arquivo, alvos:{nome:[fx,fy]}}], dados:{valor, variacao, serie:[...]}}
// cores:    {fundo, fundo2, texto, suave, destaque, destaque2, marca, cartao}  (vêm do Brand Kit, claro ou escuro)
// direcao:  {par, shot_modo, flutuante, anotacao, fundo:"liso"|"degrade", lado:"direita"|"esquerda", semente}
import {grade} from "./grid.mjs";

export const SISTEMAS = {
  SAAS_EDITORIAL: "Big left-aligned headline, short subtitle, product screenshot dominant and bleeding off one edge, one floating card on its corner, a small handwritten note with an arrow. Lots of negative space.",
  PRODUCT_EXPLAINER: "Headline on top, a zoomed crop of the screenshot on the exact feature, a circle on it and a callout line explaining it, short text below.",
  EDITORIAL_CLEAN: "Magazine-like: large headline, short text, one small visual card in a corner, huge negative space, a highlighter on the key words.",
  FEATURE_SHOWCASE: "Headline, a wide screenshot in the centre and two or three small feature cards overlapping its bottom edge.",
  PROMOTIONAL: "Poster: very large headline, the benefit, the product tilted, a strong call-to-action button and an offer tag.",
  TIPOGRAFICO: "Typography-led: a huge headline fills most of the space with a highlighted word; the screenshot is only a small secondary tilted card.",
  CARDS_FLUTUANTES: "Screenshot reduced in the centre surrounded by floating cards (metric, notification, growth) that overlap its corners. Rich, layered, tech.",
  DESTAQUE_NUMERO: "One big number or short fact in the accent colour as the hero, a headline that explains it, short text. For a highlight slide.",
  ENCERRAMENTO: "Closing slide: centred logo, short headline and a clear call-to-action button.",
};
export const SISTEMAS_CAPA = ["SAAS_EDITORIAL", "TIPOGRAFICO", "CARDS_FLUTUANTES", "PROMOTIONAL", "EDITORIAL_CLEAN"];

const fundo = (cores, d) => ({id: "fundo", tipo: "fundo", ...(d.fundo === "degrade" ? {gradiente: {cores: [cores.fundo, cores.fundo2 || cores.fundo], angulo: 115}} : {cor: cores.fundo})});
// logo no canto: largura do painel (logo_px), altura pela proporção, nunca mais alta que a 1ª linha do grid
function logo(C, G) {
  if (!C.logo) return [];
  const h = Math.min(C.logo_h || G.u * 6, G.linha(1).h), w = C.logo_h ? (C.logo_w || G.u * 24) * h / C.logo_h : G.u * 24;
  return [{id: "logo", tipo: "imagem", arquivo: C.logo, ajuste: "contain", x: G.m.esq, y: G.linha(1).y, w, h, nivel: 4, ...(C.logo_halo && {halo: C.logo_halo})}];
}
const tela0 = (C) => C.telas?.[0];
const alvo0 = (t) => t && Object.keys(t.alvos || {})[0];
const temCorpo = (C) => C.corpo ? [{id: "corpo_01", tipo: "texto", papel: "corpo", texto: C.corpo, antes: "l"}] : [];

// Bloco de texto padrão: apoio (sobretítulo) + título + corpo, numa pilha dentro da zona.
function textos(C, cores, zona, {corpoCols, alinhamento = "esquerda", semCorpo = false} = {}) {
  const itens = [];
  if (C.apoio) itens.push({id: "apoio_01", tipo: "texto", papel: "apoio", texto: C.apoio, cor: cores.destaque});
  itens.push({id: "titulo_01", tipo: "texto", papel: "titulo", texto: C.titulo, cor: cores.texto, cor_enfase: cores.destaque, cor_marca: cores.marca, antes: "s"});
  if (!semCorpo) itens.push(...temCorpo(C).map((t) => ({...t, cor: cores.suave, cor_enfase: cores.texto, ...(corpoCols && {col: corpoCols})})));
  return {id: "texto_principal", tipo: "pilha", ...zona, alinhamento, itens: itens.map((i) => ({...i, alinhamento}))};
}
// Anotação que a direção pediu sobre a ênfase do título (marcador por padrão).
function enfase(C, cores, d) {
  if (!/\*\*|==/.test(C.titulo || "") || d.anotacao === "nenhuma") return [];
  const forma = ["marcador", "sublinhado", "circulo"].includes(d.anotacao) ? d.anotacao : "marcador";
  return [{id: "enfase_01", tipo: "anotacao", forma, alvo: "titulo_01#enfase", cor: forma === "marcador" ? cores.marca : cores.destaque, ...(forma === "sublinhado" && {variante: "onda"})}];
}
function flutuante(d, C, cores, alvo, canto, sobra = .3, id = "flut_01", forma = d.flutuante) {
  if (!forma || forma === "nenhum") return [];
  const base = {id, tipo: "flutuante", forma, cor: cores.destaque, fundo: cores.cartao, ancora: {alvo, canto, sobra}};
  // nunca número, notificação ou recurso inventado: sem dado real do texto, o cartão não aparece (regra do Enzo: "nunca inventar número")
  if ((forma === "metrica" && !C.dados?.valor) || (forma === "crescimento" && !C.dados?.crescimento) || (forma === "notificacao" && !C.notificacao?.titulo)) return [];
  if (forma === "metrica") return [{...base, w: 300, ...(C.dados?.valor && {valor: C.dados.valor, titulo: C.dados.rotulo}), ...(C.dados?.variacao && {variacao: C.dados.variacao}), ...(C.dados?.serie && {dados: C.dados.serie})}];
  if (forma === "notificacao") return [{...base, w: 470, titulo: C.notificacao?.titulo || "Cliente avisado", texto: C.notificacao?.texto || "Aviso automático enviado.", icone: C.notificacao?.icone || "bell"}];
  if (forma === "crescimento") return [{...base, valor: C.dados?.crescimento || "+38%", titulo: C.dados?.rotulo_crescimento || "no mês"}];
  if (forma === "linha" || forma === "barras") return [{...base, w: 320, titulo: C.dados?.rotulo, ...(C.dados?.serie && {dados: C.dados.serie})}];
  return [{...base, w: 300}];
}

const zonaShot = (G, ini) => ({linha: [ini, 13 - ini], centralizar_y: true});
const largo = (G, w) => w * (G.stories ? 1.22 : 1);  // stories: a tela cresce para ocupar a altura

const S = {
  SAAS_EDITORIAL(C, G, cores, d) {
    const t = tela0(C), dir = d.lado !== "esquerda", w = largo(G, G.W - G.col(4).x + G.u * 15), x = dir ? G.W + G.u * 15 - w : -G.u * 15;
    return [fundo(cores, d), ...logo(C, G), textos(C, cores, {col: [1, 10], linha: [2, 6]}, {corpoCols: [1, 7]}), ...enfase(C, cores, d),
      ...(t ? [{id: "shot_01", tipo: "screenshot", modo: d.shot_modo || "floating", arquivo: t.arquivo, alvos: t.alvos, x, ...zonaShot(G, 8), w}] : []),
      ...(t ? flutuante(d, C, cores, "shot_01", dir ? "sup-esq" : "sup-dir", .3) : []),
      ...(C.nota && t ? [{id: "nota_01", tipo: "texto", papel: "manuscrito", texto: C.nota, cor: cores.destaque, x: dir ? G.m.esq : G.col(9).x, y: G.linha(11).y, largura: G.col(1, 3).w, rotacao: -4},
        {id: "seta_01", tipo: "anotacao", forma: "seta-curva", de: "nota_01", para: alvo0(t) ? `shot_01.${alvo0(t)}` : "shot_01", cor: cores.destaque}] : [])];
  },
  PRODUCT_EXPLAINER(C, G, cores, d) {
    const t = tela0(C), a = alvo0(t), p = a ? t.alvos[a] : [.5, .3];
    const rec = [Math.min(Math.max(p[0] - .3, 0), .45), Math.min(Math.max(p[1] - .25, 0), .45), .55, .55];
    return [fundo(cores, d), ...logo(C, G), textos(C, cores, {col: [1, 11], linha: [2, 4]}, {semCorpo: true}),
      ...(t ? [{id: "shot_01", tipo: "screenshot", modo: "cropped", arquivo: t.arquivo, alvos: t.alvos, recorte: rec, col: [1, 8], y: G.linha(6).y, w: G.col(1, 8).w}] : []),
      ...(t && a ? [{id: "circ_01", tipo: "anotacao", forma: "circulo", alvo: `shot_01.${a}`, cor: cores.destaque},
        {id: "chamada_01", tipo: "anotacao", forma: "linha-chamada", alvo: `shot_01.${a}`, lado: "direita", distancia: 4, fora: "shot_01", texto: C.nota || C.pontos?.[0] || "", cor: cores.destaque}] : []),
      ...(C.corpo ? [{id: "corpo_01", tipo: "texto", papel: "corpo", texto: C.corpo, col: [1, 10], linha: [11, 2], cor: cores.suave, cor_enfase: cores.texto}] : [])];
  },
  EDITORIAL_CLEAN(C, G, cores, d) {
    const t = tela0(C);
    return [fundo(cores, {...d, fundo: "liso"}), ...logo(C, G), {...textos(C, cores, {col: [1, 10], linha: t ? [3, 6] : [2, 11]}, {corpoCols: [1, 7]}), alinhar: t ? "topo" : "centro"}, ...enfase(C, cores, {...d, anotacao: d.anotacao || "marcador"}),
      ...(t ? [{id: "shot_01", tipo: "screenshot", modo: "card", arquivo: t.arquivo, alvos: t.alvos, x: G.col(7).x, y: G.linha(10).y, w: G.col(7, 6).w + G.m.dir * .5, elevacao: 1, fundo_cartao: cores.cartao}] : [])];
  },
  FEATURE_SHOWCASE(C, G, cores, d) {
    const t = tela0(C), pts = (C.pontos || []).slice(0, 3), n = pts.length, span = n ? 12 / n : 12;
    return [fundo(cores, d), ...logo(C, G), textos(C, cores, {col: [1, 11], linha: [2, 3]}, {semCorpo: true}),
      ...(t ? [{id: "shot_01", tipo: "screenshot", modo: d.shot_modo === "perspective" ? "perspective" : "normal", arquivo: t.arquivo, alvos: t.alvos, x: G.col(2).x, linha: [5, 5], centralizar_y: true, w: G.col(2, 10).w}] : []),
      ...(t && C.selo ? [{id: "badge_01", tipo: "flutuante", forma: "badge", texto: C.selo, cor: cores.destaque, fundo: cores.cartao, ancora: {alvo: "shot_01", canto: "sup-esq", sobra: .5}}] : []),
      ...pts.map((p, i) => ({id: `card_0${i + 1}`, tipo: "flutuante", forma: "info", titulo: p, texto: "", cor: cores.destaque, fundo: cores.cartao,
        x: G.col(1 + i * span).x + (i ? G.gut / 2 : 0), y: G.linha(10).y, w: G.col(1, span).w - (n > 1 ? G.gut / 2 : 0)}))];
  },
  PROMOTIONAL(C, G, cores, d) {
    const t = tela0(C);
    return [fundo(cores, {...d, fundo: d.fundo || "degrade"}), ...logo(C, G), {...textos(C, cores, {col: [1, 12], linha: t ? [2, 5] : [2, 9]}, {corpoCols: [1, 9]}), alinhar: t ? "topo" : "centro"},
      ...(t ? [{id: "shot_01", tipo: "screenshot", modo: "tilted-right", arquivo: t.arquivo, alvos: t.alvos, x: G.col(5).x, ...zonaShot(G, 7), w: largo(G, G.col(5, 8).w + G.m.dir)}] : []),
      ...(C.cta ? [{id: "cta_01", tipo: "flutuante", forma: "botao", texto: C.cta, cor: cores.destaque, x: G.m.esq, y: G.linha(10).y}] : []),
      ...(C.selo ? [{id: "selo_01", tipo: "anotacao", forma: "etiqueta", alvo: t ? "shot_01" : "titulo_01", lado: "acima", distancia: 2, texto: C.selo, cor: cores.destaque2 || cores.destaque, cor_texto: cores.fundo}] : [])];
  },
  TIPOGRAFICO(C, G, cores, d) {
    const t = tela0(C);
    return [fundo(cores, d), ...logo(C, G),
      {...textos({...C}, cores, {col: [1, 12], linha: t ? [2, 7] : [2, 11]}, {corpoCols: [1, 7]}), alinhar: t ? "topo" : "base", titulo_max: true}, ...enfase(C, cores, {...d, anotacao: d.anotacao || "marcador"}),
      ...(t ? [{id: "shot_01", tipo: "screenshot", modo: "tilted-left", arquivo: t.arquivo, alvos: t.alvos, x: G.col(7).x, ...zonaShot(G, 9), w: largo(G, G.col(7, 6).w + G.m.dir + G.u * 6), nivel: 4}] : []),
      ...(C.nota && t ? [{id: "nota_01", tipo: "texto", papel: "manuscrito", texto: C.nota, cor: cores.destaque, x: G.m.esq, y: G.linha(10).y, largura: G.col(1, 5).w, rotacao: -3},
        {id: "seta_01", tipo: "anotacao", forma: "seta-curva", de: "nota_01", para: "shot_01", cor: cores.destaque}] : [])];
  },
  CARDS_FLUTUANTES(C, G, cores, d) {
    const t = tela0(C);
    return [fundo(cores, {...d, fundo: d.fundo || "degrade"}), ...logo(C, G), textos(C, cores, {col: [1, 11], linha: [2, 4]}, {corpoCols: [1, 8]}),
      ...(t ? [{id: "shot_01", tipo: "screenshot", modo: "normal", arquivo: t.arquivo, alvos: t.alvos, x: G.stories ? G.col(2).x : G.col(3).x, ...zonaShot(G, 6), w: G.stories ? G.col(2, 10).w : G.col(3, 8).w, elevacao: 2},
        ...flutuante(d, C, cores, "shot_01", "sup-esq", .4, "flut_01", "metrica"),
        ...flutuante(d, C, cores, "shot_01", "inf-dir", .35, "flut_02", "notificacao"),
        ...flutuante(d, C, cores, "shot_01", "inf-esq", .45, "flut_03", "crescimento")] : [])];
  },
  DESTAQUE_NUMERO(C, G, cores, d) {
    return [fundo(cores, d), ...logo(C, G),
      {id: "texto_principal", tipo: "pilha", col: [1, 11], linha: [2, 10], alinhar: "centro", itens: [
        {id: "numero_01", tipo: "texto", papel: "titulo", texto: C.numero || "", cor: cores.destaque, tamanho: G.tipo.titulo[2] * 1.6, max_linhas: 1},
        {id: "titulo_01", tipo: "texto", papel: "titulo", texto: C.titulo, cor: cores.texto, cor_enfase: cores.destaque, tamanho: G.tipo.titulo[0] * .7, antes: "m"},
        ...temCorpo(C).map((x) => ({...x, cor: cores.suave, cor_enfase: cores.texto, col: [1, 8]}))]}];
  },
  ENCERRAMENTO(C, G, cores, d) {
    return [fundo(cores, {...d, fundo: d.fundo || "degrade"}),
      {id: "texto_principal", tipo: "pilha", col: [2, 10], linha: [3, 8], alinhar: "centro", itens: [
        ...(C.logo ? [{id: "logo", tipo: "imagem", arquivo: C.logo, ajuste: "contain", w: G.u * 40, h: G.u * 12, alinhar_x: "centro", ...(C.logo_halo && {halo: C.logo_halo})}] : []),
        {id: "titulo_01", tipo: "texto", papel: "titulo", texto: C.titulo, cor: cores.texto, cor_enfase: cores.destaque, alinhamento: "centro", antes: "l", tamanho: G.tipo.titulo[0] * .8},
        ...temCorpo(C).map((x) => ({...x, cor: cores.suave, alinhamento: "centro"}))]},
      ...(C.cta ? [{id: "cta_01", tipo: "flutuante", forma: "botao", texto: C.cta, cor: cores.destaque, centro_x: true, y: G.linha(10).y}] : [])];
  },
};

export function compor(sistema, conteudo, cores, direcao, dims) {
  const f = S[sistema];
  if (!f) throw new Error(`sistema de composição "${sistema}" não existe (${Object.keys(S).join(", ")})`);
  const G = grade(dims), camadas = f(conteudo, G, cores, direcao);
  // foto real no lugar da tela do sistema: sem moldura de navegador
  for (const c of camadas) if (c.tipo === "screenshot" && conteudo.telas?.find((t) => t.arquivo === c.arquivo)?.foto) c.moldura = "nenhuma";
  // ênfase com marcador: o marcador já destaca, a palavra volta à cor do texto (azul sobre azul some)
  if (camadas.some((c) => c.forma === "marcador" && String(c.alvo).startsWith("titulo_01#")))
    for (const c of camadas.flatMap((c) => c.itens || [c])) if (c.id === "titulo_01") c.cor_enfase = cores.texto;
  return {sistema, par: direcao.par || "saas_moderno", semente: direcao.semente, cores, camadas};
}
