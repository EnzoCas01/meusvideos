/**
 * Roda um dos agentes operacionais (narracao, som, imagem, render) usando a
 * DeepSeek em vez do Claude Code, via camada mínima de integração.
 *
 *   node tools/deepseek-agent.mjs <agente> "<tarefa>"
 *
 * POR QUE ESTE ARQUIVO EXISTE
 * ----------------------------
 * O Claude Code (nesta versão, 2.1.276) não tem roteamento de provedor por
 * subagente: o campo `model:` no frontmatter de .claude/agents/*.md só aceita
 * apelidos do próprio Claude (sonnet/opus/haiku/fable/inherit), e a troca de
 * backend (ANTHROPIC_BASE_URL) é de sessão inteira, não por chamada de
 * subagente. Não existe gambiarra limpa para isso dentro do Claude Code.
 *
 * Este script é a "menor camada de integração possível" alternativa: um loop
 * de ferramentas próprio, chamando o endpoint da DeepSeek compatível com a
 * Anthropic Messages API (confirmado em api-docs.deepseek.com/guides/anthropic_api):
 *   - base_url: https://api.deepseek.com/anthropic
 *   - header:   x-api-key: <DEEPSEEK_API_KEY>
 *   - modelo:   deepseek-flash
 *   - tools/tool_use/tool_result e imagens (base64) são suportados.
 *
 * O `diretor` (que continua em Claude, via Agent tool normal) chama este
 * script pelo Bash quando quer delegar para narracao/som/imagem/render, no
 * lugar de abrir um subagente Claude para essas quatro funções. `motion` e
 * `revisor` continuam Claude, sem qualquer mudança.
 *
 * SEGURANÇA
 * ---------
 * - A chave vem só de DEEPSEEK_API_KEY (lida de .env, nunca versionado, nunca
 *   impressa, nunca passada em prompt).
 * - Ferramentas de arquivo (read_file/write_file/glob) são travadas dentro da
 *   raiz do projeto — não saem daqui.
 * - A ferramenta bash só roda comandos cujo início bate com uma lista
 *   permitida por agente (ALLOWED_BASH abaixo). Um comando fora da lista é
 *   recusado, não executado.
 * - Qualquer falha (chave ausente, erro HTTP, timeout, rate limit, resposta
 *   inválida, ferramenta rejeitada) termina o processo com código != 0 e uma
 *   mensagem clara em stderr começando com "FALLBACK:" — quem chamou este
 *   script deve tratar isso como "delegue esta tarefa para o Claude normal
 *   (Agent tool)", nunca como sucesso silencioso, e nunca deve trocar o
 *   modelo de outro agente por causa disso.
 */

import {execFileSync} from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const MODEL = "deepseek-flash";
const BASE_URL = "https://api.deepseek.com/anthropic/v1/messages";
const MAX_TURNS = 20;
const MAX_TOOL_OUTPUT = 20000;
const IMAGE_EXT = {".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp"};

const AGENTS = ["narracao", "som", "imagem", "render"];

// Prefixos de comando permitidos para a ferramenta bash, por agente. Um
// comando que não começa com nenhum destes é recusado antes de rodar.
const ALLOWED_BASH = {
	narracao: ["tools/vs/.venv/Scripts/python.exe", "node tools/watch-narration.mjs"],
	som: ["node tools/generate-audio.mjs"],
	imagem: ["node tools/fetch-images.mjs"],
	render: ["npx remotion", "npx eslint", "npx tsc"],
};

/**
 * Teto de tempo por comando, por agente.
 *
 * 15 min serve para busca de imagem e síntese de efeitos, mas NÃO para os dois
 * processos longos desta máquina: a narração são 4 chamadas ao modelo a ~10 min
 * cada, e um render do filme leva de 15 a 20 min. Com o teto genérico, os dois
 * eram mortos no meio e o agente relatava "timeout" para algo que estava apenas
 * rodando.
 */
