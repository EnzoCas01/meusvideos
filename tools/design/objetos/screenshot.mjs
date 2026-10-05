// PRODUCT_SCREENSHOT: a tela do sistema como objeto de design (não como foto).
// Camada: {tipo:"screenshot", arquivo, x, y, w, modo, recorte:[fx,fy,fw,fh] (frações), raio, borda:{cor,espessura},
//   moldura:"navegador"|"nenhuma", elevacao:0-3, rotacao, perspectiva:{lado:"direita"|"esquerda", forca}, tratamento,
//   opacidade, extras:[arquivo...] (stacked), fundo_cartao (card), alvos:{nome:[fx,fy]} → pontos na arte (para setas)}
// Modos: normal | floating | tilted-left | tilted-right | stacked | perspective | cropped | full-width | card
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {execFileSync} from "node:child_process";
import {Resvg} from "@resvg/resvg-js";

const n2 = (v) => Math.round(v * 100) / 100;
const MIME = {".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp"};
export const dataUri = (arq) => `data:${MIME[path.extname(arq).toLowerCase()] || "image/png"};base64,${fs.readFileSync(arq).toString("base64")}`;
const dims = new Map();
export function tamanho(arq) {
  if (!dims.has(arq)) dims.set(arq, execFileSync("identify", ["-format", "%w %h", `${arq}[0]`]).toString().split(" ").map(Number));
  return dims.get(arq);
}

// Predefinições de cada modo (o spec pode sobrescrever qualquer campo).
const MODOS = {
  normal: {raio: 14, elevacao: 1, moldura: "navegador"},
  floating: {raio: 18, elevacao: 3, moldura: "navegador"},
  "tilted-left": {raio: 18, elevacao: 3, rotacao: -6, moldura: "navegador"},
  "tilted-right": {raio: 18, elevacao: 3, rotacao: 6, moldura: "navegador"},
  stacked: {raio: 16, elevacao: 2, moldura: "navegador"},
  perspective: {raio: 16, elevacao: 3, moldura: "navegador", perspectiva: {lado: "direita", forca: .16}},
  cropped: {raio: 20, elevacao: 2, moldura: "nenhuma", recorte: [0, 0, .62, .62]},
  "full-width": {raio: 0, elevacao: 0, moldura: "nenhuma"},
  card: {raio: 22, elevacao: 2, moldura: "nenhuma", fundo_cartao: "#FFFFFF"},
};

// Sombra por elevação: duas sombras somadas (contato + ambiente), como em interface real.
export function filtroSombra(id, nivel, cor = "#0B1220") {
  if (!nivel) return "";
  const [d1, b1, o1, d2, b2, o2] = [[2, 3, .10, 8, 16, .10], [4, 6, .12, 18, 32, .16], [6, 10, .14, 30, 54, .22]][Math.min(nivel, 3) - 1];
  return `<filter id="${id}" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="${d1}" stdDeviation="${b1}" flood-color="${cor}" flood-opacity="${o1}"/><feDropShadow dx="0" dy="${d2}" stdDeviation="${b2}" flood-color="${cor}" flood-opacity="${o2}"/></filter>`;
}

// Tratamento de cor da tela: pb | escurecer | duotone (sombra→cor1, luz→cor2) | suave (menos saturação, para tela de fundo)
function filtroCor(id, t, cores = ["#0F1B3D", "#FFFFFF"]) {
  const hex = (c) => c.replace("#", "").match(/../g).map((x) => parseInt(x, 16) / 255);
  if (t === "pb") return `<filter id="${id}"><feColorMatrix type="saturate" values="0"/></filter>`;
  if (t === "suave") return `<filter id="${id}"><feColorMatrix type="saturate" values=".55"/></filter>`;
  if (t === "escurecer") return `<filter id="${id}"><feComponentTransfer><feFuncR type="linear" slope=".72"/><feFuncG type="linear" slope=".72"/><feFuncB type="linear" slope=".72"/></feComponentTransfer></filter>`;
  if (t === "duotone") { const [a, b] = cores.map(hex);
    return `<filter id="${id}"><feColorMatrix type="saturate" values="0"/><feComponentTransfer>${["R", "G", "B"].map((k, i) => `<feFunc${k} type="table" tableValues="${n2(a[i])} ${n2(b[i])}"/>`).join("")}</feComponentTransfer></filter>`; }
  return "";
}

