// Mini gráficos e elementos flutuantes: cartões vetoriais com sombra, para compor junto da screenshot.
// Camada: {tipo:"flutuante", forma, x, y, w, h?, ancora:{alvo, canto:"sup-dir"|"sup-esq"|"inf-dir"|"inf-esq", sobra:0-1},
//   dados:[números] (REAIS: usados exatamente; sem dados = decorativo, marcado no layout), rotulos, titulo, valor, variacao,
//   texto, icone (Tabler), cor (destaque), fundo, cor_texto, raio, elevacao, rotacao}
// Formas: linha | barras | donut | progresso | sparkline | metrica | notificacao | badge | botao | crescimento | info | dashboard
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {marcacao, estilos, ajusta, svgTexto} from "../texto.mjs";
import {filtroSombra} from "./screenshot.mjs";
import {resolve} from "./anotacoes.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const n2 = (v) => Math.round(v * 100) / 100;
function rng(semente) { let s = [...String(semente)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7) || 7;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647); }
// série decorativa: sobe com ruído (cara de "crescimento"), sem fingir ser dado real
const serie = (r, n, sobe = true) => Array.from({length: n}, (_, i) => 30 + (sobe ? i / (n - 1) * 55 : 25) + (r() - .5) * 22);

function texto(t, ctx, {papel = "corpo", tam, cor, largura, x, y, alinhamento = "esquerda", par = "saas_moderno", max = 3}) {
  const segs = estilos(marcacao(String(t)), par, papel, {tamanho: tam, cor, cor_enfase: cor});
  const comp = ajusta(segs, {largura, entrelinha: segs[0]?.entrelinha || 1.2, alinhamento}, {maxLinhas: max});
  return {svg: svgTexto(comp, x, y), h: comp.altura, w: comp.largura};
}
function icone(nome, x, y, tam, cor) {
  const f = path.join(ROOT, "node_modules/@tabler/icons/icons/outline", `${nome}.svg`);
  if (!nome || !fs.existsSync(f)) return "";
  const corpo = fs.readFileSync(f, "utf8").replace(/^[\s\S]*?<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "").replace(/<path stroke="none" d="M0 0h24v24H0z" fill="none"\/>/, "");
  return `<g transform="translate(${n2(x)} ${n2(y)}) scale(${n2(tam / 24)})" fill="none" stroke="${cor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${corpo}</g>`;
}
const caminho = (pts) => pts.map((p, i) => `${i ? "L" : "M"}${n2(p[0])} ${n2(p[1])}`).join("");
// linha suave (Catmull-Rom → Bézier)
function suave(p) {
  let d = `M${n2(p[0][0])} ${n2(p[0][1])}`;
  for (let i = 0; i < p.length - 1; i++) { const a = p[i - 1] || p[i], b = p[i], c = p[i + 1], e = p[i + 2] || c;
    d += `C${n2(b[0] + (c[0] - a[0]) / 6)} ${n2(b[1] + (c[1] - a[1]) / 6)} ${n2(c[0] - (e[0] - b[0]) / 6)} ${n2(c[1] - (e[1] - b[1]) / 6)} ${n2(c[0])} ${n2(c[1])}`; }
  return d;
}
const fmt = (v) => typeof v === "number" ? v.toLocaleString("pt-BR") : String(v ?? "");

