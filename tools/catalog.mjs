#!/usr/bin/env node
// Regenerates the catalog from the library: catalog/componentes.json, catalog/temas.json and catalog/index.json.
// The director (AI) reads only these compact files — never the component code.
// Usage: node tools/catalog.mjs
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BIB = path.join(RAIZ, "biblioteca");
const CAT = path.join(RAIZ, "catalog");
const REG = path.join(RAIZ, "src/engine/registro.ts");
const REG_TEMAS = path.join(RAIZ, "biblioteca/temas/registro.ts");

const lerJson = (f) => {
	try {
		return JSON.parse(fs.readFileSync(f, "utf8"));
	} catch {
		return null;
	}
};

const problemas = [];
const OBRIGATORIOS = ["id", "tipo", "formatos", "estilos", "descricao", "uso_recomendado"];

// ---------- componentes ----------
const componentes = [];
const compDir = path.join(BIB, "componentes");
const regText = fs.readFileSync(REG, "utf8");
for (const pasta of fs.readdirSync(compDir).sort()) {
	if (pasta.startsWith("_") || !fs.statSync(path.join(compDir, pasta)).isDirectory()) continue;
	const meta = lerJson(path.join(compDir, pasta, "meta.json"));
	if (!meta) {
		problemas.push(`componentes/${pasta}: meta.json ausente ou inválido`);
		continue;
	}
	const faltando = OBRIGATORIOS.filter((k) => meta[k] === undefined);
	if (faltando.length) problemas.push(`componentes/${pasta}: meta.json sem: ${faltando.join(", ")}`);
	if (meta.id !== pasta) problemas.push(`componentes/${pasta}: meta.id "${meta.id}" difere da pasta`);
	if (!Array.isArray(meta.parametros)) {
		meta.parametros = meta.parametros ?? {};
		if (typeof meta.parametros !== "object") problemas.push(`componentes/${pasta}: parametros precisa ser objeto`);
	}
	const registrado = regText.includes(`"${pasta}"`) || regText.includes(`'${pasta}'`) || new RegExp(`\\b${pasta}\\s*:`).test(regText);
	if (!registrado) problemas.push(`componentes/${pasta}: não registrado em src/engine/registro.ts`);
	componentes.push({...meta, registrado});
}

// ---------- temas ----------
const temas = [];
const temasDir = path.join(BIB, "temas");
const regTemasText = fs.readFileSync(REG_TEMAS, "utf8");
for (const pasta of fs.readdirSync(temasDir).sort()) {
	if (!fs.statSync(path.join(temasDir, pasta)).isDirectory()) continue;
	const meta = lerJson(path.join(temasDir, pasta, "meta.json"));
	if (!meta) continue;
	if (meta.id !== pasta) problemas.push(`temas/${pasta}: meta.id difere da pasta`);
	if (!regTemasText.includes(`${pasta}:`)) problemas.push(`temas/${pasta}: não registrado em biblioteca/temas/registro.ts`);
	temas.push(meta);
}

// ---------- saída ----------
fs.mkdirSync(CAT, {recursive: true});
const cabecalho = {gerado_em: new Date().toISOString(), projeto: "meusvideos"};
fs.writeFileSync(path.join(CAT, "componentes.json"), JSON.stringify({...cabecalho, componentes}, null, 1) + "\n");
fs.writeFileSync(path.join(CAT, "temas.json"), JSON.stringify({...cabecalho, temas}, null, 1) + "\n");
fs.writeFileSync(
	path.join(CAT, "index.json"),
	JSON.stringify(
		{
			...cabecalho,
			total_componentes: componentes.length,
			total_temas: temas.length,
			componentes: componentes.map((c) => ({id: c.id, tipo: c.tipo, formatos: c.formatos, estilos: c.estilos, uso_recomendado: c.uso_recomendado})),
			temas: temas.map((t) => ({id: t.id, estilos: t.estilos, descricao: t.descricao})),
		},
		null,
		1,
	) + "\n",
);

console.log(`catalog/ atualizado: ${componentes.length} componentes, ${temas.length} temas`);
for (const p of problemas) console.log(`AVISO: ${p}`);
process.exit(problemas.length ? 1 : 0);
