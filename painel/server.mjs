// Painel web do meusvideos: fila de vídeos, progresso, custo real por agente, edição, avaliação e envio ao WhatsApp.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawn, execFile, execFileSync } from "node:child_process";
import {createInstagramScheduler} from "./instagram-scheduler.mjs";

const ROOT = process.env.MEUSVIDEOS_ROOT || path.resolve(import.meta.dirname, "..");
const OUT = process.env.PAINEL_OUT || `${ROOT}/out/painel`;
const DB = `${OUT}/jobs.json`;
const SESS = `${OUT}/sessions.json`;
const UPLOADS = `${ROOT}/public/uploads`;
const BRAND = `${ROOT}/public/brand`; // logo da marca do Enzo (enviada pelo painel)
const INSTAGRAM_DIR = process.env.MEUSVIDEOS_INSTAGRAM_DIR || "/root/documentos/operacao/meusvideos/instagram";
const PROJECT_SLUG = /^[a-z0-9][a-z0-9_-]{0,63}$/;
const LOGO_EXTS = ["png", "jpg", "jpeg", "svg", "webp"];
const logoAtual = () => {
	try {
		return fs.readdirSync(BRAND).find((f) => LOGO_EXTS.includes(f.split(".").pop().toLowerCase()));
	} catch { return undefined; }
};
const AVALIACOES = `${ROOT}/.claude/memoria/avaliacoes.md`;
const PORT = Number(process.env.PORT || 6018);
const PASSWORD = process.env.PANEL_PASSWORD;
const DEST = "5522981346097"; // Enzo (autorizado)
const LIMITE_MS = 5 * 3600 * 1000; // GLM é lento: 2 voltas de correção passavam de 3 h (Burger King, 24/09)
const ORQ = process.env.PAINEL_ORQ || `${ROOT}/tools/orquestrador.py`;
const LIMITE_CORTES_MS = 12 * 3600 * 1000; // ~1× a duração da live na CPU (teste 27/09: 8 min → 8 min)
const CORTES = ["nice", "-n", "10", `${ROOT}/vendor/autoclip/.venv/bin/python`, `${ROOT}/tools/cortes_job.py`]; // AutoClip: live → vários cortes 9:16
const ORQ_POST = process.env.PAINEL_ORQ_POST || `${ROOT}/tools/orquestrador-post.py`; // post/carrossel: diretor monta a spec, código renderiza os JPGs
const ESTILOS_CORTE = ["bold_pop", "karaoke_fill", "clean_lower", "boxed"];
if (!PASSWORD) throw new Error("PANEL_PASSWORD ausente");
fs.mkdirSync(OUT, { recursive: true });

// ---------- estado ----------
let jobs = fs.existsSync(DB) ? JSON.parse(fs.readFileSync(DB, "utf8")) : [];
const save = () => fs.writeFileSync(DB, JSON.stringify(jobs, null, 1));
const igScheduler = createInstagramScheduler({root: ROOT, out: OUT, getJobs: () => jobs, credentialsDir: INSTAGRAM_DIR});
for (const j of jobs) if (j.diretor) { j.resumo ||= j.diretor.result; delete j.diretor; }
// Depois de cada avaliação o assessor (modelo do agente "assessor" no modelos.json) reescreve o perfil aprendido, em segundo plano.
let aprendendo = 0;
function assessorAprende() {
  const marca = `${ROOT}/painel/assessor/.aprendendo`;
  aprendendo++; try { fs.writeFileSync(marca, String(Date.now())); fs.writeFileSync(`${ROOT}/painel/assessor/.aprendizado.pendente`, String(Date.now())); } catch {}
  const ch = spawn("python3", [`${ROOT}/tools/assessor.py`, "--aprender"], { cwd: ROOT, stdio: "ignore" });
  ch.on("exit", () => { if (--aprendendo === 0) try { fs.unlinkSync(marca); } catch {} });
}
// Reposição persistente: falhas ficam visíveis e são tentadas novamente sem depender de um clique.
let abastecendo = false;
const abastecimentoFile = `${ROOT}/painel/assessor/abastecimento.json`;
function estadoAbastecimento() { try { return JSON.parse(fs.readFileSync(abastecimentoFile, "utf8")); } catch { return {}; } }
function gravaAbastecimento(v) { fs.mkdirSync(path.dirname(abastecimentoFile), {recursive: true}); fs.writeFileSync(abastecimentoFile, JSON.stringify(v)); }
function assessorAbastece() {
  const anterior = estadoAbastecimento();
  if (abastecendo || anterior.tentar_em > Date.now()) return;
  abastecendo = true;
  gravaAbastecimento({rodando: true, inicio: Date.now()});
  const ch = spawn("python3", [`${ROOT}/tools/assessor.py`, "--abastecer"], {cwd: ROOT, stdio: ["ignore", "pipe", "pipe"]});
  let saida = "", erro = "", terminou = false;
  ch.stdout.on("data", b => { saida = (saida + b).slice(-2000); });
  ch.stderr.on("data", b => { erro = (erro + b).slice(-2000); });
  const fim = (code, msg = "") => {
    if (terminou) return; terminou = true; abastecendo = false;
    if (code === 0) { gravaAbastecimento({rodando: false, fim: Date.now(), resultado: saida.trim()}); return; }
    const detalhe = msg || erro.split("\n").filter(Boolean).at(-1) || "Não foi possível repor os prompts.";
    let tentar = Date.now() + 15 * 60_000;
    const limite = detalhe.match(/resets (\d+):(\d+)(am|pm) \(UTC\)/i);
    if (limite) {
      const d = new Date(); let hora = +limite[1] % 12 + (limite[3].toLowerCase() === "pm" ? 12 : 0);
      d.setUTCHours(hora, +limite[2], 30, 0); if (+d <= Date.now()) d.setUTCDate(d.getUTCDate() + 1); tentar = +d;
    }
    gravaAbastecimento({rodando: false, erro: detalhe.slice(-500), tentar_em: tentar});
    console.error("Reposição do assessor:", detalhe);
  };
  ch.on("error", e => fim(1, e.message)); ch.on("close", code => fim(code));
}
setInterval(assessorAbastece, 60_000).unref();
const ALVO_BANCO = `${ROOT}/painel/alvomanage-prompts.json`, ALVO_USADOS = `${ROOT}/painel/alvomanage-usados.json`, ALVO_DESCARTADOS = `${ROOT}/painel/alvomanage-descartados.json`;
const lerJson = (f) => { try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch { return undefined; } };
const instagramProjects = () => {
  try {
    return fs.readdirSync(INSTAGRAM_DIR).filter((n) => n.endsWith(".json") && PROJECT_SLUG.test(n.slice(0, -5)))
      .filter((n) => !fs.lstatSync(path.join(INSTAGRAM_DIR, n)).isSymbolicLink())
      .map((n) => {
        const d = lerJson(path.join(INSTAGRAM_DIR, n));
        return d?.access_token ? { project: n.slice(0, -5), provider: d.provider, hasAccountId: !!d.ig_user_id,
          verified: !!d.verified_at, username: d.username || null } : null;
      }).filter(Boolean).sort((a, b) => a.project.localeCompare(b.project));
  } catch { return []; }
};
const knownProject = (name) => PROJECT_SLUG.test(name || "") && instagramProjects().some((p) => p.project === name);
const vivo = (pid) => { try { process.kill(pid, 0); return true; } catch { return false; } };

// Painel reiniciou com vídeo em andamento: o diretor roda destacado e sobrevive — readota em vez de dar como falho.
for (const j of jobs.filter((j) => j.status === "running")) {
  if (!j.pid || !vivo(j.pid)) {
    try { j.pid = Number(execFileSync("pgrep", ["-of", "tools/orquestrador.py /root/meusvideos/out/painel/|tools/cortes_job.py /root/meusvideos/out/painel/|^bash /root/meusvideos/tools/agente.sh diretor "]).toString().trim()) || undefined; } catch { j.pid = undefined; }
  }
  if (!j.pid || !vivo(j.pid)) finish(j);
}
save();

