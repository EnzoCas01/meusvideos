// ElevenLabs narration generator for AlvoManage.
// Dry run by default (no network, no credit). Use --gerar to synthesize.
//   node tools/generate-narration-elevenlabs.mjs                       dry run
//   node tools/generate-narration-elevenlabs.mjs --gerar               generate missing lines
//   node tools/generate-narration-elevenlabs.mjs --gerar --ids=am01,am04
//   node tools/generate-narration-elevenlabs.mjs --gerar --forcar      regenerate existing (spends credit)
//   --json=<path>  manifest to use (default src/narration-alvomanage.json); audio goes to the manifest's own "dir"
//   node tools/generate-narration-elevenlabs.mjs --testar-chave        GET /v1/voices (free)
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const jsonArg = args.find((a) => a.startsWith("--json="));
const JSON_PATH = jsonArg ? path.resolve(process.cwd(), jsonArg.slice(7)) : path.join(ROOT, "src", "narration-alvomanage.json");
const GERAR = args.includes("--gerar");
const FORCAR = args.includes("--forcar");
const TESTAR = args.includes("--testar-chave");
const idsArg = args.find((a) => a.startsWith("--ids="));
const ONLY = idsArg ? idsArg.slice(6).split(",").map((s) => s.trim()).filter(Boolean) : null;

function die(msg) {
  console.error("ERRO: " + msg);
  process.exit(1);
}

function loadEnvKey() {
  if (process.env.ELEVENLABS_API_KEY) return process.env.ELEVENLABS_API_KEY.trim();
  const envPath = path.join(ROOT, ".env");
  if (!fs.existsSync(envPath)) return null;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*ELEVENLABS_API_KEY\s*=\s*(.*)\s*$/);
    if (m) return m[1].replace(/^["']|["']$/g, "").trim();
  }
  return null;
}

function readJson() {
  return JSON.parse(fs.readFileSync(JSON_PATH, "utf8"));
}
function saveJson(data) {
  fs.writeFileSync(JSON_PATH, JSON.stringify(data, null, 2) + "\n");
}

function validate(data) {
  const errs = [];
  for (const k of ["voice_id", "model_id", "output_format", "voice_settings", "dir", "lines"]) {
    if (data[k] === undefined) errs.push(`campo ausente: ${k}`);
  }
  const seen = new Set();
  for (const l of data.lines || []) {
    if (!l.id) errs.push("fala sem id");
    if (seen.has(l.id)) errs.push(`id duplicado: ${l.id}`);
    seen.add(l.id);
    if (!l.text || !l.text.trim()) errs.push(`${l.id}: texto vazio`);
    if (!l.file) errs.push(`${l.id}: sem file`);
  }
  if (ONLY) for (const id of ONLY) if (!seen.has(id)) errs.push(`--ids: ${id} não existe`);
  return errs;
}

const lineText = (l) => (l.useAlt && l.alt ? l.alt : l.text);

function probeDuration(file) {
  const p = spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", file], { encoding: "utf8" });
  const v = parseFloat((p.stdout || "").trim());
  if (Number.isFinite(v) && v > 0) return v;
  // Fallback: decode fully and read the last time= from ffmpeg progress.
  const f = spawnSync("ffmpeg", ["-i", file, "-f", "null", "-"], { encoding: "utf8" });
  const ms = [...(f.stderr || "").matchAll(/time=(\d+):(\d+):(\d+\.\d+)/g)].pop();
  if (!ms) throw new Error("não consegui medir a duração de " + file);
  return +ms[1] * 3600 + +ms[2] * 60 + parseFloat(ms[3]);
}

async function testKey(key) {
  const r = await fetch("https://api.elevenlabs.io/v1/voices", { headers: { "xi-api-key": key } });
  console.log(`GET /v1/voices -> HTTP ${r.status}`);
  if (!r.ok) process.exit(1);
}

