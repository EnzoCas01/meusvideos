#!/usr/bin/env node
// Render estático de post/carrossel: spec JSON -> SVG -> PNG via ImageMagick.
// Não inicia Remotion nem Chromium.
import fs from "node:fs";
import path from "node:path";
import {execFileSync} from "node:child_process";
import {fileURLToPath} from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SAFE_SIDE = 0.12; // texto, selos, logo e CTA ficam dentro da area util
const CONTENT_WIDTH = 1 - SAFE_SIDE * 2;

const [specFile, outputArg] = process.argv.slice(2);
if (!specFile) throw new Error("uso: node tools/render-post-fast.mjs <spec.json> [pasta]");
const spec = JSON.parse(fs.readFileSync(path.resolve(specFile), "utf8"));
const output = path.resolve(outputArg || `out/${String(spec.peca).toLowerCase()}`);
fs.mkdirSync(output, {recursive: true});

const themes = {
  escuro_clean: {bg: "#0E1116", text: "#F4F6F8", sub: "#A9B4C0", accent: "#FFD23F", button: "#FFD23F", buttonText: "#15181C"},
  luxo_dourado: {bg: "#0B0907", text: "#F5EFE3", sub: "#C8BCA5", accent: "#D9A24B", button: "#D9A24B", buttonText: "#1A1208"},
  energia_viva: {bg: "#0A1631", text: "#FFFFFF", sub: "#AFC3E8", accent: "#2EE6C8", button: "#2EE6C8", buttonText: "#062A24"},
  editorial_claro: {bg: "#F4F1EA", text: "#1B1F24", sub: "#5A616B", accent: "#B4432C", button: "#1B1F24", buttonText: "#F4F1EA"},
  azul_amarelo: {bg: "#071B3B", text: "#FFFFFF", sub: "#C9D8F2", accent: "#FFD52A", button: "#FFD52A", buttonText: "#071B3B"},
  vermelho_impacto: {bg: "#250709", text: "#FFFFFF", sub: "#F5C7C9", accent: "#FF3B3F", button: "#FF3B3F", buttonText: "#FFFFFF"},
  preto_branco: {bg: "#050505", text: "#FFFFFF", sub: "#C8C8C8", accent: "#FFFFFF", button: "#FFFFFF", buttonText: "#050505"},
  verde_negocio: {bg: "#06251B", text: "#F5FFF9", sub: "#B8D8CB", accent: "#43E3A1", button: "#43E3A1", buttonText: "#06251B"},
  roxo_premium: {bg: "#180B31", text: "#FFFFFF", sub: "#D5C5EF", accent: "#A978FF", button: "#A978FF", buttonText: "#180B31"},
  laranja_energia: {bg: "#291208", text: "#FFF8F2", sub: "#E7C8B5", accent: "#FF7A1A", button: "#FF7A1A", buttonText: "#291208"},
};
const hex = (c) => c.replace("#", "").match(/../g).map((x) => parseInt(x, 16));
const mix = (a, b, t) => "#" + hex(a).map((v, i) => Math.round(v + (hex(b)[i] - v) * t).toString(16).padStart(2, "0")).join("");
const lum = (c) => { const [r, g, b] = hex(c); return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255; };
// fundo_estilo: gradiente | dividido | invertido (claro<->escuro) | solido. Cada versão do post usa um, então as 3 saem diferentes.
function paleta(t, estilo) {
  if (estilo === "invertido") {
    if (lum(t.bg) < 0.5) {
      const claroAcc = lum(t.accent) > 0.55; // amarelo em fundo claro não se lê: vira a cor escura do tema
      return {bg: mix(t.bg, "#FFFFFF", 0.95), text: t.bg, sub: mix(t.bg, "#FFFFFF", 0.35), accent: claroAcc ? t.bg : t.accent,
        button: t.bg, buttonText: claroAcc ? t.accent : "#FFFFFF", deco: t.bg, panel: mix(t.accent, "#FFFFFF", 0.72), panel2: mix(t.accent, "#FFFFFF", 0.55)};
    }
    return {bg: t.text, text: t.bg, sub: mix(t.bg, t.text, 0.35), accent: t.accent, button: t.accent, buttonText: "#FFFFFF",
      deco: t.accent, panel: mix(t.text, "#FFFFFF", 0.10), panel2: mix(t.text, "#FFFFFF", 0.18)};
  }
  const claro = lum(t.bg) >= 0.5;
  return {...t, deco: t.accent, panel: mix(t.bg, claro ? "#000000" : "#FFFFFF", 0.08), panel2: mix(t.bg, claro ? "#000000" : "#FFFFFF", 0.15)};
}
// Fundos sorteados por versão (fundo_estilo + fundo_var 0..1 muda ângulo/posição): sem padrão fixo entre criações.
const FUNDOS_RASTER = new Set(["gradiente", "brilho"]);  // degradês: o renderizador SVG interno não faz, vão pelo ImageMagick
function fundo(estilo, c, w, h, v = 0.5) {
  const rect = `<rect width="${w}" height="${h}" fill="${c.bg}"/>`;
  if (FUNDOS_RASTER.has(estilo)) return "";
  if (estilo === "dividido" || estilo === "dividido_baixo") { const a = h * (.90 + v * .05), b = h * (.97 - v * .06);
    return `${rect}<path d="M0 ${a}L${w} ${b}V${h}H0z" fill="${c.panel2}"/><path d="M0 ${a}L${w} ${b}" stroke="${c.accent}" stroke-width="6"/>`; }
  if (estilo === "dividido_topo") { const a = h * (.07 + v * .05), b = h * (.13 - v * .05);
    return `${rect}<path d="M0 0H${w}V${b}L0 ${a}z" fill="${c.panel2}"/><path d="M0 ${a}L${w} ${b}" stroke="${c.accent}" stroke-width="5"/>`; }
  if (estilo === "faixa_lateral") { const x = v < .5 ? 0 : w - 22;
    return `${rect}<rect x="${x}" width="22" height="${h}" fill="${c.accent}"/><rect x="${v < .5 ? 34 : w - 40}" width="6" height="${h}" fill="${c.accent}" opacity=".45"/>`; }
  if (estilo === "circulos") { const q = v < .5 ? 1 : -1;
    return `${rect}<circle cx="${w * (q > 0 ? .95 : .05)}" cy="${h * .06}" r="${w * .34}" fill="${c.panel}"/><circle cx="${w * (q > 0 ? .02 : .98)}" cy="${h * .97}" r="${w * .28}" fill="${c.panel}"/><circle cx="${w * (q > 0 ? .97 : .03)}" cy="${h * .99}" r="${w * .07}" fill="none" stroke="${c.accent}" stroke-width="5"/>`; }
  if (estilo === "listras") { let l = ""; const passo = 70 + Math.round(v * 40);
    for (let x = -h; x < w; x += passo) l += `<path d="M${x} ${h}L${x + h} 0" stroke="${c.panel}" stroke-width="${18 + Math.round(v * 14)}"/>`;
    return rect + l; }
  if (estilo === "pontos") { let d = ""; const passo = 54 + Math.round(v * 20);
    for (let y = passo / 2; y < h; y += passo) for (let x = passo / 2; x < w; x += passo) d += `<circle cx="${x}" cy="${y}" r="3.2" fill="${c.panel2}"/>`;
    return rect + d; }
  if (estilo === "duas_cores") { const x = w * (.55 + v * .25);
    return `${rect}<path d="M${x} 0H${w}V${h}H${x - w * .18}z" fill="${c.panel}"/>`; }
  return rect;  // solido e invertido
}
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&apos;"}[c]));
// Largura REAL do texto, medida pelo ImageMagick com a própria fonte (a estimativa por nº de letras deixava
// "MMMM" 66% maior que o previsto e a frase vazava da arte). Cache por fonte|tamanho|texto.
const FONTE = "DejaVu-Sans", FONTE_B = "DejaVu-Sans-Bold";
const medidas = new Map(), mk = (f, s, t) => `${f}|${s}|${t}`;
function mede(font, size, textos) {
  const falta = [...new Set(textos)].filter((t) => !medidas.has(mk(font, size, t)));
  if (!falta.length) return;
  const lit = (t) => t.replace(/\\/g, "\\\\").replace(/%/g, "%%").replace(/^@/, "\\@");
  const out = execFileSync("convert", ["-font", font, "-pointsize", String(size), ...falta.map((t) => `label:${lit(t)}`), "-format", "%w %h\n", "info:"]).toString().trim().split("\n");
  falta.forEach((t, i) => { const [lw, lh] = out[i].split(" ").map(Number); medidas.set(mk(font, size, t), lw); medidas.set(mk(font, size, "\0h"), lh); });
}
const alturaLinha = (font, size) => { mede(font, size, ["Ág"]); return medidas.get(mk(font, size, "\0h")); };
// Quebra por largura medida; ok = nenhuma linha passa de max (palavra sozinha maior que a área = não cabe).
function quebra(text, font, size, max) {
  const words = String(text).trim().split(/\s+/).filter(Boolean);
  if (!words.length) return {lines: [], ok: true};
  mede(font, size, [...words, "x x", "xx"]);
  const L = (t) => medidas.get(mk(font, size, t)), esp = L("x x") - L("xx");
  const lines = []; let cur = [], wcur = 0, maior = 0;
  for (const wd of words) {
    const ww = L(wd), nw = cur.length ? wcur + esp + ww : ww;
    if (cur.length && nw > max) { lines.push(cur.join(" ")); maior = Math.max(maior, wcur); cur = [wd]; wcur = ww; } else { cur.push(wd); wcur = nw; }
  }
  lines.push(cur.join(" ")); maior = Math.max(maior, wcur);
  return {lines, ok: maior <= max};
}
const wrap = (text, max) => {
  const words = String(text).trim().split(/\s+/), lines = []; let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (line && next.length > max) { lines.push(line); line = word; } else line = next;
  }
  if (line) lines.push(line);
  return lines;
};
const VISUAL_RIGHT = new Set(["interface_saas","bancada_tecnica","celular","ferramentas","estoque","financeiro","clientes","loja","calendario","produto"]);
function decoration(type, accent, w, h) {
  if (type === "interface_saas") return `<g transform="translate(${w * .56} ${h * .10}) rotate(-3)">
    <rect width="${w * .5}" height="${h * .42}" rx="28" fill="#102A55" stroke="${accent}" stroke-width="4"/>
    <rect x="25" y="25" width="${w * .11}" height="${h * .37}" rx="14" fill="#173663"/>
    <circle cx="55" cy="62" r="13" fill="${accent}"/><rect x="82" y="51" width="48" height="18" rx="8" fill="#7187A9"/>
    <rect x="${w * .15}" y="36" width="${w * .14}" height="72" rx="14" fill="#173663"/><rect x="${w * .31}" y="36" width="${w * .14}" height="72" rx="14" fill="#173663"/>
    <rect x="${w * .15}" y="132" width="${w * .3}" height="${h * .14}" rx="16" fill="#173663"/>
    <polyline points="${w*.19},${h*.25} ${w*.25},${h*.20} ${w*.31},${h*.23} ${w*.38},${h*.15} ${w*.47},${h*.11}" fill="none" stroke="${accent}" stroke-width="10" stroke-linecap="round"/>
    <rect x="${w * .15}" y="${h * .30}" width="${w * .3}" height="${h * .07}" rx="16" fill="#173663"/>
  </g>`;
  // canto inferior esquerdo, 60%, tons do fundo: o MSVG ignora opacity (folhas amarelas sólidas cobriam o texto)
  if (type === "folhagem") return `<g transform="translate(0 ${h}) scale(.6) translate(0 ${-h})" stroke="#173663" stroke-width="7"><path d="M-30 ${h-40}C170 ${h-230} 180 ${h-470} 350 ${h-620}" fill="none"/>${[[70,-150,-35],[145,-250,40],[210,-365,-40],[280,-480,38]].map(([x,y,r])=>`<ellipse cx="${x}" cy="${h+y}" rx="48" ry="105" transform="rotate(${r} ${x} ${h+y})" fill="#102A55"/>`).join("")}</g>`;
  if (type === "bancada_tecnica") return `<g transform="translate(${w*.57} ${h*.12})" fill="none" stroke="${accent}" stroke-width="7" stroke-linejoin="round"><rect x="0" y="0" width="${w*.39}" height="${h*.27}" rx="24" fill="#102A55"/><rect x="45" y="40" width="${w*.29}" height="${h*.16}" rx="12"/><path d="M${w*.145} ${h*.27}v70m-85 0h170M-30 ${h*.37}h${w*.48}"/><rect x="20" y="${h*.30}" width="105" height="175" rx="20"/><path d="M190 ${h*.31}l35 80m25-95l-18 95m80-88v90"/></g>`;
  if (type === "celular") return `<g transform="translate(${w*.7} ${h*.12}) rotate(8)" fill="#102A55" stroke="${accent}" stroke-width="8"><rect width="240" height="470" rx="42"/><rect x="78" y="22" width="84" height="14" rx="7" fill="${accent}"/><circle cx="120" cy="428" r="16" fill="none"/></g>`;
  if (type === "ferramentas") return `<g transform="translate(${w*.69} ${h*.16})" fill="none" stroke="${accent}" stroke-width="18" stroke-linecap="round"><path d="M20 0v330m-45-260h90M145 10l120 300m-145-40l170-80"/><circle cx="20" cy="355" r="32"/><path d="M260 30l65 65-155 155-65-65z"/></g>`;
  if (type === "estoque") return `<g transform="translate(${w*.62} ${h*.14})" fill="#102A55" stroke="${accent}" stroke-width="7">${[[0,0],[185,20],[40,185],[225,205]].map(([x,y])=>`<path d="M${x} ${y+45}l75-40 110 45-75 45zM${x} ${y+45}v115l110 48 75-48V${y+50}"/>`).join("")}</g>`;
  if (type === "financeiro") return `<g transform="translate(${w*.58} ${h*.12})" fill="none" stroke="${accent}" stroke-width="10"><rect width="${w*.39}" height="${h*.29}" rx="28" fill="#102A55"/><path d="M45 ${h*.23}l85-80 70 45 120-130"/><circle cx="80" cy="85" r="42"/><path d="M80 55v60m-22-45h35m-35 30h35"/></g>`;
  if (type === "clientes") return `<g transform="translate(${w*.62} ${h*.13})" fill="#102A55" stroke="${accent}" stroke-width="8"><circle cx="170" cy="90" r="65"/><circle cx="50" cy="145" r="48"/><circle cx="290" cy="145" r="48"/><path d="M55 340c15-110 75-165 115-165s100 55 115 165M-20 335c10-80 38-125 75-125m230 0c37 0 65 45 75 125"/></g>`;
  if (type === "loja") return `<g transform="translate(${w*.57} ${h*.15})" fill="#102A55" stroke="${accent}" stroke-width="8"><path d="M0 100h430L380 0H50z"/><path d="M25 100v330h380V100M65 180h140v110H65zm205 0h95v250h-95z"/><path d="M0 100c0 55 80 55 80 0 0 55 80 55 80 0 0 55 80 55 80 0 0 55 80 55 80 0 0 55 80 55 80 0"/></g>`;
  if (type === "calendario") return `<g transform="translate(${w*.63} ${h*.13})" fill="#102A55" stroke="${accent}" stroke-width="8"><rect width="350" height="380" rx="30"/><path d="M0 95h350M85 0v65m180-65v65"/>${[[65,150],[155,150],[245,150],[65,245],[155,245],[245,245]].map(([x,y],i)=>i===4?`<path d="M${x-25} ${y}l20 22 42-52"/>`:`<circle cx="${x}" cy="${y}" r="12" fill="${accent}"/>`).join("")}</g>`;
  if (type === "produto") return `<g transform="translate(${w*.58} ${h*.13})"><ellipse cx="220" cy="420" rx="220" ry="65" fill="${accent}" opacity=".28"/><path d="M80 390h280l-35 105H115z" fill="#102A55" stroke="${accent}" stroke-width="7"/><path d="M220 0L80 350h280z" fill="${accent}" opacity=".10"/></g>`;
  if (type === "bolhas") return `<g fill="none" stroke="${accent}" stroke-width="7" opacity=".35"><circle cx="${w*.9}" cy="${h*.07}" r="120"/><circle cx="${w*.97}" cy="${h*.17}" r="70"/></g>`;
  // linhas soltas: o MSVG do ImageMagick não faz <pattern> (pintava a arte inteira de preto); #173663 vira panel2 em deco()
  if (type === "grade") { let d = ""; for (let x = 70; x < w; x += 70) d += `M${x} 0V${h}`; for (let y = 70; y < h; y += 70) d += `M0 ${y}H${w}`;
    return `<path d="${d}" fill="none" stroke="#173663" stroke-width="2"/>`; }
  if (type === "moldura") return `<rect x="42" y="42" width="${w-84}" height="${h-84}" rx="24" fill="none" stroke="${accent}" stroke-opacity=".3" stroke-width="3"/>`;
  // halo em círculos já misturados ao fundo (#102A55/#173663 viram panel/panel2 em deco()): <radialGradient> saía PRETO no MSVG
  if (type === "brilho") return `<circle cx="${w*.82}" cy="${h*.14}" r="${w*.3}" fill="#102A55"/><circle cx="${w*.82}" cy="${h*.14}" r="${w*.19}" fill="#173663"/>`;
  if (type === "nenhuma") return "";
  return `<g opacity=".16" fill="none" stroke="${accent}" stroke-width="6"><circle cx="${w*.9}" cy="${h*.08}" r="${w*.2}"/><circle cx="${w*.02}" cy="${h*.97}" r="${w*.13}"/></g>`;  // arcos nos cantos, longe do texto
}

