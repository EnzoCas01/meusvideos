#!/usr/bin/env node
// Motor editorial: spec v2 (camadas com id) -> SVG -> PNG pelo resvg (sem Chromium). O motor clássico
// (tools/render-post-fast.mjs) continua intacto; este só roda quando o painel escolhe "editorial".
// Uso: node tools/design/render.mjs <spec.json> <pasta>   → <pasta>/slide-NN.png + slide-NN.layout.json (caixa de cada id)
import fs from "node:fs";
import path from "node:path";
import {Resvg} from "@resvg/resvg-js";
import {marcacao, estilos, ajusta, svgTexto, caixasEnfase, caixasLinhas} from "./texto.mjs";
import {grade, NIVEIS, confereHierarquia, respiro} from "./grid.mjs";
import {screenshot, alturaShot, dataUri} from "./objetos/screenshot.mjs";
import {anotacao} from "./objetos/anotacoes.mjs";
import {flutuante} from "./objetos/graficos.mjs";

const n2 = (v) => Math.round(v * 100) / 100;

// Fundo: cor lisa, degradê linear (angulo em graus) ou radial — nativos no resvg.
function fundo(c, w, h, defs) {
  if (c.gradiente) {
    const g = c.gradiente, id = `g_${c.id}`, stops = g.cores.map((cor, i) => `<stop offset="${i / (g.cores.length - 1)}" stop-color="${cor}"/>`).join("");
    if (g.tipo === "radial") defs.push(`<radialGradient id="${id}" cx="${g.cx ?? .5}" cy="${g.cy ?? .5}" r="${g.r ?? .75}">${stops}</radialGradient>`);
    else { const a = (g.angulo ?? 135) * Math.PI / 180, dx = Math.cos(a) / 2, dy = Math.sin(a) / 2;
      defs.push(`<linearGradient id="${id}" x1="${n2(.5 - dx)}" y1="${n2(.5 - dy)}" x2="${n2(.5 + dx)}" y2="${n2(.5 + dy)}">${stops}</linearGradient>`); }
    return `<rect width="${w}" height="${h}" fill="url(#${id})"/>`;
  }
  return `<rect width="${w}" height="${h}" fill="${c.cor || "#FFFFFF"}"/>`;
}

// Cada tipo de camada devolve {svg, caixa}; a caixa vai para o layout.json (o crítico e as setas miram por id).
const TIPOS = {
  fundo: (c, ctx) => ({svg: fundo(c, ctx.w, ctx.h, ctx.defs), caixa: [0, 0, ctx.w, ctx.h]}),
  forma: (c) => {
    const op = c.opacidade != null ? ` opacity="${c.opacidade}"` : "";
    const svg = c.forma === "circulo" ? `<circle cx="${c.x + c.w / 2}" cy="${c.y + c.h / 2}" r="${c.w / 2}" fill="${c.cor}"${op}/>`
      : `<rect x="${c.x}" y="${c.y}" width="${c.w}" height="${c.h}" rx="${c.rx || 0}" fill="${c.cor || "none"}"${c.borda ? ` stroke="${c.borda}" stroke-width="${c.espessura || 2}"` : ""}${op}/>`;
    return {svg, caixa: [c.x, c.y, c.w, c.h]};
  },
  texto: (c, ctx) => {
    const comp = c._comp || mede(c, ctx);
    if (!comp.cabe) ctx.avisos.push(`${c.id}: texto não coube nem encolhido`);
    const caixa = [c.x, c.y, comp.largura, comp.altura], meio = [c.x + c.largura / 2, c.y + comp.altura / 2];
    const rot = c.rotacao ? ` transform="rotate(${c.rotacao} ${n2(meio[0])} ${n2(meio[1])})"` : "";
    return {svg: `<g${rot}>${svgTexto(comp, c.x, c.y)}</g>`, caixa, info: {linhas: comp.linhas.length, escala: comp.escala, tamanho: n2(comp.tamanho), enfases: caixasEnfase(comp, c.x, c.y), ...(!c.rotacao && {linhas_caixas: caixasLinhas(comp, c.x, c.y)})}};
  },
  screenshot: (c, ctx) => screenshot(c, ctx),
  imagem: (c) => {  // halo: cor do brilho em volta (logo que some no fundo)
    const ajuste = c.ajuste === "contain" ? "xMidYMid meet" : "xMidYMid slice";
    const clip = c.rx ? `<clipPath id="cp_${c.id}"><rect x="${c.x}" y="${c.y}" width="${c.w}" height="${c.h}" rx="${c.rx}"/></clipPath>` : "";
    const halo = c.halo ? `<filter id="h_${c.id}" x="-20%" y="-40%" width="140%" height="180%">${c.halo === "#000000" ? `<feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="#000000" flood-opacity=".28"/>` : `<feDropShadow dx="0" dy="0" stdDeviation="6" flood-color="${c.halo}" flood-opacity=".75"/>`}</filter>` : "";
    return {svg: `${clip}${halo}<image href="${dataUri(c.arquivo)}" x="${c.x}" y="${c.y}" width="${c.w}" height="${c.h}" preserveAspectRatio="${ajuste}"${clip ? ` clip-path="url(#cp_${c.id})"` : ""}${halo ? ` filter="url(#h_${c.id})"` : ""}/>`, caixa: [c.x, c.y, c.w, c.h]};
  },
};

