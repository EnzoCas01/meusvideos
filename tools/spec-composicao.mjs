#!/usr/bin/env node
// Turns a spec into a Remotion piece — deterministic, no AI:
//   node tools/spec-composicao.mjs src/specs/<sx>.json
// Writes:
//   src/<Peca>.tsx            wrapper: Motor + spec (validated) + custom scenes
//   src/specs/<sx>.cenas.json scene frames derived from the spec (for the review step)
// and registers <Composition id="<Peca>"> in src/Root.tsx (idempotent).
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const specPath = path.resolve(process.argv[2] ?? "");
if (!specPath.startsWith(path.join(RAIZ, "src", "specs"))) {
	console.error("uso: node tools/spec-composicao.mjs src/specs/<sx>.json");
	process.exit(2);
}
const spec = JSON.parse(fs.readFileSync(specPath, "utf8"));

const erros = [];
if (!/^[A-Z][A-Za-z0-9]{2,40}$/.test(spec.peca ?? "")) erros.push("peca precisa ser PascalCase");
if (!/^[a-z]{2,5}$/.test(spec.sx ?? "")) erros.push("sx precisa ter 2 a 5 letras minúsculas");
if (!Array.isArray(spec.dims) || spec.dims.length !== 2) erros.push("dims precisa ser [largura, altura]");
if (!Array.isArray(spec.cenas) || !spec.cenas.length) erros.push("cenas precisa ter pelo menos 1 cena");
if (erros.length) {
	console.error("spec inválida:\n- " + erros.join("\n- "));
	process.exit(1);
}

const peca = spec.peca;
const sx = spec.sx;
const SX = sx.toUpperCase();

// Scene frames (mirrors src/engine/Motor.tsx cenaFrames)
const padrao = spec.formato === "video" ? 90 : 60;
let t = 0;
const cs = spec.cenas.map((c) => {
	const from = c.from ?? t;
	const dur = c.durationInFrames ?? padrao;
	t = from + dur;
	return {...c, from, durationInFrames: dur};
});

const visual = (c) => {
	if (c.custom) return `cena custom: ${c.custom}`;
	if (c.layout) return `layout ${c.layout.componente}`;
	const partes = [];
	if (c.midia) partes.push(c.midia.arquivo);
	if (c.texto) partes.push(`texto ${c.texto.componente}`);
	if (c.cta) partes.push(`cta ${c.cta.componente}`);
	return partes.join(" · ") || "fundo";
};

fs.writeFileSync(
	path.join(RAIZ, "src", "specs", `${sx}.cenas.json`),
	JSON.stringify(cs.map((c) => ({n: c.n, from: c.from, durationInFrames: c.durationInFrames, visual: visual(c)})), null, 1) + "\n",
);

// Custom scenes become static imports on the wrapper.
const customs = [...new Set(spec.cenas.map((c) => c.custom).filter(Boolean))];
const importCustoms = customs
	.map((c) => `import ${c} from "./scenes/${sx}/${c}";`)
	.join("\n");
const mapaCustoms = customs.length ? ` customs={{${customs.join(", ")}}}` : "";

const wrapper = `import React from "react";
import {Motor, totalFrames} from "./engine/Motor";
import {validaSpec} from "./engine/spec";
import specBruto from "./specs/${sx}.json";
${importCustoms}

const spec = validaSpec(specBruto);

export const ${peca}: React.FC = () => <Motor spec={spec}${mapaCustoms} />;

export const FPS_${SX} = spec.fps;
export const TOTAL_FRAMES_${SX} = totalFrames(spec);
`;

fs.writeFileSync(path.join(RAIZ, "src", `${peca}.tsx`), wrapper);

// Register in Root.tsx (idempotent).
const rootPath = path.join(RAIZ, "src", "Root.tsx");
const root = fs.readFileSync(rootPath, "utf8");
if (!root.includes(`id="${peca}"`)) {
	const linhaImport = `import {${peca}, FPS_${SX}, TOTAL_FRAMES_${SX}} from "./${peca}";\n`;
	let novo = root;
	if (!novo.includes(linhaImport.trim())) {
		const linhas = novo.split("\n");
		let ultimoImport = 0;
		linhas.forEach((l, i) => {
			if (l.startsWith("import ")) ultimoImport = i;
		});
		linhas.splice(ultimoImport + 1, 0, linhaImport.trim());
		novo = linhas.join("\n");
	}
	const bloco = `\n\t\t\t{/* spec: src/specs/${sx}.json */}\n\t\t\t<Composition\n\t\t\t\tid="${peca}"\n\t\t\t\tcomponent={${peca}}\n\t\t\t\tdurationInFrames={TOTAL_FRAMES_${SX}}\n\t\t\t\tfps={FPS_${SX}}\n\t\t\t\twidth={${spec.dims[0]}}\n\t\t\t\theight={${spec.dims[1]}}\n\t\t\t/>\n\t\t</>`;
		novo = novo.replace("\t\t</>\n\t);\n};", bloco + "\n\t);\n};");
	fs.writeFileSync(rootPath, novo);
	console.log(`src/Root.tsx: composição "${peca}" registrada`);
} else {
	console.log(`src/Root.tsx: composição "${peca}" já registrada`);
}

console.log(`ok: src/${peca}.tsx (${cs.length} cenas, ${cs[cs.length - 1].from + cs[cs.length - 1].durationInFrames} frames) + src/specs/${sx}.cenas.json`);