const BASH_TIMEOUT_MS = {
	narracao: 75 * 60 * 1000,
	render: 45 * 60 * 1000,
};

const fail = (msg) => {
	console.error(`FALLBACK: ${msg}`);
	process.exit(1);
};

const [, , agente, tarefa] = process.argv;
if (!AGENTS.includes(agente) || !tarefa) {
	fail(`uso: node tools/deepseek-agent.mjs <${AGENTS.join("|")}> "<tarefa>"`);
}

// ── .env (chave nunca em código/versão, só nesta variável em runtime) ──────
const loadEnvKey = () => {
	const envPath = path.join(ROOT, ".env");
	if (!fs.existsSync(envPath)) return process.env.DEEPSEEK_API_KEY;
	const text = fs.readFileSync(envPath, "utf-8");
	for (const line of text.split(/\r?\n/)) {
		const m = /^DEEPSEEK_API_KEY=(.*)$/.exec(line.trim());
		if (m) return m[1].trim();
	}
	return process.env.DEEPSEEK_API_KEY;
};

const API_KEY = loadEnvKey();
if (!API_KEY) fail("DEEPSEEK_API_KEY ausente (verifique .env). Delegue esta tarefa para o Claude normal.");

// ── prompt do agente + memória, exatamente como o Claude Code já usa ───────
const readAgentDef = (nome) => {
	const p = path.join(ROOT, ".claude", "agents", `${nome}.md`);
	const raw = fs.readFileSync(p, "utf-8");
	// tira o frontmatter YAML (--- ... ---) do topo, o corpo já é o prompt.
	return raw.replace(/^---[\s\S]*?---\s*/, "").trim();
};

const readMemoria = (nome) => {
	const p = path.join(ROOT, ".claude", "memoria", `${nome}.md`);
	return fs.existsSync(p) ? fs.readFileSync(p, "utf-8").trim() : "(memória vazia ainda)";
};

const systemPrompt = [
	readAgentDef(agente),
	"",
	`## Sua memória (.claude/memoria/${agente}.md), já carregada:`,
	readMemoria(agente),
	"",
	"## Sobre esta execução",
	"Você está rodando via DeepSeek, não Claude, através de um loop de ferramentas próprio deste projeto.",
	"Suas ferramentas são: bash (com prefixos restritos), read_file, write_file, append_file, glob.",
	"Para acrescentar algo em .claude/memoria/<agente>.md, use SEMPRE append_file, nunca write_file —",
	"write_file substitui o arquivo inteiro e arrisca perder entradas antigas.",
	"Responda sempre em português. Ao terminar, se aprendeu algo que vale para a próxima vez, escreva em",
	`.claude/memoria/${agente}.md usando write_file, seguindo o formato já descrito acima. Não invente que`,
	"terminou algo que não terminou de verdade — diga com clareza o que fez e o que ficou pendente.",
].join("\n");

// ── ferramentas ─────────────────────────────────────────────────────────
const resolveInRoot = (rel) => {
	const abs = path.resolve(ROOT, rel);
	if (abs !== ROOT && !abs.startsWith(ROOT + path.sep)) {
		throw new Error(`caminho fora do projeto recusado: ${rel}`);
	}
	return abs;
};

const truncate = (s) => (s.length > MAX_TOOL_OUTPUT ? s.slice(0, MAX_TOOL_OUTPUT) + "\n…(truncado)" : s);

const globMatch = (pattern, root) => {
	const reSrc = pattern
		.split("/")
		.map((seg) =>
			seg === "**"
				? "@@DOUBLESTAR@@"
				: seg.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, "[^/]*").replace(/\?/g, "."),
		)
		.join("/")
		.replace(/@@DOUBLESTAR@@/g, ".*");
	const re = new RegExp(`^${reSrc}$`);
	const out = [];
	const walk = (dir) => {
		for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
			if (entry.name === "node_modules" || entry.name === ".git") continue;
			const abs = path.join(dir, entry.name);
			const rel = path.relative(root, abs).split(path.sep).join("/");
			if (entry.isDirectory()) walk(abs);
			else if (re.test(rel)) out.push(rel);
		}
	};
	walk(root);
	return out;
};

