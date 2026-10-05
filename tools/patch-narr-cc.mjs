#!/usr/bin/env node
// Corte de duração da peça "Coca-Cola": remove a fala 03 e encurta 04, 08 e 11.
// As falas alteradas voltam a durationInFrames 0 / words [] para serem regeradas e remedidas.
// Uso: node tools/patch-narr-cc.mjs
import fs from "node:fs";
import path from "node:path";

const file = path.resolve(import.meta.dirname, "../src/narration-cocacola.json");
const doc = JSON.parse(fs.readFileSync(file, "utf8"));

const DROP = ["03-distancia"];
const NEW_TEXT = {
	"04-1886":
		"Em oito de maio de mil oitocentos e oitenta e seis, o farmacêutico John Pemberton serviu o primeiro copo numa farmácia de Atlanta.",
	"08-candler":
		"Nos anos seguintes, o negócio mudou de mãos: em mil oitocentos e oitenta e oito, Asa Candler passou a adquirir o controle da fórmula.",
	"11-garrafa": "E, em mil novecentos e quinze, uma garrafa reconhecida só pelo formato.",
};

doc.lines = doc.lines.filter((l) => !DROP.includes(l.id));
for (const l of doc.lines) {
	if (NEW_TEXT[l.id] && l.text !== NEW_TEXT[l.id]) {
		l.text = NEW_TEXT[l.id];
		l.durationInFrames = 0;
		l.words = [];
		delete l.wordsMatched;
		delete l.wordsEngine;
	}
}

const head = JSON.stringify(doc, null, 2);
fs.writeFileSync(file, head + "\n");
console.log(`${doc.lines.length} falas; regerar: ${doc.lines.filter((l) => l.durationInFrames === 0).map((l) => l.id).join(", ")}`);