// ---------- etapas (peso = % da barra quando a etapa começa), lidas de "▶ <agente> ·" em ds.log ----------
const STAGES = [
  [/\] ▶ triagem ·/, "Jev escolhendo modelos", 3],
  [/\] ▶ decisao ·/, "Jev escolhendo tema, formato e ícone", 5],
  [/\] ▶ diretor ·/, "Planejando o vídeo", 6],
  [/\] ▶ imagem ·/, "Buscando imagens e vídeos", 10],
  [/\] ▶ narracao ·/, "Voz e legenda", 25],
  [/\] ▶ motion ·/, "Montando a edição", 45],
  [/\] ▶ som ·/, "Efeitos sonoros", 65],
  [/\] ▶ render ·/, "Renderizando o vídeo", 78],
  [/\] ▶ revisao ·/, "Revisão cena a cena (Jev)", 90],
];

// ---------- instruções ao diretor ----------
const CAPTION_STYLES = {
  rapido: { label: "Rápida, poucas palavras" },
  karaoke: { label: "Frase com efeito (karaokê)" },
  simples: { label: "Frase simples, sem efeito" },
};
const captionText = (style) => `Use o componente PRONTO src/components/captions/CaptionsStyled.tsx com style="${style}" (não reescreva a legenda). ${style === "rapido" ? "O DIRETOR ESCOLHE a posição da legenda rápida com a prop posicao=\"meio\"|\"baixo\"|\"alto\" conforme o vídeo: \"meio\" quando a tela está livre; \"baixo\" (terço inferior) quando há texto de impacto, título ou rosto/assunto no centro; \"alto\" se o de baixo e o centro estiverem ocupados; o motion aplica e o revisor confere em um still de um frame com legenda. " : ""}Passe lines={...} vindo de narration-*.json (frame + words com s/e, já medidos) e as cores/fonte do tema da peça. Monte-o por cima das cenas, uma vez, na timeline da peça.`;
const ehPost = (j) => j.modo === "post" || j.modo === "carrossel";  // post roda à parte (criaPostDireto), fora da fila de vídeo
const legenda = (s) => `Estilo de legenda escolhido pelo Enzo no painel: ${CAPTION_STYLES[s]?.label || CAPTION_STYLES.simples.label}. ${captionText(CAPTION_STYLES[s] ? s : "simples")}`;
// ---------- execução (um vídeo por vez; saída em arquivo para sobreviver a reinício do painel) ----------
function startNext() {
  if (jobs.some((j) => j.status === "running" && !ehPost(j))) return;
  const job = jobs.find((j) => j.status === "queued");
  if (!job) return;
  const dir = `${OUT}/${job.id}`;
  fs.mkdirSync(dir, { recursive: true });
  const pai = job.parentId ? jobs.find((j) => j.id === job.parentId) : null;
  fs.writeFileSync(`${dir}/pedido.json`, JSON.stringify({ id: job.id, modo: job.modo, prompt: job.prompt, captionStyle: job.captionStyle, legenda: legenda(job.captionStyle),
    brutos: job.brutos || [], cortes: job.cortes, parentId: job.parentId || null, parent: pai ? { dir: pai.dir, prompt: pai.prompt, resumo: pai.resumo || "" } : null }, null, 1));
  const out = fs.openSync(`${dir}/diretor.txt`, "w"), err = fs.openSync(`${dir}/diretor.stderr.log`, "a");
  const [cmd, ...args] = job.modo === "cortes" ? CORTES : job.modo === "post" || job.modo === "carrossel" ? [ORQ_POST] : [ORQ];
  const child = spawn(cmd, [...args, dir],
    { cwd: ROOT, env: { ...process.env, JOB_DIR: dir }, stdio: ["ignore", out, err], detached: true });
  fs.closeSync(out); fs.closeSync(err);
  child.unref();
  child.on("error", (e) => fs.appendFileSync(`${dir}/diretor.stderr.log`, `não iniciou: ${e.message}\n`));
  Object.assign(job, { status: "running", stage: "Começando", progress: 2, startedAt: Date.now(), dir, pid: child.pid });
  save();
}

let dsOff = 0;
try { dsOff = fs.statSync(`${ROOT}/ds.log`).size; } catch {}
setInterval(() => {
  const job = jobs.find((j) => j.status === "running" && !ehPost(j));
  if (!job) return startNext();
  const pr = job.modo === "cortes" && lerJson(`${job.dir}/progresso.json`);
  if (pr && pr.pct > job.progress) Object.assign(job, { stage: pr.msg, progress: pr.pct });
  if (job.modo !== "cortes") try {
    const buf = fs.readFileSync(`${ROOT}/ds.log`);
    for (const line of buf.subarray(Math.min(dsOff, buf.length)).toString("utf8").split("\n"))
      for (const [re, label, pct] of STAGES) if (re.test(line) && pct > job.progress) Object.assign(job, { stage: label, progress: pct });
    dsOff = buf.length;
  } catch {}
  // Agente esperando o limite do Claude liberar: relógio das 3 h congela e a etapa avisa.
  try {
    fs.accessSync(`${job.dir}/aguardando-limite`);
    job.startedAt += 3000;
    job.stageAntes ??= job.stage;
    job.stage = "Limite do Claude — testando de novo a cada 30 s";
  } catch { if (job.stageAntes) { job.stage = job.stageAntes; delete job.stageAntes; } }
  if (Date.now() - job.startedAt > (job.modo === "cortes" ? LIMITE_CORTES_MS : LIMITE_MS) && vivo(job.pid)) try { process.kill(-job.pid, "SIGTERM"); } catch {}
  if (!vivo(job.pid)) { finish(job); startNext(); }
  save();
}, 3000);

function finish(job) {
  job.endedAt = Date.now();
  try { job.resumo = fs.readFileSync(`${job.dir}/diretor.txt`, "utf8").trim() || job.resumo; } catch {}
  job.tokens = custos(job);
  const ok = job.dir && (job.modo === "cortes" ? !!lerJson(`${job.dir}/cortes.json`)?.length : job.modo === "post" || job.modo === "carrossel" ? fs.existsSync(`${job.dir}/entrega.json`) : fs.existsSync(`${job.dir}/video.mp4`));
  if (job.status === "canceled") job.stage = "Cancelado";
  else if (ok) Object.assign(job, { status: "done", stage: "Pronto", progress: 100 });
  else Object.assign(job, { status: "failed", stage: job.modo === "cortes" ? "Terminou sem gerar cortes" : job.modo === "post" || job.modo === "carrossel" ? "Terminou sem gerar as imagens" : "Terminou sem gerar o vídeo" });
  if (ok && job.autoSend && job.status === "done") sendWhatsapp(job).catch(() => {});
}

// ---------- custo real: tokens de usage.jsonl × tabela de preços de modelos.json ----------
function custos(job) {
  let precos = {};
  try { precos = JSON.parse(fs.readFileSync(`${ROOT}/modelos.json`, "utf8")).precos || {}; } catch {}
  const pico = (p, ts) => {
    if (!p.fora_do_pico) return 1;
    const d = new Date(ts), h = d.getUTCHours();
    const emPico = (p.pico_dias || []).includes(d.getUTCDay()) && (p.pico_utc || []).some(([a, b]) => h >= a && h < b);
    return emPico ? 1 : p.fora_do_pico;
  };
  const agentes = {};
  const f = job.dir && `${job.dir}/usage.jsonl`;
  const linhas = f && fs.existsSync(f) ? fs.readFileSync(f, "utf8").split("\n").filter(Boolean) : [];
  for (const l of linhas) {
    let u; try { u = JSON.parse(l); } catch { continue; }
    for (const [modelo, m] of Object.entries(u.modelUsage || {})) {
      const a = (agentes[`${u.agent}|${modelo}`] ||= { agente: u.agent, modelo, chamadas: 0, entrada: 0, cache: 0, saida: 0, custo: 0, assinatura: false, equivApi: 0, semPreco: false });
      const ent = (m.inputTokens || 0) + (m.cacheCreationInputTokens || 0), cache = m.cacheReadInputTokens || 0, sai = m.outputTokens || 0;
      Object.assign(a, { chamadas: a.chamadas + 1, entrada: a.entrada + ent, cache: a.cache + cache, saida: a.saida + sai });
      const p = precos[modelo];
      if (!p) a.semPreco = true;
      else if (p.assinatura) { a.assinatura = true; a.equivApi += m.costUSD || 0; }
      else a.custo += ((ent * p.entrada + cache * p.cache + sai * p.saida) / 1e6) * pico(p, (u.ts ? u.ts * 1000 : job.startedAt));
    }
  }
  const lista = Object.values(agentes);
  return { agentes: lista, total: lista.reduce((s, a) => s + a.custo, 0), equivApi: lista.reduce((s, a) => s + a.equivApi, 0) };
}