// O cartão em coordenadas locais (0,0)-(w,h): moldura de navegador opcional + tela recortada + borda.
function cartao(c, arq, w, idp) {
  const [iw, ih] = tamanho(arq), [fx, fy, fw, fh] = c.recorte || [0, 0, 1, 1];
  const cw = iw * fw, ch = ih * fh, barra = c.moldura === "navegador" ? Math.round(w * .045) : 0;
  const pad = c.fundo_cartao ? Math.round(w * .035) : 0, tw = w - 2 * pad, th = tw * ch / cw, h = th + barra + 2 * pad, r = c.raio ?? 14;
  const defs = [`<clipPath id="${idp}_c"><rect width="${w}" height="${h}" rx="${r}"/></clipPath>`, filtroCor(`${idp}_t`, c.tratamento, c.cores_tratamento)];
  const tela = `<svg x="${pad}" y="${barra + pad}" width="${n2(tw)}" height="${n2(th)}" viewBox="${n2(iw * fx)} ${n2(ih * fy)} ${n2(cw)} ${n2(ch)}" preserveAspectRatio="none"><image href="${dataUri(arq)}" width="${iw}" height="${ih}"${c.tratamento ? ` filter="url(#${idp}_t)"` : ""}/></svg>`;
  const nav = barra ? `<rect width="${w}" height="${barra}" fill="${c.cor_moldura || "#E9ECF2"}"/>${[0, 1, 2].map((i) => `<circle cx="${n2(barra * (.55 + i * .42))}" cy="${n2(barra / 2)}" r="${n2(barra * .13)}" fill="${["#FF5F57", "#FEBC2E", "#28C840"][i]}"/>`).join("")}<rect x="${n2(w * .3)}" y="${n2(barra * .25)}" width="${n2(w * .4)}" height="${n2(barra * .5)}" rx="${n2(barra * .25)}" fill="#FFFFFF"/>` : "";
  const fundo = c.fundo_cartao ? `<rect width="${w}" height="${h}" fill="${c.fundo_cartao}"/>` : "";
  const borda = c.borda ? `<rect x="${c.borda.espessura / 2}" y="${c.borda.espessura / 2}" width="${w - c.borda.espessura}" height="${h - c.borda.espessura}" rx="${r}" fill="none" stroke="${c.borda.cor}" stroke-width="${c.borda.espessura}"/>`
    : `<rect x=".75" y=".75" width="${w - 1.5}" height="${h - 1.5}" rx="${r}" fill="none" stroke="#0B1220" stroke-opacity=".08" stroke-width="1.5"/>`;
  // ponto da imagem original (frações) → coordenada local no cartão
  const local = ([px, py]) => [pad + (px - fx) / fw * tw, barra + pad + (py - fy) / fh * th];
  return {defs: defs.join(""), corpo: `<g clip-path="url(#${idp}_c)">${fundo}${nav}${tela}</g>${borda}`, h, local};
}