// Cada forma desenha dentro de (0,0)-(w,h) do cartão e devolve {svg, h}. u = unidade do grid (8 px em 1080).
const FORMAS = {
  linha: (c, k) => {
    const {w, u, r} = k, h = c.h || w * .55, pad = u * 2.5, top = c.titulo ? u * 6 : pad;
    const d = c.dados?.length ? c.dados : serie(r, 8), mn = Math.min(...d), mx = Math.max(...d), gh = h - top - pad;
    const pts = d.map((v, i) => [pad + i / (d.length - 1) * (w - 2 * pad), top + gh - (v - mn) / (mx - mn || 1) * gh]);
    k.defs.push(`<linearGradient id="${c.id}_a" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.cor}" stop-opacity=".28"/><stop offset="1" stop-color="${c.cor}" stop-opacity="0"/></linearGradient>`);
    const ult = pts[pts.length - 1], grade = [0, .5, 1].map((t) => `<line x1="${pad}" x2="${n2(w - pad)}" y1="${n2(top + gh * t)}" y2="${n2(top + gh * t)}" stroke="${c.cor_texto}" stroke-opacity=".08"/>`).join("");
    return {h, svg: (c.titulo ? texto(c.titulo, k.ctx, {papel: "apoio", tam: u * 2.2, cor: c.cor_suave, largura: w - 2 * pad, x: pad, y: pad}).svg : "") + grade
      + `<path d="${suave(pts)}L${n2(ult[0])} ${n2(top + gh)}L${n2(pts[0][0])} ${n2(top + gh)}Z" fill="url(#${c.id}_a)"/><path d="${suave(pts)}" fill="none" stroke="${c.cor}" stroke-width="${n2(u * .55)}" stroke-linecap="round"/>`
      + `<circle cx="${n2(ult[0])}" cy="${n2(ult[1])}" r="${n2(u * 1.1)}" fill="${c.fundo}" stroke="${c.cor}" stroke-width="${n2(u * .5)}"/>`};
  },
  barras: (c, k) => {
    const {w, u, r} = k, h = c.h || w * .62, pad = u * 2.5, top = c.titulo ? u * 6 : pad, base = h - pad - (c.rotulos ? u * 3 : 0);
    const d = c.dados?.length ? c.dados : serie(r, 6), mx = Math.max(...d), n = d.length, bw = (w - 2 * pad) / n * .58, passo = (w - 2 * pad) / n;
    const destaque = c.destaque ?? n - 1;
    let svg = c.titulo ? texto(c.titulo, k.ctx, {papel: "apoio", tam: u * 2.2, cor: c.cor_suave, largura: w - 2 * pad, x: pad, y: pad}).svg : "";
    d.forEach((v, i) => { const bh = (base - top) * v / mx, x = pad + i * passo + (passo - bw) / 2;
      svg += `<rect x="${n2(x)}" y="${n2(base - bh)}" width="${n2(bw)}" height="${n2(bh)}" rx="${n2(Math.min(bw / 2, u))}" fill="${i === destaque ? c.cor : c.cor_trilho}"/>`;
      if (c.rotulos?.[i]) svg += texto(c.rotulos[i], k.ctx, {papel: "apoio", tam: u * 1.6, cor: c.cor_suave, largura: passo, x: pad + i * passo, y: base + u, alinhamento: "centro"}).svg; });
    return {h, svg};
  },
  donut: (c, k) => {
    const {w, u} = k, h = c.h || w, R = Math.min(w, h) * .36, esp = R * .28, cx = w / 2, cy = h / 2, circ = 2 * Math.PI * R;
    const pct = c.dados?.[0] ?? 72, val = c.valor ?? `${fmt(pct)}%`;
    const t = texto(`**${val}**`, k.ctx, {papel: "corpo", tam: R * .5, cor: c.cor_texto, largura: R * 1.6, x: cx - R * .8, y: 0, alinhamento: "centro", max: 1});
    return {h, svg: `<circle cx="${n2(cx)}" cy="${n2(cy)}" r="${n2(R)}" fill="none" stroke="${c.cor_trilho}" stroke-width="${n2(esp)}"/>`
      + `<circle cx="${n2(cx)}" cy="${n2(cy)}" r="${n2(R)}" fill="none" stroke="${c.cor}" stroke-width="${n2(esp)}" stroke-linecap="round" stroke-dasharray="${n2(circ * pct / 100)} ${n2(circ)}" transform="rotate(-90 ${n2(cx)} ${n2(cy)})"/>`
      + `<g transform="translate(0 ${n2(cy - t.h / 2)})">${t.svg}</g>` + (c.titulo ? texto(c.titulo, k.ctx, {papel: "apoio", tam: u * 1.8, cor: c.cor_suave, largura: w, x: 0, y: cy + R + esp / 2 + u, alinhamento: "centro"}).svg : "")};
  },
  progresso: (c, k) => {
    const {w, u} = k, pad = u * 2.5, pct = c.dados?.[0] ?? 68, lab = texto(c.titulo || "Progresso", k.ctx, {papel: "corpo", tam: u * 2.3, cor: c.cor_texto, largura: w * .7, x: pad, y: pad, max: 1});
    const pv = texto(`**${fmt(pct)}%**`, k.ctx, {papel: "corpo", tam: u * 2.3, cor: c.cor, largura: w * .25, x: w - pad - w * .25, y: pad, alinhamento: "direita", max: 1});
    const by = pad + lab.h + u * 1.6, bh = u * 1.4, h = by + bh + pad;
    return {h, svg: lab.svg + pv.svg + `<rect x="${pad}" y="${n2(by)}" width="${n2(w - 2 * pad)}" height="${n2(bh)}" rx="${n2(bh / 2)}" fill="${c.cor_trilho}"/><rect x="${pad}" y="${n2(by)}" width="${n2((w - 2 * pad) * pct / 100)}" height="${n2(bh)}" rx="${n2(bh / 2)}" fill="${c.cor}"/>`};
  },
  sparkline: (c, k) => {
    const {w, u, r} = k, h = c.h || w * .32, d = c.dados?.length ? c.dados : serie(r, 10), mn = Math.min(...d), mx = Math.max(...d), p = u;
    const pts = d.map((v, i) => [p + i / (d.length - 1) * (w - 2 * p), h - p - (v - mn) / (mx - mn || 1) * (h - 2 * p)]);
    return {h, svg: `<path d="${suave(pts)}" fill="none" stroke="${c.cor}" stroke-width="${n2(u * .5)}" stroke-linecap="round"/>`};
  },
  metrica: (c, k) => {
    const {w, u} = k, pad = u * 2.6, lab = texto(c.titulo || "Faturado no mês", k.ctx, {papel: "apoio", tam: u * 1.9, cor: c.cor_suave, largura: w - 2 * pad, x: pad, y: pad, max: 1});
    const v = texto(`**${c.valor ?? "R$ 12.480"}**`, k.ctx, {papel: "corpo", tam: u * 4.6, cor: c.cor_texto, largura: w - 2 * pad, x: pad, y: pad + lab.h + u * 1.4, max: 1});
    let y = pad + lab.h + u * 1.4 + v.h + u * 1.2, svg = lab.svg + v.svg;
    if (c.variacao) { const neg = /^-|^−/.test(String(c.variacao)), cor = neg ? "#E5484D" : "#12A150";
      const t = texto(`**${neg ? "▼" : "▲"} ${String(c.variacao).replace(/^[+-]/, "")}**`, k.ctx, {papel: "corpo", tam: u * 1.9, cor, largura: w, x: pad + u * 1.2, y: y + u * .7, max: 1});
      svg += `<rect x="${pad}" y="${n2(y)}" width="${n2(t.w + u * 2.4)}" height="${n2(t.h + u * 1.2)}" rx="${n2((t.h + u * 1.2) / 2)}" fill="${cor}" opacity=".12"/>` + t.svg; y += t.h + u * 1.2; }
    if (c.sparkline !== false) { const s = FORMAS.sparkline({...c, h: u * 6}, {...k, w: w - 2 * pad}); svg += `<g transform="translate(${pad} ${n2(y + u)})">${s.svg}</g>`; y += u * 7; }
    return {h: y + pad, svg};
  },
  notificacao: (c, k) => {
    const {w, u} = k, pad = u * 2.2, ic = u * 5.2, tx = pad + ic + u * 1.8;
    const t1 = texto(`**${c.titulo || "Aparelho pronto"}**`, k.ctx, {papel: "corpo", tam: u * 2.2, cor: c.cor_texto, largura: w - tx - pad - u * 6, x: tx, y: pad, max: 1});
    const t2 = texto(c.texto || "O cliente já foi avisado.", k.ctx, {papel: "corpo", tam: u * 2, cor: c.cor_suave, largura: w - tx - pad, x: tx, y: pad + t1.h + u, max: 2});
    const hora = texto(c.hora || "agora", k.ctx, {papel: "corpo", tam: u * 1.6, cor: c.cor_suave, largura: u * 7, x: w - pad - u * 7, y: pad, alinhamento: "direita", max: 1});
    const h = Math.max(ic, t1.h + u + t2.h) + 2 * pad;
    return {h, svg: `<rect x="${pad}" y="${n2((h - ic) / 2)}" width="${n2(ic)}" height="${n2(ic)}" rx="${n2(ic * .28)}" fill="${c.cor}"/>${icone(c.icone || "bell", pad + ic * .2, (h - ic) / 2 + ic * .2, ic * .6, "#FFFFFF")}` + t1.svg + t2.svg + hora.svg};
  },
  badge: (c, k) => {
    const {u} = k, t = texto(c.texto || "Novo", k.ctx, {papel: "apoio", tam: u * 1.9, cor: c.cor_texto, largura: u * 60, x: u * 4.2, y: u * 1.3, max: 1});
    const w = t.w + u * 6.2, h = t.h + u * 2.6;
    return {w, h, svg: `<circle cx="${n2(u * 2.4)}" cy="${n2(h / 2)}" r="${n2(u * .8)}" fill="${c.cor}"/>` + t.svg, pilula: true};
  },
  botao: (c, k) => {
    const {u} = k, t = texto(`**${c.texto || "Teste grátis"}**${c.seta === false ? "" : "  →"}`, k.ctx, {papel: "corpo", cor: c.cor_texto, largura: u * 80, x: u * 5, y: u * 2.8, max: 1, tam: u * 3.4});
    return {w: t.w + u * 10, h: t.h + u * 5.6, svg: t.svg, pilula: true};
  },
  crescimento: (c, k) => {
    const {u} = k, cor = c.cor || "#12A150", v = texto(`**${c.valor || "+38%"}**`, k.ctx, {papel: "corpo", tam: u * 3.6, cor: c.cor_texto, largura: u * 30, x: u * 7.4, y: u * 2.4, max: 1});
    const s = c.titulo ? texto(c.titulo, k.ctx, {papel: "apoio", tam: u * 1.6, cor: c.cor_suave, largura: u * 30, x: u * 7.4, y: u * 2.4 + v.h + u, max: 1}) : {h: 0, w: 0, svg: ""};
    const h = Math.max(u * 5, v.h + (s.h ? s.h + u : 0)) + u * 4.8, w = Math.max(v.w, s.w) + u * 10;
    return {w, h, svg: `<circle cx="${n2(u * 4)}" cy="${n2(h / 2)}" r="${n2(u * 2.4)}" fill="${cor}" opacity=".15"/>${icone("trending-up", u * 2.4, h / 2 - u * 1.6, u * 3.2, cor)}` + v.svg + s.svg};
  },
  info: (c, k) => {
    const {w, u} = k, pad = u * 2.6, t1 = texto(`**${c.titulo || ""}**`, k.ctx, {papel: "corpo", tam: u * 2.4, cor: c.cor_texto, largura: w - 2 * pad, x: pad, y: pad, max: 2});
    const t2 = texto(c.texto || "", k.ctx, {papel: "corpo", tam: u * 2, cor: c.cor_suave, largura: w - 2 * pad, x: pad, y: pad + t1.h + u * 1.2, max: 4});
    return {h: pad * 2 + t1.h + u * 1.2 + t2.h, svg: `<rect x="0" y="${n2(pad)}" width="${n2(u * .6)}" height="${n2(t1.h)}" fill="${c.cor}"/>` + t1.svg + t2.svg};
  },
  dashboard: (c, k) => {
    const {w, u} = k, pad = u * 2, col = (w - 3 * pad) / 2;
    const m1 = FORMAS.metrica({...c, sparkline: false, valor: c.valor ?? "18", titulo: c.titulo ?? "OS em aberto", variacao: null}, {...k, w: col});
    const b = FORMAS.barras({...c, titulo: null, h: m1.h}, {...k, w: col});
    const l = FORMAS.linha({...c, titulo: null, h: w * .3}, {...k, w: w - 2 * pad});
    const trilho = (x, y, ww, hh) => `<rect x="${n2(x)}" y="${n2(y)}" width="${n2(ww)}" height="${n2(hh)}" rx="${n2(u * 1.2)}" fill="${c.cor_trilho}" opacity=".45"/>`;
    return {h: pad * 3 + m1.h + l.h, svg: trilho(pad, pad, col, m1.h) + `<g transform="translate(${pad} ${pad})">${m1.svg}</g>` + trilho(pad * 2 + col, pad, col, m1.h)
      + `<g transform="translate(${n2(pad * 2 + col)} ${pad})">${b.svg}</g>` + trilho(pad, pad * 2 + m1.h, w - 2 * pad, l.h) + `<g transform="translate(${pad} ${n2(pad * 2 + m1.h)})">${l.svg}</g>`};
  },
};
export const FORMAS_FLUTUANTE = Object.keys(FORMAS);

