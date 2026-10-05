import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import {execFile, execFileSync} from "node:child_process";

const SLUG = /^[a-z0-9][a-z0-9_-]{0,63}$/;
const GRAPH_VERSION = process.env.INSTAGRAM_GRAPH_VERSION || "v25.0";
const PUBLIC_BASE = (process.env.MEUSVIDEOS_PUBLIC_URL || "https://srv1408471.hstgr.cloud/videos").replace(/\/$/, "");

export function createInstagramScheduler({root, out, getJobs, credentialsDir}) {
  const db = path.join(out, "instagram-schedule.json");
  const assets = path.join(out, "instagram-assets");
  const publicDir = path.join(out, "instagram-public");
  fs.mkdirSync(assets, {recursive: true});
  fs.mkdirSync(publicDir, {recursive: true});
  let entries = fs.existsSync(db) ? JSON.parse(fs.readFileSync(db, "utf8")) : [];
  const save = () => {
    const temp = `${db}.tmp`;
    fs.writeFileSync(temp, JSON.stringify(entries, null, 1), {mode: 0o600});
    fs.renameSync(temp, db);
  };
  // Um processo pode parar após a Meta publicar e antes de gravarmos a resposta.
  // Nessas situações, revisão manual evita uma publicação duplicada.
  if (entries.some((e) => e.status === "publishing")) {
    entries.filter((e) => e.status === "publishing").forEach((e) => { e.status = "needs_review"; e.error = "Processo interrompido durante a publicação; confira a conta antes de reenviar."; });
    save();
  }

  function sources(jobId, names) {
    const job = getJobs().find((j) => j.id === jobId && j.status === "done" && ["post", "carrossel"].includes(j.modo));
    if (!job || !Array.isArray(names) || names.length < 1 || names.length > 10 || new Set(names).size !== names.length)
      throw new Error("selecione de 1 a 10 imagens de uma criação pronta");
    const delivered = new Set((JSON.parse(fs.readFileSync(path.join(job.dir, "entrega.json"), "utf8")).arquivos || []));
    const files = names.map((name) => {
      if (!/^v\d+-slide-\d{2}\.(png|jpe?g)$/.test(name) && !/^slide-\d{2}\.(png|jpe?g)$/.test(name)) throw new Error("nome de imagem inválido");
      if (!delivered.has(name)) throw new Error("imagem não pertence a esta criação");
      const f = path.join(job.dir, "slides", name);
      if (!fs.existsSync(f)) throw new Error("imagem não encontrada");
      return f;
    });
    const versions = new Set(names.map((name) => (/^v\d+-/.exec(name) || [""])[0]));
    if (versions.size > 1) throw new Error("escolha slides da mesma versão");
    return {job, files};
  }

  async function caption({jobId, names}) {
    const {job, files} = sources(jobId, names);
    const task = `Crie título e descrição para a publicação de Instagram. Leia estas imagens, na ordem: ${files.join(" ; ")}. Briefing original: ${job.prompt.slice(0, 2500)}. Responda apenas o JSON exigido pelo agente.`;
    const text = await new Promise((resolve, reject) => {
      execFile(path.join(root, "tools/agente.sh"), ["instagram-legenda", task],
        {cwd: root, env: {...process.env, AGENTE_ESFORCO: "low", JOB_DIR: job.dir}, timeout: 180000, maxBuffer: 2e6},
        (err, stdout) => err ? reject(err) : resolve(stdout));
    });
    const a = text.indexOf("{"), b = text.lastIndexOf("}");
    if (a < 0 || b < a) throw new Error("o agente não devolveu título e descrição");
    const result = JSON.parse(text.slice(a, b + 1));
    const title = String(result.titulo || "").trim().slice(0, 100);
    const description = String(result.descricao || "").trim().slice(0, 2200);
    if (!title || !description) throw new Error("o agente devolveu texto incompleto");
    return {title, description};
  }

  function schedule({jobId, names, project, title, description, publishAt}) {
    const {job, files} = sources(jobId, names);
    if (!SLUG.test(project || "")) throw new Error("escolha um projeto do Instagram");
    const credentialFile = path.join(credentialsDir, `${project}.json`);
    if (!fs.existsSync(credentialFile) || fs.lstatSync(credentialFile).isSymbolicLink()) throw new Error("projeto não cadastrado");
    const credential = JSON.parse(fs.readFileSync(credentialFile, "utf8"));
    if (!credential.access_token || !credential.ig_user_id || !credential.verified_at) throw new Error("valide o token e o ID da conta antes de agendar");
    title = String(title || "").trim(); description = String(description || "").trim();
    if (!title || title.length > 100 || !description || description.length > 2200) throw new Error("preencha título e descrição (até 2200 caracteres)");
    const when = new Date(publishAt).getTime();
    if (!Number.isFinite(when) || when < Date.now() + 30_000 || when > Date.now() + 365 * 86400_000) throw new Error("escolha uma data futura, até um ano à frente");
    const id = crypto.randomBytes(12).toString("hex");
    const dir = path.join(assets, id);
    const dimensions = files.map((file) => execFileSync("identify", ["-format", "%w %h", file], {encoding: "utf8"}).trim().split(/\s+/).map(Number));
    for (const dims of dimensions) {
      if (!dims[0] || !dims[1] || dims[0] / dims[1] < .8 || dims[0] / dims[1] > 1.91)
        throw new Error("esta arte não tem proporção de feed; use uma versão 1:1 ou 4:5");
    }
    if (dimensions.some(([w, h]) => Math.abs(w / h - dimensions[0][0] / dimensions[0][1]) > .01))
      throw new Error("todos os slides precisam ter a mesma proporção");
    fs.mkdirSync(dir, {recursive: true, mode: 0o700});
    let snapshots;
    try {
      snapshots = files.map((file, index) => {
        const target = path.join(dir, `${String(index + 1).padStart(2, "0")}.jpg`);
        execFileSync("convert", [file, "-strip", "-quality", "90", target], {timeout: 30000});
        return target;
      });
    } catch (error) { fs.rmSync(dir, {recursive: true, force: true}); throw error; }
    const entry = {id, project, username: credential.username || "", title, description, publishAt: new Date(when).toISOString(),
      createdAt: new Date().toISOString(), status: "scheduled", jobId: job.id, sourceNames: names, images: snapshots};
    entries.push(entry); save();
    return publicEntry(entry);
  }

  const publicEntry = (e) => ({id: e.id, project: e.project, username: e.username, title: e.title, description: e.description,
    publishAt: e.publishAt, createdAt: e.createdAt, status: e.status, error: e.error || null, mediaId: e.mediaId || null,
    permalink: e.permalink || null, imageCount: e.images.length});
  const list = () => entries.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(publicEntry);
  const image = (id, index) => entries.find((e) => e.id === id)?.images[Number(index) - 1] || null;
  function cancel(id) {
    const entry = entries.find((e) => e.id === id);
    if (!entry || entry.status !== "scheduled") throw new Error("só um agendamento pendente pode ser cancelado");
    entry.status = "canceled"; save();
    return publicEntry(entry);
  }
  function staged(token) {
    if (!/^[a-f0-9]{48}$/.test(token)) return null;
    const file = path.join(publicDir, `${token}.jpg`);
    try { return Date.now() - fs.statSync(file).mtimeMs < 86400_000 ? file : null; } catch { return null; }
  }
  function stage(file) {
    const token = crypto.randomBytes(24).toString("hex");
    fs.copyFileSync(file, path.join(publicDir, `${token}.jpg`));
    return `${PUBLIC_BASE}/instagram-stage/${token}.jpg`;
  }
  async function graph(token, route, data, host = "graph.instagram.com") {
    const url = `https://${host}/${GRAPH_VERSION}/${route}`;
    const response = await fetch(url, {method: data ? "POST" : "GET", headers: {Authorization: `Bearer ${token}`,
      ...(data ? {"Content-Type": "application/x-www-form-urlencoded"} : {})}, body: data ? new URLSearchParams(data) : undefined,
      signal: AbortSignal.timeout(30000)});
    const result = await response.json();
    if (!response.ok || result.error) throw new Error(`Meta HTTP ${response.status}, código ${result.error?.code || "?"}, subcódigo ${result.error?.error_subcode || "?"}`);
    return result;
  }
  async function ready(token, id, host) {
    for (let n = 0; n < 30; n++) {
      const result = await graph(token, `${id}?fields=status_code`, null, host);
      if (["FINISHED", "PUBLISHED"].includes(result.status_code)) return;
      if (["ERROR", "EXPIRED"].includes(result.status_code)) throw new Error(`Meta não processou a imagem (${result.status_code})`);
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
    throw new Error("tempo esgotado ao processar a imagem na Meta");
  }
  async function publish(entry) {
    const credential = JSON.parse(fs.readFileSync(path.join(credentialsDir, `${entry.project}.json`), "utf8"));
    const token = credential.access_token, account = credential.ig_user_id;
    const host = credential.provider === "facebook_login" ? "graph.facebook.com" : "graph.instagram.com";
    if (!token || !account) throw new Error("credencial do projeto incompleta");
    const urls = entry.images.map(stage);
    let container;
    if (urls.length === 1) {
      container = (await graph(token, `${account}/media`, {image_url: urls[0], caption: entry.description}, host)).id;
    } else {
      const children = [];
      for (const url of urls) {
        const child = (await graph(token, `${account}/media`, {image_url: url, is_carousel_item: "true"}, host)).id;
        await ready(token, child, host);
        children.push(child);
      }
      container = (await graph(token, `${account}/media`, {media_type: "CAROUSEL", children: children.join(","), caption: entry.description}, host)).id;
    }
    await ready(token, container, host);
    entry.publishRequested = true; save();
    const published = await graph(token, `${account}/media_publish`, {creation_id: container}, host);
    entry.mediaId = published.id;
    try { entry.permalink = (await graph(token, `${published.id}?fields=permalink`, null, host)).permalink; } catch {}
    entry.status = "published"; entry.publishedAt = new Date().toISOString(); save();
  }
  let busy = false;
  async function runDue() {
    if (busy) return;
    const entry = entries.filter((e) => e.status === "scheduled" && Date.parse(e.publishAt) <= Date.now())
      .sort((a, b) => a.publishAt.localeCompare(b.publishAt))[0];
    if (!entry) return;
    busy = true; entry.status = "publishing"; save();
    try { await publish(entry); }
    catch (error) { entry.status = entry.publishRequested ? "needs_review" : "failed";
      entry.error = String(error.message || error).slice(0, 250); save(); }
    finally { busy = false; setImmediate(runDue); }
  }
  setInterval(runDue, 15000).unref();
  setInterval(() => {
    for (const name of fs.readdirSync(publicDir)) {
      const f = path.join(publicDir, name);
      try { if (Date.now() - fs.statSync(f).mtimeMs > 86400_000) fs.unlinkSync(f); } catch {}
    }
  }, 3600_000).unref();
  setImmediate(runDue);
  return {sources, caption, schedule, list, image, cancel, staged};
}