// ---------- avaliação: vira aprendizado dos agentes ----------
// Jev decide de quem é o defeito; incerto (confiança < 0,5) = fica só no arquivo geral de avaliações.
const AREAS_DEFEITO = new Set(["imagem", "narracao", "motion", "som", "diretor"]); // únicos nomes válidos de agente para .claude/memoria/<agente>.md
function areaDoDefeito(texto) {
  try {
    const r = JSON.parse(execFileSync("python3", [`${ROOT}/tools/jev.py`, "-"], { timeout: 30000, input: JSON.stringify({ state: { reclamacao_do_enzo: texto.slice(0, 2000) },
      questions: { area: { type: "choice", instructions: "This complaint about a video (written in Portuguese) is mainly the fault of which area?", criteria: {
        imagem: "Photos or video clips: ugly, dark, amateur, repeated or off-topic.",
        narracao: "Spoken text or voice: script, words, pace, voice, pronunciation, wrong information.",
        motion: "The assembled visuals: layout, on-screen text, captions, animation, colors, scene timing.",
        som: "Sound effects or music.",
        diretor: "The overall idea of the video: structure, opening, duration, approach." } } } }) }).toString());
    const a = r.answers.area;
    if (!AREAS_DEFEITO.has(a.choice)) return null; // resposta fora do esperado (Jev indisponível/alucinou): não grava em caminho arbitrário
    return a.confidence >= 0.5 ? { agente: a.choice, confianca: a.confidence } : null;
  } catch { return null; }
}

// 👍/👎 na ARTE pronta (post/carrossel) ensina o ASSESSOR: vai para o histórico dele com o prompt usado e o que a versão usou
// (luz, fundo, sombra, foto…), e ele reaprende. Os agentes de vídeo não têm nada com post.
function aprendeDaArte(job, nota, texto, versao) {
  let jv = {}; try { jv = JSON.parse(fs.readFileSync(`${job.dir}/jev.json`, "utf8")); } catch {}
  const vs = (jv.versoes || []).filter((v) => !versao || v.n === versao);
  const txt = versao && jv.textos?.[versao - 1] ? jv.textos[versao - 1].map((x) => x.filter(Boolean).join(" | ")).join(" || ") : "";
  const ASS = `${ROOT}/painel/assessor`, ef = `${ASS}/exemplos.json`, ex = lerJson(ef) || [];
  ex.push({ texto: String(job.prompt), bom: nota === "boa", motivo: texto, origem: "arte", versao: versao || null,
    texto_da_versao: txt && txt !== job.prompt ? txt.slice(0, 400) : undefined,
    arte: vs.map((v) => ({ n: v.n, ...Object.fromEntries(Object.entries(v).filter(([k, x]) => x != null && k !== "n" && k !== "foto_id")) })) });
  fs.mkdirSync(ASS, { recursive: true }); fs.writeFileSync(ef, JSON.stringify(ex.slice(-200), null, 1));
  assessorAprende();
}
function avaliar(job, nota, texto, versao) {
  job.avaliacao = { nota, texto, em: Date.now(), ...(versao ? { versao } : {}) };
  if (ehPost(job)) {
    if (versao) job.votos = { ...(job.votos || {}), [versao]: nota };  // voto por versão: os quadrados da tela Criar mostram
    aprendeDaArte(job, nota, texto, versao); job.avaliacao.agente = "assessor"; return;
  }
  const data = new Date().toISOString().slice(0, 10);
  let peca = "";
  try { peca = JSON.parse(fs.readFileSync(`${job.dir}/peca.json`, "utf8")).peca || ""; } catch {}
  const entrada = `\n## ${data} — ${nota === "boa" ? "👍 BOM" : "👎 RUIM"}${peca ? ` · ${peca}` : ""} (job ${job.id})
**Pedido:** ${job.prompt.replace(/\s+/g, " ").slice(0, 400)}
**Legenda:** ${CAPTION_STYLES[job.captionStyle]?.label || "?"}${job.brutos?.length ? " · vídeo bruto do Enzo" : ""}${job.parentId ? ` · edição do job ${job.parentId}` : ""}
**Como foi feito (resumo do diretor):** ${(job.resumo || "").replace(/\s+/g, " ").slice(0, 600)}
**${nota === "boa" ? "O que o Enzo gostou" : "O que está RUIM (não repetir)"}:** ${texto || "(sem comentário — o vídeo como um todo foi aprovado)"}
`;
  if (nota === "ruim") {
    const area = areaDoDefeito(texto);
    if (area) {
      fs.appendFileSync(`${ROOT}/.claude/memoria/${area.agente}.md`, `\n## ${data} — 👎 do Enzo no vídeo${peca ? ` ${peca}` : ""} (job ${job.id})\n${texto}\n**Por quê:** avaliação do Enzo no painel; o Jev atribuiu a você (confiança ${area.confianca}). Não repita isso.\n`);
      job.avaliacao.agente = area.agente;
    }
  }
  if (!fs.existsSync(AVALIACOES)) fs.writeFileSync(AVALIACOES, "# Avaliações do Enzo\n\nCada vídeo avaliado no painel. 👍 = repetir esse tipo de escolha. 👎 = o motivo escrito é defeito a evitar. Gravado pelo painel; não editar à mão.\n");
  fs.appendFileSync(AVALIACOES, entrada);
}

// ---------- assistente de prompt: IA da assinatura pergunta e escreve 3 versões; o Jev dá nota e escolhe ----------
const roda = (cmd, args, { input, ...opts } = {}) => new Promise((ok, erro) => {
  const c = execFile(cmd, args, { maxBuffer: 8e6, cwd: ROOT, ...opts }, (e, out, err) => (e ? erro(new Error(String(err || e.message).slice(-400))) : ok(out)));
  if (input !== undefined) c.stdin.end(input);
});
const extraiJson = (t) => { const a = t.indexOf("{"), b = t.lastIndexOf("}"); if (a < 0 || b < a) throw new Error("a IA não devolveu JSON"); return JSON.parse(t.slice(a, b + 1)); };
const assistente = async (texto) => extraiJson(await roda(`${ROOT}/tools/agente.sh`, ["assistente", texto], { env: { ...process.env, AGENTE_ESFORCO: "low" }, timeout: 240000 }));
const conversas = new Map();
const MAX_RODADAS = 10;
// Gosto do Enzo aprendido nas conversas, por tipo de vídeo (historia, livre, bruto, outro).
const GOSTO = process.env.PAINEL_GOSTO || `${ROOT}/.claude/memoria/gosto-prompts.json`;
const lerGosto = () => { try { return JSON.parse(fs.readFileSync(GOSTO, "utf8")); } catch { return {}; } };
const TIPOS = { historia: "história", livre: "livre (anúncio, dica, lista…)", bruto: "vídeo gravado pelo Enzo", outro: "outro" };
function textoGosto(tipo) {
  const g = lerGosto();
  const tipos = tipo ? [tipo] : Object.keys(g);
  const linhas = tipos.filter((t) => g[t]?.length).map((t) => `Para vídeos de ${TIPOS[t] || t}:\n${g[t].map((x) => `- ${x}`).join("\n")}`);
  return linhas.length ? `GOSTO DO ENZO (aprendido em conversas anteriores):\n${linhas.join("\n")}\n\n` : "";
}

// Histórico da conversa em texto: ideia, cada rodada (perguntas + respostas + o que ele escreveu) e o rascunho atual.
function historico(c) {
  const rodadas = c.rodadas.filter((r) => r.respostas).map((r, i) => `RODADA ${i + 1}:\n` +
    r.perguntas.map((q) => `- ${q.pergunta}\n  → ${String(r.respostas[q.id] || "").trim() || "(sem resposta)"}`).join("\n") +
    (r.livre ? `\n- O Enzo escreveu por conta própria: "${r.livre}"` : "")).join("\n\n");
  return `${textoGosto(c.tipo)}${c.tipo ? `Tipo deste vídeo: ${c.tipo}\n\n` : ""}Ideia original do Enzo:\n"""${c.texto}"""\n\n${rodadas ? `Conversa até agora:\n${rodadas}\n\n` : ""}${c.estrutura ? `Rascunho atual:\n${c.estrutura}\n` : ""}`;
}

