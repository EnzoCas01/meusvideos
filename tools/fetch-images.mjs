/**
 * Busca imagens por uma consulta e baixa as escolhidas para o projeto.
 *
 *   node tools/fetch-images.mjs "ampulheta areia" --n=6
 *   node tools/fetch-images.mjs "lua fases" --n=4 --pasta=lua --engines=google,bing
 *
 * Consulta uma instância local do SearXNG (metabuscador que pergunta ao Google,
 * Bing e outros), baixa os resultados e grava um `manifest.json` ao lado das
 * imagens com a origem de cada uma.
 *
 * O manifest existe porque imagem da web tem dono: ele guarda a página de
 * origem, a engine e a licença quando a engine informa, para dar como conferir
 * o direito de uso antes de publicar o vídeo.
 *
 * Precisa de uma instância rodando com JSON habilitado — ver .claude/agents/imagem.md.
 */
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.SEARXNG_URL ?? "http://127.0.0.1:8888";
const ROOT = path.resolve(import.meta.dirname, "..");
const MAX_BYTES = 12 * 1024 * 1024;
const TIMEOUT_MS = 20000;

const TIPOS = {
	"image/jpeg": ".jpg",
	"image/png": ".png",
	"image/webp": ".webp",
	"image/gif": ".gif",
	"image/avif": ".avif",
};

const args = process.argv.slice(2);
const consulta = args.find((a) => !a.startsWith("--"));
const opt = (nome, padrao) => {
	const hit = args.find((a) => a.startsWith(`--${nome}=`));
	return hit ? hit.slice(nome.length + 3) : padrao;
};

if (!consulta) {
	console.error('uso: node tools/fetch-images.mjs "consulta" [--n=6] [--pasta=nome] [--engines=google,bing]');
	process.exit(1);
}

const quantos = Number(opt("n", "6"));
const engines = opt("engines", "");
const slug =
	opt("pasta", "") ||
	consulta
		.toLowerCase()
		.normalize("NFD")
		.replace(/[̀-ͯ]/g, "")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "")
		.slice(0, 40);

const destino = path.join(ROOT, "public", "images", slug);

/**
 * Busca no Wikimedia Commons. É API pública, não precisa de serviço local, e
 * devolve licença e autor de cada arquivo — o campo que quase nenhuma engine
 * do SearXNG informa. Serve de alternativa quando não há instância no ar.
 */
const buscarCommons = async () => {
	const url = new URL("https://commons.wikimedia.org/w/api.php");
	url.search = new URLSearchParams({
		action: "query",
		generator: "search",
		gsrsearch: consulta,
		gsrnamespace: "6", // só arquivos
		gsrlimit: String(Math.max(quantos * 3, 10)),
		prop: "imageinfo",
		iiprop: "url|extmetadata|size|mime",
		format: "json",
		origin: "*",
	});

	const resposta = await fetch(url, {
		signal: AbortSignal.timeout(TIMEOUT_MS),
		headers: {"user-agent": "LifePhases/1.0 (projeto Remotion local)"},
	});
	if (!resposta.ok) {
		console.error(`Commons respondeu ${resposta.status}`);
		process.exit(2);
	}

	const dados = await resposta.json();
	const paginas = Object.values(dados.query?.pages ?? {});

	return paginas
		.map((p) => {
			const info = p.imageinfo?.[0];
			if (!info) return null;
			const meta = info.extmetadata ?? {};
			const limpar = (v) => (v ? String(v.value).replace(/<[^>]*>/g, "").trim() : null);
			return {
				img_src: info.url,
				url: info.descriptionurl,
				title: p.title,
				engine: "wikimedia commons",
				license_name: limpar(meta.LicenseShortName),
				author: limpar(meta.Artist),
				resolution: info.width && info.height ? `${info.width}x${info.height}` : null,
			};
		})
		.filter((r) => r && TIPOS[r.img_src && guessMime(r.img_src)] !== undefined);
};

