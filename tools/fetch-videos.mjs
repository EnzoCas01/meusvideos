/**
 * Busca clipes de vídeo por uma consulta e baixa os escolhidos para o projeto.
 *
 *   node tools/fetch-videos.mjs "ocean waves" --n=4
 *   node tools/fetch-videos.mjs "city night" --n=3 --pasta=cidade --fontes=pexels,commons --vertical
 *
 * Fontes (em ordem padrão): pexels, pixabay (precisam de chave grátis) e
 * commons (Wikimedia Commons, sem chave, com licença e autor).
 *   Pexels : PEXELS_API_KEY   ou /root/secrets/pexels.env
 *   Pixabay: PIXABAY_API_KEY  ou /root/secrets/pixabay.env
 * Fonte sem chave é pulada com aviso; commons sempre funciona.
 *
 * Cada clipe é reencodado para MP4 H.264 sem áudio (lado maior <= 1920), formato
 * que o <OffthreadVideo> do Remotion lê sem surpresa, e vai para
 * public/videos/<pasta>/ com um manifest.json (origem, autor, licença, duração).
 * Use no código com staticFile("videos/<pasta>/<arquivo>.mp4").
 */
import fs from "node:fs";
import path from "node:path";
import {execFileSync} from "node:child_process";

const ROOT = path.resolve(import.meta.dirname, "..");
const TIMEOUT_MS = 30000;
const MAX_BYTES = 150 * 1024 * 1024;
const UA = "meusvideos/1.0 (projeto Remotion local)";

const args = process.argv.slice(2);
const consulta = args.find((a) => !a.startsWith("--"));
const opt = (nome, padrao) => {
	const hit = args.find((a) => a.startsWith(`--${nome}=`));
	return hit ? hit.slice(nome.length + 3) : padrao;
};

if (!consulta) {
	console.error('uso: node tools/fetch-videos.mjs "consulta" [--n=4] [--pasta=nome] [--fontes=pexels,pixabay,commons] [--vertical] [--maxdur=20]');
	process.exit(1);
}

const quantos = Number(opt("n", "4"));
const fontes = opt("fontes", "pexels,pixabay,commons").split(",");
const vertical = args.includes("--vertical");
const maxDur = Number(opt("maxdur", "30"));
const slug =
	opt("pasta", "") ||
	consulta.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
const destino = path.join(ROOT, "public", "videos", slug);

const chave = (env, arquivo) => {
	if (process.env[env]) return process.env[env];
	try {
		const m = fs.readFileSync(`/root/secrets/${arquivo}`, "utf8").match(new RegExp(`^${env}=(.*)$`, "m"));
		return m ? m[1].trim() : null;
	} catch {
		return null;
	}
};

const getJson = async (url, headers = {}) => {
	const r = await fetch(url, {signal: AbortSignal.timeout(TIMEOUT_MS), headers: {"user-agent": UA, ...headers}});
	if (!r.ok) throw new Error(`${new URL(url).host} respondeu ${r.status}`);
	return r.json();
};

// Cada fonte devolve {url (arquivo de vídeo), pagina, fonte, autor, licenca, duracao, w, h}.
const pexels = async () => {
	const k = chave("PEXELS_API_KEY", "pexels.env");
	if (!k) throw new Error("sem PEXELS_API_KEY (grátis em pexels.com/api)");
	const u = new URL("https://api.pexels.com/videos/search");
	u.search = new URLSearchParams({query: consulta, per_page: String(quantos * 3), ...(vertical ? {orientation: "portrait"} : {})});
	const d = await getJson(u, {authorization: k});
	return (d.videos ?? []).map((v) => {
		const f = v.video_files.filter((x) => x.file_type === "video/mp4").sort((a, b) => b.width - a.width).find((x) => x.width <= 2200) ?? v.video_files[0];
		return {url: f.link, pagina: v.url, fonte: "pexels", autor: v.user?.name ?? null, licenca: "Pexels License (uso livre, sem atribuição obrigatória)", duracao: v.duration, w: f.width, h: f.height};
	});
};

const pixabay = async () => {
	const k = chave("PIXABAY_API_KEY", "pixabay.env");
	if (!k) throw new Error("sem PIXABAY_API_KEY (grátis em pixabay.com/api/docs)");
	const u = new URL("https://pixabay.com/api/videos/");
	u.search = new URLSearchParams({key: k, q: consulta, per_page: String(Math.max(quantos * 3, 3))});
	const d = await getJson(u);
	return (d.hits ?? []).map((v) => {
		const f = v.videos.large?.url ? v.videos.large : v.videos.medium;
		return {url: f.url, pagina: v.pageURL, fonte: "pixabay", autor: v.user ?? null, licenca: "Pixabay Content License", duracao: v.duration, w: f.width, h: f.height};
	});
};