async function rodadaDaConversa(c) {
  const ultima = c.rodadas.at(-1);
  const nota = ultima?.livre || Object.values(ultima?.respostas || {}).some((v) => String(v).trim())
    ? "Aprofunde no que ele respondeu e mudou na última rodada." : "Primeira rodada: estruture a ideia e confirme o que entendeu.";
  const r = await assistente(`MODO: CONVERSA\n${historico(c)}\n${nota}`);
  if (!Array.isArray(r.perguntas)) throw new Error("a IA não devolveu a rodada");
  c.estrutura = String(r.estrutura || c.estrutura || "");
  if (!c.tipo && TIPOS[r.tipo]) c.tipo = r.tipo;
  const perguntas = r.perguntas.slice(0, 6).map((q, i) => ({ ...q, id: `r${c.rodadas.length + 1}p${i + 1}` }));
  c.rodadas.push({ perguntas, respostas: null, livre: "" });
  const pronto = !!r.pronto || !perguntas.length || c.rodadas.length >= MAX_RODADAS;
  return { entendi: r.entendi, estrutura: c.estrutura, perguntas, pronto, rodada: c.rodadas.length };
}

function registraRespostas(c, respostas, livre) {
  const ultima = c.rodadas.at(-1);
  if (ultima && !ultima.respostas) Object.assign(ultima, { respostas: respostas || {}, livre: String(livre || "").trim().slice(0, 3000) });
}

async function assistenteInicio(texto) {
  for (const [k, v] of conversas) if (Date.now() - v.em > 3 * 3600e3) conversas.delete(k);
  const sessao = crypto.randomUUID();
  const c = { texto, rodadas: [], estrutura: "", em: Date.now() };
  conversas.set(sessao, c);
  return { sessao, ...(await rodadaDaConversa(c)) };
}

async function assistenteRodada(sessao, respostas, livre) {
  const c = conversas.get(sessao);
  if (!c) throw new Error("conversa expirou; comece de novo");
  registraRespostas(c, respostas, livre);
  c.em = Date.now();
  return rodadaDaConversa(c);
}

async function assistentePrompts(sessao, respostas, livre) {
  const c = conversas.get(sessao);
  if (!c) throw new Error("conversa expirou; comece de novo");
  registraRespostas(c, respostas, livre);
  const r = await assistente(`MODO: PROMPTS\n${historico(c)}`);
  const opcoes = (r.opcoes || []).filter((o) => o?.prompt).slice(0, 3);
  if (!opcoes.length) throw new Error("a IA não gerou prompts");
  const tipo = c.tipo || "outro";
  let gosto = null;
  if (Array.isArray(r.gosto) && r.gosto.length) {
    const g = lerGosto();
    g[tipo] = r.gosto.map((x) => String(x).trim()).filter(Boolean).slice(0, 15);
    fs.writeFileSync(GOSTO, JSON.stringify(g, null, 1));
    gosto = g[tipo];
  }
  const ids = opcoes.map((_, i) => "abc"[i]);
  // O Jev julga em inglês (onde acerta mais): o Claude já devolveu tudo nas duas línguas.
  const qs = { melhor: { type: "choice", instructions: "Which version is the best production prompt for a team of video agents: it follows the `agreed_structure` and everything the creator confirmed or changed in `conversation`, keeps his own lines, is complete and concrete, and invents no facts?",
    criteria: Object.fromEntries(ids.map((id) => [id, `Version \`options.${id}\`.`])) } };
  for (const id of ids) {
    qs[`fiel_${id}`] = { type: "score", instructions: `How faithfully does version \`options.${id}\` follow the \`agreed_structure\` and everything the creator confirmed, changed or rejected in \`conversation\`, keeping his own lines from \`original_idea\`?`,
      criteria: ["It ignores what he decided in the conversation, rewrites his lines, or brings back something he rejected.", "Mostly faithful, but something he decided is missing or changed.", "Follows everything he decided and keeps his lines."] };
    qs[`completo_${id}`] = { type: "score", instructions: `How complete and concrete is version \`options.${id}\` as a production prompt (objective, audience, tone, duration, opening, the final spoken script line by line, each scene with what is shown and on-screen text, call to action, must-haves, things to avoid)?`,
      criteria: ["Vague: it talks about the idea instead of specifying the video; sections or the final script are missing.", "Mostly complete, but some sections are generic or missing.", "Complete and concrete: every section present, final script and every scene specified."] };
    qs[`inventa_${id}`] = { type: "noul", instructions: `Does version \`options.${id}\` state FACTS, NUMBERS, NAMES, PRICES or OFFERS that the creator never gave in \`original_idea\` or \`conversation\`? Production choices (which image, which clip, on-screen text, pacing) do NOT count.`,
      criteria: { true: "It states a fact, number, name, price or offer he never gave.", false: "Every fact, number, name and offer in it came from him; the rest are production choices." } };
    qs[`viavel_${id}`] = { type: "noul", instructions: `Can option \`options.${id}\` be produced using only stock photos and stock video clips, animated text and graphics, captions and a synthetic voice, without filming anything new and without showing specific real people?`,
      criteria: { true: "Everything it asks for can be made with those resources.", false: "It asks for something those resources cannot make." } };
  }
  let a = null;
  try {
    a = JSON.parse(await roda("python3", [`${ROOT}/tools/jev.py`, "-"], { timeout: 60000, input: JSON.stringify({
      state: { original_idea: r.original_en || c.texto, agreed_structure: r.estrutura_en || c.estrutura, conversation: r.respostas_en || [],
        options: Object.fromEntries(ids.map((id, i) => [id, opcoes[i].prompt_en || opcoes[i].prompt])) }, questions: qs }) })).answers;
  } catch {}
  const notas = ids.map((id) => a ? { fiel: a[`fiel_${id}`].score, completo: a[`completo_${id}`].score, inventa: a[`inventa_${id}`].noul, viavel: a[`viavel_${id}`].noul } : null);
  const ranking = ids.map((id, i) => [id, notas[i] ? notas[i].fiel + notas[i].completo - 2 * notas[i].inventa + (notas[i].viavel >= 0.5 ? 0.5 : 0) : 0]).sort((x, y) => y[1] - x[1]);
  const confiante = a && a.melhor.confidence >= 0.5;
  const escolhida = confiante ? a.melhor.choice : ranking[0][0];
  return { opcoes: opcoes.map((o, i) => ({ id: ids[i], titulo: o.titulo, abordagem: o.abordagem, duracao_s: o.duracao_s, prompt: o.prompt, nota: notas[i] })), escolhida,
    gosto, tipo: TIPOS[tipo] || tipo,
    julgado_em: opcoes.every((o) => o.prompt_en) ? "inglês" : "português (a IA não mandou a versão em inglês)",
    jev: a ? { confianca: a.melhor.confidence, probabilidades: a.melhor.probabilities, incerto: !confiante } : { indisponivel: true } };
}

