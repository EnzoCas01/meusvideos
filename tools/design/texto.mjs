// Tipografia do motor editorial: fontes reais (biblioteca/fontes, OFL), rich text por segmento e desenho em contorno.
// O texto vira <path>: a largura medida é exatamente a desenhada (sem depender do casamento de fonte do rasterizador).
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import opentype from "opentype.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const DIR = path.join(ROOT, "biblioteca/fontes");
export const PARES = JSON.parse(fs.readFileSync(path.join(DIR, "pares.json"), "utf8"));
const ARQS = fs.readdirSync(DIR).map((f) => /^(.+)-(\d+)(i?)\.ttf$/.exec(f)).filter(Boolean)
  .map((m) => ({arq: m[0], fam: m[1], peso: +m[2], it: !!m[3]}));
const cache = new Map();

// Família + peso + itálico → a fonte mais próxima que existe (peso mais perto; sem itálico, a reta).
export function fonte(familia, peso = 400, italico = false) {
  const fam = familia.replace(/\s+/g, ""), chave = `${fam}|${peso}|${italico}`;
  if (cache.has(chave)) return cache.get(chave);
  let cands = ARQS.filter((a) => a.fam === fam && a.it === !!italico);
  if (!cands.length) cands = ARQS.filter((a) => a.fam === fam);
  if (!cands.length) throw new Error(`fonte ${familia} não está em biblioteca/fontes`);
  const a = cands.sort((x, y) => Math.abs(x.peso - peso) - Math.abs(y.peso - peso))[0];
  const f = opentype.parse(fs.readFileSync(path.join(DIR, a.arq)).buffer);
  cache.set(chave, f);
  return f;
}
const reserva = (peso) => fonte("Inter", peso);  // ✓ → e afins que a fonte não tem

// Glifos de um trecho num estilo: [{g, f, x}] e largura (tracking em em, como no CSS letter-spacing).
function glifos(texto, st) {
  const f = fonte(st.familia, st.peso, st.italico), k = st.tamanho;
  const out = []; let x = 0, ant = null;
  for (const ch of texto) {
    let ff = f, g = f.charToGlyph(ch);
    if (!g.index && ch.trim()) { ff = reserva(st.peso); g = ff.charToGlyph(ch); }
    if (ant && ant.f === ff) x += ff.getKerningValue(ant.g, g) * k / ff.unitsPerEm;
    out.push({g, f: ff, x});
    x += g.advanceWidth * k / ff.unitsPerEm + (st.tracking || 0) * k;
    ant = {g, f: ff};
  }
  return {gl: out, w: x - (out.length ? (st.tracking || 0) * k : 0)};
}
const capH = (st) => { const f = fonte(st.familia, st.peso, st.italico); return (f.tables.os2.sCapHeight || f.ascender * .7) / f.unitsPerEm * st.tamanho; };

// "Para empresas e **empreendedores**" → segmentos com papel: base | enfase (**) | marca (==) | sublinhado (__) | risco (~~)
export function marcacao(txt) {
  const papeis = {"**": "enfase", "==": "marca", "__": "sublinhado", "~~": "risco"};
  return String(txt).split(/(\*\*[^*]+\*\*|==[^=]+==|__[^_]+__|~~[^~]+~~)/).filter(Boolean)
    .map((p) => papeis[p.slice(0, 2)] && p.endsWith(p.slice(0, 2)) && p.length > 4 ? {t: p.slice(2, -2), papel: papeis[p.slice(0, 2)]} : {t: p, papel: "base"});
}

// Estilo de cada segmento: papel do bloco no par tipográfico (titulo/corpo/apoio/manuscrito) + papel do segmento + o que o spec forçar.
export function estilos(segs, par, papelBloco, base = {}) {
  const P = PARES[par] || PARES.saas_moderno, b = {...(P[papelBloco] || PARES[papelBloco] || P.corpo), ...base};
  return segs.map((s) => {
    const r = s.papel === "enfase" ? {...b, ...(P.enfase_titulo && papelBloco === "titulo" ? P.enfase_titulo : P.enfase), cor: base.cor_enfase || b.cor_enfase}
      : s.papel === "marca" || s.papel === "sublinhado" || s.papel === "risco" ? {...b, peso: Math.max(b.peso, 600), decor: s.papel} : b;
    const {t, papel, ...forca} = s;
    return {t: r.caixa === "alta" ? t.toLocaleUpperCase("pt-BR") : t, ...r, junto: papel !== "base", ...forca, tamanho: (forca.tamanho || r.tamanho || base.tamanho) * (r.escala || 1)};
  });
}