const commons = async () => {
	const u = new URL("https://commons.wikimedia.org/w/api.php");
	u.search = new URLSearchParams({
		action: "query", generator: "search", gsrsearch: `${consulta} filetype:video`, gsrnamespace: "6",
		gsrlimit: String(quantos * 3), prop: "imageinfo", iiprop: "url|extmetadata|size|mime|mediatype", format: "json", origin: "*",
	});
	const d = await getJson(u);
	const limpar = (v) => (v ? String(v.value).replace(/<[^>]*>/g, "").trim() : null);
	return Object.values(d.query?.pages ?? {})
		.map((p) => {
			const i = p.imageinfo?.[0];
			if (!i || i.mediatype !== "VIDEO") return null;
			const m = i.extmetadata ?? {};
			return {url: i.url, pagina: i.descriptionurl, fonte: "wikimedia commons", autor: limpar(m.Artist), licenca: limpar(m.LicenseShortName), duracao: null, w: i.width, h: i.height};
		})
		.filter(Boolean);
};

const FONTES = {pexels, pixabay, commons};

const baixar = async (url, arq) => {
	const r = await fetch(url, {signal: AbortSignal.timeout(120000), headers: {"user-agent": UA}});
	if (!r.ok) throw new Error(`download ${r.status}`);
	const buf = Buffer.from(await r.arrayBuffer());
	if (buf.length > MAX_BYTES) throw new Error("arquivo grande demais");
	fs.writeFileSync(arq, buf);
};

const sonda = (arq) => {
	const j = JSON.parse(execFileSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-show_entries", "format=duration", "-of", "json", arq]).toString());
	return {w: j.streams[0].width, h: j.streams[0].height, duracao: Number(j.format.duration)};
};

fs.mkdirSync(destino, {recursive: true});
const manifestPath = path.join(destino, "manifest.json");
const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, "utf8")) : [];
let idx = manifest.length;
let salvos = 0;

for (const nome of fontes) {
	if (salvos >= quantos) break;
	const buscar = FONTES[nome];
	if (!buscar) { console.error(`fonte desconhecida: ${nome}`); continue; }
	let achados;
	try {
		achados = await buscar();
	} catch (e) {
		console.error(`[${nome}] pulada: ${e.message}`);
		continue;
	}
	console.error(`[${nome}] ${achados.length} resultados`);
	for (const v of achados) {
		if (salvos >= quantos) break;
		if (v.duracao && v.duracao > maxDur * 3) continue;
		if (manifest.some((m) => m.pagina === v.pagina)) continue;
		const bruto = path.join(destino, `_bruto-${idx}${path.extname(new URL(v.url).pathname) || ".mp4"}`);
		const final = path.join(destino, `clip-${String(idx + 1).padStart(2, "0")}.mp4`);
		try {
			await baixar(v.url, bruto);
			// Reencoda: H.264, sem áudio, lado maior <= 1920, no máximo maxDur segundos.
			execFileSync("ffmpeg", ["-y", "-v", "error", "-i", bruto, "-an", "-t", String(maxDur),
				"-vf", "scale='if(gt(iw,ih),min(1920,iw),-2)':'if(gt(iw,ih),-2,min(1920,ih))'",
				"-c:v", "libx264", "-preset", "veryfast", "-crf", "23", "-pix_fmt", "yuv420p", "-movflags", "+faststart", final]);
			fs.unlinkSync(bruto);
			const s = sonda(final);
			manifest.push({arquivo: `videos/${slug}/${path.basename(final)}`, consulta, ...v, ...s, url: undefined});
			idx++;
			salvos++;
			console.error(`  ok ${path.basename(final)} ${s.w}x${s.h} ${s.duracao.toFixed(1)}s (${v.fonte})`);
		} catch (e) {
			console.error(`  falhou ${v.pagina}: ${e.message}`);
			for (const f of [bruto, final]) if (fs.existsSync(f)) fs.unlinkSync(f);
		}
	}
}

fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
console.log(JSON.stringify({pasta: `public/videos/${slug}`, baixados: salvos, total: manifest.length}));
if (!salvos) process.exit(2);