// ---------- WhatsApp (Evolution local, instância ee → Enzo) ----------
async function evo(endpoint, body) {
  const key = /^AUTHENTICATION_API_KEY=(.*)$/m.exec(fs.readFileSync("/opt/evo/.env", "utf8"))[1].trim();
  const r = await fetch(`http://127.0.0.1:8083/message/${endpoint}/ee`, {
    method: "POST", headers: { apikey: key, "Content-Type": "application/json" }, body: JSON.stringify({ number: DEST, ...body }),
  });
  if (!r.ok) throw new Error(`Evolution ${r.status}: ${(await r.text()).slice(0, 200)}`);
}
async function sendWhatsapp(job) {
  job.send = "enviando"; save();
  try {
    if (job.modo === "cortes") {
      for (const c of lerJson(`${job.dir}/cortes.json`) || []) {
        const f = `${job.dir}/${c.arquivo}`, big = fs.statSync(f).size > 15 * 1024 * 1024;
        await evo("sendMedia", { mediatype: big ? "document" : "video", mimetype: "video/mp4", fileName: c.arquivo,
          caption: c.titulo || c.arquivo, media: fs.readFileSync(f).toString("base64") });
      }
      job.send = "enviado"; return save();
    }
    if (job.modo === "post" || job.modo === "carrossel") {
      const e = lerJson(`${job.dir}/entrega.json`) || {};
      const imagens = (e.arquivos || []).filter((a) => fs.existsSync(`${job.dir}/slides/${a}`));
      for (let i = 0; i < imagens.length; i++) {
        const png = imagens[i].toLowerCase().endsWith(".png");
        await evo("sendMedia", { mediatype: "image", mimetype: png ? "image/png" : "image/jpeg", fileName: imagens[i],
          caption: i === 0 ? job.prompt.slice(0, 200) : "", media: fs.readFileSync(`${job.dir}/slides/${imagens[i]}`).toString("base64") });
      }
      job.send = "enviado"; return save();
    }
    const f = `${job.dir}/video.mp4`;
    const big = fs.statSync(f).size > 15 * 1024 * 1024; // WhatsApp recusa vídeo grande: vai como documento
    await evo("sendMedia", {
      mediatype: big ? "document" : "video", mimetype: "video/mp4", fileName: `${job.id}.mp4`,
      caption: job.prompt.slice(0, 200), media: fs.readFileSync(f).toString("base64"),
    });
    const cr = `${job.dir}/creditos.txt`;
    if (fs.existsSync(cr)) await evo("sendText", { text: fs.readFileSync(cr, "utf8").slice(0, 3500) });
    job.send = "enviado";
  } catch (err) { job.send = `erro: ${err.message}`; }
  save();
}

// ---------- login (senha única + limite de tentativas; sessão sobrevive a reinício) ----------
const sessions = new Set(fs.existsSync(SESS) ? JSON.parse(fs.readFileSync(SESS, "utf8")) : []);
const fails = new Map();
const ip = (req) => req.headers["x-real-ip"] || req.socket.remoteAddress || "";
const cookie = (req) => /(?:^|;\s*)mv=([\w-]+)/.exec(req.headers.cookie || "")?.[1];
const authed = (req) => sessions.has(cookie(req));

function login(req, res, body) {
  const f = fails.get(ip(req)) || { n: 0, until: 0 };
  if (Date.now() < f.until) return json(res, 429, { erro: "Muitas tentativas. Aguarde 15 minutos." });
  const a = Buffer.from(String(body.senha || "")), b = Buffer.from(PASSWORD);
  if (a.length === b.length && crypto.timingSafeEqual(a, b)) {
    fails.delete(ip(req));
    const t = crypto.randomUUID(); sessions.add(t);
    fs.writeFileSync(SESS, JSON.stringify([...sessions].slice(-50)), { mode: 0o600 });
    res.setHeader("Set-Cookie", `mv=${t}; Path=${process.env.COOKIE_PATH || "/videos"}; HttpOnly; Secure; SameSite=Strict; Max-Age=2592000`);
    return json(res, 200, { ok: true });
  }
  f.n += 1; if (f.n >= 5) { f.until = Date.now() + 15 * 60_000; f.n = 0; }
  fails.set(ip(req), f);
  json(res, 401, { erro: "Senha incorreta" });
}

// ---------- http ----------
const json = (res, code, obj) => { res.writeHead(code, { "Content-Type": "application/json" }); res.end(JSON.stringify(obj)); };
const readBody = (req) => new Promise((ok) => { let d = ""; req.on("data", (c) => (d += c)); req.on("end", () => { try { ok(JSON.parse(d || "{}")); } catch { ok({}); } }); });
const HIDE = new Set(["usage.jsonl", "peca.json"]);
// O que está acontecendo agora: última fala/ferramenta do agente mais recente (…-atividade.log).
function agora(j) {
  try {
    const logs = fs.readdirSync(j.dir).filter((n) => n.endsWith("-atividade.log"))
      .map((n) => [n, fs.statSync(`${j.dir}/${n}`).mtimeMs]).sort((a, b) => b[1] - a[1]);
    if (!logs.length) return null;
    const [nome, mtime] = logs[0], fd = fs.openSync(`${j.dir}/${nome}`, "r"), tam = fs.fstatSync(fd).size, buf = Buffer.alloc(Math.min(4096, tam));
    fs.readSync(fd, buf, 0, buf.length, tam - buf.length); fs.closeSync(fd);
    const linha = buf.toString("utf8").split("\n").reverse().find((l) => /\] (FALA|TOOL)/.test(l));
    if (!linha) return null;
    const txt = linha.replace(/^\[[\d:]+\] /, "").replace(/^FALA: /, "").replace(/^TOOL (\w+): /, (_, t) => (t === "Bash" ? "$ " : `${t}: `));
    return { agente: nome.replace("-atividade.log", ""), texto: txt.slice(0, 160), ha: Math.round((Date.now() - mtime) / 1000) };
  } catch { return null; }
}
const MOSTRAR = new Set(["video.mp4", "creditos.txt"]);
const view = (j) => ({ ...j, pid: undefined, ...(j.status === "running" && (j.modo === "post" || j.modo === "carrossel") && j.dir ? { stage: (() => { try { return fs.readFileSync(`${j.dir}/status.txt`, "utf8").slice(0, 160); } catch { return j.stage; } })() } : {}), tokens: custos(j), agora: j.status === "running" ? agora(j) : undefined,
  modelos: j.dir && lerJson(`${j.dir}/modelos-escolhidos.json`), lista: j.modo === "cortes" && j.dir ? lerJson(`${j.dir}/cortes.json`) : undefined,
  files: j.dir && fs.existsSync(j.dir) ? [
    ...fs.readdirSync(j.dir).filter((n) => MOSTRAR.has(n)),
    ...((j.modo === "post" || j.modo === "carrossel") ? ((lerJson(`${j.dir}/entrega.json`)?.arquivos || []).filter((n) => fs.existsSync(`${j.dir}/slides/${n}`)).map((n) => `slides/${n}`)) : []),
  ].map((n) => ({ name: n, size: fs.statSync(`${j.dir}/${n}`).size })) : [] });
const novoId = () => `v${Date.now().toString(36)}${crypto.randomBytes(2).toString("hex")}`;

function serveFile(req, res, file, download) {
	const st = fs.statSync(file); const range = /bytes=(\d*)-(\d*)/.exec(req.headers.range || "");
	const tipos = {".mp4": "video/mp4", ".txt": "text/plain; charset=utf-8", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".svg": "image/svg+xml", ".webp": "image/webp"};
	const h = {"Content-Type": tipos[path.extname(file).toLowerCase()] || "application/octet-stream", "Accept-Ranges": "bytes"};
  if (download) h["Content-Disposition"] = `attachment; filename="${path.basename(file)}"`;
  if (range) {
    const s = range[1] ? +range[1] : 0, e = range[2] ? +range[2] : st.size - 1;
    res.writeHead(206, { ...h, "Content-Range": `bytes ${s}-${e}/${st.size}`, "Content-Length": e - s + 1 });
    return fs.createReadStream(file, { start: s, end: e }).pipe(res);
  }
  res.writeHead(200, { ...h, "Content-Length": st.size });
  fs.createReadStream(file).pipe(res);
}

function upload(req, res, nome) {
  const ext = (/\.(mp4|mov|m4v|webm|mkv|3gp)$/i.exec(nome || "") || [])[0];
  if (!ext) return json(res, 400, { erro: "envie um vídeo (mp4, mov, m4v, webm, mkv, 3gp)" });
  const id = novoId(); fs.mkdirSync(`${UPLOADS}/${id}`, { recursive: true });
  const rel = `public/uploads/${id}/bruto${ext.toLowerCase()}`;
  const ws = fs.createWriteStream(`${ROOT}/${rel}`);
  req.pipe(ws);
  ws.on("finish", () => json(res, 200, { arquivo: rel, tamanho: ws.bytesWritten }));
  ws.on("error", (e) => json(res, 500, { erro: e.message }));
}