const tools = [
	{
		name: "bash",
		description: `Roda um comando de shell. Só comandos que começam com um destes prefixos são aceitos: ${JSON.stringify(ALLOWED_BASH[agente])}`,
		input_schema: {type: "object", properties: {command: {type: "string"}}, required: ["command"]},
	},
	{
		name: "read_file",
		description: "Lê um arquivo de texto ou imagem (jpg/png/webp) do projeto, caminho relativo à raiz.",
		input_schema: {type: "object", properties: {path: {type: "string"}}, required: ["path"]},
	},
	{
		name: "write_file",
		description: "Escreve (cria ou sobrescreve) um arquivo de texto do projeto, caminho relativo à raiz.",
		input_schema: {
			type: "object",
			properties: {path: {type: "string"}, content: {type: "string"}},
			required: ["path", "content"],
		},
	},
	{
		name: "glob",
		description: "Lista arquivos do projeto que batem com um padrão (ex.: public/images/**/*.jpg).",
		input_schema: {type: "object", properties: {pattern: {type: "string"}}, required: ["pattern"]},
	},
	{
		name: "append_file",
		description:
			"Acrescenta texto ao FINAL de um arquivo, sem tocar no que já existe (cria o arquivo se não existir). " +
			`Use esta ferramenta para escrever em .claude/memoria/${agente}.md — nunca use write_file nela, ` +
			"porque write_file substitui o arquivo inteiro e arrisca perder entradas antigas ao tentar reproduzi-las de memória.",
		input_schema: {type: "object", properties: {path: {type: "string"}, content: {type: "string"}}, required: ["path", "content"]},
	},
];