/** Extensão -> mime, para descartar SVG/TIFF antes de baixar. */
const guessMime = (u) => {
	const ext = path.extname(new URL(u).pathname).toLowerCase();
	return {".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".gif": "image/gif"}[ext];
};

/** Pergunta ao SearXNG. A instância precisa ter `json` em `search.formats`. */
const buscar = async () => {
	const url = new URL("/search", BASE);
	url.searchParams.set("q", consulta);
	url.searchParams.set("categories", "images");
	url.searchParams.set("format", "json");
	if (engines) url.searchParams.set("engines", engines);

	let resposta;
	try {
		resposta = await fetch(url, {signal: AbortSignal.timeout(TIMEOUT_MS)});
	} catch (erro) {
		// Sem instância no ar. Quem chamou decide se cai para o Commons.
		const falha = new Error(`SearXNG inacessível em ${BASE}: ${erro.message}`);
		falha.semInstancia = true;
		throw falha;
	}

	if (resposta.status === 403) {
		console.error("O SearXNG respondeu 403: o formato JSON está desligado.");
		console.error("  Adicione `- json` em `search.formats` no settings.yml e reinicie.");
		process.exit(2);
	}
	if (!resposta.ok) {
		console.error(`SearXNG respondeu ${resposta.status}`);
		process.exit(2);
	}

	const dados = await resposta.json();
	return dados.results ?? [];
};

/** Baixa uma imagem, recusando o que não for imagem ou for grande demais. */
const baixar = async (url, base) => {
	const resposta = await fetch(url, {
		signal: AbortSignal.timeout(TIMEOUT_MS),
		headers: {"user-agent": "Mozilla/5.0 (compatible; LifePhases/1.0)"},
	});
	if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);

	const tipo = (resposta.headers.get("content-type") ?? "").split(";")[0].trim();
	const ext = TIPOS[tipo];
	if (!ext) throw new Error(`tipo não suportado: ${tipo || "desconhecido"}`);

	const buffer = Buffer.from(await resposta.arrayBuffer());
	if (buffer.length > MAX_BYTES) throw new Error(`${(buffer.length / 1e6).toFixed(1)} MB, grande demais`);
	if (buffer.length < 1024) throw new Error("arquivo vazio");

	const arquivo = `${base}${ext}`;
	fs.writeFileSync(path.join(destino, arquivo), buffer);
	return {arquivo, bytes: buffer.length};
};

/**
 * `--fonte=searxng` exige a instância local; `--fonte=commons` não exige nada.
 * O padrão tenta o SearXNG e cai para o Commons se não houver instância — assim
 * a busca funciona mesmo antes de alguém subir o serviço.
 */
const escolherFonte = async () => {
	const fonte = opt("fonte", "auto");

	if (fonte === "commons") return {nome: "wikimedia commons", resultados: await buscarCommons()};
	if (fonte === "searxng") return {nome: `searxng (${BASE})`, resultados: await buscar()};

	try {
		return {nome: `searxng (${BASE})`, resultados: await buscar()};
	} catch (erro) {
		if (!erro.semInstancia) throw erro;
		console.log(`SearXNG fora do ar, usando o Wikimedia Commons.`);
		console.log(`  (${erro.message})\n`);
		return {nome: "wikimedia commons", resultados: await buscarCommons()};
	}
};

const main = async () => {
	console.log(`consulta: "${consulta}"`);
	const {nome, resultados} = await escolherFonte();
	console.log(`fonte: ${nome}`);
	console.log(`${resultados.length} resultados, baixando até ${quantos}\n`);

	if (!resultados.length) {
		console.log("Nada voltou. A engine pode ter sido bloqueada — tente --engines=bing,duckduckgo.");
		return;
	}

	fs.mkdirSync(destino, {recursive: true});
	const manifest = [];
	let i = 0;

	for (const r of resultados) {
		if (manifest.length >= quantos) break;
		const origem = r.img_src ?? r.thumbnail_src;
		if (!origem) continue;
		i++;

		const base = String(i).padStart(2, "0");
		try {
			const {arquivo, bytes} = await baixar(origem, base);
			manifest.push({
				arquivo,
				titulo: r.title ?? null,
				paginaDeOrigem: r.url ?? null,
				urlDaImagem: origem,
				engine: r.engine ?? null,
				// Poucas engines informam licença. Quando vier null, é preciso
				// abrir a página de origem para saber se a imagem pode ser usada.
				licenca: r.license_name ?? r.license ?? null,
				autor: r.author ?? null,
				dimensoes: r.resolution ?? null,
			});
			console.log(`  ${arquivo}  ${(bytes / 1024).toFixed(0)} KB  ${r.engine ?? ""}`);
		} catch (erro) {
			console.log(`  pulei ${base}: ${erro.message}`);
		}
	}

	fs.writeFileSync(
		path.join(destino, "manifest.json"),
		JSON.stringify({consulta, buscadoEm: new Date().toISOString(), imagens: manifest}, null, 2) + "\n",
	);

	const semLicenca = manifest.filter((m) => !m.licenca).length;
	console.log(`\n${manifest.length} imagens em public/images/${slug}/`);
	console.log(`manifest.json com a origem de cada uma`);
	if (semLicenca) {
		console.log(`${semLicenca} sem licença informada — confira a página de origem antes de publicar.`);
	}
};

main();
