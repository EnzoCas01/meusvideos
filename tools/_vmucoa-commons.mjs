#!/usr/bin/env node
// TEMPORARIO (peca VmuCoa). Baixa ARQUIVOS ESPECIFICOS do Wikimedia Commons,
// porque o fetch-videos.mjs/fetch-images.mjs nao aceitam titulo de arquivo e
// nao tem retry — e em 2026-09-22 o upload.wikimedia.org respondeu 429 em quase
// toda tentativa. Aqui cada download tem espera crescente.
//
//   node tools/_vmucoa-commons.mjs --tipo=video  --destino=vmucoa-cand File:A.webm File:B.webm
//   node tools/_vmucoa-commons.mjs --tipo=imagem --destino=vmucoa-cand File:C.jpg
//
// Video: reencoda H.264 sem audio, lado maior <= 1920, ate 30 s, em clip-NN.mp4.
// Imagem: salva como img-NN.<ext>. Escreve/atualiza manifest.json (origem, autor,
// licenca, dimensoes, duracao).
import fs from "node:fs";
import path from "node:path";
import {execFileSync} from "node:child_process";

const ROOT = path.resolve(import.meta.dirname, "..");
const API = "https://commons.wikimedia.org/w/api.php";
const UA = "meusvideos/1.0 (peca VmuCoa; curadoria de midia)";
const args = process.argv.slice(2);
const opt = (k, d) => {
	const hit = args.find((a) => a.startsWith(`--${k}=`));
	return hit ? hit.slice(k.length + 3) : d;
};
const tipo = opt("tipo", "video");
const destino = path.join(ROOT, tipo === "video" ? "public/videos" : "public/images", opt("destino", "vmucoa-cand"));
const titulos = args.filter((a) => !a.startsWith("--"));

const dorme = (ms) => new Promise((r) => setTimeout(r, ms));

const meta = async (lote) => {
	const u = new URL(API);
	u.search = new URLSearchParams({
		action: "query", titles: lote.join("|"), prop: "imageinfo",
		iiprop: "url|size|mime|extmetadata", format: "json", origin: "*",
	});
	for (const espera of [0, 20000, 45000, 90000]) {
		if (espera) await dorme(espera);
		const r = await fetch(u, {signal: AbortSignal.timeout(40000), headers: {"user-agent": UA}});
		if (r.ok) {
			const d = await r.json();
			if (d.query?.pages) return d;
		}
	}
	throw new Error("metadata falhou");
};

const baixar = async (url, arq) => {
	for (const espera of [0, 20000, 45000, 90000, 150000]) {
		if (espera) await dorme(espera);
		const r = await fetch(url, {signal: AbortSignal.timeout(300000), headers: {"user-agent": UA}});
		if (r.ok) {
			fs.writeFileSync(arq, Buffer.from(await r.arrayBuffer()));
			return;
		}
		console.error(`    HTTP ${r.status}, tentando de novo em ${espera || 20}s`);
	}
	throw new Error("download 429/erro");
};

fs.mkdirSync(destino, {recursive: true});
const manifestPath = path.join(destino, "manifest.json");
const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, "utf8")) : [];

for (let i = 0; i < titulos.length; i += 5) {
	const lote = titulos.slice(i, i + 5);
	let d;
	try {
		d = await meta(lote);
	} catch (e) {
		console.error(`lote ${i / 5 + 1}: ${e.message}`);
		continue;
	}
	for (const p of Object.values(d.query.pages)) {
		const info = p.imageinfo?.[0];
		if (!info) {
			console.error(`sem imageinfo: ${p.title}`);
			continue;
		}
		const m = info.extmetadata ?? {};
		const limpar = (v) => (v ? String(v.value).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim() : null);
		const ext = path.extname(new URL(info.url).pathname).toLowerCase() || ".bin";
		const n = manifest.filter((x) => x.pagina === info.descriptionurl).length
			? manifest.findIndex((x) => x.pagina === info.descriptionurl)
			: manifest.length;
		const base = tipo === "video" ? `clip-${String(n + 1).padStart(2, "0")}` : `img-${String(n + 1).padStart(2, "0")}`;
		const bruto = path.join(destino, `_bruto-${base}${ext}`);
		const final = path.join(destino, `${base}.${tipo === "video" ? "mp4" : ext.slice(1)}`);
		console.error(`${p.title}  ${info.width}x${info.height}`);
		try {
			await baixar(info.url, bruto);
			if (tipo === "video") {
				execFileSync("ffmpeg", ["-y", "-v", "error", "-i", bruto, "-an", "-t", "30",
					"-vf", "scale='if(gt(iw,ih),min(1920,iw),-2)':'if(gt(iw,ih),-2,min(1920,ih))'",
					"-c:v", "libx264", "-preset", "veryfast", "-crf", "23", "-pix_fmt", "yuv420p",
					"-movflags", "+faststart", final]);
				fs.unlinkSync(bruto);
			} else {
				fs.renameSync(bruto, final);
			}
			const sonda = tipo === "video"
				? (() => {
					const j = JSON.parse(execFileSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-show_entries", "format=duration", "-of", "json", final]).toString());
					return {w: j.streams[0].width, h: j.streams[0].height, duracao: Number(j.format.duration)};
				})()
				: {w: info.width, h: info.height, duracao: null};
			const entrada = {
				arquivo: `${tipo === "video" ? "videos" : "images"}/${opt("destino", "vmucoa-cand")}/${path.basename(final)}`,
				titulo: p.title.replace(/^File:/, ""), pagina: info.descriptionurl,
				fonte: "wikimedia commons", url_original: info.url,
				autor: limpar(m.Artist), licenca: limpar(m.LicenseShortName), ...sonda,
			};
			if (n < manifest.length) manifest[n] = entrada;
			else manifest.push(entrada);
			console.error(`  ok ${path.basename(final)} ${sonda.w}x${sonda.h}${sonda.duracao ? " " + sonda.duracao.toFixed(1) + "s" : ""} | ${entrada.licenca}`);
		} catch (e) {
			console.error(`  falhou ${p.title}: ${e.message}`);
			for (const f of [bruto, final]) if (fs.existsSync(f)) fs.unlinkSync(f);
		}
	}
}

fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
console.log(JSON.stringify({destino, total: manifest.length}));