// Texto composto na largura da camada; tamanho padrão e mínimo vêm do papel no grid (título encolhe até o mínimo).
function mede(c, ctx) {
  const [pad, min] = ctx.G.tipo[c.papel || "corpo"] || ctx.G.tipo.corpo, tam = c.tamanho || pad;
  const segs = estilos(c.segmentos || marcacao(c.texto), c.par || ctx.par, c.papel || "corpo",
    {tamanho: tam, cor: c.cor, cor_enfase: c.cor_enfase, ...(c.cor_marca && {cor_marca: c.cor_marca}), ...(c.estilo || {})});
  const ent = c.entrelinha || segs[0]?.entrelinha || 1.15;
  const comp = ajusta(segs, {largura: c.largura, entrelinha: ent, alinhamento: c.alinhamento},
    {maxAltura: c.max_altura, maxLinhas: c.max_linhas ?? ctx.G.linhasMax[c.papel || "corpo"], minEscala: Math.min(1, min / tam)});
  return {...comp, tamanho: (segs[0]?.tamanho || tam) * comp.escala};
}

// Posição pelo grid: col [início, colunas] dá x e largura; linha [início, linhas] dá y e altura (área útil 12x12).
function noGrid(c, G) {
  const o = {...c};
  if (c.col) { const k = G.col(...c.col); o.x = k.x; o.largura ??= k.w; o.w ??= k.w; }
  if (c.linha) { const k = G.linha(...c.linha); o.y ??= k.y; o.h ??= k.h;
    if (c.centralizar_y && c.tipo === "screenshot") { const hs = alturaShot(o); o.y = k.y + Math.max(0, (k.h - hs) / 2); delete o.h; } }
  o.nivel ??= c.tipo === "texto" ? NIVEIS[c.papel || "corpo"] : ["imagem", "screenshot"].includes(c.tipo) ? 3 : c.tipo === "fundo" ? 0 : 5;
  return o;
}

// Pilha: itens um embaixo do outro dentro da zona, com espaço por token (antes: "s" | "m" | "l" | "xl"…), alinhada
// em cima, no centro ou embaixo. Se não cabe, o título (nível 1) encolhe primeiro.
function pilha(p, ctx) {
  const G = ctx.G, z = noGrid(p, G), itens = p.itens.map((it) => noGrid({col: p.col, ...it}, G));
  if (p.titulo_max) for (const it of itens) if (it.papel === "titulo") it.tamanho ??= G.tipo.titulo[2];  // tipográfico: começa no máximo da escala
  const alturas = () => itens.map((it) => it.tipo === "texto" ? (it._comp = mede(it, ctx)).altura : it.tipo === "screenshot" ? alturaShot(it) : it.h ?? it.w / (it.proporcao || 1));
  const gaps = itens.map((it, i) => i ? (typeof it.antes === "number" ? it.antes : G.esp[it.antes || "m"]) : 0);
  const ti = itens.find((it) => it.papel === "titulo"), co = itens.filter((it) => it.papel === "corpo");
  const soma = (hs) => hs.reduce((a, b) => a + b, 0) + gaps.reduce((a, b) => a + b, 0);
  // cabe na zona: o título (nível 1) encolhe primeiro
  const cabe = () => { if (ti) delete ti.max_altura; let hs = alturas(), total = soma(hs);
    if (total > z.h && ti) { const t = itens.indexOf(ti); ti.max_altura = hs[t] - (total - z.h); hs = alturas(); total = soma(hs); }
    return [hs, total]; };
  let [hs, total] = cabe();
  // depois a hierarquia: título < 1,8x corpo → o título ganha a largura toda; ainda fraco → corpo no mínimo
  const fraco = () => ti && co.length && ti._comp.tamanho < 1.8 * Math.max(...co.map((c) => c._comp.tamanho));
  if (fraco() && ti.largura < G.larg) { ti.largura = G.larg; ti.w = G.larg; ti.x = G.m.esq; [hs, total] = cabe(); }
  if (fraco()) { for (const c of co) c.tamanho = G.tipo.corpo[1]; [hs, total] = cabe(); }
  if (total > z.h + 1) ctx.avisos.push(`${p.id}: pilha passa da zona em ${Math.round(total - z.h)}px`);
  let y = z.y + (p.alinhar === "base" ? z.h - total : p.alinhar === "centro" ? (z.h - total) / 2 : 0);
  return itens.map((it, i) => { y += gaps[i]; const o = {...it, y, ...(it.tipo !== "texto" && {h: hs[i]})}; y += hs[i];
    if (it.alinhar_x === "centro" && it.w && z.w) o.x = z.x + (z.w - it.w) / 2;
    return o; });
}

