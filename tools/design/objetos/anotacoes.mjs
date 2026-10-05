// Anotações vetoriais com traço de mão: miram em OBJETOS já posicionados (nunca coordenada solta).
// Referência ("alvo", "de", "para"): "id" (caixa) · "id.alvo" (ponto marcado na screenshot) · "id#enfase" (1ª palavra em
// ênfase; "#enfase2" a 2ª) · "id@direita|esquerda|topo|base" (meio da borda) · [x, y] (ponto absoluto, último recurso).
// Camada: {tipo:"anotacao", forma, alvo|de+para, cor, espessura, estilo:"manual"|"limpa", variante, escala, rotacao,
//   intensidade (0-1, opacidade), curva (-1..1), ponta:"aberta"|"cheia"|"nenhuma", lado, distancia, texto, par}
import {marcacao, estilos, ajusta, svgTexto} from "../texto.mjs";

const n2 = (v) => Math.round(v * 100) / 100;
function rng(semente) { let s = [...String(semente)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7) || 7;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647); }

// Referência → caixa {x,y,w,h} (um ponto vira caixa de tamanho 0).
export function resolve(ref, layout) {
  if (Array.isArray(ref)) return {x: ref[0], y: ref[1], w: 0, h: 0};
  const m = /^([\w-]+)(?:\.([\w-]+)|#enfase(\d*)|@(\w+))?$/.exec(String(ref));
  const o = m && layout[m[1]];
  if (!o) throw new Error(`anotação: alvo "${ref}" não existe`);
  const [x, y, w, h] = o.caixa;
  if (m[2]) { const p = o.alvos?.[m[2]]; if (!p) throw new Error(`anotação: "${m[1]}" não tem o alvo "${m[2]}"`); return {x: p[0], y: p[1], w: 0, h: 0}; }
  if (m[3] !== undefined) { const e = o.enfases?.[(+m[3] || 1) - 1]; if (!e) throw new Error(`anotação: "${m[1]}" não tem ênfase ${m[3] || 1}`); return {x: e[0], y: e[1], w: e[2], h: e[3]}; }
  if (m[4]) { const p = {direita: [x + w, y + h / 2], esquerda: [x, y + h / 2], topo: [x + w / 2, y], base: [x + w / 2, y + h]}[m[4]];
    return {x: p[0], y: p[1], w: 0, h: 0}; }
  return {x, y, w, h};
}
const centro = (b) => [b.x + b.w / 2, b.y + b.h / 2];
// Ponto na borda da caixa na direção de "rumo" (a seta sai/chega na borda, com folga), não no meio do objeto.
function naBorda(b, rumo, folga) {
  const [cx, cy] = centro(b), dx = rumo[0] - cx, dy = rumo[1] - cy, d = Math.hypot(dx, dy) || 1;
  const t = b.w || b.h ? Math.min(b.w / 2 / Math.abs(dx || 1e-9), b.h / 2 / Math.abs(dy || 1e-9)) : 0;
  return [cx + dx * t + dx / d * folga, cy + dy * t + dy / d * folga];
}

// Traço de mão: polilinha com tremor leve, suavizada por curvas quadráticas.
function traco(pts, r, tremor) {
  const p = pts.map(([x, y], i) => i && i < pts.length - 1 ? [x + (r() - .5) * tremor, y + (r() - .5) * tremor] : [x, y]);
  let d = `M${n2(p[0][0])} ${n2(p[0][1])}`;
  for (let i = 1; i < p.length - 1; i++) d += `Q${n2(p[i][0])} ${n2(p[i][1])} ${n2((p[i][0] + p[i + 1][0]) / 2)} ${n2((p[i][1] + p[i + 1][1]) / 2)}`;
  return d + `L${n2(p[p.length - 1][0])} ${n2(p[p.length - 1][1])}`;
}
const linha = (d, c, esp, extra = "") => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${n2(esp)}" stroke-linecap="round" stroke-linejoin="round"${extra}/>`;
const bez = (a, k, b, t) => [(1 - t) ** 2 * a[0] + 2 * (1 - t) * t * k[0] + t * t * b[0], (1 - t) ** 2 * a[1] + 2 * (1 - t) * t * k[1] + t * t * b[1]];

function seta(c, L, r, u) {
  const A = resolve(c.de, L), B = resolve(c.para, L), esp = c.espessura || u * .7, man = c.estilo !== "limpa";
  const fb = u * (B.w || B.h ? 1.5 : 3), curva0 = c.curva ?? (man ? .35 : 0);
  const chegadas = [naBorda(B, centro(A), fb), ...(B.w || B.h ? [[B.x + B.w / 2, B.y - fb], [B.x - fb, B.y + B.h / 2], [B.x + B.w + fb, B.y + B.h / 2], [B.x + B.w / 2, B.y + B.h + fb]] : [])];
  // desvio: a seta nunca cruza texto nem cartão. O dono da origem/destino só sai da lista quando a referência é o objeto
  // inteiro ("nota_01"); em "titulo_01#enfase" o resto do título continua sendo obstáculo.
  const livres = [c.de, c.para].filter((x) => !/[.#@]/.test(String(x))).map(String);
  const obst = Object.entries(L).filter(([id, o]) => !livres.includes(id) && (o.tipo === "texto" || o.tipo === "flutuante")).flatMap(([, o]) => o.linhas_caixas || [o.caixa]);
  const dentroDe = (b, [x, y]) => x > b.x - u && x < b.x + b.w + u && y > b.y - u && y < b.y + b.h + u;
  const saidas = [naBorda(A, centro(B), u * 2), ...(A.w || A.h ? [[A.x + A.w + u * 2, A.y + A.h / 2], [A.x - u * 2, A.y + A.h / 2], [A.x + A.w / 2, A.y - u * 2], [A.x + A.w / 2, A.y + A.h + u * 2]] : [])];
  const ctrl = (s, e, cv) => { const dx = e[0] - s[0], dy = e[1] - s[1]; return [(s[0] + e[0]) / 2 - dy * cv * .5, (s[1] + e[1]) / 2 + dx * cv * .5]; };
  const bate = (s, e, cv) => { const k = ctrl(s, e, cv); return Array.from({length: 40}, (_, i) => bez(s, k, e, (i + 1) / 41))
    .filter((p) => !dentroDe(A, p) && !dentroDe(B, p) && obst.some(([ox, oy, ow, oh]) => p[0] > ox - u && p[0] < ox + ow + u && p[1] > oy - u && p[1] < oy + oh + u)).length; };
  const curvas = c.curva_fixa ? [curva0] : [curva0, ...[.2, .45, .7, .95, 1.2, 1.6, 2.1].flatMap((v) => [v * Math.sign(curva0 || 1), -v * Math.sign(curva0 || 1)])];
  let s = saidas[0], e = chegadas[0], curva = curva0, melhor = Infinity;
  for (const [i, sx] of saidas.entries()) for (const [j, ex] of chegadas.entries()) for (const cv of curvas) {
    // menos colisão; empate: saída/chegada naturais, curva perto da pedida
    const nota = bate(sx, ex, cv) * 1000 + (i + j) * 2 + Math.abs(cv - curva0);
    if (nota < melhor) { melhor = nota; s = sx; e = ex; curva = cv; }
  }
  const dist = Math.hypot(e[0] - s[0], e[1] - s[1]), k = ctrl(s, e, curva);
  const pts = Array.from({length: 9}, (_, i) => bez(s, k, e, i / 8));
  const ang = Math.atan2(e[1] - k[1], e[0] - k[0]), cab = Math.min(u * 3.2, dist * .3) * (c.escala || 1);
  const ab = (da, f = 1) => [e[0] - Math.cos(ang + da) * cab * f, e[1] - Math.sin(ang + da) * cab * f];
  const ponta = c.ponta === "nenhuma" ? "" : c.ponta === "cheia"
    ? `<path d="M${n2(e[0])} ${n2(e[1])}L${ab(.42).map(n2).join(" ")}L${ab(-.42).map(n2).join(" ")}Z" fill="${c.cor}"/>`
    : linha(`M${ab(.5, man ? .9 + r() * .2 : 1).map(n2).join(" ")}L${n2(e[0])} ${n2(e[1])}L${ab(-.5, man ? .9 + r() * .2 : 1).map(n2).join(" ")}`, c.cor, esp);
  return {svg: linha(man ? traco(pts, r, u * .35) : `M${n2(s[0])} ${n2(s[1])}Q${n2(k[0])} ${n2(k[1])} ${n2(e[0])} ${n2(e[1])}`, c.cor, esp) + ponta,
    caixa: caixaDe([s, e, k])};
}
const caixaDe = (pts) => { const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  return [n2(Math.min(...xs)), n2(Math.min(...ys)), n2(Math.max(...xs) - Math.min(...xs)), n2(Math.max(...ys) - Math.min(...ys))]; };

// Rótulo curto (balão, etiqueta, chamada): manuscrito por padrão.
function rotulo(c, ctx, x, y, largura, alinhamento = "esquerda") {
  const segs = estilos(marcacao(c.texto || ""), c.par || ctx.par, c.papel_texto || "manuscrito", {tamanho: c.tamanho || ctx.G.tipo.manuscrito[0] * .8, cor: c.cor_texto || c.cor});
  const comp = ajusta(segs, {largura, entrelinha: 1.05, alinhamento}, {maxLinhas: 3});
  return {comp, svg: (dx = 0, dy = 0) => svgTexto(comp, x + dx, y + dy)};
}
const dentro = (x, w, ctx) => Math.min(Math.max(x, ctx.G.m.esq * .5), ctx.W - ctx.G.m.dir * .5 - w);  // rótulo nunca sai da arte
// Posição ao lado do alvo, a "distancia" unidades de grid.
function aoLado(b, lado, dist) {
  return {direita: [b.x + b.w + dist, b.y + b.h / 2], esquerda: [b.x - dist, b.y + b.h / 2], acima: [b.x + b.w / 2, b.y - dist], abaixo: [b.x + b.w / 2, b.y + b.h + dist]}[lado || "direita"];
}

const FORMAS = {
  seta,
  "seta-curva": (c, L, r, u) => seta({...c, curva: c.curva ?? .7}, L, r, u),
  circulo: (c, L, r, u) => {
    const b = resolve(c.alvo, L), pad = u * 2.2 * (c.escala || 1), rx = b.w / 2 + pad + (b.w ? 0 : u * 3), ry = b.h / 2 + pad * .8 + (b.h ? 0 : u * 3), [cx, cy] = centro(b);
    const voltas = c.variante === "duplo" ? 1.9 : 1.12, a0 = -2.2 + r() * .6, pts = [];
    for (let i = 0; i <= 36 * voltas; i++) { const a = a0 + i / 36 * Math.PI * 2, k = 1 + (r() - .5) * .05 + i / 36 * .04;
      pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]); }
    return {svg: linha(traco(pts, r, u * .2), c.cor, c.espessura || u * .6, ` transform="rotate(${n2(c.rotacao ?? (r() - .5) * 6)} ${n2(cx)} ${n2(cy)})"`), caixa: [n2(cx - rx), n2(cy - ry), n2(rx * 2), n2(ry * 2)]};
  },
  sublinhado: (c, L, r, u) => {
    const b = resolve(c.alvo, L), y = b.y + b.h + u * 1.2, esp = c.espessura || u * .7;
    if (c.variante === "onda") { const pts = []; for (let x = b.x; x <= b.x + b.w; x += u * 1.6) pts.push([x, y + ((pts.length % 2) ? u * .8 : -u * .2)]);
      return {svg: linha(traco(pts, r, 1), c.cor, esp), caixa: [b.x, y - u, b.w, u * 2]}; }
    let svg = linha(traco([[b.x - u * .5, y + r() * u * .4], [b.x + b.w * .5, y - u * .35], [b.x + b.w + u, y + u * .3]], r, u * .3), c.cor, esp);
    if (c.variante === "duplo") svg += linha(traco([[b.x + u, y + u * 1.3], [b.x + b.w * .55, y + u * .9], [b.x + b.w - u * .5, y + u * 1.5]], r, u * .3), c.cor, esp * .8);
    return {svg, caixa: [b.x, y - u, b.w + u, u * 3]};
  },
  risco: (c, L, r, u) => {
    const b = resolve(c.alvo, L), y = b.y + b.h * .55, esp = c.espessura || u * .6;
    const pts = c.variante === "rabisco" ? Array.from({length: 7}, (_, i) => [b.x + b.w * i / 6, y + (i % 2 ? -1 : 1) * b.h * .22])
      : [[b.x - u * .5, y + u * .3], [b.x + b.w + u * .5, y - u * .5]];
    return {svg: linha(traco(pts, r, u * .3), c.cor, esp), caixa: [b.x, b.y, b.w, b.h]};
  },
  // atrás do texto: faixa de marca-texto com bordas irregulares
  marcador: (c, L, r, u) => {
    const b = resolve(c.alvo, L), pad = u * .6, x0 = b.x - pad, x1 = b.x + b.w + pad, y0 = b.y + b.h * .15, y1 = b.y + b.h + u * .5;
    const pts = [[x0 + r() * u, y0 + (r() - .5) * u], [x1 - r() * u * .5, y0 - u * .2 + (r() - .5) * u], [x1 + r() * u * .4, y1 + (r() - .5) * u * .6], [x0 - r() * u * .4, y1 + (r() - .5) * u * .6]];
    return {svg: `<path d="M${pts.map((p) => p.map(n2).join(" ")).join("L")}Z" fill="${c.cor}" opacity="${c.intensidade ?? .55}"/>`, caixa: [x0, y0, x1 - x0, y1 - y0], atras: true};
  },
  colchete: (c, L, r, u) => {
    const b = resolve(c.alvo, L), esq = c.lado === "esquerda", x = esq ? b.x - u * 2.5 : b.x + b.w + u * 2.5, d = esq ? 1 : -1, ab = u * 1.6 * d * -1;
    const d_ = `M${n2(x - ab)} ${n2(b.y)}Q${n2(x)} ${n2(b.y)} ${n2(x)} ${n2(b.y + u * 2)}L${n2(x)} ${n2(b.y + b.h / 2 - u)}L${n2(x + ab * .8)} ${n2(b.y + b.h / 2)}L${n2(x)} ${n2(b.y + b.h / 2 + u)}L${n2(x)} ${n2(b.y + b.h - u * 2)}Q${n2(x)} ${n2(b.y + b.h)} ${n2(x - ab)} ${n2(b.y + b.h)}`;
    return {svg: linha(d_, c.cor, c.espessura || u * .55), caixa: [Math.min(x, x + ab) - u, b.y, u * 4, b.h]};
  },
  rabisco: (c, L, r, u) => {
    const [x, y] = c.alvo ? aoLado(resolve(c.alvo, L), c.lado, u * (c.distancia ?? 3)) : [c.x, c.y], k = u * 2.2 * (c.escala || 1), pts = [];
    for (let i = 0; i <= 26; i++) { const a = i / 26 * Math.PI * 4.2; pts.push([x + i / 26 * k * 4 + Math.cos(a) * k * .6, y + Math.sin(a) * k * .6]); }
    return {svg: linha(traco(pts, r, u * .15), c.cor, c.espessura || u * .5), caixa: [x - k, y - k, k * 5, k * 2]};
  },
  estrela: (c, L, r, u) => {
    const [x, y] = c.alvo ? aoLado(resolve(c.alvo, L), c.lado || "acima", u * (c.distancia ?? 2)) : [c.x, c.y], k = u * 2.6 * (c.escala || 1);
    const um = (cx, cy, s) => `<path d="M${n2(cx)} ${n2(cy - s)}Q${n2(cx + s * .12)} ${n2(cy - s * .12)} ${n2(cx + s)} ${n2(cy)}Q${n2(cx + s * .12)} ${n2(cy + s * .12)} ${n2(cx)} ${n2(cy + s)}Q${n2(cx - s * .12)} ${n2(cy + s * .12)} ${n2(cx - s)} ${n2(cy)}Q${n2(cx - s * .12)} ${n2(cy - s * .12)} ${n2(cx)} ${n2(cy - s)}Z" fill="${c.cor}"/>`;
    return {svg: um(x, y, k) + (c.variante === "simples" ? "" : um(x + k * 1.3, y - k * .9, k * .45) + um(x - k * 1.1, y + k * .9, k * .3)), caixa: [x - k * 1.5, y - k * 1.5, k * 3.2, k * 3]};
  },
  "linha-chamada": (c, L, r, u, ctx) => {
    const b = resolve(c.alvo, L), p0 = b.w || b.h ? centro(b) : [b.x, b.y], esq = c.lado === "esquerda";
    let [lx, ly] = aoLado(b, c.lado, u * (c.distancia ?? 10));
    if (c.fora) { const f = resolve(c.fora, L); lx = esq ? Math.min(lx, f.x - u * 2) : Math.max(lx, f.x + f.w + u * 2); }
    const larg = Math.max(u * 14, Math.min(u * 29, esq ? lx - ctx.G.m.esq * .5 - u : ctx.W - ctx.G.m.dir * .5 - lx - u));
    const t = rotulo(c, ctx, esq ? lx - u - larg : lx + u, ly - u * 1.5, larg, esq ? "direita" : "esquerda");
    return {svg: `<circle cx="${n2(p0[0])}" cy="${n2(p0[1])}" r="${n2(u * .9)}" fill="${c.cor}"/>` + linha(`M${n2(p0[0])} ${n2(p0[1])}L${n2(lx)} ${n2(ly)}`, c.cor, c.espessura || u * .35) + t.svg(),
      caixa: caixaDe([p0, [lx, ly], [esq ? lx - u - larg : lx + u + larg, ly + t.comp.altura]])};
  },
  balao: (c, L, r, u, ctx) => {
    const b = resolve(c.alvo, L), [ax, ay] = aoLado(b, c.lado || "acima", u * (c.distancia ?? 4)), larg = u * (c.largura_u || 30), pad = u * 2;
    const t = rotulo({...c, cor_texto: c.cor_texto || "#FFFFFF", papel_texto: c.papel_texto || "corpo"}, ctx, 0, 0, larg - 2 * pad);
    const w = t.comp.largura + 2 * pad, h = t.comp.altura + 2 * pad, x = dentro(ax - w / 2, w, ctx), y = c.lado === "abaixo" ? ay + u * 2.2 : ay - h - u * 2.2;
    const tx = Math.min(Math.max(ax, x + u * 3), x + w - u * 3), cauda = c.lado === "abaixo" ? `M${n2(tx - u * 1.5)} ${n2(y + 1)}L${n2(ax)} ${n2(ay)}L${n2(tx + u * 1.5)} ${n2(y + 1)}Z` : `M${n2(tx - u * 1.5)} ${n2(y + h - 1)}L${n2(ax)} ${n2(ay)}L${n2(tx + u * 1.5)} ${n2(y + h - 1)}Z`;
    return {svg: `<rect x="${n2(x)}" y="${n2(y)}" width="${n2(w)}" height="${n2(h)}" rx="${n2(u * 2)}" fill="${c.cor}"/><path d="${cauda}" fill="${c.cor}"/>` + t.svg(x + pad, y + pad), caixa: [n2(x), n2(y), n2(w), n2(h)]};
  },
  etiqueta: (c, L, r, u, ctx) => {
    const b = resolve(c.alvo, L), [ax, ay] = aoLado(b, c.lado || "direita", u * (c.distancia ?? 2));
    const t = rotulo({...c, cor_texto: c.cor_texto || "#FFFFFF", papel_texto: "apoio"}, ctx, 0, 0, u * 60), pad = u * 1.4;
    const w = t.comp.largura + 2 * pad * 1.4, h = t.comp.altura + 2 * pad, esq = c.lado === "esquerda";
    const x = dentro(c.lado === "acima" || c.lado === "abaixo" ? ax - w / 2 : esq ? ax - w : ax, w, ctx), y = c.lado === "acima" ? ay - h : c.lado === "abaixo" ? ay : ay - h / 2;
    const rot = c.rotacao ?? (r() - .5) * 8;
    return {svg: `<g transform="rotate(${n2(rot)} ${n2(x + w / 2)} ${n2(y + h / 2)})"><rect x="${n2(x)}" y="${n2(y)}" width="${n2(w)}" height="${n2(h)}" rx="${n2(h / 2)}" fill="${c.cor}"/>${t.svg(x + pad * 1.4, y + pad)}</g>`, caixa: [n2(x), n2(y), n2(w), n2(h)]};
  },
};

export function anotacao(c, ctx, layout) {
  const f = FORMAS[c.forma];
  if (!f) throw new Error(`anotação: forma "${c.forma}" não existe (${Object.keys(FORMAS).join(", ")})`);
  const r = rng(`${c.id}|${c.variante || ""}|${ctx.semente ?? ""}`), out = f({cor: "#111111", ...c}, layout, r, ctx.G.u, ctx);
  const op = c.intensidade != null && c.forma !== "marcador" ? ` opacity="${c.intensidade}"` : "";
  return {svg: op ? `<g${op}>${out.svg}</g>` : out.svg, caixa: out.caixa, atras: out.atras};
}
export const FORMAS_ANOTACAO = Object.keys(FORMAS);
