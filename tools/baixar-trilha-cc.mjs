// Candidatas de trilha para "Coca-Cola" (Kevin MacLeod / incompetech.com, CC BY 4.0).
// Escolhidas do CSV da coleção (Incompetech Pieces 2020) por instrumentação:
// sem piano, sem sino/glockenspiel, sem bateria — o que o Enzo proibiu — e com
// feel de descoberta/calma. uso: node tools/baixar-trilha-cc.mjs
import {createWriteStream, existsSync, mkdirSync, statSync} from "node:fs";
import {Readable} from "node:stream";
import {pipeline} from "node:stream/promises";
import {join} from "node:path";

const DEST = "out/musica-candidatas";
const BASE = "https://incompetech.com/music/royalty-free/mp3-royaltyfree/";

const TRACKS = [
	{titulo: "Odyssey", arquivo: "Odyssey.mp3"}, // Soundtrack, synths, 80 bpm, Bright/Uplifting/Mystical — "descoberta"
	{titulo: "Ever Mindful", arquivo: "Ever Mindful.mp3"}, // Soundtrack, cordas+coro+madeiras, 40 bpm
	{titulo: "Light Awash", arquivo: "Light Awash.mp3"}, // Contemporary, ambiente luminoso
	{titulo: "Dewdrop Fantasy", arquivo: "Dewdrop Fantasy.mp3"}, // synths + chuva, 55 bpm
	{titulo: "Soaring", arquivo: "Soaring.mp3"}, // pad de synth, sem ataque
	{titulo: "Overheat", arquivo: "Overheat.mp3"}, // flauta/synth/violino, 55 bpm
	{titulo: "Silver Blue Light", arquivo: "Silver Blue Light.mp3"}, // violão + synths, 47 bpm
	{titulo: "Tranquility", arquivo: "Tranquility.mp3"}, // só synths, bem neutra
	{titulo: "Airship Serenity", arquivo: "Airship Serenity.mp3"}, // referência já aceita na série
];

mkdirSync(DEST, {recursive: true});

for (const t of TRACKS) {
	const alvo = join(DEST, t.arquivo);
	if (existsSync(alvo) && statSync(alvo).size > 100_000) {
		console.log(`pulado (já existe) ${t.arquivo}`);
		continue;
	}
	const url = BASE + encodeURIComponent(t.arquivo);
	process.stdout.write(`baixando ${t.arquivo} ... `);
	const res = await fetch(url);
	if (!res.ok) {
		console.log(`FALHOU ${res.status}`);
		continue;
	}
	await pipeline(Readable.fromWeb(res.body), createWriteStream(alvo));
	console.log(`${(statSync(alvo).size / 1048576).toFixed(1)} MB`);
}