async function synth(key, data, lines, i) {
  const l = lines[i];
  const body = {
    text: lineText(l),
    model_id: data.model_id,
    voice_settings: data.voice_settings,
  };
  if (data.language_code) body.language_code = data.language_code;
  if (i > 0) body.previous_text = lineText(lines[i - 1]);
  if (i < lines.length - 1) body.next_text = lineText(lines[i + 1]);
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${data.voice_id}?output_format=${data.output_format}`;
  const r = await fetch(url, {
    method: "POST",
    headers: { "xi-api-key": key, "Content-Type": "application/json", Accept: "audio/mpeg" },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    let detail = "";
    try { detail = (await r.text()).slice(0, 400); } catch { /* ignore */ }
    const hint = r.status === 401 ? " (chave inválida ou ausente)" : r.status === 429 ? " (rate limit ou cota esgotada)" : r.status === 422 ? " (parâmetro rejeitado)" : "";
    throw new Error(`${l.id}: HTTP ${r.status}${hint} ${detail}`);
  }
  return Buffer.from(await r.arrayBuffer());
}

async function main() {
  const data = readJson();
  const errs = validate(data);
  if (errs.length) die("JSON inválido:\n - " + errs.join("\n - "));

  const outDir = path.join(ROOT, data.dir);
  const lines = data.lines;
  const chars = lines.reduce((s, l) => s + lineText(l).length, 0);

  if (TESTAR) {
    const key = loadEnvKey();
    if (!key) die("ELEVENLABS_API_KEY ausente no .env");
    return testKey(key);
  }

  const todo = lines
    .map((l, i) => ({ l, i }))
    .filter(({ l }) => (!ONLY || ONLY.includes(l.id)))
    .filter(({ l }) => FORCAR || !fs.existsSync(path.join(outDir, l.file)));
  const todoChars = todo.reduce((s, { l }) => s + lineText(l).length, 0);

  console.log(`Voz ${data.voice} (${data.voice_id}), ${data.model_id}, ${data.output_format}`);
  console.log("voice_settings:", JSON.stringify(data.voice_settings));
  console.log(`${lines.length} falas, ${chars} caracteres no total.`);
  for (const { l } of todo) {
    console.log(`  ${GERAR ? "gerar" : "geraria"} ${l.id} -> ${path.join(data.dir, l.file)} (${lineText(l).length} car.)`);
  }
  for (const l of lines) {
    if (!todo.some((t) => t.l.id === l.id)) console.log(`  pula   ${l.id} (já existe ou fora de --ids)`);
  }
  console.log(`A gerar: ${todo.length} falas, ${todoChars} caracteres.`);

  if (!GERAR) {
    console.log("DRY RUN: nada foi chamado, nenhum crédito gasto. Use --gerar para sintetizar.");
    return;
  }

  const key = loadEnvKey();
  if (!key) die("ELEVENLABS_API_KEY ausente no .env");
  fs.mkdirSync(outDir, { recursive: true });
  const fps = data.fps || 30;

  for (const { l, i } of todo) {
    process.stdout.write(`${l.id}... `);
    let buf;
    try {
      buf = await synth(key, data, lines, i);
    } catch (e) {
      saveJson(data);
      die(e.message.replaceAll(key, "***"));
    }
    const dest = path.join(outDir, l.file);
    fs.writeFileSync(dest, buf);
    const d = probeDuration(dest);
    l.duration_s = Math.round(d * 1000) / 1000;
    l.durationInFrames = Math.ceil(d * fps);
    saveJson(data); // resumable: saved after every line
    console.log(`${l.duration_s}s = ${l.durationInFrames} frames`);
  }

  // Measure lines that already existed but have no duration yet (no API call).
  for (const l of lines) {
    const f = path.join(outDir, l.file);
    if (l.durationInFrames == null && fs.existsSync(f)) {
      const d = probeDuration(f);
      l.duration_s = Math.round(d * 1000) / 1000;
      l.durationInFrames = Math.ceil(d * fps);
    }
  }
  saveJson(data);
  const total = lines.reduce((s, l) => s + (l.duration_s || 0), 0);
  console.log(`Concluído. Fala total medida: ${total.toFixed(1)}s.`);
}

main().catch((e) => die(String(e.message || e)));
