#!/usr/bin/env node
// Ponte do orquestrador (Python) com o motor editorial (Node).
//   node tools/design/monta.mjs kit <id|-> [logoPadrao]      → o que o Jev pode escolher: modos, pares, telas, estilo
//   node tools/design/monta.mjs compoe <pedido.json> <pasta> → <pasta>/vN.json (spec v2 de cada versão)
// pedido: {dims, marca:{id, logoPadrao, modo}, logo_px, versoes:[[{sistema, conteudo, direcao}, ...slides]]}
import fs from "node:fs";
import path from "node:path";
import {execFileSync} from "node:child_process";
import {carregaMarca} from "./marca.mjs";
import {compor, SISTEMAS} from "./composicoes.mjs";
import {PARES} from "./texto.mjs";

const [cmd, a, b] = process.argv.slice(2);
if (cmd === "kit") {
  const k = carregaMarca(a === "-" ? null : a, {logoPadrao: b});
  const pares = k.pares || Object.keys(PARES).filter((p) => !p.startsWith("_") && PARES[p].titulo);
  console.log(JSON.stringify({id: k.id, automatico: !!k.automatico, modos: k.modos, par_padrao: k.par_padrao || pares[0], estilo: k.estilo || "",
    pares: Object.fromEntries(pares.map((p) => [p, PARES[p].descricao])), telas: k.telas.map(({arquivo, descricao, alvos}) => ({arquivo, descricao, alvos})), sistemas: SISTEMAS}));
} else if (cmd === "compoe") {
  const ped = JSON.parse(fs.readFileSync(a, "utf8"));
  fs.mkdirSync(b, {recursive: true});
  const k = carregaMarca(ped.marca.id, {modo: ped.marca.modo, logoPadrao: ped.marca.logoPadrao});
  // logo: logo_px do painel = largura máxima; a altura sai da proporção real
  let logo = {};
  if (k.logo_arte) { const [lw, lh] = execFileSync("identify", ["-format", "%w %h", k.logo_arte]).toString().split(" ").map(Number), w = ped.logo_px || 190;
    logo = {logo: k.logo_arte, logo_halo: k.logo_halo, logo_w: w, logo_h: Math.round(w * lh / lw)}; }
  ped.versoes.forEach((slides, n) => {
    const spec = {versao: 2, dims: ped.dims, marca: k.id, modo: k.modo,
      slides: slides.map((s) => compor(s.sistema, {...s.conteudo, ...logo}, k.cores, s.direcao, ped.dims))};
    fs.writeFileSync(path.join(b, `v${n + 1}.json`), JSON.stringify(spec, null, 1));
  });
  console.log(JSON.stringify({ok: true, versoes: ped.versoes.length, modo: k.modo}));
} else {
  throw new Error("uso: monta.mjs kit <id|-> [logo] | compoe <pedido.json> <pasta>");
}