// Post/carrossel: o card entra na lista NA HORA (status ao vivo pelo status.txt do orquestrador); gera em segundo plano, um por vez.
function criaPostDireto(item, autoSend) {
  const job = { id: novoId(), modo: item.modo, prompt: String(item.prompt || "").trim(), autoSend: !!autoSend,
    ...(knownProject(item.project) ? { project: item.project } : {}),
    ...(/^(post|carrossel):\d+$/.test(item.alvo || "") ? { alvo: item.alvo } : {}),
    status: "running", stage: "Na fila de criação", progress: 0, createdAt: Date.now(), startedAt: Date.now() };
  const dir = `${OUT}/${job.id}`;
  fs.mkdirSync(dir, {recursive: true});
  job.dir = dir;
  job.formato = item.formato === "stories" ? "stories" : "feed";  // Stories 9:16 ou Feed 1:1
  fs.writeFileSync(`${dir}/pedido.json`, JSON.stringify({id: job.id, modo: job.modo, prompt: job.prompt, formato: job.formato, project: job.project || null}, null, 1));
  jobs.push(job);
  save();
  filaPosts = filaPosts.then(() => rodaPostDireto(job)).catch(() => {});
  return job;
}
let filaPosts = Promise.resolve();
async function rodaPostDireto(job) {
  try {
    job.resumo = String(await roda(ORQ_POST, [job.dir], {env: {...process.env, JOB_DIR: job.dir}, timeout: 20 * 60_000})).trim();
  } catch (e) {
    fs.writeFileSync(`${job.dir}/diretor.stderr.log`, e.message);
  }
  if (!jobs.includes(job)) return;  // apagado enquanto criava
  finish(job);
  save();
}

