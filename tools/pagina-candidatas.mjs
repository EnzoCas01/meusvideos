// Gera a página de escuta das candidatas de trilha a partir do manifest.json.
// uso: node tools/pagina-candidatas.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const SRC = "public/audio/musica-candidatas";
const m = JSON.parse(readFileSync(join(SRC, "manifest.json"), "utf8"));

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const card = (f) => `
  <article class="card g${f.grupo}">
    <header>
      <span class="tag">Grupo ${f.grupo}</span>
      <h2>${esc(f.titulo)}</h2>
      <p class="sub">${esc(f.artista)} · ${esc(f.genero ?? "—")} · ${esc(f.feel ?? "—")}${f.bpm ? " · " + f.bpm + " bpm" : ""}</p>
    </header>
    <audio controls preload="none" src="${encodeURIComponent(f.preview).replace(/%2F/g, "/")}"></audio>
    <dl>
      <div><dt>Duração integral</dt><dd>${Math.floor(f.duracao_s / 60)}m${String(f.duracao_s % 60).padStart(2, "0")}s</dd></div>
      <div><dt>Loudness</dt><dd>${f.lufs_integrado ?? "—"} LUFS (LRA ${f.lra ?? "—"})</dd></div>
      <div><dt>Instrumentos</dt><dd>${esc(f.instrumentos ?? "não informado")}</dd></div>
    </dl>
    <p class="why"><b>Por que está aqui:</b> ${esc(f.porque)}</p>
    <p class="risk"><b>Risco:</b> ${esc(f.risco)}</p>
    <p class="cred">${esc(f.credito)}</p>
    <p class="src"><a href="${esc(f.origem)}">${esc(f.arquivo)}</a> · prévia de 75 s</p>
  </article>`;

const html = `<!doctype html>
<html lang="pt-BR">
<meta charset="utf-8">
<title>Candidatas de trilha — ${esc(m.peca)}</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  :root { color-scheme: dark; }
  body { margin: 0; padding: 32px 20px 64px; background: #12100f; color: #ece7e1;
         font: 16px/1.5 system-ui, -apple-system, Segoe UI, Roboto, sans-serif; }
  h1 { font-size: 1.5rem; margin: 0 0 4px; }
  .lead { color: #a89e95; max-width: 70ch; margin: 0 0 28px; font-size: .95rem; }
  .grid { display: grid; gap: 18px; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); }
  .card { background: #1c1917; border: 1px solid #2e2926; border-radius: 12px; padding: 18px; }
  .card.gB { border-color: #4a3b2a; }
  .tag { font-size: .7rem; letter-spacing: .08em; text-transform: uppercase; color: #c9a227; }
  h2 { font-size: 1.15rem; margin: 4px 0 2px; }
  .sub { margin: 0 0 12px; color: #a89e95; font-size: .85rem; }
  audio { width: 100%; }
  dl { display: flex; flex-wrap: wrap; gap: 6px 18px; margin: 14px 0; font-size: .82rem; }
  dl div { display: flex; gap: 6px; }
  dt { color: #8c8279; }
  dd { margin: 0; }
  .why, .risk, .cred, .src { font-size: .85rem; margin: 8px 0 0; }
  .risk { color: #e0b872; }
  .cred, .src { color: #7d746c; font-size: .75rem; }
  a { color: #9db4d0; }
</style>
<h1>Candidatas de trilha — ${esc(m.peca)}</h1>
<p class="lead">${esc(m.finalidade)} Licença ${esc(m.licenca)} — ${esc(m.credito_obrigatorio)}</p>
<div class="grid">${m.faixas.map(card).join("")}</div>
</html>
`;

writeFileSync(join(SRC, "index.html"), html);
console.log(`index.html: ${m.faixas.length} faixas`);
