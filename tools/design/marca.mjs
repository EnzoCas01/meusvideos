// Brand Kit: identidade persistente por marca (painel/marcas/<id>.json). Com kit, o Jev trabalha DENTRO dele
// (só escolhe modo claro/escuro e par tipográfico entre os permitidos); sem kit, a marca sai da logo, como antes.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import {execFileSync} from "node:child_process";
import {fileURLToPath} from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const DIR = path.join(ROOT, "painel/marcas"), CACHE = path.join(ROOT, "out/painel/.marca-cache");
const abs = (p) => p && (path.isAbsolute(p) ? p : path.join(ROOT, p));
const hex = (c) => c.replace("#", "").match(/../g).map((x) => parseInt(x, 16));
const mix = (a, b, t) => "#" + hex(a).map((v, i) => Math.round(v + (hex(b)[i] - v) * t).toString(16).padStart(2, "0")).join("");
const lum = (c) => { const [r, g, b] = hex(c); return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255; };

// Pixels visíveis da logo (alfa 0-255 na saída txt do ImageMagick 6).
function pixels(arq) {
  return execFileSync("convert", [arq, "-resize", "60x60", "-alpha", "on", "txt:-"]).toString().split("\n")
    .map((l) => /\((\d+(?:\.\d+)?),(\d+(?:\.\d+)?),(\d+(?:\.\d+)?),(\d+(?:\.\d+)?)\)/.exec(l)).filter(Boolean)
    .map((m) => [+m[1], +m[2], +m[3], +m[4] / 255]).filter((q) => q[3] > .5);
}
// Luminância média (decide se a logo precisa de versão para fundo claro/escuro).
function lumLogo(arq) {
  const px = pixels(arq);
  return px.length ? px.reduce((s, [r, g, b]) => s + (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255, 0) / px.length : .5;
}
// Contraste WCAG entre a parte da logo mais parecida com o fundo (percentil 25 da distância) e o fundo.
const linear = (v) => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; };
const relLum = ([r, g, b]) => .2126 * linear(r) + .7152 * linear(g) + .0722 * linear(b);
function contrasteLogo(arq, fundo) {
  const lf = relLum(hex(fundo)), razao = (l) => (Math.max(l, lf) + .05) / (Math.min(l, lf) + .05);
  const rs = pixels(arq).map((p) => razao(relLum(p))).sort((a, b) => a - b);
  return rs.length ? rs[Math.floor(rs.length * .25)] : 21;
}
// Logo com partes brancas não aparece em fundo claro (e a preta, no escuro): troca essa cor pela cor do texto do modo.
function logoPara(arq, modo, corTexto) {
  if (!arq || !fs.existsSync(arq)) return null;
  const l = lumLogo(arq), alvo = modo === "claro" ? "white" : "black";
  if ((modo === "claro" && l < .55) || (modo === "escuro" && l > .35)) return arq;
  fs.mkdirSync(CACHE, {recursive: true});
  const h = crypto.createHash("md5").update(fs.readFileSync(arq)).update(modo + corTexto).digest("hex").slice(0, 10);
  const out = path.join(CACHE, `logo-${h}.png`);
  if (!fs.existsSync(out)) execFileSync("convert", [arq, "-channel", "RGB", "-fuzz", "22%", "-fill", corTexto, "-opaque", alvo, "+channel", out]);
  return out;
}