// Âncora: o cartão sobrepõe o canto de outro objeto, com "sobra" (fração do cartão) para fora — o jeito editorial de flutuar.
function ancorar(c, w, h, layout) {
  const b = resolve(c.ancora.alvo, layout), s = c.ancora.sobra ?? .35, cn = c.ancora.canto || "sup-dir";
  const x = cn.endsWith("dir") ? b.x + b.w - w * (1 - s) : b.x - w * s, y = cn.startsWith("sup") ? b.y - h * s : b.y + b.h - h * (1 - s);
  return [x, y];
}

export function flutuante(c0, ctx, layout) {
  const claro = !c0.fundo || /^#(f|e|d)/i.test(c0.fundo);
  const c = {cor: "#2F6BFF", fundo: "#FFFFFF", cor_texto: claro ? "#101828" : "#FFFFFF", cor_suave: claro ? "#667085" : "#C9D1E3", cor_trilho: claro ? "#E8ECF4" : "#2A3550", raio: ctx.G.u * 2, elevacao: 2, ...(c0.forma === "botao" && {cor_texto: "#FFFFFF"}), ...c0};
  const f = FORMAS[c.forma];
  if (!f) throw new Error(`flutuante: forma "${c.forma}" não existe (${FORMAS_FLUTUANTE.join(", ")})`);
  const u = ctx.G.u, w0 = c.w || u * 34, k = {w: w0, u, r: rng(`${c.id}|${ctx.semente ?? ""}`), defs: ctx.defs, ctx};
  const out = f(c, k), w = out.w || w0, h = out.h;
  let [x, y] = c.ancora ? ancorar(c, w, h, layout) : [c.centro_x ? (ctx.W - w) / 2 : c.x, c.y];
  x = Math.min(Math.max(x, ctx.G.m.esq * .4), ctx.W - ctx.G.m.dir * .4 - w);  // flutua, mas não sai da arte
  // nunca cobre texto de nível 1-2 (título, corpo): desce até liberar
  for (const o of Object.values(layout)) {
    if (o.tipo !== "texto" || o.nivel > 2) continue;
    for (const [tx, ty, tw, th] of o.linhas_caixas || [o.caixa])
      if (x < tx + tw && x + w > tx && y < ty + th + u && y + h > ty) y = ty + th + u * 2.5;
  }
  ctx.defs.push(filtroSombra(`${c.id}_s`, c.elevacao));
  const rx = out.pilula ? h / 2 : c.raio, rot = c.rotacao ? ` rotate(${c.rotacao} ${n2(w / 2)} ${n2(h / 2)})` : "";
  const svg = `<g transform="translate(${n2(x)} ${n2(y)})${rot}"><rect width="${n2(w)}" height="${n2(h)}" rx="${n2(rx)}" fill="${c.fundo}"${c.elevacao ? ` filter="url(#${c.id}_s)"` : ""}/>${c.forma === "botao" ? `<rect width="${n2(w)}" height="${n2(h)}" rx="${n2(rx)}" fill="${c.cor}"/>` : ""}${out.svg}</g>`;
  return {svg, caixa: [n2(x), n2(y), n2(w), n2(h)], info: {decorativo: !c.dados?.length && !c.valor && ["linha", "barras", "sparkline", "dashboard", "metrica", "donut", "progresso", "crescimento"].includes(c.forma)}};
}
