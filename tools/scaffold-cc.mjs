#!/usr/bin/env node
// Scaffold da peça "Coca-Cola": copia os utils/componentes do Microsoft trocando o sufixo MS -> CC.
// Uso: node tools/scaffold-cc.mjs
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const ren = (s) =>
	s
		.replaceAll("narration-microsoft.json", "narration-cocacola.json")
		.replaceAll("audio/vo-microsoft", "audio/vo-cocacola")
		.replaceAll("audio/microsoft/", "audio/cocacola/")
		.replaceAll("_MS", "_CC")
		.replaceAll("MS.", "CC.")
		.replaceAll("MS,", "CC,")
		.replaceAll("MS;", "CC;")
		.replaceAll("MS ", "CC ")
		.replaceAll("MS}", "CC}")
		.replaceAll("MS)", "CC)")
		.replaceAll("MS(", "CC(")
		.replaceAll("MS:", "CC:")
		.replaceAll("MS<", "CC<")
		.replaceAll("MS>", "CC>")
		.replaceAll("MS=", "CC=")
		.replaceAll("MS[", "CC[")
		.replaceAll("MS]", "CC]")
		.replaceAll("MS\n", "CC\n")
		.replaceAll("MS`", "CC`")
		.replaceAll("MS/", "CC/")
		.replaceAll("-ms", "-cc")
		.replaceAll("/microsoft/", "/cocacola/")
		.replaceAll("MS.tsx", "CC.tsx");

const copy = (from, to) => {
	fs.mkdirSync(path.dirname(to), {recursive: true});
	fs.writeFileSync(to, ren(fs.readFileSync(from, "utf8")));
	console.log(`${from} -> ${to}`);
};

for (const f of ["narration-ms", "timeline-ms", "cue-ms", "captions-ms", "theme-ms"]) {
	copy(path.join(root, "src/utils", f + ".ts"), path.join(root, "src/utils", f.replace("-ms", "-cc") + ".ts"));
}
for (const f of ["CaptionsMS", "NarrationMS", "SceneShell", "TextMS", "GradedPhoto", "SoundtrackMS", "AmbienceMS"]) {
	const out = f.endsWith("MS") ? f.slice(0, -2) + "CC" : f;
	copy(path.join(root, "src/components/microsoft", f + ".tsx"), path.join(root, "src/components/cocacola", out + ".tsx"));
}