function apagar(job) {
  if (job.status === "running") return false;
  if (job.dir?.startsWith(`${OUT}/`)) fs.rmSync(job.dir, { recursive: true, force: true });
  for (const b of job.brutos || []) if (b.startsWith("public/uploads/")) fs.rmSync(path.dirname(`${ROOT}/${b}`), { recursive: true, force: true });
  jobs = jobs.filter((j) => j !== job);
  return true;
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://x");
  const p = url.pathname;
  if (req.method === "POST" && p === "/api/login") return login(req, res, await readBody(req));
  if (p === "/" || p === "/index.html") { res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" }); return res.end(fs.readFileSync(`${ROOT}/painel/public/index.html`)); }
  let pv;
  if (req.method === "GET" && (pv = /^\/previews\/(rapido|karaoke|simples)\.mp4$/.exec(p))) return serveFile(req, res, `${ROOT}/painel/public/previews/${pv[1]}.mp4`);
  if (req.method === "GET" && (pv = /^\/instagram-stage\/([a-f0-9]{48})\.jpg$/.exec(p))) {
    const file = igScheduler.staged(pv[1]);
    if (!file) { res.writeHead(404); return res.end(); }
    return serveFile(req, res, file);
  }
  if (!authed(req)) return json(res, 401, { erro: "login" });
  let m0;

  if (req.method === "GET" && p === "/api/jobs") return json(res, 200, jobs.map(view).reverse());
  if (req.method === "GET" && p === "/api/instagram/projects") return json(res, 200, instagramProjects());
  if (req.method === "GET" && p === "/api/instagram/schedule") return json(res, 200, igScheduler.list());
  if (req.method === "GET" && (m0 = /^\/api\/instagram\/schedule\/([a-f0-9]{24})\/image\/(\d{1,2})$/.exec(p))) {
    const file = igScheduler.image(m0[1], m0[2]);
    if (!file || !fs.existsSync(file)) { res.writeHead(404); return res.end(); }
    return serveFile(req, res, file);
  }
  if (req.method === "POST" && p === "/api/instagram/caption") {
    try { const b = await readBody(req); return json(res, 200, await igScheduler.caption({jobId: b.jobId, names: b.names})); }
    catch (e) { return json(res, 400, {erro: `legenda: ${String(e.message || e).slice(0, 200)}`}); }
  }
  if (req.method === "POST" && p === "/api/instagram/schedule") {
    try { return json(res, 200, igScheduler.schedule(await readBody(req))); }
    catch (e) { return json(res, 400, {erro: String(e.message || e).slice(0, 200)}); }
  }
  if (req.method === "POST" && (m0 = /^\/api\/instagram\/schedule\/([a-f0-9]{24})\/cancel$/.exec(p))) {
    try { return json(res, 200, igScheduler.cancel(m0[1])); }
    catch (e) { return json(res, 400, {erro: String(e.message || e).slice(0, 200)}); }
  }
  if (req.method === "POST" && p === "/api/posts/direto") {
    const b = await readBody(req);
    const items = (b.items || []).filter((it) => it && (it.modo === "post" || it.modo === "carrossel") && String(it.prompt || "").trim()).slice(0, 4);
    if (!items.length) return json(res, 400, {erro: "descreva o post ou carrossel"});
    const feitos = items.map((item) => criaPostDireto(item, b.autoSend));
    return json(res, 200, {criados: feitos.length, ids: feitos.map((j) => j.id)});
  }
  // banco de prompts prontos do AlvoManage (botão no post/carrossel); gerado pelo agente frontend do AlvoManage
  // só sai o que ainda não foi gasto; gasto = criação aprovada (Limpar na mesa). "Não gostei" apaga e o prompt volta.
  if (req.method === "GET" && p === "/api/alvomanage") {
    const d = lerJson(ALVO_BANCO); if (!d) return json(res, 404, { erro: "o banco de prompts do AlvoManage ainda não foi gerado" });
    const usados = new Set([...(lerJson(ALVO_USADOS) || []), ...(lerJson(ALVO_DESCARTADOS) || [])]), out = {};  // descartado ("não gostei do prompt") também não volta
    for (const m of ["post", "carrossel"]) out[m] = (d[m] || []).map((x, i) => ({ ...x, id: `${m}:${i}` })).filter((x) => !usados.has(x.id));
    return json(res, 200, out);
  }
  if (req.method === "POST" && p === "/api/alvomanage/descartar") {
    const b = await readBody(req), l = new Set(lerJson(ALVO_DESCARTADOS) || []);
    if (/^(post|carrossel):\d+$/.test(b.id || "")) l.add(b.id);
    fs.writeFileSync(ALVO_DESCARTADOS, JSON.stringify([...l]));
    if (String(b.motivo || "").trim()) {  // o motivo ensina o assessor: vai COM o texto do prompt (comentário solto não ensina)
      const ASS = `${ROOT}/painel/assessor`, rf = `${ASS}/regras.json`, rl = lerJson(rf) || [], motivo = String(b.motivo).trim().slice(0, 300);
      rl.push({ regra: `Evitar: ${motivo}`, origem: b.id, em: Math.floor(Date.now() / 1000) });
      fs.mkdirSync(ASS, { recursive: true }); fs.writeFileSync(rf, JSON.stringify(rl, null, 1));
      const [m_, i_] = String(b.id || "").split(":"), texto = ((lerJson(ALVO_BANCO) || {})[m_] || [])[+i_]?.prompt;
      if (texto) { const ef = `${ASS}/exemplos.json`, ex = lerJson(ef) || []; ex.push({ texto: texto, bom: false, motivo }); fs.writeFileSync(ef, JSON.stringify(ex.slice(-200), null, 1)); }
      assessorAprende();
    }
    return json(res, 200, { descartados: l.size });
  }
  if (req.method === "POST" && p === "/api/alvomanage/gastar") {
    const b = await readBody(req), usados = new Set(lerJson(ALVO_USADOS) || []);
    for (const j of jobs) if ((b.ids || []).includes(j.id) && j.status === "done" && j.alvo) usados.add(j.alvo);
    fs.writeFileSync(ALVO_USADOS, JSON.stringify([...usados]));
    return json(res, 200, { usados: usados.size });
  }
  // como o Jev decidiu cada post/carrossel (jev.json gravado pelo orquestrador-post)
  if (req.method === "GET" && p === "/api/jev") {
    const out = jobs.filter((j) => (j.modo === "post" || j.modo === "carrossel") && j.dir).slice(-40).reverse()
      .map((j) => ({ id: j.id, modo: j.modo, status: j.status, prompt: j.prompt, createdAt: j.createdAt, jev: lerJson(`${j.dir}/jev.json`),
        slides: (lerJson(`${j.dir}/entrega.json`)?.arquivos || []).filter((n) => /-slide-01\./.test(n) || !/^v\d/.test(n)) }))
      .filter((j) => j.jev);
    return json(res, 200, out);
  }
  // biblioteca de fotos: as que o Enzo envia (com descrição) + as que o DeepSeek baixou do Pexels/Pixabay
  const FOTOS_IDX = `${ROOT}/painel/fotos.json`, FOTOS_DIR = `${ROOT}/public/fotos`;
  const fotosLe = () => lerJson(FOTOS_IDX) || [], fotosSalva = (l) => fs.writeFileSync(FOTOS_IDX, JSON.stringify(l, null, 1));
  if (req.method === "GET" && p === "/api/fotos") return json(res, 200, fotosLe().filter((f) => fs.existsSync(`${ROOT}/${f.arquivo}`)).reverse());
  if (req.method === "GET" && (m0 = /^\/foto\/(\w+)\.(jpe?g|png|webp)$/.exec(p))) return serveFile(req, res, `${FOTOS_DIR}/${m0[1]}.${m0[2]}`);
  if (req.method === "POST" && p === "/api/fotos") {
    const nome = String(url.searchParams.get("nome") || ""), descricao = String(url.searchParams.get("descricao") || "").trim().slice(0, 300);
    const ext = ((/\.(png|jpe?g|webp)$/i.exec(nome) || [])[1] || "").toLowerCase().replace("jpeg", "jpg");
    if (!ext) return json(res, 400, { erro: "envie a foto em JPG, PNG ou WebP" });
    if (descricao.length < 5) return json(res, 400, { erro: "escreva o que aparece na foto (o Jev escolhe pela descrição)" });
    fs.mkdirSync(FOTOS_DIR, { recursive: true });
    const id = crypto.randomBytes(5).toString("hex"), ws = fs.createWriteStream(`${FOTOS_DIR}/${id}.${ext}`);
    req.pipe(ws);
    ws.on("finish", () => { const l = fotosLe(); l.push({ id, arquivo: `public/fotos/${id}.${ext}`, descricao, origem: "enviada pelo Enzo", credito: "", em: Math.floor(Date.now() / 1000) }); fotosSalva(l); json(res, 200, { id }); });
    ws.on("error", (e) => json(res, 500, { erro: e.message }));
    return;
  }
  if (req.method === "POST" && (m0 = /^\/api\/fotos\/(\w+)\/(remover|descricao)$/.exec(p))) {
    const l = fotosLe(), f = l.find((x) => x.id === m0[1]);
    if (!f) return json(res, 404, { erro: "foto não existe" });
    if (m0[2] === "remover") { fs.rmSync(`${ROOT}/${f.arquivo}`, { force: true }); fotosSalva(l.filter((x) => x !== f)); }
    else { const b = await readBody(req); f.descricao = String(b.descricao || "").trim().slice(0, 300) || f.descricao; fotosSalva(l); }
    return json(res, 200, { ok: true });
  }
  if (req.method === "GET" && p === "/api/config") return json(res, 200, lerJson(`${ROOT}/painel/config.json`) || { logo_px: 90 });
  if (req.method === "POST" && p === "/api/config") {
    const b = await readBody(req), c = lerJson(`${ROOT}/painel/config.json`) || {};
    if (b.logo_px != null) c.logo_px = Math.max(40, Math.min(320, Math.round(Number(b.logo_px) || 90)));
    fs.writeFileSync(`${ROOT}/painel/config.json`, JSON.stringify(c));
    return json(res, 200, c);
  }
  if (req.method === "POST" && (m0 = /^\/api\/jobs\/([\w-]+)\/redesenhar$/.exec(p))) {
    const job = jobs.find((j) => j.id === m0[1]);
    if (!job || job.status !== "done" || !ehPost(job)) return json(res, 400, { erro: "só dá para redesenhar post/carrossel pronto" });
    try { await roda("python3", [`${ROOT}/tools/redesenha-post.py`, job.dir], { timeout: 5 * 60_000 }); } catch (e) { return json(res, 500, { erro: `redesenhar: ${e.message.slice(0, 200)}` }); }
    job.redesenhadoEm = Date.now(); save();
    return json(res, 200, { ok: true });
  }
  // ---------- Assessor de prompts: guia + regras aprendidas + exemplos; gera pelo DeepSeek e o Jev confere ----------
  const ASS = `${ROOT}/painel/assessor`, assLe = (n, d) => lerJson(`${ASS}/${n}`) ?? d, assGrava = (n, v) => { fs.mkdirSync(ASS, { recursive: true }); fs.writeFileSync(`${ASS}/${n}`, JSON.stringify(v, null, 1)); };
  const novaRegra = (regra, origem) => { const l = assLe("regras.json", []); l.push({ regra: String(regra).slice(0, 300), origem, em: Math.floor(Date.now() / 1000) }); assGrava("regras.json", l); };
  if (req.method === "GET" && p === "/api/assessor") {
    let guia = ""; try { guia = fs.readFileSync(`${ASS}/guia.md`, "utf8"); } catch {}
    let aprendizado = ""; try { aprendizado = fs.readFileSync(`${ASS}/aprendizado.md`, "utf8"); } catch {}
    const est = assLe("estoque.json", {});
    return json(res, 200, { guia, aprendizado, abastecimento: estadoAbastecimento(), aprendendo: fs.existsSync(`${ASS}/.aprendendo`), estoque: { post: (est.post || []).length, carrossel: (est.carrossel || []).length },
      regras: assLe("regras.json", []), exemplos: assLe("exemplos.json", []) });
  }
  if (req.method === "POST" && p === "/api/assessor/guia") { const b = await readBody(req); fs.mkdirSync(ASS, { recursive: true }); fs.writeFileSync(`${ASS}/guia.md`, String(b.texto || "").slice(0, 20000)); return json(res, 200, { ok: true }); }
  if (req.method === "POST" && p === "/api/assessor/regra/remover") { const b = await readBody(req), l = assLe("regras.json", []); l.splice(+b.i, 1); assGrava("regras.json", l); return json(res, 200, { ok: true }); }
  if (req.method === "POST" && p === "/api/assessor/exemplo") {
    const b = await readBody(req), t = String(b.texto || "").trim();
    if (t.length < 5) return json(res, 400, { erro: "cole o texto do exemplo" });
    const l = assLe("exemplos.json", []); l.push({ texto: t, bom: !!b.bom, motivo: String(b.motivo || "").trim().slice(0, 300) }); assGrava("exemplos.json", l); assessorAprende();
    return json(res, 200, { ok: true });
  }
  if (req.method === "POST" && p === "/api/assessor/exemplo/remover") { const b = await readBody(req), l = assLe("exemplos.json", []); l.splice(+b.i, 1); assGrava("exemplos.json", l); return json(res, 200, { ok: true }); }
  if (req.method === "POST" && p === "/api/assessor/proximo") {  // botão 🎯 AlvoManage: entrega um pronto na hora e repõe
    const b = await readBody(req);
    try {
      const out = JSON.parse(String(await roda("python3", [`${ROOT}/tools/assessor.py`, "--proximo", b.modo === "carrossel" ? "carrossel" : "post"], { timeout: 30_000 })));
      assessorAbastece();
      return json(res, 200, { ...out, abastecimento: estadoAbastecimento(), aprendendo: fs.existsSync(`${ASS}/.aprendendo`) });
    } catch (e) { return json(res, 502, { erro: `assessor: ${String(e.message).slice(0, 200)}` }); }
  }
  if (req.method === "POST" && p === "/api/assessor/gerar") {
    const b = await readBody(req);
    try {
      const out = await roda("python3", [`${ROOT}/tools/assessor.py`], { input: JSON.stringify({ modo: b.modo, tema: b.tema, n: b.n, evitar: Array.isArray(b.evitar) ? b.evitar : [] }), timeout: 5 * 60_000 });
      return json(res, 200, JSON.parse(String(out)));
    } catch (e) { return json(res, 502, { erro: `assessor: ${String(e.message).slice(0, 200)}` }); }
  }
  if (req.method === "POST" && p === "/api/assessor/avaliar") {
    const b = await readBody(req), pr = String(b.prompt || "").trim(), motivo = String(b.motivo || "").trim();
    if (!pr) return json(res, 400, { erro: "sem prompt" });
    if (b.nota === "ruim" && !motivo) return json(res, 400, { erro: "diga em uma frase o que ficou ruim" });
    if (motivo) novaRegra(b.nota === "boa" ? `Fazer como: ${motivo}` : `Evitar: ${motivo}`, pr.slice(0, 160));
    const ex = assLe("exemplos.json", []); ex.push({ texto: pr, bom: b.nota === "boa", motivo }); assGrava("exemplos.json", ex.slice(-200));
    assessorAprende();
    if (b.nota === "boa") {  // aprovado vai para o banco do botão AlvoManage
      const banco = lerJson(ALVO_BANCO) || { post: [], carrossel: [] }, modo = b.modo === "carrossel" ? "carrossel" : "post";
      (banco[modo] ||= []).push({ contexto: String(b.contexto || "Assessor").slice(0, 60), tela: "", prompt: pr });
      fs.writeFileSync(ALVO_BANCO, JSON.stringify(banco, null, 1));
    }
    return json(res, 200, { ok: true });
  }
  if (req.method === "POST" && p === "/api/upload") return upload(req, res, url.searchParams.get("nome"));
  if (req.method === "GET" && p === "/api/logo") { const f = logoAtual(); return json(res, 200, f ? {tem: true, arquivo: `public/brand/${f}`} : {tem: false}); }
  if (req.method === "GET" && p === "/logo.img") { const f = logoAtual(); if (!f) { res.writeHead(404); return res.end(); } return serveFile(req, res, `${BRAND}/${f}`); }
  if (req.method === "POST" && p === "/api/logo/remover") { try { for (const f of fs.readdirSync(BRAND)) fs.unlinkSync(`${BRAND}/${f}`); } catch {} return json(res, 200, {ok: true}); }
  if (req.method === "POST" && p === "/api/logo") {
    const nome = String(url.searchParams.get("nome") || "");
    const ext = (/\.(png|jpe?g|svg|webp)$/i.exec(nome) || [])[1];
    if (!ext) return json(res, 400, {erro: "envie a logo como PNG, JPG, SVG ou WebP"});
    fs.mkdirSync(BRAND, {recursive: true});
    for (const f of fs.readdirSync(BRAND)) fs.unlinkSync(`${BRAND}/${f}`);
    const alvo = `${BRAND}/logo.${ext.toLowerCase()}`;
    const ws = fs.createWriteStream(alvo);
    req.pipe(ws);
    ws.on("finish", () => json(res, 200, {arquivo: `public/brand/logo.${ext.toLowerCase()}`}));
    ws.on("error", (e) => json(res, 500, {erro: e.message}));
    return;
  }
  if (req.method === "POST" && p === "/api/jobs") {
    const b = await readBody(req);
    const items = (b.items || []).map((it) => ({
      ...(it.modo === "cortes" ? { modo: "cortes", cortes: {
        estilo: ESTILOS_CORTE.includes(it.cortes?.estilo) ? it.cortes.estilo : "bold_pop" } } : {}),
      modo: ["video", "post", "carrossel"].includes(it.modo) ? it.modo : "video",
      prompt: String(it.prompt || "").trim(),
      captionStyle: CAPTION_STYLES[it.captionStyle] ? it.captionStyle : "simples",
      brutos: (it.brutos || []).filter((x) => /^public\/uploads\/v\w+\/bruto\.\w+$/.test(x) && fs.existsSync(`${ROOT}/${x}`)),
    })).filter((it) => it.modo !== "cortes" || it.brutos.length)
      .map((it) => ({ ...it, prompt: it.prompt || (it.modo === "cortes" ? "✂️ Cortes da live" : it.brutos.length ? "Edite este vídeo: deixe-o profissional e pronto para postar." : "") }))
      .filter((it) => it.prompt).slice(0, 20);
    const ids = [];
    for (const it of items) { const id = novoId(); ids.push(id); jobs.push({ id, ...it, autoSend: !!b.autoSend, status: "queued", stage: "Na fila", progress: 0, createdAt: Date.now() }); }
    save(); startNext();
    return json(res, 200, { criados: items.length, ids });
  }
  if (req.method === "POST" && /^\/api\/assistente\/(perguntas|rodada|prompts)$/.test(p)) {
    const b = await readBody(req);
    try {
      if (p.endsWith("perguntas")) {
        const texto = String(b.texto || "").trim();
        if (texto.length < 10) return json(res, 400, { erro: "escreva um pouco mais da sua ideia" });
        return json(res, 200, await assistenteInicio(texto.slice(0, 8000)));
      }
      if (p.endsWith("rodada")) return json(res, 200, await assistenteRodada(String(b.sessao || ""), b.respostas || {}, b.livre));
      return json(res, 200, await assistentePrompts(String(b.sessao || ""), b.respostas || {}, b.livre));
    } catch (e) { return json(res, 502, { erro: `assistente: ${e.message}` }); }
  }
  if (req.method === "POST" && p === "/api/limpar-falhos") {
    const n = jobs.filter((j) => j.status === "failed" || j.status === "canceled").map(apagar).filter(Boolean).length;
    save(); return json(res, 200, { apagados: n });
  }
  let m;
  if (req.method === "POST" && (m = /^\/api\/jobs\/([\w-]+)\/(cancel|send|delete|editar|avaliar|outra)$/.exec(p))) {
    const job = jobs.find((j) => j.id === m[1]);
    if (!job) return json(res, 404, { erro: "não existe" });
    const b = m[2] === "editar" || m[2] === "avaliar" ? await readBody(req) : {};
    if (m[2] === "cancel") {
      if (job.status === "queued") Object.assign(job, { status: "canceled", stage: "Cancelado" });
      else if (job.status === "running") { job.status = "canceled"; try { process.kill(-job.pid, "SIGTERM"); } catch {} }
    } else if (m[2] === "send") {
      if (job.status !== "done") return json(res, 400, { erro: "vídeo ainda não está pronto" });
      sendWhatsapp(job);
    } else if (m[2] === "delete") {
      if (!apagar(job)) return json(res, 400, { erro: "cancele antes de apagar" });
    } else if (m[2] === "editar") {
      const texto = String(b.texto || "").trim();
      if (job.status !== "done" || !texto) return json(res, 400, { erro: "escreva o que mudar num vídeo pronto" });
      jobs.push({ id: novoId(), parentId: job.id, modo: job.modo, prompt: texto, captionStyle: job.captionStyle, autoSend: job.autoSend, status: "queued", stage: "Na fila (edição)", progress: 0, createdAt: Date.now() });
    } else if (m[2] === "outra") {
      if (job.status !== "done" || (job.modo !== "post" && job.modo !== "carrossel")) return json(res, 400, { erro: "outra versão só vale para post/carrossel pronto" });
      const novo = criaPostDireto({modo: job.modo, prompt: job.prompt, alvo: job.alvo, formato: job.formato, project: job.project}, job.autoSend);
      novo.parentId = job.id;
    } else {
      const nota = b.nota === "boa" ? "boa" : b.nota === "ruim" ? "ruim" : null, texto = String(b.texto || "").trim();
      if (job.status !== "done" || !nota) return json(res, 400, { erro: "avaliação inválida" });
      if (nota === "ruim" && !texto) return json(res, 400, { erro: "escreva o que ficou ruim" });
      avaliar(job, nota, texto, Number.isInteger(b.versao) && b.versao > 0 ? b.versao : null);
    }
    save(); startNext();
    return json(res, 200, { ok: true });
  }
  if (req.method === "GET" && (m = /^\/files\/([\w-]+)\/([\w.\/-]+)$/.exec(p))) {
    const job = jobs.find((j) => j.id === m[1]); const f = job?.dir && path.resolve(job.dir, m[2]);
    // nunca sai da pasta da criação (bloqueia "../")
    if (!f || !f.startsWith(path.resolve(job.dir) + path.sep) || m[2].split("/").includes("..") || HIDE.has(m[2]) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
    return serveFile(req, res, f, url.searchParams.has("dl"));
  }
  res.writeHead(404); res.end();
}).listen(PORT, "127.0.0.1", () => { console.log(`painel em 127.0.0.1:${PORT}`); startNext(); try { fs.unlinkSync(`${ROOT}/painel/assessor/.aprendendo`); } catch {} assessorAbastece(); });  // marca de um aprendizado cortado pelo reinício
