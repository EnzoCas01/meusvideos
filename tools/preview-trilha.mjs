// Mede duração e loudness (EBU R128) das candidatas e gera prévias de 75 s.
// uso: node tools/preview-trilha.mjs [--only=Nome.mp3]
import { readdirSync, mkdirSync, existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const run = promisify(execFile);
const SRC = "public/audio/musica-candidatas";
const OUT = join(SRC, "preview");
mkdirSync(OUT, { recursive: true });

const onlyArg = process.argv.find((a) => a.startsWith("--only="));
const only = onlyArg ? onlyArg.slice(7) : null;

const files = readdirSync(SRC).filter((f) => f.toLowerCase().endsWith(".mp3"));
const alvos = only ? files.filter((f) => f === only) : files;
const medicoes = {};

for (const f of alvos) {
  const src = join(SRC, f);
  const nome = f.replace(/\.mp3$/i, "");
  const preview = join(OUT, `${nome} - previa 75s.mp3`);

  // duração real
  const { stdout: durOut } = await run("ffprobe", [
    "-v", "error", "-show_entries", "format=duration",
    "-of", "default=nw=1:nk=1", src,
  ]);
  const dur = Number(durOut.trim());

  // loudness integrada (EBU R128) — o resumo vai para o stderr
  let lufs = null;
  let lra = null;
  try {
    const { stderr } = await run(
      "ffmpeg",
      ["-hide_banner", "-nostats", "-i", src, "-af", "ebur128", "-f", "null", "-"],
      { maxBuffer: 64 * 1024 * 1024 }
    );
    for (const line of stderr.split("\n")) {
      if (line.includes("I:") && line.includes("LUFS")) {
        const m = line.match(/I:\s*(-?\d+\.?\d*)\s*LUFS\s*LRA:\s*(-?\d+\.?\d*)/);
        if (m) { lufs = Number(m[1]); lra = Number(m[2]); }
      }
    }
  } catch (e) {
    console.log(`  ebur128 falhou: ${e.message}`);
  }

  if (!existsSync(preview)) {
    await run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-i", src, "-t", "75", "-b:a", "128k", preview]);
  }

  const linha = { arquivo: f, duracao_s: Math.round(dur), lufs, lra, preview: `${nome} - previa 75s.mp3` };
  medicoes[f] = linha;
  console.log(JSON.stringify(linha));
}

if (!only) {
  writeFileSync(join(SRC, "medicoes.json"), JSON.stringify(medicoes, null, 2) + "\n");
  console.log(`medicoes.json: ${Object.keys(medicoes).length} faixas`);
}