// Ícone Tabler escolhido pelo Jev para o assunto: grande, num círculo suave, na cor do tema.
function corpoIcone(nome, cheio) {
  const base = path.join(ROOT, "node_modules/@tabler/icons/icons");
  const f = [cheio && path.join(base, "filled", `${nome}.svg`), path.join(base, "outline", `${nome}.svg`)].find((x) => x && fs.existsSync(x));
  if (!f) return null;
  return {cheio: f.includes("/filled/"), corpo: fs.readFileSync(f, "utf8").replace(/^[\s\S]*?<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "").replace(/<path stroke="none" d="M0 0h24v24H0z" fill="none"\/>/, "")};
}
function iconeSvg(p, c, w, h, left) {
  const est = p.icone_estilo || "circulo_suave", ic = p.icone && corpoIcone(p.icone, est === "preenchido");
  if (!ic) return "";
  const g = geometria(p, w, h), {S, iconeCy} = g, cx = g.media ? g.media.x + g.media.w / 2 : left ? w * .78 : w / 2, cy = iconeCy;
  const desenha = (tam, cor, x0, y0, extra = "") => ic.cheio
    ? `<g transform="translate(${x0} ${y0}) scale(${tam / 24})" fill="${cor}" stroke="none"${extra}>${ic.corpo}</g>`
    : `<g transform="translate(${x0} ${y0}) scale(${tam / 24})" fill="none" stroke="${cor}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"${extra}>${ic.corpo}</g>`;
  const normal = (tam = S, cor = c.deco) => desenha(tam, cor, cx - tam / 2, cy - tam / 2);
  if (est === "preenchido") return normal(S * 1.25, c.accent);
  if (est === "selo_quadrado") { const L = S * 1.5;
    return `<rect x="${cx - L / 2}" y="${cy - L / 2}" width="${L}" height="${L}" rx="${L * .24}" fill="${c.accent}"/>${normal(S * .95, c.bg)}`; }
  if (est === "aneis") return `<circle cx="${cx}" cy="${cy}" r="${S * .8}" fill="none" stroke="${c.accent}" stroke-width="3"/><circle cx="${cx}" cy="${cy}" r="${S * 1.05}" fill="none" stroke="${c.accent}" stroke-width="2" opacity=".45"/>${normal(S * .95)}`;
  if (est === "marca_dagua" && !g.media) { const G = w * .95;
    return `${desenha(G, mix(c.bg, c.deco, .09), w * .35, h * .30)}<circle cx="${cx}" cy="${cy}" r="${S * .78}" fill="${c.panel2}"/>${normal()}`; }
  // o renderizador ignora opacidade: o halo é feito com cores já misturadas ao fundo
  if (est === "brilho") return (g.media ? [1.05, .95, .85, .75] : [1.5, 1.25, 1.02, .82]).map((k, i) => `<circle cx="${cx}" cy="${cy}" r="${S * k}" fill="${mix(c.bg, c.accent, [.06, .11, .17, .24][i])}"/>`).join("") + normal(S, c.deco);
  if (est === "mancha") { const r = S * .85;
    return `<path d="M${cx - r} ${cy} C${cx - r} ${cy - r * 1.1} ${cx + r * .4} ${cy - r * 1.25} ${cx + r * .95} ${cy - r * .35} C${cx + r * 1.4} ${cy + r * .5} ${cx + r * .3} ${cy + r * 1.2} ${cx - r * .35} ${cy + r * .95} C${cx - r * .9} ${cy + r * .75} ${cx - r} ${cy + r * .4} ${cx - r} ${cy}Z" fill="${c.panel2}"/>${normal()}`; }
  return `<circle cx="${cx}" cy="${cy}" r="${S * .78}" fill="${c.panel2}"/>${normal()}`;  // circulo_suave
}
// Enfeites (o Jev escolhe): pequenos, nunca por cima do texto
function enfeiteSvg(p, c, w, h) {
  const e = p.enfeite, g = geometria(p, w, h), cy = g.iconeCy, r = (g.D || g.S) / 2;
  const estrela = (x, y, k) => `<path d="M${x} ${y - k}L${x + k * .28} ${y - k * .28}L${x + k} ${y}L${x + k * .28} ${y + k * .28}L${x} ${y + k}L${x - k * .28} ${y + k * .28}L${x - k} ${y}L${x - k * .28} ${y - k * .28}Z" fill="${c.accent}"/>`;
  if (e === "brilhos") return estrela(w / 2 + r + 60, cy - r * .6, 26) + estrela(w / 2 - r - 70, cy + r * .4, 18) + estrela(w / 2 + r + 20, cy + r * .9, 12) + estrela(w * .88, h * .86, 16);
  if (e === "seta") { const x0 = w / 2 + r + 150, y0 = cy + r * 1.1, x1 = w / 2 + r + 30, y1 = cy - r * .1;
    return `<path d="M${x0} ${y0}C${x0 + 40} ${y0 - 120} ${x1 + 90} ${y1 - 30} ${x1} ${y1}" fill="none" stroke="${c.accent}" stroke-width="7" stroke-linecap="round"/><path d="M${x1 + 34} ${y1 - 18}L${x1} ${y1}L${x1 + 22} ${y1 + 32}" fill="none" stroke="${c.accent}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>`; }
  if (e === "ondas") return [0, 1].map((i) => `<path d="M0 ${h - 70 + i * 34}Q${w * .25} ${h - 120 + i * 34} ${w * .5} ${h - 70 + i * 34}T${w} ${h - 70 + i * 34}V${h}H0z" fill="${i ? c.panel2 : c.panel}"/>`).join("");
  if (e === "cantos") { const m = 40, L = 70; return [[m, m, 1, 1], [w - m, m, -1, 1], [m, h - m, 1, -1], [w - m, h - m, -1, -1]]
    .map(([x, y, sx, sy]) => `<path d="M${x} ${y + sy * L}V${y}H${x + sx * L}" fill="none" stroke="${c.accent}" stroke-width="6"/>`).join(""); }
  if (e === "confete") { const pts = [[.12, .20], [.86, .24], [.08, .62], [.92, .58], [.18, .88], [.80, .90], [.30, .12], [.70, .10]];
    return pts.map(([x, y], i) => i % 3 === 0 ? `<circle cx="${w * x}" cy="${h * y}" r="9" fill="${c.accent}"/>` : i % 3 === 1
      ? `<rect x="${w * x}" y="${h * y}" width="18" height="18" rx="3" fill="${c.panel2}" transform="rotate(${20 + i * 17} ${w * x} ${h * y})"/>`
      : `<path d="M${w * x} ${h * y}l12 -20l12 20z" fill="${mix(c.bg, c.accent, .6)}"/>`).join(""); }
  return "";
}
// Desenhos "de assunto" ficam a 50% no canto superior direito: o texto começa abaixo deles e nunca se cruzam.
const ESCALA_DESENHO = 0.5;
function deco(type, c, w, h) {
  const g = decoration(type, c.deco, w, h).replaceAll("#102A55", c.panel).replaceAll("#173663", c.panel2).replaceAll("#7187A9", c.sub);
  if (!VISUAL_RIGHT.has(type)) return g;
  const ax = w * .95, ay = h * .09;
  return `<g transform="translate(${ax} ${ay}) scale(${ESCALA_DESENHO}) translate(${-ax} ${-ay})">${g}</g>`;
}
function seloY(p, w, h) {  // selo "2 / 5" ou "OFERTA": abaixo da logo quando o texto é à esquerda (a logo fica no canto esquerdo)
  const temLogo = spec.logo || process.env.LOGO_TESTE;
  if (p.alinhamento === "centro" || !temLogo) return Math.round(h * .105);
  return Math.round((h > 1600 ? h * .075 : 58) + logoAltura() + 34);
}
// Texto SEMPRE dentro da área útil: mede de verdade e, se não cabe na largura ou na altura, encolhe tudo e refaz.
const geoCache = new Map();
function geometria(p, w, h) {
  const chave = JSON.stringify([p, w, h]);
  if (!geoCache.has(chave)) for (let esc = 1; ; esc = Math.round((esc - .06) * 100) / 100) {
    const g = tentaGeometria(p, w, h, esc);
    if (g.cabe || esc <= .5) { geoCache.set(chave, g); break; }
  }
  return geoCache.get(chave);
}
function geometriaLateral(p, w, h, esc) {
  const left = p.alinhamento !== "centro", st = h > 1600, k = st ? 1.25 : 1;
  const x = Math.round(w * SAFE_SIDE), width = w - 2 * x, gap = 42;
  const col = Math.floor((width - gap) / 2), subX = x + col + gap;
  const top = Math.max(h * (st ? .16 : .14), logo ? (st ? h * .075 : 58) + logoAltura() + 38 : 0);
  const end = p.cta ? h - (st ? 330 : 210) : h * (st ? .82 : .88);
  const titleSize = Math.round(78 * k * esc), subSize = Math.round(38 * k * esc), subFont = FONTE_B;
  const tq = quebra(String(p.frase || ""), FONTE_B, titleSize, width);
  const sq = quebra(String(p.subtitulo || ""), subFont, subSize, col - 44);
  const titleInter = -4, subInter = Math.round(subSize * .22), detailInter = 7;
  const titleStep = alturaLinha(FONTE_B, titleSize) + titleInter, subStep = alturaLinha(subFont, subSize) + subInter;
  const selo = String(p.selo || "").trim().toUpperCase().slice(0, 28), seloSize = Math.round(30 * k * esc), seloH = selo ? seloSize * 2 : 0;
  if (selo) mede(FONTE_B, seloSize, [selo]);
  const subPad = 24, midH = Math.max(h * .27, sq.lines.length * subStep + 2 * subPad + (p.solucao === "balao" ? 20 : 0));
  const pSize = Math.round(30 * k * esc), chipH = pSize * 2, chipPad = 22;
  const pts = (p.pontos || []).slice(0, 3).map(v => "✓ " + String(v).trim());
  mede(FONTE_B, pSize, pts);
  const chipWidths = pts.map(t => medidas.get(mk(FONTE_B, pSize, t)) + chipPad * 2);
  const dq = quebra(String(p.destaque || ""), FONTE_B, pSize, width);
  const detailH = p.destaque ? dq.lines.length * (alturaLinha(FONTE_B, pSize) + detailInter) + 24 : 0;
  const total = (seloH ? seloH + 20 : 0) + tq.lines.length * titleStep + 36 + midH + detailH + (pts.length ? 30 + pts.length * (chipH + 12) : 0);
  const seloTop = Math.round(top + Math.max(0, (end - top - total) / 2));
  const titleTop = seloTop + (seloH ? seloH + 20 : 0), midTop = titleTop + tq.lines.length * titleStep + 36;
  const media = {x, y: midTop, w: col, h: midH};
  const subTop = Math.round(midTop + (midH - sq.lines.length * subStep) / 2);
  const detailTop = midTop + midH + 24;
  const chips = pts.map((texto, i) => ({texto, x: left ? x : Math.round((w - chipWidths[i]) / 2), y: midTop + midH + detailH + 30 + i * (chipH + 12), w: chipWidths[i]}));
  return {S: Math.min(col, midH) / 2.2, D: midH, iconeCy: midTop + midH / 2, media, subX: subX + 22, subBox: {x: subX, y: subTop - subPad, w: col, h: sq.lines.length * subStep + 2 * subPad},
    titleSize, titleLines: tq.lines, subSize, subLines: sq.lines, detailSize: pSize, detailLines: dq.lines, titleTop, subTop, detailTop,
    subFont, titleInter, subInter, detailInter, subStep, sol: p.solucao || "cartao", subPad, selo, seloTop, seloSize, seloH, chips, pSize, chipH, chipPad,
    cabe: tq.ok && sq.ok && dq.ok && chipWidths.every(v => v <= width) && total <= end - top};
}
function tentaGeometria(p, w, h, esc) {
  if (p.composicao === "visual_lateral") return geometriaLateral(p, w, h, esc);
  const title = String(p.frase || ""), subtitle = String(p.subtitulo || ""), detail = String(p.destaque || ""), cta = String(p.cta || "");
  const left = p.alinhamento !== "centro", reservado = VISUAL_RIGHT.has(p.decoracao);
  const textWidth = Math.floor(w * CONTENT_WIDTH * .98);
  const alto = h > 1600, k = alto ? 1.2 : 1;  // stories: tela alta, texto maior
  // solução (subtítulo): simples | faixa (faixa forte na cor de destaque) | cartao (caixa com barra) | grande (2º título colorido)
  const sol = ["faixa", "cartao", "grande", "balao", "antes_depois"].includes(p.solucao) ? p.solucao : "simples";
  const subFont = sol !== "simples" || p.destaque_estilo === "cor" ? FONTE_B : FONTE;
  let titleSize = Math.round((title.length <= 18 ? 112 : title.length <= 35 ? 98 : title.length <= 55 ? 84 : 72) * k * esc * (p.destaque_estilo === "peso" ? 1.12 : 1)), tq;
  for (;;) { tq = quebra(title, FONTE_B, titleSize, textWidth); if ((tq.ok && tq.lines.length <= (alto ? 4 : 3)) || titleSize <= 30) break; titleSize -= 4; }
  const subWidth = ["cartao", "balao"].includes(sol) ? textWidth - 80 : textWidth;
  let subSize = Math.round(Math.max((alto ? 46 : 40) * esc, titleSize * (sol === "grande" ? .66 : .5))), sq;
  for (;;) { sq = quebra(subtitle, subFont, subSize, subWidth); if (sq.ok || subSize <= 20) break; subSize -= 2; }
  const subPad = subtitle && (["faixa", "cartao", "balao", "antes_depois"].includes(sol)) ? Math.round(subSize * .75) : 0;
  // selo curto acima do título (NOVIDADE, IA…) e pontos: 2-3 etiquetas com informação embaixo
  const selo = String(p.selo || "").trim().toUpperCase().slice(0, 28), seloSize = Math.round(38 * k * esc), seloH = selo ? Math.round(seloSize * 2) : 0;
  if (selo) mede(FONTE_B, seloSize, [selo]);
  const pontos = (Array.isArray(p.pontos) ? p.pontos : []).map((x) => "✓ " + String(x).trim().slice(0, 40)).filter((x) => x.length > 2).slice(0, 3);
  const pSize = Math.round(Math.max(32 * k * esc, subSize * .86)), chipH = Math.round(pSize * 2), chipPad = Math.round(pSize * .9), chipGap = 14;
  mede(FONTE_B, pSize, pontos);
  const chipW = pontos.map((x) => medidas.get(mk(FONTE_B, pSize, x)) + 2 * chipPad), filas = [];
  for (let i = 0; i < pontos.length; i++) {
    const f = filas[filas.length - 1];
    if (f && f.w + chipGap + chipW[i] <= textWidth) { f.itens.push(i); f.w += chipGap + chipW[i]; } else filas.push({ itens: [i], w: chipW[i] });
  }
  const pontosOk = chipW.every((x) => x <= textWidth), pontosH = filas.length ? filas.length * chipH + (filas.length - 1) * chipGap : 0;
  const detailSize = Math.round(30 * esc), dq = quebra(detail, FONTE_B, detailSize, textWidth);
  const titleLines = tq.lines, subLines = sq.lines, detailLines = dq.lines;
  // mesmo espaçamento que o -annotate usa (altura da linha da fonte + interline)
  const titleInter = Math.round(titleSize * -.06), subInter = Math.round(subSize * .3), detailInter = 7;
  const titleStep = alturaLinha(FONTE_B, titleSize) + titleInter, subStep = alturaLinha(subFont, subSize) + subInter, detailStep = alturaLinha(FONTE_B, detailSize) + detailInter;
  const gapSub = sol === "antes_depois" ? 100 : p.destaque_estilo === "linha" ? 84 : p.destaque_estilo === "selo" && sol === "simples" ? 70 : sol === "faixa" || sol === "cartao" ? 44 : 56;
  const blocoH = (seloH ? seloH + 24 : 0) + titleLines.length * titleStep + (subtitle ? gapSub + subLines.length * subStep + 2 * subPad : 0)
    + (detail ? 28 + detailLines.length * detailStep : 0) + (pontosH ? 36 + pontosH : 0);
  // ícone centralizado: ícone + texto formam um bloco só, centralizado na altura livre
  const S = Math.round(h * .17), gap = h * .04, fl = p.foto && p.foto_layout;
  let D = fl === "topo_cartao" ? h * .42 : fl === "circulo" ? h * .33 : fl === "polaroid" ? h * .46 : fl === "arco" ? h * .46 : S * 1.56;
  const comIcone = !!p.icone || ["topo_cartao", "circulo", "polaroid", "arco"].includes(fl);
  const st = h > 1600, fim = cta ? h - (st ? 330 : 210) : h * (st ? .82 : .88);  // stories: fora das faixas do Instagram
  const logoFim = spec.logo || process.env.LOGO_TESTE ? (st ? h * .075 : 58) + logoAltura() + 28 : 0;  // a altura REAL da logo empurra o conteúdo
  const topo = Math.max(h * (st ? .16 : .14), logoFim);
  if (comIcone) D = Math.max(h * .18, Math.min(D, fim - topo - gap - blocoH));  // falta espaço (logo grande, texto longo): a foto encolhe
  let iconeCy = h * .15 + S / 2, titleTop;
  if (fl === "metade_superior" || fl === "fundo_escurecido" || fl === "recorte_diagonal") {  // texto na parte de baixo
    const t0 = h * (fl === "fundo_escurecido" ? .50 : .57);
    titleTop = Math.round(Math.max(t0, t0 + (fim - t0 - blocoH) / 2));
  } else if (comIcone && p.composicao === "icone_baixo") {  // texto em cima, ícone/foto embaixo
    const ini = Math.max(topo, topo + (fim - topo - (D + gap + blocoH)) / 2);
    titleTop = Math.round(ini); iconeCy = ini + blocoH + gap + D / 2;
  } else if (comIcone) {
    const ini = Math.max(topo, topo + (fim - topo - (D + gap + blocoH)) / 2);
    iconeCy = ini + D / 2; titleTop = Math.round(ini + D + gap);
  } else {
    const t0 = Math.max(h * ((p.icone || reservado) ? .36 : .20), seloY(p, w, h) + 60);
    titleTop = Math.round(Math.max(t0, t0 + (fim - t0 - blocoH) / 2));
  }
  const seloTop = titleTop;
  if (seloH) titleTop += seloH + 24;  // o selo é o começo do bloco de texto
  const subTop = Math.round(titleTop + titleLines.length * titleStep + gapSub + subPad), detailTop = Math.round(subTop + (subtitle ? subLines.length * subStep + subPad + 28 : 0));
  const textoFim = detail ? detailTop + detailLines.length * detailStep : subtitle ? subTop + subLines.length * subStep + subPad : titleTop + titleLines.length * titleStep;
  const pontosTop = Math.round(textoFim + 36);
  const chips = filas.flatMap((f, r) => { let x = left ? Math.round(w * SAFE_SIDE) : Math.round((w - f.w) / 2);
    return f.itens.map((i) => { const c = { texto: pontos[i], x, y: pontosTop + r * (chipH + chipGap), w: chipW[i] }; x += chipW[i] + chipGap; return c; }); });
  const fundoTudo = Math.max(pontosH ? pontosTop + pontosH : textoFim, comIcone && p.composicao === "icone_baixo" ? iconeCy + D / 2 : 0);
  const cabe = tq.ok && sq.ok && dq.ok && pontosOk && titleLines.length <= (alto ? 4 : 3) && fundoTudo <= fim + 4;
  return {S, D, iconeCy, subStep, titleSize, titleLines, subSize, subLines, detailSize, detailLines, titleTop, subTop, detailTop,
    subFont, titleInter, subInter, detailInter, cabe, sol, subPad, selo, seloTop, seloSize, seloH, chips, pSize, chipH, chipPad};
}
// destaque "selo": subtítulo dentro de uma etiqueta; "linha": barra sob o título
function seloSub(p, c, w, h, left) {
  const g = geometria(p, w, h);
  if (g.media || (p.destaque_estilo === "linha" && g.sol !== "simples")) return "";  // a caixa da solução já destaca
  if (p.destaque_estilo === "linha") return `<rect x="${left ? w * SAFE_SIDE : w / 2 - 60}" y="${g.subTop - 30}" width="120" height="8" rx="4" fill="${c.accent}"/>`;
  if (p.destaque_estilo !== "selo" || !g.subLines.length || g.sol !== "simples") return "";
  mede(g.subFont, g.subSize, g.subLines);
  const larg = Math.min(w * CONTENT_WIDTH + 40, Math.max(...g.subLines.map((l) => medidas.get(mk(g.subFont, g.subSize, l)))) + 70), alt = g.subLines.length * g.subStep + 34;
  return `<rect x="${left ? w * SAFE_SIDE - 30 : (w - larg) / 2}" y="${g.subTop - 18}" width="${larg}" height="${alt}" rx="${Math.min(alt / 2, 40)}" fill="${c.panel2}"/>`;
}
// formas da solução, do selo e dos pontos (o texto vem depois, pelo ImageMagick)
function formasTexto(p, c, w, h, left) {
  const g = geometria(p, w, h);
  let out = "";
  const bx = g.subBox?.x ?? Math.round(w * SAFE_SIDE - 10), by = g.subBox?.y ?? g.subTop - g.subPad;
  const bw = g.subBox?.w ?? Math.round(w * CONTENT_WIDTH + 20), bh = g.subBox?.h ?? g.subLines.length * g.subStep - g.subInter + 2 * g.subPad;
  if (g.subLines.length && ["faixa", "cartao", "balao", "antes_depois"].includes(g.sol)) {
    out += `<rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="${g.sol === "faixa" ? 6 : 26}" fill="${g.sol === "faixa" ? c.accent : c.panel2}"/>`;
    if (g.sol === "cartao") out += `<rect x="${bx}" y="${by}" width="8" height="${bh}" rx="4" fill="${c.accent}"/>`;
    if (g.sol === "balao") out += g.media
      ? `<path d="M${bx+2} ${by+bh*.4}l-24 18l24 18Z" fill="${c.panel2}"/>`
      : `<path d="M${bx+40} ${by+2}l20 -22l20 22Z" fill="${c.panel2}"/>`;
    if (g.sol === "antes_depois") out += g.media
      ? `<path d="M${bx-34} ${by+bh/2}h24m-10 -10l10 10l-10 10" fill="none" stroke="${c.accent}" stroke-width="5"/>`
      : `<path d="M${w/2} ${by-54}v30m-12 -12l12 12l12 -12" fill="none" stroke="${c.accent}" stroke-width="6"/>`;
  }
  if (g.selo) { const sw = medidas.get(mk(FONTE_B, g.seloSize, g.selo)) + 56, sx = left ? Math.round(w * SAFE_SIDE) : Math.round((w - sw) / 2);
    out += `<rect x="${sx}" y="${g.seloTop}" width="${sw}" height="${g.seloH}" rx="${g.seloH / 2}" fill="${c.accent}"/>`; }
  for (const ch of g.chips) out += `<rect x="${ch.x}" y="${ch.y}" width="${ch.w}" height="${g.chipH}" rx="${g.chipH / 2}" fill="${c.panel2}" stroke="${c.accent}" stroke-width="2"/>`;
  return out;
}
function svgFor(scene) {
  const p = scene.layout?.params || {}, [w,h] = spec.dims;
  const t = paleta(themes[scene.tema || spec.tema] || themes.escuro_clean, p.fundo_estilo);
  const reservado = VISUAL_RIGHT.has(p.decoracao), left = p.alinhamento !== "centro", x = left ? Math.round(w * SAFE_SIDE) : Math.round(w/2);
  const title = String(p.frase || ""), subtitle = String(p.subtitulo || ""), detail = String(p.destaque || ""), cta = String(p.cta || "");
  const titleSize = title.length <= 18 ? 138 : title.length <= 35 ? 112 : title.length <= 55 ? 90 : 76;
  const titleLines = wrap(title, Math.max(12, Math.floor((w*.78)/(titleSize*.55))));
  const subLines = wrap(subtitle, 43), detailLines = wrap(detail, 52);
  const titleY = Math.round(h * (detail ? .29 : .39)), subY = titleY + titleLines.length * titleSize * 1.02 + 42;
  const detailY = subY + subLines.length * 54 + 38;
  const buttonW = Math.min(w * CONTENT_WIDTH, Math.max(280, cta.length * 25 + 90)), buttonX = (w-buttonW)/2;
  const buttonY = h - (h > 1600 ? 150 : 100) - 78;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    ${p.fundo ? `<rect width="${w}" height="${h}" fill="${p.fundo}"/>` : fundo(p.fundo_estilo, t, w, h, p.fundo_var ?? .5)}${p.composicao === "visual_lateral" || p.foto ? "" : p.icone ? (reservado ? "" : deco(p.decoracao, t, w, h)) + iconeSvg(p, t, w, h, left) : !left && reservado ? "" : deco(p.decoracao, t, w, h)}${p.composicao === "visual_lateral" ? (p.icone ? iconeSvg(p, t, w, h, left) : "") : enfeiteSvg(p, t, w, h)}${seloSub(p, t, w, h, left)}${formasTexto(p, t, w, h, left)}
    ${!(p.etiqueta || p.objetivo === "promocao") ? "" : left ? `<rect x="${x}" y="${seloY(p, w, h)}" width="62" height="8" rx="4" fill="${t.accent}"/>` : `<rect x="${w/2 - 31}" y="${h*.105 + 30}" width="62" height="8" rx="4" fill="${t.accent}"/>`}
    ${cta ? `<rect x="${buttonX}" y="${buttonY}" width="${buttonW}" height="78" rx="39" fill="${t.button}"/>` : ""}
  </svg>`;
}

function annotations(scene) {
  const p = scene.layout?.params || {}, [w,h] = spec.dims;
  const t = paleta(themes[scene.tema || spec.tema] || themes.escuro_clean, p.foto && p.foto_layout === "fundo_escurecido" ? "solido" : p.fundo_estilo);
  const reservado = VISUAL_RIGHT.has(p.decoracao), left = p.alinhamento !== "centro", x = left ? Math.round(w * SAFE_SIDE) : Math.round(w/2), gravity = left ? "northwest" : "north";
  const title = String(p.frase || ""), subtitle = String(p.subtitulo || ""), detail = String(p.destaque || ""), cta = String(p.cta || "");
  const g = geometria(p, w, h), {titleSize, titleLines, subSize, subLines, detailSize, detailLines, titleTop, subTop, detailTop, subFont, titleInter, subInter, detailInter} = g;
  const subCor = g.sol === "faixa" ? t.buttonText : g.sol === "grande" ? t.accent : ["cartao", "balao", "antes_depois"].includes(g.sol) ? t.text : p.destaque_estilo === "cor" ? t.accent : t.sub;
  const ctaText = `${cta.toUpperCase()}  →`, ctaSize = Math.min(31, Math.floor((w * CONTENT_WIDTH - 60) / Math.max(1, ctaText.length * .62)));
  const ctaX = Math.round((w - ctaText.length * ctaSize * .62) / 2), buttonY = h - (h > 1600 ? 150 : 100) - 78;
  const label = p.etiqueta || (p.objetivo === "promocao" ? "OFERTA ESPECIAL" : "");
  const at = (font, size, fill, gx, gy, text, g = gravity, interline = 0) => ["-gravity",g,"-font",font,"-pointsize",String(size),"-fill",fill,"-interline-spacing",String(interline),"-annotate",`+${gx}+${gy}`,text];
  return [
    ...(label ? at("DejaVu-Sans-Bold",28,t.accent,left ? x+86 : 0,seloY(p, w, h)-8,label) : []),
    ...at(FONTE_B,titleSize,t.text,left ? x : 0,titleTop,titleLines.join("\n"),gravity,titleInter),
    ...(subtitle ? at(subFont,subSize,subCor,g.subX ?? (left ? x : 0),subTop,subLines.join("\n"),g.media ? "northwest" : gravity,subInter) : []),
    ...(g.selo ? at(FONTE_B,g.seloSize,t.buttonText,left ? x + 28 : 0,Math.round(g.seloTop + (g.seloH - alturaLinha(FONTE_B, g.seloSize)) / 2),g.selo) : []),
    ...g.chips.flatMap((ch) => at(FONTE_B,g.pSize,t.text,ch.x + g.chipPad,Math.round(ch.y + (g.chipH - alturaLinha(FONTE_B, g.pSize)) / 2),ch.texto,"northwest")),
    ...(detail ? at(FONTE_B,detailSize,t.accent,left ? x : 0,detailTop,detailLines.join("\n"),gravity,detailInter) : []),
    ...(cta ? at("DejaVu-Sans-Bold",ctaSize,t.buttonText,ctaX,buttonY+21,ctaText,"northwest") : []),
  ];
}

// Tema "marca": cores tiradas da logo enviada no painel (fundo = cor principal escurecida, destaque = 2ª cor).
function temaDaLogo(arq) {
  const linhas = execFileSync("convert", [arq, "-alpha", "on", "-resize", "120x120", "-colors", "8", "-format", "%c", "histogram:info:-"]).toString().split("\n");
  const cores = linhas.map((l) => /^\s*(\d+):\s*\(([\d.]+),([\d.]+),([\d.]+)(?:,([\d.]+))?\)/.exec(l)).filter(Boolean)
    .map((m) => ({n: +m[1], rgb: [+m[2], +m[3], +m[4]].map(Math.round), a: m[5] == null ? 255 : +m[5]}))
    .filter((c) => c.a >= 128)
    .map((c) => ({...c, hex: "#" + c.rgb.map((v) => v.toString(16).padStart(2, "0")).join(""), sat: (Math.max(...c.rgb) - Math.min(...c.rgb)) / 255}))
    .filter((c) => c.sat > 0.25)  // fora branco, preto e cinza
    .sort((a, b) => b.n - a.n);
  if (!cores.length) return null;
  const hue = ([r, g, b]) => { const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn || 1; const h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; return (h * 60 + 360) % 360; };
  const p1 = cores[0], p2 = cores.find((c) => Math.min(Math.abs(hue(c.rgb) - hue(p1.rgb)), 360 - Math.abs(hue(c.rgb) - hue(p1.rgb))) > 40);
  const bg = mix(p1.hex, "#000000", lum(p1.hex) > 0.5 ? 0.82 : 0.62);
  const accent = p2 ? p2.hex : mix(p1.hex, "#FFFFFF", 0.35);
  return {bg, text: "#FFFFFF", sub: mix("#FFFFFF", p1.hex, 0.22), accent, button: accent, buttonText: lum(accent) > 0.5 ? bg : "#FFFFFF"};
}
// Foto na capa: o Jev escolhe onde (foto_layout) e o efeito (foto_efeito). Tudo feito pelo ImageMagick.
function aplicaFoto(png, p, c, W, H, base) {
  const tmp = (n) => path.join(output, `${base}-${n}.png`), f1 = tmp("f1"), m = tmp("m");
  const {D, iconeCy, media} = geometria(p, W, H);
  const efeito = (arq) => {
    if (p.foto_efeito === "duotone_marca") execFileSync("convert", [arq, "-colorspace", "gray", "-auto-level", "+level-colors", `${mix(c.bg, "#000000", .35)},${mix(c.accent, "#FFFFFF", .55)}`, arq]);
    if (p.foto_efeito === "escurecer") execFileSync("convert", [arq, "-modulate", "82,75", arq]);
    if (p.foto_efeito === "preto_e_branco") execFileSync("convert", [arq, "-colorspace", "gray", "-sigmoidal-contrast", "3x50%", "-colorspace", "sRGB", arq]);
    if (p.foto_efeito === "contraste") execFileSync("convert", [arq, "-modulate", "100,130", "-sigmoidal-contrast", "4x50%", arq]);
  };
  const L = p.foto_layout;
  if (media) {
    const fw = Math.round(media.w), fh = Math.round(media.h);
    execFileSync("convert", [p.foto, "-resize", `${fw}x${fh}^`, "-gravity", "center", "-extent", `${fw}x${fh}`, f1]);
    efeito(f1);
    execFileSync("convert", ["-size", `${fw}x${fh}`, "xc:none", "-fill", "white", "-draw", `roundrectangle 0,0 ${fw-1},${fh-1} 24,24`, m]);
    execFileSync("convert", [f1, m, "-compose", "CopyOpacity", "-composite", f1]);
    execFileSync("convert", [png, f1, "-geometry", `+${media.x}+${media.y}`, "-composite", png]);
  } else if (L === "recorte_diagonal") {
    const fh = Math.round(H * .52);
    execFileSync("convert", [p.foto, "-resize", `${W}x${fh}^`, "-gravity", "center", "-extent", `${W}x${fh}`, f1]);
    efeito(f1);
    execFileSync("convert", ["-size", `${W}x${fh}`, "xc:none", "-fill", "white", "-draw", `polygon 0,0 ${W},0 ${W},${Math.round(fh * .76)} 0,${fh}`, m]);
    execFileSync("convert", [f1, m, "-compose", "CopyOpacity", "-composite", f1]);
    execFileSync("convert", [png, f1, "-geometry", "+0+0", "-composite", "-stroke", c.accent, "-strokewidth", "10", "-draw", `line 0,${fh} ${W},${Math.round(fh * .76)}`, png]);
  } else if (L === "polaroid") {
    const fh = Math.round(D * .70), fw = Math.min(Math.round(W * .56), Math.round(fh * 2)), b = 20;
    execFileSync("convert", [p.foto, "-resize", `${fw}x${fh}^`, "-gravity", "center", "-extent", `${fw}x${fh}`, f1]);
    efeito(f1);
    execFileSync("convert", [f1, "-bordercolor", "white", "-border", String(b), "-gravity", "north", "-background", "white", "-extent", `${fw + 2 * b}x${fh + 2 * b + 60}`,
      "-background", "none", "-rotate", "-4", "(", "+clone", "-background", "black", "-shadow", "55x16+10+16", ")", "+swap", "-background", "none", "-layers", "merge", "+repage", f1]);
    const dim = execFileSync("identify", ["-format", "%w %h", f1]).toString().split(" ").map(Number);
    execFileSync("convert", [png, f1, "-geometry", `+${Math.round((W - dim[0]) / 2)}+${Math.round(iconeCy - dim[1] / 2)}`, "-composite", png]);
  } else if (L === "arco") {
    const fw = Math.round(W * .50), fh = Math.round(D), r = fw / 2;
    execFileSync("convert", [p.foto, "-resize", `${fw}x${fh}^`, "-gravity", "center", "-extent", `${fw}x${fh}`, f1]);
    efeito(f1);
    execFileSync("convert", ["-size", `${fw}x${fh}`, "xc:none", "-fill", "white", "-draw", `circle ${r},${r} ${r},0`, "-draw", `rectangle 0,${r} ${fw},${fh}`, m]);
    execFileSync("convert", [f1, m, "-compose", "CopyOpacity", "-composite", f1]);
    const x = Math.round((W - fw) / 2), y = Math.round(iconeCy - fh / 2);
    const args = [png];
    if (p.foto_efeito === "moldura") args.push("-fill", c.accent, "-draw", `circle ${W / 2},${y + r} ${W / 2},${y - 12}`, "-draw", `rectangle ${x - 12},${y + r} ${x + fw + 11},${y + fh + 12}`);
    execFileSync("convert", [...args, f1, "-geometry", `+${x}+${y}`, "-composite", png]);
  } else if (L === "fundo_escurecido" || L === "metade_superior") {
    const fh = L === "fundo_escurecido" ? H : Math.round(H * .56);
    execFileSync("convert", [p.foto, "-resize", `${W}x${fh}^`, "-gravity", "center", "-extent", `${W}x${fh}`, f1]);
    efeito(f1);
    if (L === "fundo_escurecido") {
      // degradê escuro por cima: mais forte embaixo, onde fica o texto
      execFileSync("convert", [f1, "(", "-size", `${W}x${H}`, `gradient:${c.bg}66-${c.bg}F2`, ")", "-composite", f1]);
      execFileSync("convert", [png, f1, "-composite", png]);
    } else {
      execFileSync("convert", [f1, "(", "-size", `${W}x${Math.round(fh * .45)}`, `gradient:${c.bg}00-${c.bg}FF`, ")", "-gravity", "south", "-composite", f1]);
      execFileSync("convert", [png, f1, "-gravity", "north", "-composite", png]);
    }
  } else {
    const circ = L === "circulo", fh = Math.round(D), fw = circ ? fh : Math.min(Math.round(W * .76), Math.round(fh * 1.6)), r = circ ? fw / 2 : 30;  // cartão nunca vira faixa fina
    execFileSync("convert", [p.foto, "-resize", `${fw}x${fh}^`, "-gravity", "center", "-extent", `${fw}x${fh}`, f1]);
    efeito(f1);
    execFileSync("convert", ["-size", `${fw}x${fh}`, "xc:none", "-fill", "white", "-draw", circ ? `circle ${fw / 2},${fh / 2} ${fw / 2},0` : `roundrectangle 0,0 ${fw - 1},${fh - 1} ${r},${r}`, m]);
    execFileSync("convert", [f1, m, "-compose", "CopyOpacity", "-composite", f1]);
    const x = Math.round((W - fw) / 2), y = Math.round(iconeCy - fh / 2);
    const moldura = p.foto_efeito === "moldura" || circ;
    const args = [png];
    if (moldura) args.push("-fill", "none", "-stroke", c.accent, "-strokewidth", "8", "-draw", circ ? `circle ${W / 2},${iconeCy} ${W / 2},${y - 10}` : `roundrectangle ${x - 10},${y - 10} ${x + fw + 9},${y + fh + 9} ${r + 8},${r + 8}`);
    execFileSync("convert", [...args, f1, "-geometry", `+${x}+${y}`, "-composite", png]);
  }
  for (const f of [f1, m]) fs.rmSync(f, {force: true});
}
// Luz (o Jev escolhe): camada raster por cima do fundo/foto e por baixo do texto. v = fundo_var muda lado e posição.
function aplicaLuz(png, p, c, W, H) {
  const L = p.luz, v = p.fundo_var ?? .5;
  if (!L || L === "nenhuma") return;
  const rgba = (hx, a) => `rgba(${hex(hx).join(",")},${a})`, claro = lum(c.bg) >= .5, cor = claro ? c.accent : mix(c.accent, "#FFFFFF", .45);
  let a;
  if (L === "holofote") { const gw = Math.round(W * 1.3), gh = Math.round(H * 1.15);
    a = ["(", "-size", `${gw}x${gh}`, `radial-gradient:${rgba(cor, claro ? .22 : .34)}-${rgba(cor, 0)}`, ")", "-gravity", "north", "-geometry", `+0-${Math.round(gh / 2)}`, "-composite"]; }
  if (L === "brilho_canto") { const s = Math.round(W * 1.25);
    a = ["(", "-size", `${s}x${s}`, `radial-gradient:${rgba(cor, claro ? .28 : .42)}-${rgba(cor, 0)}`, ")", "-gravity", v < .5 ? "northwest" : "northeast", "-geometry", `-${s / 2}-${s / 2}`, "-composite"]; }
  if (L === "vinheta") a = ["(", "-size", `${W}x${H}`, `radial-gradient:${rgba(c.bg, 0)}-${rgba(mix(c.bg, "#000000", claro ? .3 : .7), claro ? .45 : .75)}`, ")", "-composite"];
  if (L === "raios") { const ox = v < .5 ? -W * .05 : W * 1.05, oy = -H * .05, d = [];
    for (let i = 0; i < 5; i++) { const ang = (v < .5 ? 25 : 155) + (v < .5 ? 1 : -1) * i * 13, r = H * 1.6, a1 = (ang - 3.2) * Math.PI / 180, a2 = (ang + 3.2) * Math.PI / 180;
      d.push("-fill", rgba(cor, i % 2 ? .10 : .16), "-draw", `polygon ${ox},${oy} ${ox + Math.cos(a1) * r},${oy + Math.sin(a1) * r} ${ox + Math.cos(a2) * r},${oy + Math.sin(a2) * r}`); }
    a = ["(", "-size", `${W}x${H}`, "xc:none", ...d, "-blur", "0x16", ")", "-composite"]; }
  if (L === "bokeh") { const d = []; let s = Math.floor(v * 9973) + 7; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 18; i++) { const x = rnd() * W, y = rnd() * H, r = 14 + rnd() * 46;
      d.push("-fill", rgba(i % 3 ? cor : "#FFFFFF", (.08 + rnd() * .16).toFixed(2)), "-draw", `circle ${x},${y} ${x + r},${y}`); }
    a = ["(", "-size", `${W}x${H}`, "xc:none", ...d, "-blur", "0x5", ")", "-composite"]; }
  if (a) execFileSync("convert", [png, ...a, png]);
}
// Sombra do texto (o Jev escolhe): o texto vai numa camada própria e ganha sombra/brilho embaixo dele.
function sombraArgs(camada, p, c) {
  const claro = lum(c.bg) >= .5;
  if (p.sombra === "suave") return ["(", camada, "-background", claro ? "#00000055" : "black", "-shadow", claro ? "40x8+4+6" : "65x10+6+10", ")"];
  if (p.sombra === "forte") return ["(", camada, "-background", "black", "-shadow", claro ? "45x2+6+8" : "85x3+8+10", ")"];
  if (p.sombra === "brilho") return ["(", camada, "-background", c.accent, "-shadow", "80x14+0+0", ")"];
  return [];
}
const files = [], desenhos = new Map();
let lLogoCache;  // cor média da logo: calculada 1 vez
const logo = process.env.LOGO_TESTE || (spec.logo ? ["png","jpg","jpeg","webp"].map((ext) => path.join(ROOT,"public","brand",`logo.${ext}`)).find(fs.existsSync) : null);  // LOGO_TESTE: só para teste, sem mexer em public/brand
// logo_px é o LADO MAIOR: logo larga (ex.: AlvoManage ~4:1) tem altura bem menor; reservar logo_px inteiro deixava 1/3 da arte vazio em cima
let LOGO_H = null;
function logoAltura() {
  if (LOGO_H === null) {
    const px = spec.logo_px || 90;
    try { const [lw, lh] = execFileSync("identify", ["-format", "%w %h", logo]).toString().split(" ").map(Number); LOGO_H = Math.round(px * lh / Math.max(lw, lh)); } catch { LOGO_H = px; }
  }
  return LOGO_H;
}
if (logo) { const m = temaDaLogo(logo); if (m) themes.marca = m; }
for (const scene of spec.cenas) {
  const base = `slide-${String(scene.n).padStart(2,"0")}`, svg = path.join(output, `${base}.svg`), png = path.join(output, `${base}.png`);
  fs.writeFileSync(svg, svgFor(scene));
  execFileSync("convert", ["-background", "none", "-density", "96", svg, "-strip", png]);
  const pp = scene.layout?.params || {};
  if (FUNDOS_RASTER.has(pp.fundo_estilo) && !pp.fundo) {
    const c = paleta(themes[scene.tema || spec.tema] || themes.escuro_clean, pp.fundo_estilo), [w, h] = spec.dims, v = pp.fundo_var ?? .5;
    const claro = mix(mix(c.bg, lum(c.bg) < 0.5 ? "#FFFFFF" : "#000000", 0.16), c.accent, 0.08);
    const base = pp.fundo_estilo === "brilho"
      ? ["-size", `${w}x${h}`, `radial-gradient:${mix(c.bg, c.accent, .30)}-${c.bg}`]
      : ["-size", `${w}x${h}`, "-define", `gradient:direction=${["SouthEast", "South", "East", "NorthEast", "SouthWest"][Math.floor(v * 5) % 5]}`, `gradient:${c.bg}-${claro}`];
    execFileSync("convert", [...base, png, "-composite", png]);
  }  if (pp.enfeite === "granulado") execFileSync("convert", [png, "-attenuate", "0.35", "+noise", "Gaussian", png]);  // textura, antes do texto

  const sp = scene.layout?.params || {}, [W, H] = spec.dims;
  if (sp.foto && fs.existsSync(sp.foto)) aplicaFoto(png, sp, paleta(themes[scene.tema || spec.tema] || themes.escuro_clean, sp.foto_layout === "fundo_escurecido" ? "solido" : sp.fundo_estilo), W, H, base);
  if (!sp.foto && !sp.icone && sp.alinhamento === "centro" && VISUAL_RIGHT.has(sp.decoracao)) {
    // desenho sozinho -> recorta -> centraliza em cima do texto
    const c = paleta(themes[scene.tema || spec.tema] || themes.escuro_clean, sp.fundo_estilo), dsvg = path.join(output, `${base}-d.svg`);
    const chave = [sp.decoracao, scene.tema || spec.tema, sp.fundo_estilo].join("|");
    let dpng = desenhos.get(chave);
    if (!dpng) {
    dpng = path.join(output, `.desenho-${desenhos.size}.png`); desenhos.set(chave, dpng);
    fs.writeFileSync(dsvg, `<svg xmlns="http://www.w3.org/2000/svg" width="${W * 1.6}" height="${H}" viewBox="0 0 ${W * 1.6} ${H}">${decoration(sp.decoracao, c.deco, W, H).replaceAll("#102A55", c.panel).replaceAll("#173663", c.panel2).replaceAll("#7187A9", c.sub)}</svg>`);
    execFileSync("convert", ["-background", "none", "-density", "96", dsvg, "-trim", "+repage", "-resize", `${Math.round(W * .38)}x${Math.round(H * .16)}`, dpng]);
    fs.unlinkSync(dsvg);
    }
    execFileSync("convert", [png, dpng, "-gravity", "north", "-geometry", `+0+${Math.round(H * .15)}`, "-composite", png]);
  }
  const cLuz = paleta(themes[scene.tema || spec.tema] || themes.escuro_clean, sp.fundo_estilo);
  aplicaLuz(png, sp, cLuz, W, H);
  // texto por último: fica por cima da foto e do desenho, numa camada própria para poder ter sombra
  const camadaTxt = path.join(output, `${base}-txt.png`);
  execFileSync("convert", ["-size", `${W}x${H}`, "xc:none", ...annotations(scene), camadaTxt]);
  execFileSync("convert", [png, ...sombraArgs(camadaTxt, sp, cLuz), camadaTxt, "-background", "none", "-layers", "flatten", png]);
  fs.rmSync(camadaTxt, {force: true});
  if (logo) {
    lLogoCache ??= (() => { const px = execFileSync("convert", [logo, "-resize", "32x32", "-alpha", "on", "txt:-"]).toString().split("\n")
      .map((l) => /\((\d+(?:\.\d+)?),(\d+(?:\.\d+)?),(\d+(?:\.\d+)?)(?:,(\d+(?:\.\d+)?))?\)/.exec(l)).filter(Boolean)
      .map((m) => [+m[1], +m[2], +m[3], m[4] == null ? 1 : +m[4] > 1 ? +m[4] / 255 : +m[4]]).filter((q) => q[3] > 0.5);
    return px.length ? px.reduce((s, [r, g, b]) => s + (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255, 0) / px.length : 0.5; })();
    const lLogo = lLogoCache;
    const c = paleta(themes[scene.tema || spec.tema] || themes.escuro_clean, sp.fundo_estilo);
    // logo SOLTA (sem forma atrás), tamanho ajustável no painel; se some no fundo, ganha só uma sombra/brilho de contraste
    const sobreFoto = sp.foto && ["fundo_escurecido", "metade_superior", "recorte_diagonal"].includes(sp.foto_layout);
    const px = Math.round(spec.logo_px || 90), ly = spec.dims[1] > 1600 ? Math.round(spec.dims[1] * .075) : 58;
    const some = sobreFoto || Math.abs(lLogo - lum(c.bg)) < 0.35, cor = lLogo < 0.5 ? "white" : "black";
    execFileSync("convert", [png, "(", logo, "-resize", `${px}x${px}`, ...(some ? ["(", "+clone", "-background", cor, "-shadow", "85x5+0+0", ")", "+swap", "-background", "none", "-layers", "merge", "+repage"] : []), ")",
      "-geometry", `+${Math.round(W * SAFE_SIDE)}+${some ? ly - 10 : ly}`, "-composite", png]);
  }
  fs.unlinkSync(svg);
  files.push(path.basename(png));
}
for (const f of desenhos.values()) fs.rmSync(f, {force: true});
console.log(JSON.stringify({ok:true, files}));