const runTool = (name, input) => {
	if (name === "bash") {
		const cmd = String(input.command ?? "").trim();
		// A allowlist compara com o COMANDO, não com as variáveis de ambiente
		// que o precedem. `NARRATION_JSON=... tools/vs/.../python.exe ...` é a
		// forma documentada de rodar a narração de uma peça que não é a padrão,
		// e sem esta limpeza ela seria recusada por não começar com o prefixo.
		const semEnv = cmd.replace(/^(?:[A-Za-z_][A-Za-z0-9_]*=(?:"[^"]*"|'[^']*'|\S*)\s+)+/, "");
		const allowed = (ALLOWED_BASH[agente] ?? []).some((p) => semEnv.startsWith(p));
		if (!allowed) {
			return {isError: true, content: `comando recusado (fora da lista permitida para ${agente}): ${cmd}`};
		}
		try {
			// Git Bash, não cmd.exe. Os prefixos da allowlist são escritos com
			// barra normal (`tools/vs/.venv/Scripts/python.exe`), que o cmd.exe
			// não executa — no shell padrão do Windows o agente `narracao`
			// ficava impedido de rodar exatamente o comando que lhe é permitido.
			const out = execFileSync("bash", ["-c", cmd], {
				cwd: ROOT,
				encoding: "utf-8",
				timeout: BASH_TIMEOUT_MS[agente] ?? 15 * 60 * 1000,
				maxBuffer: 64 * 1024 * 1024,
			});
			return {content: truncate(out)};
		} catch (err) {
			const out = [err.stdout, err.stderr].filter(Boolean).join("\n");
			return {isError: true, content: truncate(`erro ao rodar (${err.message}):\n${out}`)};
		}
	}

	if (name === "read_file") {
		try {
			const abs = resolveInRoot(input.path);
			const ext = path.extname(abs).toLowerCase();
			if (IMAGE_EXT[ext]) {
				const b64 = fs.readFileSync(abs).toString("base64");
				return {image: {media_type: IMAGE_EXT[ext], data: b64}};
			}
			return {content: truncate(fs.readFileSync(abs, "utf-8"))};
		} catch (err) {
			return {isError: true, content: `erro ao ler ${input.path}: ${err.message}`};
		}
	}

	if (name === "write_file") {
		try {
			const abs = resolveInRoot(input.path);
			fs.mkdirSync(path.dirname(abs), {recursive: true});
			fs.writeFileSync(abs, input.content, "utf-8");
			return {content: `escrito: ${input.path} (${input.content.length} bytes)`};
		} catch (err) {
			return {isError: true, content: `erro ao escrever ${input.path}: ${err.message}`};
		}
	}

	if (name === "append_file") {
		try {
			const abs = resolveInRoot(input.path);
			fs.mkdirSync(path.dirname(abs), {recursive: true});
			const sep = fs.existsSync(abs) && fs.readFileSync(abs, "utf-8").length > 0 ? "\n" : "";
			fs.appendFileSync(abs, sep + input.content, "utf-8");
			return {content: `acrescentado a: ${input.path} (${input.content.length} bytes)`};
		} catch (err) {
			return {isError: true, content: `erro ao acrescentar em ${input.path}: ${err.message}`};
		}
	}

	if (name === "glob") {
		try {
			return {content: truncate(globMatch(input.pattern, ROOT).join("\n") || "(nenhum arquivo bateu)")};
		} catch (err) {
			return {isError: true, content: `erro no glob ${input.pattern}: ${err.message}`};
		}
	}

	return {isError: true, content: `ferramenta desconhecida: ${name}`};
};

// ── loop de chamadas à DeepSeek ─────────────────────────────────────────
const callDeepSeek = async (messages) => {
	const resp = await fetch(BASE_URL, {
		method: "POST",
		signal: AbortSignal.timeout(120000),
		headers: {"content-type": "application/json", "x-api-key": API_KEY},
		body: JSON.stringify({model: MODEL, max_tokens: 4096, system: systemPrompt, tools, messages}),
	});
	if (!resp.ok) {
		const body = await resp.text().catch(() => "");
		throw new Error(`HTTP ${resp.status}: ${body.slice(0, 500)}`);
	}
	return resp.json();
};

const main = async () => {
	const messages = [{role: "user", content: [{type: "text", text: tarefa}]}];
	let lastText = "";

	for (let turn = 0; turn < MAX_TURNS; turn++) {
		let response;
		try {
			response = await callDeepSeek(messages);
		} catch (err) {
			fail(`erro na chamada à DeepSeek (turno ${turn + 1}): ${err.message}`);
		}

		const blocks = response.content ?? [];
		messages.push({role: "assistant", content: blocks});

		const textBlocks = blocks.filter((b) => b.type === "text").map((b) => b.text);
		if (textBlocks.length) {
			lastText = textBlocks.join("\n");
			console.log(lastText);
		}

		const toolUses = blocks.filter((b) => b.type === "tool_use");
		if (toolUses.length === 0) {
			console.log(`\n[deepseek-agent] ${agente}: concluído em ${turn + 1} turno(s).`);
			return;
		}

		const results = [];
		for (const use of toolUses) {
			console.log(`[deepseek-agent] ${agente} -> ${use.name}(${JSON.stringify(use.input).slice(0, 200)})`);
			const r = runTool(use.name, use.input ?? {});
			if (r.image) {
				results.push({
					type: "tool_result",
					tool_use_id: use.id,
					content: [{type: "image", source: {type: "base64", media_type: r.image.media_type, data: r.image.data}}],
				});
			} else {
				results.push({
					type: "tool_result",
					tool_use_id: use.id,
					is_error: Boolean(r.isError),
					content: String(r.content ?? ""),
				});
			}
		}
		messages.push({role: "user", content: results});
	}

	fail(`limite de ${MAX_TURNS} turnos atingido sem concluir — possível loop. Última fala: ${lastText.slice(0, 300)}`);
};

main();