// Quebra em linhas pela largura medida, atravessando segmentos ("empreendedores," pode ter 2 estilos numa palavra).
export function compoe(segs, {largura, entrelinha = 1.1, alinhamento = "esquerda"}) {
  const pecas = [];
  for (const s of segs) {
    // ênfase curta não quebra no meio ("vale mais" fica na mesma linha) — só se couber numa linha
    const inteiro = s.junto && !s.t.includes("\n") && s.t.trim() && glifos(s.t.trim(), s).w <= largura;
    const partes = inteiro ? s.t.split(/^(\s+)|(\s+)$/).filter(Boolean) : s.t.split(/(\n|[ \t]+)/);
    for (const t of partes) if (t) pecas.push({t, st: s, quebra: t === "\n", espaco: !t.trim() && t !== "\n"});
  }
  const palavras = []; let cur = null;
  for (const p of pecas) {
    if (p.quebra) { palavras.push({quebra: true}); cur = null; continue; }
    if (p.espaco) { palavras.push({espaco: p}); cur = null; continue; }
    if (!cur) palavras.push(cur = {pecas: []});
    cur.pecas.push({...p, ...glifos(p.t, p.st)});
  }
  const linhas = [{itens: [], w: 0}]; let espaco = null;
  for (const pw of palavras) {
    const L = linhas[linhas.length - 1];
    if (pw.quebra) { linhas.push({itens: [], w: 0}); espaco = null; continue; }
    if (pw.espaco) { const st = pw.espaco.st; espaco = glifos(" ", st).w + 2 * (st.tracking || 0) * st.tamanho; continue; }  // tracking dos dois lados do espaço
    const ww = pw.pecas.reduce((s, p) => s + p.w, 0), add = L.itens.length ? (espaco || 0) : 0;
    if (L.itens.length && L.w + add + ww > largura) { linhas.push({itens: [], w: 0}); espaco = null; }
    const M = linhas[linhas.length - 1], gap = M.itens.length ? (espaco || 0) : 0;
    let x = M.w + gap;
    for (const p of pw.pecas) { M.itens.push({...p, x}); x += p.w; }
    M.w = x; espaco = null;
  }
  let y = 0, maior = 0;
  const out = linhas.filter((l) => l.itens.length).map((l, i) => {
    const tam = Math.max(...l.itens.map((p) => p.st.tamanho)), cap = Math.max(...l.itens.map((p) => capH(p.st)));
    y += i ? tam * entrelinha : cap;  // 1ª linha: topo das maiúsculas no y do bloco
    maior = Math.max(maior, l.w);
    const dx = alinhamento === "centro" ? (largura - l.w) / 2 : alinhamento === "direita" ? largura - l.w : 0;
    return {base: y, w: l.w, dx, tam, itens: l.itens};
  });
  const ult = out[out.length - 1];
  return {linhas: out, largura: maior, altura: ult ? ult.base + ult.tam * .24 : 0, cabe: maior <= largura + .5};
}

// Encolhe tudo junto até caber em largura, altura e nº de linhas (mantém as proporções entre segmentos).
export function ajusta(segs, opts, {maxAltura = Infinity, maxLinhas = 99, minEscala = .45} = {}) {
  for (let k = 1; ; k = Math.round((k - .04) * 100) / 100) {
    const ss = k === 1 ? segs : segs.map((s) => ({...s, tamanho: s.tamanho * k}));
    const c = compoe(ss, opts);
    if ((c.cabe && c.altura <= maxAltura && c.linhas.length <= maxLinhas) || k <= minEscala) return {...c, escala: k};
  }
}

const n2 = (v) => Math.round(v * 100) / 100;
// SVG do bloco composto em (x, y = topo das maiúsculas da 1ª linha). Decorações de segmento: marca (atrás), sublinhado, risco.
export function svgTexto(c, x, y, id = "") {
  let atras = "", frente = "", txt = "";
  for (const l of c.linhas) for (const p of l.itens) {
    const x0 = x + l.dx + p.x, base = y + l.base, k = p.st.tamanho, cor = p.st.cor || "#111";
    const d = p.gl.map((g) => g.g.getPath(x0 + g.x, base, k).toPathData(2)).join("");
    txt += `<path d="${d}" fill="${cor}"/>`;
    const dec = p.st.decor, cd = p.st.cor_decor || p.st.cor_enfase || cor;
    if (dec === "marca") atras += `<rect x="${n2(x0 - k * .08)}" y="${n2(base - capH(p.st) * 1.12)}" width="${n2(p.w + k * .16)}" height="${n2(capH(p.st) * 1.3)}" rx="${n2(k * .08)}" fill="${p.st.cor_marca || cd}"/>`;
    if (dec === "sublinhado") frente += `<rect x="${n2(x0)}" y="${n2(base + k * .1)}" width="${n2(p.w)}" height="${n2(Math.max(3, k * .07))}" rx="${n2(k * .035)}" fill="${cd}"/>`;
    if (dec === "risco") frente += `<rect x="${n2(x0 - k * .04)}" y="${n2(base - capH(p.st) * .45)}" width="${n2(p.w + k * .08)}" height="${n2(Math.max(3, k * .06))}" fill="${cd}"/>`;
  }
  return `<g${id ? ` id="${id}"` : ""}>${atras}${txt}${frente}</g>`;
}

// Caixas das ênfases (**, ==, __, ~~) já na arte: viram alvo de seta, círculo e marcador ("titulo_01#enfase").
export function caixasEnfase(c, x, y) {
  const out = [];
  for (const l of c.linhas) {
    let cur = null;
    for (const p of l.itens) {
      if (!p.st.junto) { cur = null; continue; }
      const x0 = x + l.dx + p.x, ch = capH(p.st), top = y + l.base - ch;
      if (cur && cur.seg === p.st) { cur.w = x0 + p.w - cur.x; continue; }
      out.push(cur = {seg: p.st, x: x0, y: top, w: p.w, h: ch});
    }
  }
  return out.map(({x: a, y: b, w, h}) => [n2(a), n2(b), n2(w), n2(h)]);
}

// Caixa de cada linha (do topo das maiúsculas até a base com descendentes): obstáculo fino para setas.
export const caixasLinhas = (c, x, y) => c.linhas.map((l) => [n2(x + l.dx), n2(y + l.base - l.tam * .78), n2(l.w), n2(l.tam * 1.0)]);
