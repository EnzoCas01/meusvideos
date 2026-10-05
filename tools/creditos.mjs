#!/usr/bin/env node
// Gera out/<peca>-creditos.txt a partir de src/utils/imagens-<sufixo>.ts
// Uso: node tools/creditos.mjs <peca> <sufixo>
//   node tools/creditos.mjs disney df
//   node tools/creditos.mjs netflix nf
import fs from "node:fs";
import path from "node:path";
import {createRequire} from "node:module";

const [, , peca, sufixo] = process.argv;
if (!peca || !sufixo) {
	console.error("Uso: node tools/creditos.mjs <peca> <sufixo>   ex.: node tools/creditos.mjs disney df");
	process.exit(1);
}

const root = process.cwd();
const src = path.join(root, `src/utils/imagens-${sufixo}.ts`);
const ts = createRequire(path.join(root, "package.json"))("typescript");
const code = fs.readFileSync(src, "utf8");
const js = ts.transpileModule(code, {
	compilerOptions: {module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020},
}).outputText;
const tmp = path.join(root, `.creditos-${sufixo}.mjs`);
fs.writeFileSync(tmp, js);

const mod = await import(`file://${tmp}`);
fs.unlinkSync(tmp);
const IMG = mod[`IMG_${sufixo.toUpperCase()}`] ?? mod.IMG;
if (!IMG) {
	console.error(`Não achei um export IMG_${sufixo.toUpperCase()} nem IMG em ${src}`);
	process.exit(1);
}

const titulo = peca[0].toUpperCase() + peca.slice(1);
let out = `CRÉDITOS DAS IMAGENS — ${titulo} (série "Você sabia")\n\n`;
out += "Imagens sob licença aberta / domínio público. Logotipos e marcas pertencem aos seus donos.\n\n";
let n = 0;
for (const r of Object.values(IMG)) {
	// scenes: [] = image kept on disk but not used in the film -> no credit
	if (Array.isArray(r.scenes) && r.scenes.length === 0) continue;
	n++;
	const autor = r.author ?? r.autor ?? "Autor não informado";
	const licenca = r.license ?? r.licenca ?? "Licença não informada";
	const fonte = r.source ?? r.fonte ?? "";
	out += `• ${autor} — ${licenca}\n  ${fonte}\n`;
}
const trilha = path.join(root, `public/audio/${peca}/CREDITO.txt`);
if (fs.existsSync(trilha)) {
	out += `\nTRILHA (atribuição obrigatória):\n${fs.readFileSync(trilha, "utf8").trim()}\n\nNarração sintetizada por computador.\n`;
} else {
	out += "\nNarração e trilha sintetizadas por computador.\n";
}

const dest = path.join(root, `out/${peca}-creditos.txt`);
fs.writeFileSync(dest, out);
console.log(`${n} imagens -> ${dest}`);
