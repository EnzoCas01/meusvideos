/**
 * Baixa clipes do Wikimedia Commons POR TÍTULO (a busca textual é ruidosa e o
 * fetch-videos.mjs pega os resultados na ordem da API, quase sempre errada).
 *
 *   node tools/fetch-mq.mjs --pasta=mq-tech --titulos="File:A.webm|File:B.ogv" [--maxdur=15] [--maxmb=200]
 *
 * Títulos separados por "|" (não por vírgula: título do Commons costuma ter vírgula).
 * Faz o mesmo tratamento do fetch-videos.mjs: MP4 H.264, sem áudio, lado maior
 * <= 1920, no máximo --maxdur segundos, e acrescenta a entrada no
 * public/videos/<pasta>/manifest.json (autor, licença, origem).
 * Arquivo maior que --maxmb é pulado ANTES do download: o Commons tem vídeo 4K
 * de mais de 1 GB que derruba a máquina (2 CPUs, ~3 GB livres) no ffmpeg.
 * O manifest é regravado a cada clipe, então uma queda não perde o que já veio.
 */
import fs from "node:fs";
import path from "node:path";
import {execFileSync} from "node:child_process";

const ROOT = path.resolve(import.meta.dirname, "..");
const UA = "meusvideos/1.0 (projeto Remotion local)";
const args = process.argv.slice(2);
const opt = (n, d) => {
	const hit = args.find((a) => a.startsWith(`--${n}=`));
	return hit ? hit.slice(n.length + 3) : d;
};

const pasta = opt("pasta");
const maxDur = Number(opt("maxdur", "15"));
const maxMb = Number(opt("maxmb", "200"));
const titulos = opt("titulos", "").split("|").map((t) => t.trim()).filter(Boolean);
if (!pasta || !titulos.length) {
	console.error('uso: node tools/fetch-mq.mjs --pasta=mq-tech --titulos="File:A.webm|File:B.ogv" [--maxdur=15] [--maxmb=200]');
	process.exit(1);
}

const destino = path.join(ROOT, "public", "videos", pasta);
fs.mkdirSync(destino, {recursive: true});
const manifestPath = path.join(destino, "manifest.json");
const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, "utf8")) : [];
const salvar = () => fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
const limpar = (v) => (v ? String(v.value).replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim() : null);

const api = async (params) => {
	const u = new URL("https://commons.wikimedia.org/w/api.php");
	u.search = new URLSearchParams({format: "json", ...params});
	for (const espera of [0, 8000, 20000, 40000]) {
		if (espera) await new Promise((r) => setTimeout(r, espera));
		const r = await fetch(u, {headers: {"user-agent": UA}});
		if (r.ok) return r.json();
		if (r.status !== 429) throw new Error(`api ${r.status}`);
	}
	throw new Error("api 429 persistente");
};

// imageinfo de todos os títulos de uma vez (metadados de licença/autor + tamanho)
const infos = {};
const d = await api({action: "query", prop: "imageinfo", iiprop: "url|size|mime|extmetadata|user", titles: titulos.join("|")});
for (const p of Object.values(d.query?.pages ?? {})) {
	const i = p.imageinfo?.[0];
	if (!i) continue;
	const m = i.extmetadata ?? {};
	infos[p.title] = {
		url: i.url,
		bytes: i.size,
		pagina: i.descriptionurl,
		autor: limpar(m.Artist) ?? limpar(m.Credit) ?? i.user ?? null,
		licenca: limpar(m.LicenseShortName) ?? limpar(m.UsageTerms),
	};
}

let n = manifest.length;
let salvos = 0;
for (const t of titulos) {
	const titulo = t.startsWith("File:") ? t : `File:${t}`;
	const info = infos[titulo];
	if (!info) {
		console.error(`  sem imageinfo: ${t}`);
		continue;
	}
	if (info.bytes > maxMb * 1024 * 1024) {
		console.error(`  pulado (${(info.bytes / 1048576).toFixed(0)} MB > ${maxMb} MB): ${t.slice(0, 60)}`);
		continue;
	}
	const idx = n + 1;
	const ext = path.extname(new URL(info.url).pathname) || ".webm";
	const bruto = path.join(destino, `_bruto-${idx}${ext}`);
	const final = path.join(destino, `clip-${String(idx).padStart(2, "0")}.mp4`);
	try {
		const r = await fetch(info.url, {headers: {"user-agent": UA}, signal: AbortSignal.timeout(180000)});
		if (!r.ok) throw new Error(`download ${r.status}`);
		fs.writeFileSync(bruto, Buffer.from(await r.arrayBuffer()));
		execFileSync("ffmpeg", ["-y", "-v", "error", "-i", bruto, "-an", "-t", String(maxDur),
			"-vf", "scale='if(gt(iw,ih),min(1920,iw),-2)':'if(gt(iw,ih),-2,min(1920,ih))'",
			"-c:v", "libx264", "-preset", "veryfast", "-crf", "23", "-pix_fmt", "yuv420p", "-movflags", "+faststart", final]);
		fs.unlinkSync(bruto);
		const s = JSON.parse(execFileSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-show_entries", "format=duration", "-of", "json", final]).toString());
		const w = s.streams[0].width, h = s.streams[0].height, dur = Number(s.format.duration);
		manifest.push({arquivo: `videos/${pasta}/${path.basename(final)}`, titulo, pagina: info.pagina, fonte: "wikimedia commons", autor: info.autor, licenca: info.licenca, w, h, duracao: dur});
		n++;
		salvos++;
		salvar();
		console.error(`  ok ${path.basename(final)} ${w}x${h} ${dur.toFixed(1)}s | ${info.licenca}`);
	} catch (e) {
		console.error(`  falhou ${t}: ${e.message}`);
		for (const f of [bruto, final]) if (fs.existsSync(f)) fs.unlinkSync(f);
	}
}

salvar();
console.log(JSON.stringify({pasta: `public/videos/${pasta}`, baixados: salvos, total: manifest.length}));
