// Grid editorial: margens, 12 colunas x 12 linhas na área útil, unidade de 8 px (em 1080 de largura),
// tokens de espaço e escala tipográfica por nível de hierarquia. As composições posicionam por aqui, não por coordenada solta.
export const NIVEIS = {titulo: 1, corpo: 2, apoio: 4, manuscrito: 4, legenda: 4};

export function grade([W, H]) {
  const u = W / 135, stories = H / W > 1.6;
  // stories: topo e base ficam fora das faixas do Instagram (nome/caixa de resposta)
  const m = {esq: 11 * u, dir: 11 * u, topo: stories ? H * .12 : 10 * u, base: stories ? H * .17 : 10 * u};
  const gut = 3 * u, larg = W - m.esq - m.dir, alt = H - m.topo - m.base;
  const colW = (larg - gut * 11) / 12, linH = (alt - gut * 11) / 12;
  const base = W * (stories ? .042 : .035);  // corpo (nível 2) ≈ 38 px em 1080; stories 20% maior (regra da casa)
  return {
    W, H, u, m, gut, larg, alt, stories,
    // col(1, 7) = da coluna 1, ocupando 7; linha idem na altura útil
    col: (c, span = 1) => ({x: m.esq + (c - 1) * (colW + gut), w: span * colW + (span - 1) * gut}),
    linha: (l, span = 1) => ({y: m.topo + (l - 1) * (linH + gut), h: span * linH + (span - 1) * gut}),
    linhasMax: {titulo: stories ? 5 : 4, corpo: stories ? 7 : 5, apoio: 2, manuscrito: 3, legenda: 3},
    esp: {xs: u, s: 2 * u, m: 3 * u, l: 5 * u, xl: 8 * u, xxl: 12 * u},
    // tamanho padrão e faixa permitida por papel (o título encolhe até o mínimo para caber; nunca passa do máximo)
    tipo: {titulo: [base * 2.6, base * 1.7, base * 3.6], corpo: [base, base * .85, base * 1.15], apoio: [base * .7, base * .6, base * .8],
      manuscrito: [base * 1.4, base, base * 1.8], legenda: [base * .75, base * .62, base * .85]},
  };
}

// Hierarquia: o nível 1 tem de ser pelo menos 1,8x o nível 2, e nada de apoio maior que o corpo. Devolve avisos.
export function confereHierarquia(textos) {
  const av = [], por = (p) => textos.filter((t) => t.papel === p).map((t) => t.tamanho);
  const t1 = Math.min(...por("titulo")), t2 = Math.max(...por("corpo")), t4 = Math.max(...por("apoio"));
  if (isFinite(t1) && isFinite(t2) && t1 < t2 * 1.8) av.push(`hierarquia: título (${Math.round(t1)}px) menor que 1,8x o corpo (${Math.round(t2)}px)`);
  if (isFinite(t4) && isFinite(t2) && t4 > t2) av.push("hierarquia: texto de apoio maior que o corpo");
  return av;
}

// Respiro: fração da arte coberta por objetos de conteúdo (sem fundo nem decoração) e quem invade a margem.
export function respiro(layout, G) {
  const cx = Math.ceil(G.W / 20), cy = Math.ceil(G.H / 20), grid = new Uint8Array(cx * cy), av = [];
  for (const [id, o] of Object.entries(layout)) {
    if (o.tipo === "fundo" || o.nivel === 5) continue;
    const [x, y, w, h] = o.caixa;
    for (let i = Math.max(0, Math.floor(x / 20)); i < Math.min(cx, Math.ceil((x + w) / 20)); i++)
      for (let j = Math.max(0, Math.floor(y / 20)); j < Math.min(cy, Math.ceil((y + h) / 20)); j++) grid[j * cx + i] = 1;
    if (o.tipo === "texto" && (x < G.m.esq - 2 || x + w > G.W - G.m.dir + 2 || y < G.m.topo - 2 || y + h > G.H - G.m.base + 2)) av.push(`${id}: texto fora da área segura`);
  }
  return {ocupacao: Math.round(grid.reduce((s, v) => s + v, 0) / grid.length * 100) / 100, avisos: av};
}
