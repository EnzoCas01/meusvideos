#!/usr/bin/env node
// Gera src/utils/imagens-cc.ts a partir de public/images/cocacola/fontes.json.
// O campo `scenes` começa vazio: o agente motion preenche com as cenas onde usou cada imagem
// (imagem com scenes: [] não entra nos créditos, ver tools/creditos.mjs).
// Uso: node tools/imagens-cc.mjs
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const src = path.join(root, "public/images/cocacola/fontes.json");
const doc = JSON.parse(fs.readFileSync(src, "utf8"));
const list = doc.imagens ?? doc.images ?? [];

const key = (p) =>
	path
		.basename(p)
		.replace(/\.[a-z0-9]+$/i, "")
		.replace(/[^a-zA-Z0-9]+/g, "_")
		.replace(/^(\d)/, "_$1")
		.toUpperCase();

const esc = (s) => String(s ?? "").replaceAll("\\", "\\\\").replaceAll('"', '\\"');

// Preserva o campo `scenes` já preenchido pelo agente motion: regerar não pode apagar
// em que cena cada imagem entrou (é o que decide os créditos).
const dest0 = path.join(root, "src/utils/imagens-cc.ts");
const previous = new Map();
if (fs.existsSync(dest0)) {
	const old = fs.readFileSync(dest0, "utf8");
	const re = /path:\s*"([^"]+)"[\s\S]*?scenes:\s*\[([^\]]*)\]/g;
	let m;
	while ((m = re.exec(old))) {
		const nums = m[2].trim();
		if (nums) previous.set(m[1], nums);
	}
}

let out = `/** Toda imagem real da peça "Coca-Cola" (esta lista vira os créditos via tools/creditos.mjs). */
export type ImageCC = {
	/** Path under public/, for staticFile(). */
	path: string;
	width: number;
	height: number;
	author: string;
	license: string;
	source: string;
	/** What the picture actually SHOWS — a modern photo is never stamped with an old date. */
	epoca: string;
	/** Scenes (1-based) where it appears. Empty means kept on disk but unused. */
	scenes: number[];
	note?: string;
};

/**
 * Gerado por tools/imagens-cc.mjs a partir de public/images/cocacola/fontes.json.
 * Todo o material vem do Wikimedia Commons / Openverse com licença declarada.
 */
export const IMG_CC = {
`;

const seen = new Set();
for (const r of list) {
	let k = key(r.path);
	while (seen.has(k)) k += "_2";
	seen.add(k);
	out += `\t${k}: {
		path: "${esc(r.path)}",
		width: ${Number(r.width) || 0},
		height: ${Number(r.height) || 0},
		author: "${esc(r.author)}",
		license: "${esc(r.license)}",
		source: "${esc(r.source)}",
		epoca: "${esc(r.epoca)}",
		scenes: [${previous.get(r.path) ?? ""}] as number[],
		note: "${esc(r.note ?? r.title ?? "")}",
	},\n`;
}

out += `} satisfies Record<string, ImageCC>;

export const ALL_IMAGES_CC: ImageCC[] = Object.values(IMG_CC);
`;

const dest = path.join(root, "src/utils/imagens-cc.ts");
fs.writeFileSync(dest, out);
console.log(`${list.length} imagens -> ${dest}`);