// Perspectiva real: o cartão vira PNG (resvg) e o ImageMagick distorce os 4 cantos; a sombra vem depois, no SVG.
function emPerspectiva(svgLocal, w, h, p) {
  const f = p.forca ?? .16, dir = p.lado !== "esquerda";
  const q = dir ? [[0, 0], [w * (1 - f * .55), h * f / 2], [w * (1 - f * .55), h * (1 - f / 2)], [0, h]]
    : [[w * f * .55, h * f / 2], [w, 0], [w, h], [w * f * .55, h * (1 - f / 2)]];
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "ds-")), a = path.join(tmp, "a.png"), b = path.join(tmp, "b.png");
  fs.writeFileSync(a, new Resvg(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${n2(h)}" viewBox="0 0 ${w} ${n2(h)}">${svgLocal}</svg>`, {fitTo: {mode: "zoom", value: 1.5}}).render().asPng());
  const s = 1.5, src = [[0, 0], [w, 0], [w, h], [0, h]];
  execFileSync("convert", [a, "-background", "none", "-virtual-pixel", "transparent", "-distort", "Perspective",
    src.map((pt, i) => `${n2(pt[0] * s)},${n2(pt[1] * s)} ${n2(q[i][0] * s)},${n2(q[i][1] * s)}`).join(" "), b]);
  const uri = dataUri(b);
  fs.rmSync(tmp, {recursive: true, force: true});
  // mapeia ponto local pela interpolação bilinear dos cantos (boa aproximação para a seta mirar)
  const mapa = ([x, y]) => { const u = x / w, v = y / h, l = (a1, b1, t) => [a1[0] + (b1[0] - a1[0]) * t, a1[1] + (b1[1] - a1[1]) * t];
    const top = l(q[0], q[1], u), bot = l(q[3], q[2], u); return l(top, bot, v); };
  return {svg: `<image href="${uri}" width="${w}" height="${n2(h)}"/>`, mapa};
}

const gira = ([x, y], [cx, cy], g) => { const a = g * Math.PI / 180; return [cx + (x - cx) * Math.cos(a) - (y - cy) * Math.sin(a), cy + (x - cx) * Math.sin(a) + (y - cy) * Math.cos(a)]; };

export function screenshot(c0, ctx) {
  const c = {...MODOS[c0.modo || "normal"], ...c0}, W = ctx.w;
  if (c.modo === "full-width") { c.x = 0; c.w = W; }
  const id = c.id, k = cartao(c, c.arquivo, c.w, id), h = k.h;
  ctx.defs.push(k.defs, filtroSombra(`${id}_s`, c.elevacao));
  let corpo = k.corpo, mapa = (p) => p;
  if (c.perspectiva && c.modo === "perspective") ({svg: corpo, mapa} = emPerspectiva(`<defs>${k.defs}</defs>${k.corpo}`, c.w, h, c.perspectiva));
  // stacked: telas extras atrás, deslocadas e giradas, um pouco apagadas
  let atras = "";
  (c.extras || []).slice(0, 2).forEach((arq, i) => {
    const e = cartao({...c, recorte: null}, arq, c.w * (.92 - i * .06), `${id}_e${i}`), dx = c.w * (.07 + i * .06), dy = -h * (.09 + i * .07);
    ctx.defs.push(e.defs);
    atras = `<g transform="translate(${n2(dx)} ${n2(dy)}) rotate(${4 + i * 3})" opacity="${.85 - i * .2}" filter="url(#${id}_s)">${e.corpo}</g>` + atras;
  });
  const cx = c.w / 2, cy = h / 2, rot = c.rotacao || 0;
  const svg = `<g transform="translate(${n2(c.x)} ${n2(c.y)})${rot ? ` rotate(${rot} ${n2(cx)} ${n2(cy)})` : ""}"${c.opacidade != null ? ` opacity="${c.opacidade}"` : ""}>${atras}<g${c.elevacao ? ` filter="url(#${id}_s)"` : ""}>${corpo}</g></g>`;
  // caixa e alvos já no espaço da arte (com rotação e perspectiva)
  const naArte = (p) => { const [x, y] = gira(mapa(p), [cx, cy], rot); return [n2(c.x + x), n2(c.y + y)]; };
  const cantos = [[0, 0], [c.w, 0], [c.w, h], [0, h]].map(naArte), xs = cantos.map((p) => p[0]), ys = cantos.map((p) => p[1]);
  const alvos = Object.fromEntries(Object.entries(c.alvos || {}).map(([nome, p]) => [nome, naArte(k.local(p))]));
  return {svg, caixa: [Math.min(...xs), Math.min(...ys), Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)], info: {alvos, altura: n2(h)}};
}

// Altura do cartão sem desenhar (a pilha do grid precisa antes de posicionar).
export function alturaShot(c0) {
  const c = {...MODOS[c0.modo || "normal"], ...c0}, [iw, ih] = tamanho(c.arquivo), [, , fw, fh] = c.recorte || [0, 0, 1, 1];
  const barra = c.moldura === "navegador" ? Math.round(c.w * .045) : 0, pad = c.fundo_cartao ? Math.round(c.w * .035) : 0;
  return (c.w - 2 * pad) * ih * fh / (iw * fw) + barra + 2 * pad;
}
