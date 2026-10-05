// Apaga material reprovado na conferência visual e limpa o manifest.
//   node tools/mq-limpar.mjs <pasta-repo> <arquivo> [<arquivo2> ...]
//   node tools/mq-limpar.mjs --pasta-vazia <pasta-repo>
// <pasta-repo> é relativa à raiz (ex.: public/videos/mq-tech, public/images/mq-dinheiro).
// Aceita os dois formatos de manifest: lista solta (vídeos) e {imagens: [...]} (imagens).
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const args = process.argv.slice(2);

if (args[0] === "--pasta-vazia") {
	const dir = path.join(ROOT, args[1]);
	for (const f of fs.readdirSync(dir)) fs.unlinkSync(path.join(dir, f));
	fs.rmdirSync(dir);
	console.log(`removida a pasta vazia ${args[1]}`);
	process.exit(0);
}

const [pasta, ...arquivos] = args;
if (!pasta || !arquivos.length) {
	console.error("uso: node tools/mq-limpar.mjs <pasta-repo> <arquivo> [...] | --pasta-vazia <pasta-repo>");
	process.exit(1);
}

const dir = path.join(ROOT, pasta);
for (const a of arquivos) {
	const alvo = path.join(dir, a);
	if (fs.existsSync(alvo)) {
		fs.unlinkSync(alvo);
		console.log(`apagado ${pasta}/${a}`);
	} else {
		console.log(`não existia ${pasta}/${a}`);
	}
}

const manifestPath = path.join(dir, "manifest.json");
if (fs.existsSync(manifestPath)) {
	const m = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
	const lista = Array.isArray(m) ? m : m.imagens;
	const depois = lista.filter((e) => !arquivos.includes(path.basename(e.arquivo)));
	if (Array.isArray(m)) {
		fs.writeFileSync(manifestPath, JSON.stringify(depois, null, 2));
	} else {
		m.imagens = depois;
		fs.writeFileSync(manifestPath, JSON.stringify(m, null, 2));
	}
	console.log(`manifest: ${lista.length} -> ${depois.length} entradas`);
}

// _bruto-* que sobrou de download interrompido
for (const f of fs.readdirSync(dir)) {
	if (f.startsWith("_bruto-")) {
		fs.unlinkSync(path.join(dir, f));
		console.log(`apagado ${pasta}/${f} (resto de download)`);
	}
}
