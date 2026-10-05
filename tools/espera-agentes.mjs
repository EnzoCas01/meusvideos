#!/usr/bin/env node
// Bloqueia até todos os agentes lançados por ds.sh/glm.sh terminarem (▶ sem ■ em ds.log).
// Uso: node tools/espera-agentes.mjs
import fs from "node:fs";
import path from "node:path";

const log = path.resolve(import.meta.dirname, "../ds.log");

const pendentes = () => {
	const linhas = fs.readFileSync(log, "utf8").trim().split("\n");
	const abertos = new Map();
	for (const l of linhas) {
		const m = l.match(/[▶■✖]\s+(\S+)/);
		if (!m) continue;
		const agente = m[1];
		if (l.includes("▶")) abertos.set(agente, (abertos.get(agente) ?? 0) + 1);
		else abertos.set(agente, (abertos.get(agente) ?? 0) - 1);
	}
	return [...abertos.entries()].filter(([, n]) => n > 0).map(([a, n]) => `${a}x${n}`);
};

const tick = () => {
	const p = pendentes();
	console.log(p.length ? `rodando: ${p.join(", ")}` : "todos terminaram");
	if (p.length === 0) process.exit(0);
};

tick();
setInterval(tick, 90000);