function svgGrade(G) {
  let s = "";
  for (let c = 1; c <= 12; c++) { const k = G.col(c); s += `<rect x="${k.x}" y="0" width="${k.w}" height="${G.H}" fill="#ff0040" opacity=".07"/>`; }
  for (let l = 1; l <= 12; l++) { const k = G.linha(l); s += `<rect x="0" y="${k.y}" width="${G.W}" height="${k.h}" fill="#0080ff" opacity=".05"/>`; }
  return s + `<rect x="${G.m.esq}" y="${G.m.topo}" width="${G.larg}" height="${G.alt}" fill="none" stroke="#ff0040" stroke-width="2" stroke-dasharray="8 6"/>`;
}

export function renderSlide(slide, spec) {
  const [w, h] = spec.dims, G = grade(spec.dims), ctx = {w, h, W: w, H: h, G, defs: [], avisos: [], par: slide.par || spec.par, semente: slide.semente ?? spec.semente};
  const planas = (slide.camadas || []).flatMap((c) => c.tipo === "pilha" ? pilha(c, ctx) : [noGrid(c, G)]);
  const camadas = planas.map((c, i) => ({...c, z: c.z ?? i}));
  // 1ª passada: objetos (as caixas ficam no layout); 2ª: anotações, que miram nessas caixas
  const pecas = [], layout = {};
  const registra = (c, r) => { pecas.push({z: c.z, svg: `<g id="${c.id}">${r.svg}</g>`});
    layout[c.id] = {tipo: c.tipo, nivel: c.nivel, ...(c.papel && {papel: c.papel}), ...(c.forma && {forma: c.forma}), caixa: r.caixa.map(n2), ...(r.info || {})}; };
  for (const c of camadas.filter((c) => !["anotacao", "flutuante"].includes(c.tipo))) {
    const f = TIPOS[c.tipo];
    if (!f) { ctx.avisos.push(`${c.id}: tipo ${c.tipo} desconhecido`); continue; }
    registra(c, f(c, ctx));
  }
  // flutuantes depois dos objetos (podem se ancorar neles) e antes das anotações (que podem mirar neles)
  for (const c of camadas.filter((c) => c.tipo === "flutuante")) {
    try { registra({...c, nivel: c.nivel ?? 4}, flutuante(c, ctx, layout)); } catch (e) { ctx.avisos.push(`${c.id}: ${e.message}`); }
  }
  for (const c of camadas.filter((c) => c.tipo === "anotacao")) {
    try {
      const r = anotacao(c, ctx, layout), alvo = String(c.alvo || "").split(/[.#@]/)[0];
      // marcador fica logo atrás do texto que destaca
      registra({...c, nivel: c.nivel ?? 4, z: r.atras && layout[alvo] ? (camadas.find((x) => x.id === alvo)?.z ?? c.z) - .5 : c.z}, r);
    } catch (e) { ctx.avisos.push(`${c.id}: ${e.message}`); }
  }
  const corpo = pecas.sort((a, b) => a.z - b.z).map((p) => p.svg);
  if (process.env.DESIGN_GRADE) corpo.push(svgGrade(G));
  ctx.avisos.push(...confereHierarquia(Object.values(layout).filter((o) => o.tipo === "texto")));
  const resp = respiro(layout, G);
  ctx.avisos.push(...resp.avisos);
  layout._meta = {ocupacao: resp.ocupacao, grade: {u: n2(G.u), margens: Object.fromEntries(Object.entries(G.m).map(([k, v]) => [k, n2(v)]))}};
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs>${ctx.defs.join("")}</defs>${corpo.join("")}</svg>`;
  const png = new Resvg(svg, {fitTo: {mode: "original"}, font: {loadSystemFonts: false}}).render().asPng();
  return {svg, png, layout, avisos: ctx.avisos};
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [specArq, saida] = process.argv.slice(2);
  if (!specArq || !saida) throw new Error("uso: node tools/design/render.mjs <spec.json> <pasta>");
  const spec = JSON.parse(fs.readFileSync(specArq, "utf8"));
  fs.mkdirSync(saida, {recursive: true});
  const files = [], avisos = [];
  for (const [i, slide] of spec.slides.entries()) {
    const base = `slide-${String(i + 1).padStart(2, "0")}`, r = renderSlide(slide, spec);
    fs.writeFileSync(path.join(saida, `${base}.png`), r.png);
    fs.writeFileSync(path.join(saida, `${base}.layout.json`), JSON.stringify(r.layout, null, 1));
    if (process.env.DESIGN_SVG) fs.writeFileSync(path.join(saida, `${base}.svg`), r.svg);
    files.push(`${base}.png`); avisos.push(...r.avisos);
  }
  console.log(JSON.stringify({ok: true, files, avisos}));
}