// Paletas a partir de uma cor principal e uma de destaque (kit automático, quando só existe a logo).
function paletas(p1, p2) {
  const acc = p2 || mix(p1, "#FFFFFF", .35);
  return {
    escuro: {fundo: mix(p1, "#000000", lum(p1) > .5 ? .85 : .72), fundo2: mix(p1, "#000000", .55), texto: "#FFFFFF", suave: mix("#FFFFFF", p1, .3),
      destaque: lum(p1) < .25 ? mix(p1, "#FFFFFF", .45) : p1, destaque2: acc, marca: mix(p1, "#000000", .35), cartao: "#FFFFFF"},
    claro: {fundo: mix(p1, "#FFFFFF", .95), fundo2: mix(p1, "#FFFFFF", .86), texto: mix(p1, "#000000", .78), suave: mix(p1, "#4A5568", .7),
      destaque: lum(p1) > .6 ? mix(p1, "#000000", .35) : p1, destaque2: acc, marca: mix(acc, "#FFFFFF", .55), cartao: "#FFFFFF"},
  };
}
function coresDaLogo(arq) {
  const linhas = execFileSync("convert", [arq, "-alpha", "on", "-resize", "120x120", "-colors", "8", "-format", "%c", "histogram:info:-"]).toString().split("\n");
  const cores = linhas.map((l) => /^\s*(\d+):\s*\(([\d.]+),([\d.]+),([\d.]+)(?:,([\d.]+))?\)/.exec(l)).filter(Boolean)
    .map((m) => ({n: +m[1], rgb: [+m[2], +m[3], +m[4]].map(Math.round), a: m[5] == null ? 255 : +m[5]})).filter((c) => c.a >= 128)
    .map((c) => ({...c, hex: "#" + c.rgb.map((v) => v.toString(16).padStart(2, "0")).join(""), sat: (Math.max(...c.rgb) - Math.min(...c.rgb)) / 255}))
    .filter((c) => c.sat > .25).sort((a, b) => b.n - a.n);
  return [cores[0]?.hex || "#2F6BFF", cores[1]?.hex];
}

export function listaMarcas() {
  return fs.existsSync(DIR) ? fs.readdirSync(DIR).filter((f) => f.endsWith(".json")).map((f) => f.slice(0, -5)) : [];
}

// Telas capturadas do preview (painel/telas/telas.json) que o Enzo aprovou pelo chat ("usar": true) — só no kit do AlvoManage.
function telasAprovadas(id) {
  if (id !== "alvomanage") return [];
  try {
    return JSON.parse(fs.readFileSync(path.join(ROOT, "painel/telas/telas.json"), "utf8")).filter((t) => t.usar === true)
      .map((t) => ({arquivo: `painel/telas/${t.arquivo}`, descricao: `Tela "${t.nome_na_tela}" do AlvoManage${t.descricao ? ` — ${t.descricao}` : ""}`, alvos: {}}));
  } catch { return []; }
}

// Kit pronto para uso: cores do modo, logo certa para o fundo, telas com caminho absoluto.
export function carregaMarca(id, {modo, logoPadrao} = {}) {
  let kit = id && fs.existsSync(path.join(DIR, `${id}.json`)) ? JSON.parse(fs.readFileSync(path.join(DIR, `${id}.json`), "utf8")) : null;
  if (!kit) {  // sem kit: identidade tirada da logo (comportamento de antes), Jev livre nos pares
    const logo = abs(logoPadrao);
    kit = {id: "auto", nome: "Automática (da logo)", automatico: true, logo, cores: logo && fs.existsSync(logo) ? paletas(...coresDaLogo(logo)) : paletas("#2F6BFF", "#FFD23F"),
      modos: ["escuro", "claro"], pares: null, raio: 16, sombra: 2, destaque: "marcador", telas: []};
  }
  const m = modo && kit.modos.includes(modo) ? modo : kit.modos[0], cores = kit.cores[m];
  const la = logoPara(abs(kit.logo), m, cores.texto), fraco = la && contrasteLogo(la, cores.fundo) < 3;
  return {...kit, modo: m, cores, logo_arte: la, logo_halo: fraco ? (lum(cores.fundo) < .5 ? "#FFFFFF" : "#000000") : null,  // logo sumindo no fundo: só um halo, sem placa
    telas: [...(kit.telas || []), ...telasAprovadas(kit.id)].map((t) => ({...t, arquivo: abs(t.arquivo)})).filter((t) => fs.existsSync(t.arquivo))};
}
