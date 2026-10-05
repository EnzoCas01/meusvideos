#!/usr/bin/env node
// Detached render launcher. The parent claude -p process (and any plain child of it)
// dies when the turn ends, killing the render. Here the render is spawned detached
// (own session) and unreffed, so it survives the parent.
//
// Usage:
//   node tools/render-bg.mjs start Composicao out/arquivo.mp4
//   node tools/render-bg.mjs status out/arquivo.mp4
import fs from 'node:fs';
import path from 'node:path';
import {spawn, execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const LF = String.fromCharCode(10);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(ROOT, 'out');

const name = (outFile) => {
  const base = path.basename(outFile);
  return base.toLowerCase().endsWith('.mp4') ? base.slice(0, -4) : base;
};

const pathsFor = (outFile) => {
  const n = name(outFile);
  return {
    mp4: path.resolve(ROOT, outFile),
    pid: path.join(OUT_DIR, n + '-render.pid'),
    log: path.join(OUT_DIR, n + '-render.log'),
  };
};

const readPid = (file) => {
  if (!fs.existsSync(file)) return null;
  const pid = Number(fs.readFileSync(file, 'utf8').trim());
  if (!Number.isInteger(pid)) return null;
  if (pid <= 0) return null;
  return pid;
};

const isAlive = (pid) => {
  if (!pid) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    return err.code === 'EPERM';
  }
};


const tail = (file, n) => {
  if (!fs.existsSync(file)) return {lines: [], total: 0};
  const all = fs.readFileSync(file, 'utf8').trimEnd().split(LF);
  return {lines: all.slice(-n), total: all.length};
};

const ffprobeBin = fs.existsSync('/usr/bin/ffprobe') ? '/usr/bin/ffprobe' : 'ffprobe';

const toSeconds = (raw) => {
  const s = Number(raw);
  return Number.isFinite(s) ? s : null;
};

const clock = (s) => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');

const orEmpty = (v) => {
  if (v === undefined) return '';
  if (v === null) return '';
  return String(v);
};

function probe(file) {
  const json = execFileSync(
    ffprobeBin,
    ['-v', 'error', '-print_format', 'json', '-show_format', '-show_streams', file],
    {encoding: 'utf8'}
  );
  const data = JSON.parse(json);
  const video = data.streams.find((s) => s.codec_type === 'video');
  const audio = data.streams.find((s) => s.codec_type === 'audio');
  const fmtDuration = data.format ? data.format.duration : null;
  const duration = toSeconds(fmtDuration);

  console.log('ffprobe:');
  if (video) {
    const parts = orEmpty(video.r_frame_rate).split('/').map(Number);
    const den = parts[1];
    const fps = den ? parts[0] / den : null;
    console.log('  resolucao: ' + video.width + 'x' + video.height);
    console.log('  fps: ' + (fps === null ? '?' : Number(fps.toFixed(4))));
    console.log('  codec de video: ' + video.codec_name);
  } else {
    console.log('  video: NENHUM');
  }
  console.log('  duracao: ' + (duration === null ? '?' : duration.toFixed(2) + 's (' + clock(duration) + ')'));
  console.log('  codec de audio: ' + (audio ? audio.codec_name : 'NENHUM - video mudo'));
};


function start(composition, outFile) {
  const p = pathsFor(outFile);
  const pid = readPid(p.pid);
  if (isAlive(pid)) {
    console.error('recusado: ja existe render vivo (pid ' + pid + ') para ' + outFile);
    console.error('log: ' + p.log);
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, {recursive: true});
  const fdLog = fs.openSync(p.log, 'a');
  fs.writeSync(fdLog, LF + '=== start ' + new Date().toISOString() + ' - ' + composition + ' - ' + outFile + LF);

  const child = spawn(
    process.execPath,
    [
      'node_modules/.bin/remotion',
      'render',
      'src/index.ts',
      composition,
      outFile,
      '--concurrency=1',
      '--log=error',
    ],
    {cwd: ROOT, detached: true, stdio: ['ignore', fdLog, fdLog]}
  );

  fs.writeFileSync(p.pid, String(child.pid) + LF);
  child.unref();
  fs.closeSync(fdLog);

  console.log('pid ' + child.pid + ' - render destacado: ' + composition + ' - ' + outFile);
  console.log('log: ' + p.log);
  process.exit(0);
}

function status(outFile) {
  const p = pathsFor(outFile);
  const pid = readPid(p.pid);
  const alive = isAlive(pid);
  const pidTxt = pid === null ? 'sem pid gravado' : String(pid);
  console.log('processo: ' + (alive ? 'VIVO' : 'MORTO') + ' (pid ' + pidTxt + ')');

  if (fs.existsSync(p.mp4)) {
    const st = fs.statSync(p.mp4);
    console.log('mp4: ' + (st.size / 1048576).toFixed(1) + ' MB - mtime ' + st.mtime.toISOString());
  } else {
    console.log('mp4: ainda nao existe (normal com --log=error: so e escrito no fim)');
  }

  const t = tail(p.log, 8);
  console.log('log: ' + p.log + ' (ultimas ' + t.lines.length + ' de ' + t.total + ' linhas)');
  for (const line of t.lines) console.log('  ' + line);

  if (fs.existsSync(p.mp4)) {
    if (!alive) probe(p.mp4);
  }
}

const argv = process.argv.slice(2);
const mode = argv[0];
const arg1 = argv[1];
const arg2 = argv[2];

if (mode === 'start') {
  if (!arg1) {
    console.error('uso: node tools/render-bg.mjs start Composicao out/arquivo.mp4');
    process.exit(2);
  }
  if (!arg2) {
    console.error('uso: node tools/render-bg.mjs start Composicao out/arquivo.mp4');
    process.exit(2);
  }
  start(arg1, arg2);
} else if (mode === 'status') {
  if (!arg1) {
    console.error('uso: node tools/render-bg.mjs status out/arquivo.mp4');
    process.exit(2);
  }
  status(arg1);
} else {
  console.error('uso: node tools/render-bg.mjs start Composicao out/arquivo.mp4');
  console.error('     node tools/render-bg.mjs status out/arquivo.mp4');
  process.exit(2);
}

