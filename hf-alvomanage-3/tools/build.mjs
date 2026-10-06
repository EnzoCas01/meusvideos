// Builds the whole HyperFrames project for AlvoManage — vídeo 3.
//   node hf-alvomanage-3/tools/build.mjs        (run from the repo root)
// Source of truth for timing: src/narration-alvomanage-3.json (line frames) and
// hf-alvomanage-3/words.json (word frames, from tools/word-times.mjs). Every
// scene boundary, every visual beat and every sound cue is derived from them,
// so a re-recorded line re-syncs picture and sound by re-running both scripts.
// Writes: index.html (root: background, scene hosts, fixed logo, all audio) and
// compositions/sNN.html (one sub-composition per scene).
import fs from "node:fs";

const ROOT = "hf-alvomanage-3/";
const FPS = 30;
const SR_OUT = 44100;
const NAR = JSON.parse(fs.readFileSync("src/narration-alvomanage-3.json", "utf8"));
const WORDS = JSON.parse(fs.readFileSync(ROOT + "words.json", "utf8"));
const LINES = Object.fromEntries(NAR.lines.map((l) => [l.id, l]));

/** absolute frame of the n-th word of line `id` that starts with `prefix` */
const W = (id, prefix, n = 0) => {
	const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[^\p{L}\p{N}]/gu, "");
	const p = norm(prefix);
	const hits = WORDS[id].filter((x) => norm(x.w).startsWith(p));
	if (!hits[n]) throw new Error(`word ${prefix} not in ${id}`);
	return hits[n].f;
};
const END_LAST = LINES.p14.frame + LINES.p14.durationInFrames;
const TOTAL = END_LAST + 45; // ~1.5 s hold on the logo
// Scene i runs from 4 frames before its line (inside the 12-frame breath) to the next scene.
const IDS = NAR.lines.map((l) => l.id);
const STARTS = IDS.map((id, i) => (i === 0 ? 0 : LINES[id].frame - 4));
const ENDS = STARTS.map((s, i) => (i < STARTS.length - 1 ? STARTS[i + 1] : TOTAL));
const sec = (f) => +(f / FPS).toFixed(4);

/* ---------------- sound cues ---------------- */
// Effects sit 5 dB under video 1 (x0.56); the base values below are video-1-like levels.
const SFX_GAIN = 0.56;
const LEN = {};
const cues = [];
const sfx = (frame, file, base, name) => cues.push({frame: Math.max(0, Math.round(frame)), file, vol: +(base * SFX_GAIN).toFixed(3), name});

/* ---------------- drawing kit ---------------- */
const C = {ink: "#EDEBE6", muted: "#9AA3B2", y: "#F5B800", blue: "#3B6FF0", red: "#E5484D", green: "#3DDC84", slate: "#1B212B"};

const chargerSvg = () => `<svg viewBox="0 0 120 170" width="100%" height="100%" aria-hidden="true">
<rect x="36" y="0" width="11" height="32" rx="3" fill="#AEB6C2"/><rect x="73" y="0" width="11" height="32" rx="3" fill="#AEB6C2"/>
<rect x="6" y="24" width="108" height="142" rx="24" fill="#F1F2F4"/>
<path d="M92 24 h-6 a24 24 0 0 1 24 24 v94 a24 24 0 0 1 -24 24 h6 a24 24 0 0 0 22 -24 v-94 a24 24 0 0 0 -22 -24z" fill="#D5DAE1"/>
<rect x="15" y="34" width="14" height="118" rx="7" fill="#FFFFFF" opacity=".7"/>
<path d="M66 64 L50 96 H62 L55 124 L75 88 H63 Z" fill="#CBD1DA"/>
<rect x="44" y="146" width="32" height="9" rx="4.5" fill="#2A2F38"/>
<circle class="ledglow" cx="93" cy="46" r="14" fill="${C.green}" opacity=".35"/>
<circle class="led" cx="93" cy="46" r="6.5" fill="${C.green}"/></svg>`;
const xbSvg = `<svg viewBox="0 0 40 40" width="100%" height="100%"><circle cx="20" cy="20" r="19" fill="${C.red}" stroke="#0E1116" stroke-width="2"/><path d="M13 13 L27 27 M27 13 L13 27" stroke="#fff" stroke-width="5" stroke-linecap="round"/></svg>`;
/** charger actor; (x,y) = top-left, w = width (height = w*170/120) */
const CHG = (cls, x, y, w, o = {}) =>
	`<div class="a chg ${cls}${o.defect ? " defect" : ""}${o.off ? " off" : ""}" style="left:${x}px;top:${y}px;width:${w}px;height:${Math.round((w * 170) / 120)}px">${chargerSvg()}<div class="xb">${xbSvg}</div></div>`;
const chgH = (w) => Math.round((w * 170) / 120);

/** hand seen from above holding something below it; flip = comes from the bottom of frame */
const HAND = (cls, x, y, w, sleeve, o = {}) => {
	const g = `<rect x="44" y="0" width="72" height="236" rx="26" fill="${sleeve}"/><rect x="38" y="214" width="84" height="26" rx="12" fill="${o.cuff ?? "#46526A"}"/>
<rect x="30" y="232" width="100" height="78" rx="34" fill="#D9A97F"/>
<rect x="33" y="278" width="22" height="66" rx="11" fill="#D9A97F"/><rect x="57" y="284" width="22" height="70" rx="11" fill="#CF9E74"/>
<rect x="81" y="284" width="22" height="70" rx="11" fill="#D9A97F"/><rect x="105" y="278" width="20" height="60" rx="10" fill="#CF9E74"/>
<rect x="12" y="236" width="26" height="62" rx="13" fill="#CF9E74" transform="rotate(-22 25 267)"/>${o.pen ? `<g transform="rotate(${o.flip ? 160 : -20} 80 330)"><rect x="74" y="250" width="12" height="150" rx="5" fill="${C.y}"/><path d="M74 400 L86 400 L80 420 Z" fill="#333"/></g>` : ""}`;
	const vb = o.short ? "0 150 160 210" : "0 0 160 360";
	return `<div class="a hand ${cls}" style="left:${x}px;top:${y}px;width:${w}px;height:${Math.round((w * (o.short ? 210 : 360)) / 160)}px"><svg viewBox="${vb}" width="100%" height="100%" overflow="visible">${o.flip ? `<g transform="translate(0 360) scale(1 -1)">${g}</g>` : g}</svg></div>`;
};

/** standing person silhouette (no face); (x,y) top-left, w width (h = 1.5 w) */
const PERSON = (cls, x, y, w, color, o = {}) =>
	`<div class="a person ${cls}" style="left:${x}px;top:${y}px;width:${w}px;height:${Math.round(w * 1.5)}px"><svg viewBox="0 0 400 600" width="100%" height="100%" overflow="visible">
<path d="M28 600 C28 395 84 288 200 288 C316 288 372 395 372 600 Z" fill="${color}"/>
${o.cap ? `<path d="M92 140 C92 62 308 62 308 140 Z" fill="${o.cap}"/><rect x="250" y="122" width="110" height="22" rx="11" fill="${o.cap}"/>` : ""}
${o.noHead ? "" : `<circle cx="200" cy="165" r="100" fill="${color}"/>`}
${o.cap ? `<path d="M100 132 C100 58 300 58 300 132 Z" fill="${o.cap}"/>` : ""}
<path d="M28 600 C28 395 84 288 200 288" fill="none" stroke="rgba(255,255,255,.10)" stroke-width="6"/>
${o.noHead ? "" : `<path d="M100 165 A100 100 0 0 1 200 65" fill="none" stroke="rgba(255,255,255,.12)" stroke-width="6"/>`}</svg></div>`;

/** shelf: back panel + one board; items stand on y = top + h - 26 */
const SHELF = (cls, x, y, w, h, label) =>
	`<div class="a shelf ${cls}" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px"><div class="back"></div><div class="post l"></div><div class="post r"></div><div class="board"></div>${label ? `<div class="tag">${label}</div>` : ""}</div>`;

/** cardboard box with an open top; items drop to y ~ top + 40 */
const BOX = (cls, x, y, w, label) =>
	`<div class="a box ${cls}" style="left:${x}px;top:${y}px;width:${w}px;height:${Math.round(w * 0.86)}px"><svg viewBox="0 0 300 258" width="100%" height="100%" overflow="visible">
<path d="M18 40 L282 40 L262 250 L38 250 Z" fill="#8C6A44"/><path d="M18 40 L-6 6 L120 14 L150 40 Z" fill="#A47E54"/><path d="M282 40 L306 6 L180 14 L150 40 Z" fill="#9A754C"/>
<path d="M38 250 L262 250 L270 160 L30 160 Z" fill="#7A5A38" opacity=".35"/></svg>${label ? `<div class="btag">${label}</div>` : ""}</div>`;
const BOXFRONT = (cls, x, y, w) =>
	`<div class="a ${cls}" style="left:${x}px;top:${y + Math.round(w * 0.86 * 0.36)}px;width:${w}px;height:${Math.round(w * 0.86 * 0.64)}px"><svg viewBox="0 93 300 165" width="100%" height="100%" overflow="visible"><path d="M10 93 L290 93 L262 250 L38 250 Z" fill="#9A754C"/><path d="M10 93 L290 93" stroke="#B48C60" stroke-width="6"/></svg></div>`;

const CURSOR = (cls, x, y, w = 34) =>
	`<div class="a cursor ${cls}" style="left:${x}px;top:${y}px;width:${w}px;height:${Math.round(w * 1.45)}px"><svg viewBox="0 0 24 35" width="100%" height="100%"><path d="M2 2 L2 28 L8.5 22 L13 32.5 L17.5 30.5 L13 20.5 L21.5 20.5 Z" fill="#fff" stroke="#111" stroke-width="1.8" stroke-linejoin="round"/></svg></div>`;

/* ---------------- shared CSS (inside every template) ---------------- */
const FONT_FACES = [400, 500, 600, 700, 800].map((w) => `@font-face{font-family:"Inter";src:url("assets/fonts/inter-${w}.woff2") format("woff2");font-weight:${w};font-style:normal;font-display:block;}`).join("\n");
const baseCss = (id) => `${FONT_FACES}
#${id}{position:absolute;inset:0;overflow:hidden;font-family:"Inter",sans-serif;color:${C.ink};}
#${id} .a{position:absolute;}
#${id} .cam{position:absolute;left:0;top:0;width:1080px;height:1920px;}
#${id} .chg .xb{position:absolute;width:40%;height:28%;right:-14%;top:-4%;}
#${id} .chg:not(.defect) .xb{opacity:0;}
#${id} .chg.off .led{fill:#3A3F47;}
#${id} .chg.off .ledglow{opacity:0;}
#${id} .chg svg{filter:drop-shadow(0 10px 14px rgba(0,0,0,.45));}
#${id} .shelf .back{position:absolute;left:0;right:0;top:0;bottom:20px;background:linear-gradient(#1A202A,#151A22);border-radius:10px;}
#${id} .shelf .board{position:absolute;left:-14px;right:-14px;bottom:0;height:28px;background:linear-gradient(#6A7384,#4A5262);border-radius:6px;box-shadow:0 14px 24px rgba(0,0,0,.5);}
#${id} .shelf .post{position:absolute;top:0;bottom:0;width:14px;background:#2B323E;}
#${id} .shelf .post.l{left:0;} #${id} .shelf .post.r{right:0;}
#${id} .shelf .tag{position:absolute;left:50%;bottom:-62px;width:220px;margin-left:-110px;text-align:center;font-size:30px;font-weight:700;color:#0E1116;background:${C.ink};border-radius:10px;padding:6px 0;}
#${id} .box .btag{position:absolute;left:50%;bottom:-58px;width:220px;margin-left:-110px;text-align:center;font-size:30px;font-weight:700;color:#0E1116;background:${C.y};border-radius:10px;padding:6px 0;}
#${id} .win{background:#232A35;border:2px solid #394150;border-radius:22px;box-shadow:0 30px 60px rgba(0,0,0,.5);overflow:hidden;}
#${id} .win .tb{height:58px;background:#2C3442;display:flex;align-items:center;gap:12px;padding:0 22px;}
#${id} .win .tb i{width:16px;height:16px;border-radius:50%;background:#4A5364;display:block;}
#${id} .win .tb span{margin-left:14px;font-size:26px;font-weight:600;color:${C.muted};}
#${id} .field{height:64px;border-radius:12px;background:#1A2029;border:2px solid #343C4A;display:flex;align-items:center;padding:0 22px;font-size:30px;color:${C.ink};font-weight:500;}
#${id} .flabel{font-size:24px;color:${C.muted};font-weight:600;margin:0 0 10px 4px;}
#${id} .btn{height:72px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:30px;font-weight:700;}
#${id} .mon{background:#0B0E13;border:14px solid #2A313D;border-radius:26px;box-shadow:0 30px 60px rgba(0,0,0,.5);}
#${id} .shot{background:#1A1A1A;border:2px solid #2E3440;border-radius:30px;overflow:hidden;box-shadow:0 40px 80px rgba(0,0,0,.55);}
#${id} .shot .img{position:absolute;left:0;top:0;background-repeat:no-repeat;transform-origin:0 0;}
#${id} .cap{left:60px;width:960px;text-align:center;font-size:62px;font-weight:800;letter-spacing:-0.02em;line-height:1.1;}
#${id} .crop{background-repeat:no-repeat;}
`;

/* ---------------- scenes ---------------- */
const scenes = [];
const scene = (n, build) => {
	const i = n - 1;
	const id = `s${String(n).padStart(2, "0")}`;
	const start = STARTS[i];
	const end = ENDS[i];
	const t = (f) => Math.max(0, +((f - start) / FPS).toFixed(4)); // absolute frame -> local seconds
	const d = (frames) => +(frames / FPS).toFixed(4);
	const q = (sel) => `#${id} ${sel}`;
	const out = build({id, start, end, t, d, q, line: IDS[i]});
	scenes.push({id, start, end, ...out});
};
// GSAP helper source injected in every scene: a tiny API over the paused timeline.
const helpers = (id) => `const S="#${id} ";const $=(s)=>S+s;const tl=gsap.timeline({paused:true});`;

/* ===== S1 — balcão: carregador cai, LED apaga (p01) ===== */
scene(1, ({id, t, d, q}) => {
	const wComprei = W("p01", "comprei"), wParou = W("p01", "parou"), wFala = W("p01", "fala"), wCliente = W("p01", "cliente");
	sfx(wCliente, "toc.wav", 0.9, "toc no balcão");
	sfx(wComprei, "pop.wav", 0.45, "balão");
	sfx(wParou + 1, "led-off.wav", 0.7, "LED apaga");
	sfx(wParou + 5, "pop.wav", 0.3, "x vermelho");
	const cw = 190, cx = 445, cy = 1188 - chgH(cw);
	const html = `<div class="cam">
<div class="a" style="left:0;top:0;width:1080px;height:1920px;background:linear-gradient(#18202B 0%,#11161E 60%)"></div>
<div class="a" style="left:640px;top:520px;width:380px;height:20px;background:#262E3A;border-radius:6px"></div>
<div class="a" style="left:660px;top:430px;width:60px;height:90px;background:#2E3644;border-radius:10px"></div><div class="a" style="left:740px;top:446px;width:60px;height:74px;background:#2A3240;border-radius:10px"></div><div class="a" style="left:820px;top:420px;width:60px;height:100px;background:#323B4A;border-radius:10px"></div>
${PERSON("client", 260, 380, 600, "#3A4862")}
<div class="a counter" style="left:-40px;top:1150px;width:1160px;height:800px"><div class="a" style="left:0;top:0;width:1160px;height:60px;background:linear-gradient(#B48A5E,#9C7448);border-radius:10px 10px 0 0"></div><div class="a" style="left:0;top:60px;width:1160px;height:14px;background:#6E5034"></div><div class="a" style="left:0;top:74px;width:1160px;height:726px;background:linear-gradient(#3A2D22,#271E17)"></div></div>
<div class="a impact" style="left:${cx - 60}px;top:${cy + chgH(cw) - 40}px;width:${cw + 120}px;height:60px"><svg viewBox="0 0 280 60" width="100%" height="100%"><path d="M10 50 L40 30 M18 20 L44 22 M270 50 L240 30 M262 20 L236 22" stroke="${C.ink}" stroke-width="6" stroke-linecap="round" opacity=".8"/></svg></div>
<div class="a drop" style="left:0;top:0;width:1080px;height:1920px">${CHG("hero", cx, cy, cw)}${HAND("phand", cx + 10, cy - 200, 170, "#3A4862", {short: true})}</div>
${PERSON("owner", 660, 1330, 600, "#1E2633")}
</div>
<div class="a balloon" style="left:560px;top:290px;width:470px;padding:26px 34px;background:#F4F2EE;border-radius:34px;color:#12151B;font-size:46px;font-weight:800;line-height:1.12;letter-spacing:-0.01em">Comprei ontem, já parou.<svg class="a" style="left:40px;bottom:-34px" width="60" height="40" viewBox="0 0 60 40"><path d="M0 0 L60 0 L8 40 Z" fill="#F4F2EE"/></svg></div>`;
	const js = `${helpers(id)}
gsap.set($(".cam"),{transformOrigin:"${cx + cw / 2}px 1060px"});
tl.fromTo($(".cam"),{scale:2.05},{scale:2.05,duration:${d(1)}},0);
tl.fromTo($(".drop"),{y:-26},{y:0,duration:${d(3)},ease:"power2.in"},0);
tl.fromTo($(".cam"),{y:0},{y:10,duration:${d(1.5)},ease:"power1.out",yoyo:true,repeat:1},${t(wCliente)});
tl.fromTo($(".impact"),{opacity:0,scale:.8},{opacity:1,scale:1.15,duration:${d(3)}},${t(wCliente)});
tl.to($(".impact"),{opacity:0,duration:${d(8)}},${t(wCliente + 5)});
tl.to($(".cam"),{scale:1,duration:${d(32)},ease:"power2.inOut"},${t(24)});
tl.to($(".phand"),{y:-170,opacity:0,duration:${d(12)},ease:"power2.in"},${t(64)});
tl.fromTo($(".client"),{y:0},{y:-8,duration:${d(5)},yoyo:true,repeat:1,ease:"sine.inOut"},${t(wFala)});
tl.fromTo($(".balloon"),{opacity:0,scale:.6,transformOrigin:"10% 100%"},{opacity:1,scale:1,duration:${d(8)},ease:"back.out(2)"},${t(wComprei)});
for(let k=0;k<3;k++){tl.to($(".hero .led"),{fill:"#3A3F47",duration:0.01},${t(wComprei + 6)}+k*${d(7)});tl.to($(".hero .ledglow"),{opacity:0,duration:0.01},${t(wComprei + 6)}+k*${d(7)});tl.to($(".hero .led"),{fill:"${C.green}",duration:0.01},${t(wComprei + 9)}+k*${d(7)});tl.to($(".hero .ledglow"),{opacity:.35,duration:0.01},${t(wComprei + 9)}+k*${d(7)});}
tl.to($(".hero .led"),{fill:"#3A3F47",duration:${d(3)}},${t(wParou + 1)});
tl.to($(".hero .ledglow"),{opacity:0,duration:${d(3)}},${t(wParou + 1)});
tl.fromTo($(".hero .xb"),{opacity:0,scale:0},{opacity:1,scale:1,duration:${d(8)},ease:"back.out(3)"},${t(wParou + 5)});
window.__timelines["${id}"]=tl;`;
	return {html, js};
});

/* ===== S2 — a troca no balcão (p02) ===== */
scene(2, ({id, t, d, start}) => {
	const L = "p02";
	const wNormal = W(L, "normal"), wAcontece = W(L, "acontece"), wTroca = W(L, "troca"), wEntrega = W(L, "entrega"), wNovo = W(L, "novo"), wVai = W(L, "vai"), wEmbora = W(L, "embora"), wFeliz = W(L, "feliz");
	sfx(wAcontece, "whoosh-soft.wav", 0.3, "quebrado vai pro lado");
	sfx(wTroca + 4, "whoosh-soft.wav", 0.3, "mão do dono entra");
	sfx(wEntrega + 6, "toc.wav", 0.55, "novo no balcão");
	sfx(wNovo + 6, "pop.wav", 0.35, "cliente pega");
	sfx(wEmbora, "whoosh.wav", 0.3, "cliente sai");
	const cw = 160, top = 1188 - chgH(cw);
	const html = `<div class="cam">
<div class="a" style="left:0;top:0;width:1080px;height:1920px;background:linear-gradient(#18202B 0%,#11161E 60%)"></div>
<div class="a" style="left:640px;top:520px;width:380px;height:20px;background:#262E3A;border-radius:6px"></div>
<div class="a" style="left:660px;top:430px;width:60px;height:90px;background:#2E3644;border-radius:10px"></div><div class="a" style="left:740px;top:446px;width:60px;height:74px;background:#2A3240;border-radius:10px"></div><div class="a" style="left:820px;top:420px;width:60px;height:100px;background:#323B4A;border-radius:10px"></div>
<div class="a walker" style="left:0;top:0;width:1080px;height:1920px">${PERSON("client", 260, 380, 600, "#3A4862")}
<div class="a wave" style="left:770px;top:560px;width:70px;height:320px;background:#3A4862;border-radius:35px;transform-origin:35px 290px;opacity:0"><div class="a" style="left:-6px;top:-50px;width:82px;height:82px;border-radius:50%;background:#D9A97F"></div></div></div>
<div class="a counter" style="left:-40px;top:1150px;width:1160px;height:800px"><div class="a" style="left:0;top:0;width:1160px;height:60px;background:linear-gradient(#B48A5E,#9C7448);border-radius:10px 10px 0 0"></div><div class="a" style="left:0;top:60px;width:1160px;height:14px;background:#6E5034"></div><div class="a" style="left:0;top:74px;width:1160px;height:726px;background:linear-gradient(#3A2D22,#271E17)"></div></div>
${CHG("bad", 460, top, cw, {defect: true, off: true})}
<div class="a newgrp" style="left:0;top:0;width:1080px;height:1920px">${CHG("good", 545, top, cw)}${HAND("chand", 547, top - 185, 156, "#3A4862", {short: true})}</div>
<div class="a ohand-grp" style="left:0;top:0;width:1080px;height:1920px">${HAND("ohand", 547, top + 150, 156, "#10141B", {flip: true, cuff: C.y})}</div>
${PERSON("owner", 660, 1330, 600, "#1E2633")}
</div>`;
	const js = `${helpers(id)}
tl.fromTo($(".owner"),{y:0},{y:-12,duration:${d(5)},yoyo:true,repeat:1,ease:"sine.inOut"},${t(wNormal)});
tl.fromTo($(".bad"),{x:0},{x:-250,duration:${d(10)},ease:"power2.inOut"},${t(wAcontece)});
// owner's hand brings a new charger up from below the counter edge
tl.fromTo($(".newgrp"),{y:620,opacity:1},{y:0,duration:${d(14)},ease:"power3.out"},${t(wTroca + 2)});
tl.fromTo($(".ohand-grp"),{y:620},{y:0,duration:${d(14)},ease:"power3.out"},${t(wTroca + 2)});
tl.to($(".ohand-grp"),{y:950,duration:${d(10)},ease:"power2.in"},${t(wEntrega + 8)});
// client takes it
tl.fromTo($(".chand"),{opacity:0,y:-200},{opacity:1,y:0,duration:${d(8)},ease:"power2.out"},${t(wNovo)});
tl.to($(".newgrp"),{y:-260,opacity:0,duration:${d(10)},ease:"power2.in"},${t(wNovo + 10)});
// waves and leaves
tl.fromTo($(".wave"),{opacity:0,rotation:0},{opacity:1,rotation:-18,duration:${d(5)}},${t(wVai - 6)});
tl.to($(".wave"),{rotation:14,duration:${d(5)},yoyo:true,repeat:2,ease:"sine.inOut"},${t(wVai - 1)});
tl.to($(".walker"),{x:-960,duration:${d(22)},ease:"power2.in"},${t(wEmbora)});
tl.fromTo($(".walker"),{y:0},{y:-10,duration:${d(4)},yoyo:true,repeat:4,ease:"sine.inOut"},${t(wEmbora)});
window.__timelines["${id}"]=tl;`;
	void wFeliz;
	void start;
	return {html, js};
});

/* ===== S3 — lança como devolução, defeituoso volta pro estoque (p03) ===== */
scene(3, ({id, t, d}) => {
	const L = "p03";
	const wDev = W(L, "devolu"), wCarr = W(L, "carregador"), wVolta = W(L, "volta"), wEst = W(L, "estoque"), wBom = W(L, "bom");
	sfx(wDev, "click.wav", 0.7, "clique Devolução");
	sfx(wVolta, "whoosh.wav", 0.35, "volta pra prateleira");
	sfx(wEst, "count-up.wav", 0.5, "estoque +1");
	sfx(wBom, "pop.wav", 0.35, "x some");
	const cw = 130, base = 1446 - chgH(cw);
	const html = `<div class="a win w" style="left:110px;top:420px;width:860px;height:470px"><div class="tb"><i></i><i></i><i></i><span>Lançamento</span></div>
<div class="a" style="left:40px;top:96px;width:780px"><div class="flabel">Produto</div><div class="field">Carregador 20W</div></div>
<div class="a" style="left:40px;top:236px;width:360px"><div class="flabel">Tipo</div></div>
<div class="a btn dev" style="left:40px;top:278px;width:360px;background:#3A4354;color:${C.ink}">Devolução</div>
<div class="a btn" style="left:420px;top:278px;width:360px;background:#262D39;color:#6B7486">Cancelar</div>
<div class="a ok" style="left:40px;top:378px;width:780px;font-size:28px;font-weight:600;color:${C.green}">✓ Devolvido ao estoque</div>
${CURSOR("cur", 600, 420, 40)}</div>
${SHELF("sh", 150, 1180, 780, 290, "estoque")}
${CHG("g1", 200, base, cw)}${CHG("g2", 370, base, cw)}${CHG("g3", 540, base, cw)}
<div class="a cnt" style="left:820px;top:1060px;width:150px;height:150px;border-radius:50%;background:${C.y};color:#0E1116;display:flex;align-items:center;justify-content:center;font-size:84px;font-weight:800"><span class="n3">3</span><span class="a n4" style="opacity:0">4</span></div>
${CHG("bad", 120, 930, cw, {defect: true, off: true})}`;
	const js = `${helpers(id)}
tl.fromTo($(".w"),{y:30,opacity:.4,filter:"blur(10px)"},{y:0,opacity:1,filter:"blur(0px)",duration:${d(9)},ease:"power2.out"},0);
tl.fromTo($(".cur"),{x:0,y:0},{x:-330,y:-110,duration:${d(16)},ease:"power2.inOut"},${t(wDev - 17)});
tl.fromTo($(".cur"),{scale:1},{scale:.82,duration:${d(2)},yoyo:true,repeat:1},${t(wDev)});
tl.fromTo($(".dev"),{backgroundColor:"#3A4354"},{backgroundColor:"${C.blue}",duration:${d(2)}},${t(wDev)});
tl.fromTo($(".ok"),{opacity:0},{opacity:1,duration:${d(6)}},${t(wDev + 6)});
tl.fromTo($(".bad"),{scale:1},{scale:1.12,duration:${d(5)},yoyo:true,repeat:1,ease:"sine.inOut"},${t(wCarr)});
// slides into the 4th slot on the shelf
tl.to($(".bad"),{x:590,duration:${d(12)},ease:"power2.inOut"},${t(wVolta)});
tl.to($(".bad"),{y:${base - 930},duration:${d(12)},ease:"back.in(1.2)"},${t(wVolta)});
tl.to($(".n3"),{opacity:0,y:-40,duration:${d(5)}},${t(wEst)});
tl.fromTo($(".n4"),{opacity:0,y:40},{opacity:1,y:0,duration:${d(6)},ease:"back.out(2)"},${t(wEst)});
tl.fromTo($(".cnt"),{scale:1},{scale:1.15,duration:${d(4)},yoyo:true,repeat:1},${t(wEst)});
// "como se fosse bom": the x goes away, LED back on — indistinguishable
tl.to($(".bad .xb"),{scale:0,opacity:0,duration:${d(6)},ease:"back.in(2)"},${t(wBom)});
tl.to($(".bad .led"),{fill:"${C.green}",duration:${d(4)}},${t(wBom + 2)});
tl.to($(".bad .ledglow"),{opacity:.35,duration:${d(4)}},${t(wBom + 2)});
window.__timelines["${id}"]=tl;`;
	return {html, js};
});

/* ===== S4 — semana que vem, vende de novo (p04) ===== */
scene(4, ({id, t, d}) => {
	const L = "p04";
	const wSem = W(L, "semana"), wVem = W(L, "vem"), wVende = W(L, "vende"), wVoce = W(L, "voce"), wPra = W(L, "pra"), wCli = W(L, "cliente");
	sfx(wSem, "flip.wav", 0.5, "folha 1");
	sfx(wSem + 9, "flip.wav", 0.45, "folha 2");
	sfx(wVende, "whoosh-soft.wav", 0.3, "mão pega");
	sfx(wVende + 14, "bag.wav", 0.5, "sacola");
	sfx(wVoce, "pop.wav", 0.4, "x pisca");
	sfx(wCli, "sale.wav", 0.45, "venda");
	const cw = 120, base = 1316 - chgH(cw);
	const html = `<div class="a cal" style="left:330px;top:410px;width:420px;height:400px;border-radius:30px;background:#F4F2EE;overflow:hidden;box-shadow:0 30px 60px rgba(0,0,0,.5)">
<div class="a" style="left:0;top:0;width:420px;height:96px;background:${C.y};color:#0E1116;font-size:40px;font-weight:800;display:flex;align-items:center;justify-content:center;letter-spacing:.06em">SEGUNDA</div>
<div class="a days" style="left:0;top:96px;width:420px;height:230px;overflow:hidden">${[6, 7, 8, 9, 10, 11, 12, 13].map((n, k) => `<div class="a dn dn${k}" style="left:0;top:0;width:420px;height:230px;display:flex;align-items:center;justify-content:center;font-size:170px;font-weight:800;color:#12151B;${k ? "opacity:0" : ""}">${n}</div>`).join("")}</div>
<div class="a svq" style="left:0;top:320px;width:420px;text-align:center;font-size:36px;font-weight:700;color:#4A5262">semana que vem</div></div>
${SHELF("sh", 110, 1050, 620, 290)}
${CHG("g1", 150, base, cw)}${CHG("g2", 290, base, cw)}${CHG("g3", 430, base, cw)}
<div class="a grab" style="left:0;top:0;width:1080px;height:1920px">${CHG("bad", 570, base, cw, {defect: true})}${HAND("ohand", 572, base - 300, 116, "#10141B", {cuff: C.y})}</div>
${PERSON("buyer", 650, 1080, 420, "#5A4868", {cap: C.blue})}
<div class="a bag" style="left:150px;top:1430px;width:240px;height:270px"><svg viewBox="0 0 240 270" width="100%" height="100%" overflow="visible"><path d="M70 40 C70 -10 170 -10 170 40" fill="none" stroke="#8A6A44" stroke-width="10"/><path d="M10 40 L230 40 L216 270 L24 270 Z" fill="#C49A66"/><path d="M10 40 L230 40 L226 70 L14 70 Z" fill="#B08654"/></svg></div>`;
	const flips = [0, 1, 2, 3, 4, 5, 6, 7];
	const js = `${helpers(id)}
tl.fromTo($(".cal"),{y:-30,opacity:.5,filter:"blur(8px)"},{y:0,opacity:1,filter:"blur(0px)",duration:${d(8)}},0);
${flips.slice(1).map((k) => `tl.set($(".dn${k - 1}"),{opacity:0},${t(wSem + k * 2.5)});tl.fromTo($(".dn${k}"),{opacity:1,y:-60},{opacity:1,y:0,duration:${d(2)},immediateRender:false},${t(wSem + k * 2.5)});`).join("\n")}
tl.fromTo($(".svq"),{opacity:0,y:12},{opacity:1,y:0,duration:${d(6)}},${t(wVem)});
// hand takes "that" charger (still disguised) and drops it in the bag
tl.fromTo($(".ohand"),{y:-420,opacity:0},{y:0,opacity:1,duration:${d(8)},ease:"power2.out"},${t(wVende - 8)});
tl.to($(".grab"),{x:-430,y:200,duration:${d(14)},ease:"power2.inOut"},${t(wVende)});
tl.to($(".ohand"),{y:-520,opacity:0,duration:${d(8)},ease:"power2.in"},${t(wVende + 14)});
tl.to($(".bad"),{y:"+=60",duration:${d(4)}},${t(wVende + 13)});
// "Você mesmo": the x flashes on the one in the bag
tl.fromTo($(".bad .xb"),{opacity:0,scale:.4},{opacity:1,scale:1.2,duration:${d(4)},ease:"back.out(3)"},${t(wVoce)});
tl.to($(".bad .xb"),{opacity:0,duration:${d(3)}},${t(wVoce + 10)});
tl.to($(".bad .xb"),{opacity:1,duration:${d(2)}},${t(wVoce + 14)});
tl.to($(".bad .xb"),{opacity:0,scale:.6,duration:${d(4)}},${t(wVoce + 20)});
// another customer comes, the bag goes to them
tl.fromTo($(".buyer"),{x:520},{x:0,duration:${d(14)},ease:"power3.out"},${t(wPra - 14)});
tl.to([$(".bag"),$(".grab")],{x:"+=470",y:"-=170",duration:${d(12)},ease:"power2.inOut"},${t(wCli - 8)});
window.__timelines["${id}"]=tl;`;
	return {html, js};
});

/* ===== S5 — gerente: carregador sobrando, de onde veio? (p05) ===== */
scene(5, ({id, t, d}) => {
	const L = "p05";
	const wGer = W(L, "gerente"), wSob = W(L, "sobrando"), wDe = W(L, "de"), wNing = W(L, "ninguem");
	sfx(wSob, "tick.wav", 0.4, "+1 na tela");
	sfx(wDe, "pop.wav", 0.5, "? grande");
	sfx(wNing + 1, "scratch.wav", 0.5, "coça a cabeça");
	const cw = 92, base = 1356 - chgH(cw);
	const xs = [520, 615, 710, 805, 900];
	const html = `<div class="a mon m" style="left:470px;top:410px;width:560px;height:330px"><div class="a" style="left:30px;top:24px;font-size:26px;font-weight:700;color:${C.muted};letter-spacing:.08em">ESTOQUE</div>
<div class="a" style="left:30px;top:80px;font-size:44px;font-weight:800;color:${C.ink}">Carregador</div>
<div class="a" style="left:30px;top:160px;font-size:34px;font-weight:600;color:${C.muted}">em estoque:</div>
<div class="a num" style="left:250px;top:142px;font-size:72px;font-weight:800;color:${C.ink}">5</div>
<div class="a plus" style="left:330px;top:152px;padding:4px 18px;border-radius:30px;background:${C.y};color:#0E1116;font-size:44px;font-weight:800">+1</div></div>
<div class="a" style="left:720px;top:754px;width:80px;height:40px;background:#2A313D"></div>
${SHELF("sh", 500, 1110, 530, 270)}
${xs.map((x, k) => CHG(`g${k}`, x, base, cw)).join("")}
<div class="a qm" style="left:620px;top:780px;width:240px;height:260px;font-size:250px;line-height:260px;font-weight:800;color:${C.y};text-align:center;text-shadow:0 10px 40px rgba(245,184,0,.35)">?</div>
<div class="a ger" style="left:0;top:0;width:1080px;height:1920px">${PERSON("gbody", 20, 1000, 440, "#2E3A52", {noHead: true})}
<div class="a" style="left:198px;top:1317px;width:84px;height:120px;background:#E9E6DF;clip-path:polygon(0 0,100% 0,50% 100%)"></div>
<div class="a" style="left:228px;top:1336px;width:24px;height:120px;background:${C.red};border-radius:6px"></div>
<div class="a head" style="left:135px;top:1076px;width:210px;height:210px;border-radius:50%;background:#2E3A52;box-shadow:inset 6px 6px 0 rgba(255,255,255,.08)"></div>
<div class="a arm" style="left:330px;top:1340px;width:64px;height:330px;background:#2E3A52;border-radius:32px;transform-origin:32px 32px"><div class="a" style="left:-4px;top:280px;width:72px;height:72px;border-radius:50%;background:#D9A97F"></div></div></div>`;
	const js = `${helpers(id)}
tl.fromTo($(".m"),{opacity:.5,filter:"blur(8px)",y:-20},{opacity:1,filter:"blur(0px)",y:0,duration:${d(8)}},0);
tl.fromTo($(".ger"),{x:-120},{x:0,duration:${d(12)},ease:"power3.out"},0);
tl.fromTo($(".head"),{x:0,y:0},{x:14,y:-14,duration:${d(8)},ease:"power2.out"},${t(wGer)});
tl.fromTo($(".plus"),{opacity:0,scale:.3},{opacity:1,scale:1,duration:${d(7)},ease:"back.out(3)"},${t(wSob)});
tl.to($(".head"),{x:22,y:8,duration:${d(8)},ease:"power2.inOut"},${t(wDe - 6)});
tl.fromTo($(".qm"),{opacity:0,scale:.3,rotation:-20},{opacity:1,scale:1,rotation:0,duration:${d(9)},ease:"back.out(2.5)"},${t(wDe)});
tl.to($(".qm"),{rotation:8,duration:${d(6)},yoyo:true,repeat:3,ease:"sine.inOut"},${t(wDe + 10)});
// scratching the head
tl.fromTo($(".arm"),{rotation:0},{rotation:168,duration:${d(8)},ease:"power2.out"},${t(wNing - 6)});
tl.to($(".arm"),{rotation:158,duration:${d(3)},yoyo:true,repeat:5,ease:"sine.inOut"},${t(wNing + 2)});
tl.to($(".head"),{x:4,y:-6,duration:${d(8)},ease:"power2.inOut"},${t(wNing + 4)});
window.__timelines["${id}"]=tl;`;
	return {html, js};
});

/* ---- screenshot "camera" helper: frame 960x860 at (60,470), image layer in source px ---- */
const SHOT = {x: 60, y: 470, w: 960, h: 860};
const cam = (cx, cy, s) => ({x: +(SHOT.w / 2 - cx * s).toFixed(1), y: +(SHOT.h / 2 - cy * s).toFixed(1), scale: s});
const camStr = (c) => `{x:${c.x},y:${c.y},scale:${c.scale}}`;

/* ===== S6 — PDV > Troca > nº da venda (p06) ===== */
scene(6, ({id, t, d}) => {
	const L = "p06";
	const wAlvo = W(L, "alvomanage"), wTroca = W(L, "troca"), wPdv = W(L, "pdv"), wPux = W(L, "puxando"), wVenda = W(L, "venda");
	sfx(STARTS[5], "whoosh-up.wav", 0.35, "prateleira vira PDV");
	sfx(wTroca, "click.wav", 0.75, "clique Troca");
	sfx(wTroca + 6, "pop.wav", 0.3, "modal");
	const tType = wPdv - 2;
	sfx(tType, "key.wav", 0.6, "digita 1");
	const tVer = Math.max(wVenda, tType + 16);
	sfx(tVer, "click.wav", 0.75, "clique Verificar");
	const c0 = cam(760, 300, 1.75), c1 = cam(820, 230, 2.3), c2 = cam(683, 285, 2.05), c3 = cam(740, 290, 2.3);
	const html = `<div class="a shot sh" data-layout-allow-overflow style="left:${SHOT.x}px;top:${SHOT.y}px;width:${SHOT.w}px;height:${SHOT.h}px">
<div class="img im" style="width:1366px;height:577px">
<div class="a i0" style="left:0;top:0;width:1366px;height:577px;background-image:url(assets/img/pdv.png)"></div>
<div class="a i1" style="left:0;top:0;width:1366px;height:577px;background-image:url(assets/img/pdv-modal.png);opacity:0"></div>
<div class="a i2" style="left:0;top:0;width:1366px;height:577px;background-image:url(assets/img/pdv-venda1.png);opacity:0"></div>
<div class="a ring r1" style="left:788px;top:85px;width:80px;height:34px;border:3px solid ${C.y};border-radius:8px;opacity:0"></div>
<div class="a ring r2" style="left:760px;top:297px;width:94px;height:42px;border:3px solid ${C.y};border-radius:8px;opacity:0;box-shadow:0 0 18px rgba(245,184,0,.6)"></div>
${CURSOR("cur", 600, 420, 22)}</div></div>
<div class="a cap c1" style="top:1390px">troca pelo PDV</div>
<div class="a cap c2" style="top:1390px;opacity:0">puxa a venda</div>`;
	const js = `${helpers(id)}
gsap.set($(".im"),{transformOrigin:"0 0"});
tl.fromTo($(".sh"),{scale:.92,opacity:0,filter:"blur(14px)"},{scale:1,opacity:1,filter:"blur(0px)",duration:${d(9)},ease:"power2.out"},0);
tl.fromTo($(".im"),${camStr(c0)},{...${camStr(c1)},duration:${d(wTroca - 2 - STARTS[5] - 6)},ease:"power2.inOut"},${d(6)});
tl.fromTo($(".cur"),{x:0,y:0},{x:232,y:-318,duration:${d(14)},ease:"power2.inOut"},${t(wTroca - 15)});
tl.fromTo($(".cur"),{scale:1},{scale:.8,duration:${d(2)},yoyo:true,repeat:1},${t(wTroca)});
tl.fromTo($(".r1"),{opacity:1,scale:1},{opacity:0,scale:1.6,duration:${d(10)}},${t(wTroca)});
tl.fromTo($(".c1"),{opacity:0,y:20},{opacity:1,y:0,duration:${d(7)}},${t(wTroca - 4)});
tl.fromTo($(".i1"),{opacity:0},{opacity:1,duration:${d(4)}},${t(wTroca + 5)});
tl.to($(".im"),{...${camStr(c2)},duration:${d(12)},ease:"power2.inOut"},${t(wTroca + 5)});
tl.fromTo($(".i2"),{opacity:0},{opacity:1,duration:${d(2)}},${t(tType)});
tl.to($(".cur"),{x:206,y:-102,duration:${d(12)},ease:"power2.inOut"},${t(tType + 2)});
tl.to($(".cur"),{scale:.8,duration:${d(2)},yoyo:true,repeat:1},${t(tVer)});
tl.fromTo($(".r2"),{opacity:0},{opacity:1,duration:${d(3)}},${t(tVer)});
tl.to($(".im"),{...${camStr(c3)},duration:${d(20)},ease:"power2.inOut"},${t(tVer)});
tl.to($(".c1"),{opacity:0,y:-20,duration:${d(5)}},${t(wPux - 2)});
tl.fromTo($(".c2"),{opacity:0,y:20},{opacity:1,y:0,duration:${d(7)}},${t(wPux)});
window.__timelines["${id}"]=tl;`;
	void wAlvo;
	return {html, js};
});

/* ===== S7 — marca "veio com defeito" e escolhe o novo (p07) ===== */
scene(7, ({id, t, d}) => {
	const L = "p07";
	const wMarca = W(L, "marca"), wDef = W(L, "defeito"), wEsc = W(L, "escolhe"), wNovo = W(L, "novo");
	sfx(wMarca, "tick.wav", 0.6, "check defeito");
	sfx(wEsc + 2, "key.wav", 0.45, "digita");
	sfx(wEsc + 5, "key.wav", 0.4, "digita");
	sfx(wNovo, "click.wav", 0.6, "escolhe o cabo");
	const c0 = cam(300, 360, 2.6), c1 = cam(330, 470, 2.6);
	const html = `<div class="a shot sh" data-layout-allow-overflow style="left:${SHOT.x}px;top:${SHOT.y}px;width:${SHOT.w}px;height:${SHOT.h}px">
<div class="img im" style="width:1366px;height:1066px">
<div class="a i0" style="left:0;top:0;width:1351px;height:1066px;background-image:url(assets/img/form.png)"></div>
<div class="a i1" style="left:0;top:0;width:1366px;height:577px;background-image:url(assets/img/form-busca.png);opacity:0"></div>
<div class="a hide" data-layout-allow-overflow style="left:110px;top:470px;width:1200px;height:110px;background-image:url(assets/img/form.png);background-position:-110px -470px;opacity:0"></div>
<div class="a ring r1" style="left:122px;top:385px;width:30px;height:30px;border:3px solid ${C.y};border-radius:6px;opacity:0"></div>
<div class="a ring r2" style="left:144px;top:532px;width:1124px;height:38px;border:3px solid ${C.y};border-radius:8px;opacity:0"></div>
${CURSOR("cur", 600, 300, 22)}</div></div>
<div class="a cap c1" style="top:1390px;opacity:0">veio com defeito</div>
<div class="a cap c2" style="top:1390px;opacity:0">escolhe o novo</div>`;
	const js = `${helpers(id)}
gsap.set($(".im"),{transformOrigin:"0 0"});
tl.fromTo($(".im"),{...${camStr(cam(500, 300, 1.6))}},{...${camStr(c0)},duration:${d(12)},ease:"power2.out"},0);
tl.fromTo($(".sh"),{filter:"blur(10px)"},{filter:"blur(0px)",duration:${d(7)}},0);
tl.fromTo($(".cur"),{x:0,y:0},{x:-460,y:96,duration:${d(12)},ease:"power2.inOut"},${t(wMarca - 13)});
tl.to($(".cur"),{scale:.8,duration:${d(2)},yoyo:true,repeat:1},${t(wMarca)});
tl.set($(".hide"),{opacity:1},${t(wMarca)});
tl.fromTo($(".i1"),{opacity:0},{opacity:1,duration:${d(2)}},${t(wMarca)});
tl.fromTo($(".r1"),{opacity:1,scale:1},{opacity:0,scale:2.2,duration:${d(12)}},${t(wMarca)});
tl.fromTo($(".c1"),{opacity:0,y:20},{opacity:1,y:0,duration:${d(7)}},${t(wDef - 10)});
tl.to($(".im"),{...${camStr(c1)},duration:${d(12)},ease:"power2.inOut"},${t(wEsc - 8)});
tl.to($(".cur"),{x:-380,y:208,duration:${d(10)},ease:"power2.inOut"},${t(wEsc - 8)});
tl.to($(".hide"),{opacity:0,duration:${d(2)}},${t(wEsc + 6)});
tl.to($(".c1"),{opacity:0,y:-20,duration:${d(5)}},${t(wEsc - 4)});
tl.fromTo($(".c2"),{opacity:0,y:20},{opacity:1,y:0,duration:${d(7)}},${t(wEsc)});
tl.to($(".cur"),{x:-420,y:250,duration:${d(5)}},${t(wNovo - 5)});
tl.to($(".cur"),{scale:.8,duration:${d(2)},yoyo:true,repeat:1},${t(wNovo)});
tl.fromTo($(".r2"),{opacity:0},{opacity:1,duration:${d(3)}},${t(wNovo)});
window.__timelines["${id}"]=tl;`;
	return {html, js};
});

/* ===== S8 — Financeiro: a tela faz a conta (p08) ===== */
scene(8, ({id, t, d}) => {
	const L = "p08";
	const wConta = W(L, "conta"), wDif = W(L, "diferenca"), wLevou = W(L, "levou"), wNovo = W(L, "novo");
	sfx(wDif, "tick.wav", 0.55, "Diferença");
	sfx(wLevou, "tick.wav", 0.55, "Valor original");
	sfx(wNovo, "tick.wav", 0.55, "Novos produtos");
	const S = 3.0;
	const cell = (cls, sx, top) => `<div class="a cell ${cls}" style="left:110px;top:${top}px;width:${287 * S}px;height:${68 * S}px;border-radius:18px;overflow:hidden;opacity:.35"><div class="a crop" style="left:0;top:0;width:${1366 * S}px;height:${577 * S}px;background-image:url(assets/img/form-fin.png);background-size:${1366 * S}px ${577 * S}px;background-position:${-sx * S}px ${-338 * S}px"></div><div class="a hl" style="left:0;top:0;right:0;bottom:0;border:5px solid ${C.y};border-radius:18px;opacity:0"></div></div>`;
	const glyph = (cls, ch, top) => `<div class="a ${cls}" style="left:110px;top:${top}px;width:${287 * S}px;text-align:center;font-size:84px;font-weight:800;color:${C.y};line-height:70px">${ch}</div>`;
	const html = `<div class="a shot pnl" style="left:70px;top:420px;width:940px;height:1060px">
<div class="a" style="left:40px;top:34px;width:${73 * 2.6}px;height:${22 * 2.6}px;background-image:url(assets/img/form-fin.png);background-size:${1366 * 2.6}px ${577 * 2.6}px;background-position:${-129 * 2.6}px ${-301 * 2.6}px"></div>
</div>
${cell("vo", 130, 560)}${glyph("mi", "−", 772)}${cell("np", 418, 850)}${glyph("eq", "=", 1062)}${cell("df", 994, 1140)}
<div class="a sd" style="left:110px;top:1370px;width:${131 * S}px;height:${18 * S}px;background-image:url(assets/img/form-fin.png);background-size:${1366 * S}px ${577 * S}px;background-position:${-129 * S}px ${-423 * S}px;opacity:0"></div>`;
	const js = `${helpers(id)}
tl.fromTo($(".pnl"),{opacity:0,y:30},{opacity:1,y:0,duration:${d(8)},ease:"power2.out"},0);
tl.fromTo($(".cell"),{opacity:0,y:40},{opacity:.35,y:0,duration:${d(8)},stagger:${d(3)},ease:"power2.out"},0);
tl.fromTo([$(".mi"),$(".eq")],{opacity:0,scale:.4},{opacity:1,scale:1,duration:${d(7)},stagger:${d(3)},ease:"back.out(2)"},${t(wConta)});
tl.to($(".df"),{opacity:1,duration:${d(4)}},${t(wDif)});
tl.fromTo($(".df .hl"),{opacity:0},{opacity:1,duration:${d(4)}},${t(wDif)});
tl.to($(".df .hl"),{opacity:.25,duration:${d(6)}},${t(wDif + 18)});
tl.to($(".vo"),{opacity:1,duration:${d(4)}},${t(wLevou)});
tl.fromTo($(".vo .hl"),{opacity:0},{opacity:1,duration:${d(4)}},${t(wLevou)});
tl.to($(".np"),{opacity:1,duration:${d(4)}},${t(wNovo)});
tl.fromTo($(".np .hl"),{opacity:0},{opacity:1,duration:${d(4)}},${t(wNovo)});
tl.to($(".df .hl"),{opacity:1,duration:${d(4)}},${t(wNovo + 4)});
tl.fromTo($(".sd"),{opacity:0,y:10},{opacity:1,y:0,duration:${d(6)}},${t(wNovo + 4)});
window.__timelines["${id}"]=tl;`;
	return {html, js};
});

/* ===== S9 — "Não volta pro estoque à venda": fica separado (p09) ===== */
scene(9, ({id, t, d}) => {
	const L = "p09";
	const wDef = W(L, "defeituoso"), wNao = W(L, "nao"), wFica = W(L, "fica"), wSep = W(L, "separado"), wVenda = W(L, "venda");
	sfx(wNao, "pen.wav", 0.5, "sublinha");
	sfx(wFica - 2, "whoosh.wav", 0.35, "passa reto");
	sfx(wSep + 6, "thud.wav", 0.65, "cai na caixa");
	sfx(wVenda, "tick.wav", 0.35, "à venda");
	const S = 3.0;
	const cw = 120, base = 1240 - chgH(cw);
	const html = `<div class="a shot strip" data-layout-allow-overflow style="left:110px;top:420px;width:${287 * S}px;height:${44 * S}px">
<div class="a crop" style="left:0;top:0;width:${1366 * S}px;height:${577 * S}px;background-image:url(assets/img/form-busca.png);background-size:${1366 * S}px ${577 * S}px;background-position:${-125 * S}px ${-380 * S}px"></div></div>
<svg class="a" style="left:0;top:0" width="1080" height="700" viewBox="0 0 1080 700"><path class="ul" d="M${110 + (185 - 125) * S} ${420 + 41 * S} L ${110 + (352 - 125) * S} ${420 + 41 * S}" stroke="${C.y}" stroke-width="7" stroke-linecap="round" fill="none" stroke-dasharray="700" stroke-dashoffset="700"/></svg>
${SHELF("sh", 80, 970, 560, 300, "à venda")}
${CHG("g1", 130, base, cw)}${CHG("g2", 300, base, cw)}${CHG("g3", 470, base, cw)}
${BOX("bx", 700, 1050, 300, "separado")}
${CHG("bad", 470, 640, cw, {defect: true, off: true})}
${BOXFRONT("bxf", 700, 1050, 300)}`;
	const js = `${helpers(id)}
tl.fromTo($(".strip"),{opacity:0,filter:"blur(10px)",scale:.94},{opacity:1,filter:"blur(0px)",scale:1,duration:${d(8)}},0);
tl.fromTo($(".bad"),{opacity:0,y:-80,scale:.6},{opacity:1,y:0,scale:1,duration:${d(9)},ease:"back.out(2)"},${t(wDef)});
tl.fromTo($(".ul"),{strokeDashoffset:700},{strokeDashoffset:0,duration:${d(18)},ease:"power1.inOut"},${t(wNao)});
// hovers toward the shelf... and goes straight past it
tl.to($(".bad"),{x:-180,y:90,duration:${d(14)},ease:"power2.inOut"},${t(wNao + 6)});
tl.to($(".bad"),{x:330,y:90,duration:${d(14)},ease:"power2.inOut"},${t(wFica - 4)});
tl.to($(".bad"),{y:${1050 + 40 - 640},duration:${d(9)},ease:"power2.in"},${t(wSep - 3)});
tl.fromTo($(".bx"),{scaleY:1},{scaleY:.94,duration:${d(3)},yoyo:true,repeat:1,transformOrigin:"50% 100%"},${t(wSep + 6)});
tl.fromTo($(".bx .btag"),{opacity:0,y:20},{opacity:1,y:0,duration:${d(6)}},${t(wSep + 6)});
tl.fromTo($(".sh .tag"),{scale:1},{scale:1.12,duration:${d(5)},yoyo:true,repeat:1},${t(wVenda)});
window.__timelines["${id}"]=tl;`;
	return {html, js};
});

/* ===== S10 — o novo sai do estoque sozinho (p10) ===== */
scene(10, ({id, t, d}) => {
	const L = "p10";
	const wSai = W(L, "sai"), wSoz = W(L, "sozinho"), wSem = W(L, "sem"), wBaixa = W(L, "baixa"), wNa = W(L, "na");
	sfx(wSai, "whoosh.wav", 0.4, "novo sai");
	sfx(wSoz, "count-down.wav", 0.55, "contador -1");
	sfx(wNa, "whoosh-soft.wav", 0.3, "mão desiste");
	const cw = 120, base = 846 - chgH(cw);
	const html = `${SHELF("sh", 130, 560, 820, 312, "estoque")}
${CHG("g1", 180, base, cw)}${CHG("g2", 360, base, cw)}${CHG("g3", 540, base, cw)}${CHG("g4", 720, base, cw)}
<div class="a dsp" style="left:300px;top:1010px;width:480px;height:250px;border-radius:30px;background:#0B0E13;border:3px solid #2E3644">
<div class="a" style="left:0;top:26px;width:480px;text-align:center;font-size:30px;font-weight:700;color:${C.muted};letter-spacing:.08em">CARREGADOR</div>
<div class="a" style="left:150px;top:70px;width:180px;height:160px;overflow:hidden"><div class="a d4" style="left:0;top:0;width:180px;height:160px;text-align:center;font-size:150px;line-height:160px;font-weight:800">4</div><div class="a d3" style="left:0;top:0;opacity:0;width:180px;height:160px;text-align:center;font-size:150px;line-height:160px;font-weight:800">3</div></div>
<div class="a m1" style="left:340px;top:100px;padding:4px 16px;border-radius:24px;background:${C.y};color:#0E1116;font-size:38px;font-weight:800;opacity:0">−1</div></div>
<div class="a paper" style="left:120px;top:1370px;width:430px;height:300px;background:#F1EEE6;border-radius:12px;rotate:-4deg;box-shadow:0 20px 40px rgba(0,0,0,.4)">
<div class="a" style="left:30px;top:24px;font-size:32px;font-weight:800;color:#3B3F48">baixa manual</div>
<div class="a" style="left:30px;top:96px;width:360px;height:4px;background:#C9C4B8"></div><div class="a" style="left:30px;top:156px;width:360px;height:4px;background:#C9C4B8"></div><div class="a" style="left:30px;top:216px;width:360px;height:4px;background:#C9C4B8"></div></div>
${HAND("phand", 560, 1460, 150, "#10141B", {flip: true, pen: true, cuff: C.y})}`;
	const js = `${helpers(id)}
tl.fromTo([$(".sh"),$(".chg")],{opacity:.4,filter:"blur(8px)"},{opacity:1,filter:"blur(0px)",duration:${d(8)}},0);
tl.fromTo($(".dsp"),{opacity:0,y:30},{opacity:1,y:0,duration:${d(8)}},0);
tl.fromTo($(".g4"),{y:0},{y:-40,duration:${d(5)},ease:"power2.out"},${t(wSai - 5)});
tl.to($(".g4"),{x:520,y:-180,rotation:18,opacity:0,duration:${d(12)},ease:"power2.in"},${t(wSai)});
tl.to($(".d4"),{y:-120,opacity:0,duration:${d(5)},ease:"power2.in"},${t(wSoz)});
tl.fromTo($(".d3"),{y:120,opacity:0},{y:0,opacity:1,duration:${d(6)},ease:"power2.out"},${t(wSoz + 3)});
tl.fromTo($(".m1"),{opacity:0,scale:.4},{opacity:1,scale:1,duration:${d(6)},ease:"back.out(3)"},${t(wSoz + 4)});
// a pen hand comes to write it down... and gives up mid-air
tl.fromTo($(".phand"),{x:400,y:500},{x:-120,y:0,duration:${d(14)},ease:"power2.out"},${t(wSem - 4)});
tl.to($(".phand"),{rotation:-6,duration:${d(3)},yoyo:true,repeat:3,ease:"sine.inOut"},${t(wBaixa - 4)});
tl.to($(".phand"),{x:420,y:560,duration:${d(14)},ease:"power2.in"},${t(wNa)});
window.__timelines["${id}"]=tl;`;
	return {html, js};
});

/* ===== S11 — Movimentações: essa foi venda, essa foi troca (p11) ===== */
scene(11, ({id, t, d}) => {
	const L = "p11";
	const wMov = W(L, "movimentacoes"), wCada = W(L, "cada"), wVenda = W(L, "venda"), wTroca = W(L, "troca");
	sfx(wMov, "whoosh-soft.wav", 0.3, "linhas entram");
	sfx(wVenda, "tick.wav", 0.6, "linha venda");
	sfx(wTroca, "tick.wav", 0.6, "linha troca");
	const S = 2.3;
	const piece = (cls, sx, sy, sw, sh, x, y) => `<div class="a crop ${cls}" style="left:${x}px;top:${y}px;width:${Math.round(sw * S)}px;height:${Math.round(sh * S)}px;background-image:url(assets/img/mov.png);background-size:${1366 * S}px ${577 * S}px;background-position:${-sx * S}px ${-sy * S}px"></div>`;
	// rows in the print: TROCA#1 y 237-283, PDV#1 y 284-330
	const card = (cls, y0, top, pill, pillColor) => `<div class="a shot card ${cls}" style="left:70px;top:${top}px;width:940px;height:${Math.round(46 * S) * 2 + 40}px">
${piece("", 110, y0, 196, 46, 18, 20)}${piece("", 905, y0, 53, 46, 940 - 18 - Math.round(53 * S), 20)}
${piece("", 467, y0, 236, 46, 18, 20 + Math.round(46 * S))}${piece("", 1086, y0, 130, 46, 940 - 18 - Math.round(130 * S), 20 + Math.round(46 * S))}
<div class="a hl" style="left:0;top:0;right:0;bottom:0;border:5px solid ${C.y};border-radius:30px;opacity:0"></div>
<div class="a pill" style="right:170px;top:30px;padding:6px 22px;border-radius:30px;background:${pillColor};color:#0E1116;font-size:34px;font-weight:800;opacity:0">${pill}</div></div>`;
	const html = `<div class="a hdr" style="left:70px;top:420px;width:940px;height:200px">
${piece("", 106, 84, 330, 18, 0, 0)}
<div class="a crop" style="left:0;top:64px;width:${Math.round(210 * 3)}px;height:${Math.round(30 * 3)}px;background-image:url(assets/img/mov.png);background-size:${1366 * 3}px ${577 * 3}px;background-position:${-154 * 3}px ${-136 * 3}px"></div></div>
${card("cv", 284, 690, "venda", C.green)}
${card("ct", 237, 1000, "troca", "#B98CFF")}
<div class="a cap cc" style="top:1340px;opacity:0">cada saída tem nome</div>`;
	const js = `${helpers(id)}
tl.fromTo($(".hdr"),{opacity:0,y:-20,filter:"blur(8px)"},{opacity:1,y:0,filter:"blur(0px)",duration:${d(8)}},0);
tl.fromTo($(".card"),{opacity:0,y:50},{opacity:.6,y:0,duration:${d(9)},stagger:${d(5)},ease:"power2.out"},${t(wMov)});
tl.fromTo($(".cc"),{opacity:0,y:20},{opacity:1,y:0,duration:${d(7)}},${t(wCada)});
tl.to($(".cv"),{opacity:1,duration:${d(4)}},${t(wVenda)});
tl.fromTo($(".cv .hl"),{opacity:0},{opacity:1,duration:${d(4)}},${t(wVenda)});
tl.fromTo($(".cv .pill"),{opacity:0,scale:.4},{opacity:1,scale:1,duration:${d(6)},ease:"back.out(3)"},${t(wVenda)});
tl.to($(".cv .hl"),{opacity:.3,duration:${d(6)}},${t(wTroca - 3)});
tl.to($(".ct"),{opacity:1,duration:${d(4)}},${t(wTroca)});
tl.fromTo($(".ct .hl"),{opacity:0},{opacity:1,duration:${d(4)}},${t(wTroca)});
tl.fromTo($(".ct .pill"),{opacity:0,scale:.4},{opacity:1,scale:1,duration:${d(6)},ease:"back.out(3)"},${t(wTroca)});
window.__timelines["${id}"]=tl;`;
	return {html, js};
});

/* ===== S12 — o que o sistema diz é o que dá pra vender (p12) ===== */
scene(12, ({id, t, d}) => {
	const L = "p12";
	const wSis = W(L, "sistema"), wTem = W(L, "tem"), wVender = W(L, "vender"), wVerd = W(L, "verdade");
	for (let k = 0; k < 4; k++) sfx(wTem + 2 + k * 4, "tick.wav", 0.3, `conta ${k + 1}`);
	sfx(wVender, "pop.wav", 0.35, "= verde");
	sfx(wVerd, "confirm.wav", 0.5, "confere");
	const cw = 110, base = 1316 - chgH(cw);
	const html = `<div class="a mon m" style="left:150px;top:410px;width:780px;height:330px"><div class="a" style="left:36px;top:26px;font-size:28px;font-weight:700;color:${C.muted};letter-spacing:.08em">ESTOQUE</div>
<div class="a" style="left:36px;top:84px;font-size:50px;font-weight:800">Carregador</div>
<div class="a" style="left:36px;top:178px;font-size:38px;font-weight:600;color:${C.muted}">em estoque:</div>
<div class="a num" style="left:300px;top:150px;font-size:96px;font-weight:800">4</div>
<div class="a ok" style="left:620px;top:150px;width:100px;height:100px;border-radius:50%;background:${C.green};color:#0E1116;font-size:64px;font-weight:800;display:flex;align-items:center;justify-content:center;opacity:0">✓</div></div>
<div class="a eq" style="left:390px;top:770px;width:300px;text-align:center;font-size:150px;line-height:150px;font-weight:800;color:${C.muted}">=</div>
${SHELF("sh", 90, 1040, 640, 300, "à venda")}
${[0, 1, 2, 3].map((k) => CHG(`g${k}`, 130 + k * 150, base, cw)).join("")}
${[0, 1, 2, 3].map((k) => `<div class="a nb nb${k}" style="left:${130 + k * 150 + 30}px;top:${base - 70}px;width:54px;height:54px;border-radius:50%;background:${C.ink};color:#0E1116;font-size:32px;font-weight:800;display:flex;align-items:center;justify-content:center;opacity:0">${k + 1}</div>`).join("")}
${BOX("bx", 790, 1150, 230, "")}
${CHG("bad", 850, 1110, 100, {defect: true, off: true})}
${BOXFRONT("bxf", 790, 1150, 230)}
<div class="a fc" style="left:770px;top:1400px;width:270px;text-align:center;font-size:30px;font-weight:700;color:${C.muted}">fora da conta</div>`;
	const js = `${helpers(id)}
tl.fromTo($(".m"),{opacity:.4,y:-20,filter:"blur(8px)"},{opacity:1,y:0,filter:"blur(0px)",duration:${d(8)}},0);
tl.fromTo([$(".sh"),$(".chg"),$(".bx"),$(".bxf")],{opacity:.4,y:30},{opacity:1,y:0,duration:${d(8)}},0);
tl.fromTo($(".num"),{color:"${C.ink}"},{color:"${C.y}",duration:${d(5)}},${t(wSis)});
${[0, 1, 2, 3].map((k) => `tl.fromTo($(".nb${k}"),{opacity:0,scale:.3},{opacity:1,scale:1,duration:${d(5)},ease:"back.out(3)"},${t(wTem + 2 + k * 4)});`).join("\n")}
tl.fromTo($(".fc"),{opacity:0},{opacity:1,duration:${d(6)}},${t(wTem)});
tl.to($(".bad"),{opacity:.55,duration:${d(6)}},${t(wTem)});
tl.to($(".eq"),{color:"${C.green}",scale:1.15,duration:${d(6)},ease:"back.out(2)"},${t(wVender)});
tl.fromTo($(".ok"),{opacity:0,scale:.3},{opacity:1,scale:1,duration:${d(7)},ease:"back.out(3)"},${t(wVerd)});
window.__timelines["${id}"]=tl;`;
	return {html, js};
});

/* ===== S13 — nada se perde, nada se mistura (p13) ===== */
scene(13, ({id, t, d}) => {
	const L = "p13";
	const wConf = W(L, "confiavel"), wNada1 = W(L, "nada"), wPerde = W(L, "perde"), wNada2 = W(L, "nada", 1), wMist = W(L, "mistura");
	for (let k = 0; k < 5; k++) sfx(wPerde + k * 3, "tick.wav", 0.25, `conta ${k + 1}`);
	sfx(wMist - 2, "whoosh.wav", 0.4, "separa");
	sfx(wMist + 10, "thud.wav", 0.5, "na caixa");
	const cw = 110;
	const pos = [[270, 820], [400, 780], [530, 830], [660, 790], [470, 940]]; // cluster; index 4 = defective
	const html = `<div class="a k" style="left:60px;top:420px;width:960px;text-align:center;font-size:44px;font-weight:700;color:${C.muted}">Confiável é isso:</div>
<div class="a l1" style="left:60px;top:500px;width:960px;text-align:center;font-size:84px;font-weight:800;letter-spacing:-0.02em">nada se perde,</div>
<div class="a l2" style="left:60px;top:610px;width:960px;text-align:center;font-size:84px;font-weight:800;letter-spacing:-0.02em;color:${C.y}">nada se mistura.</div>
${SHELF("sh", 60, 1130, 520, 220, "à venda")}
${BOX("bx", 720, 1140, 260, "separado")}
${pos.map(([x, y], k) => CHG(`c${k}`, x, y, cw, k === 4 ? {defect: true, off: true} : {})).join("")}
${pos.slice(0, 4).map(([x, y], k) => `<div class="a ck ck${k}" style="left:${x + 30}px;top:${y - 60}px;width:50px;height:50px;border-radius:50%;background:${C.green};color:#0E1116;font-size:32px;font-weight:800;display:flex;align-items:center;justify-content:center;opacity:0">✓</div>`).join("")}
${BOXFRONT("bxf", 720, 1140, 260)}`;
	const baseShelf = 1324 - chgH(cw);
	const targets = [[90, baseShelf], [210, baseShelf], [330, baseShelf], [450, baseShelf]];
	const js = `${helpers(id)}
tl.fromTo($(".k"),{opacity:0,y:16},{opacity:1,y:0,duration:${d(7)}},${t(wConf)});
tl.fromTo($(".chg"),{opacity:.3,scale:.85},{opacity:1,scale:1,duration:${d(9)},stagger:${d(1)},ease:"back.out(2)"},0);
tl.fromTo([$(".sh"),$(".bx"),$(".bxf")],{opacity:0},{opacity:1,duration:${d(8)}},0);
tl.fromTo($(".l1"),{opacity:0,y:30,filter:"blur(8px)"},{opacity:1,y:0,filter:"blur(0px)",duration:${d(8)}},${t(wNada1)});
${[0, 1, 2, 3].map((k) => `tl.fromTo($(".ck${k}"),{opacity:0,scale:.3},{opacity:1,scale:1,duration:${d(5)},ease:"back.out(3)"},${t(wPerde + k * 3)});`).join("\n")}
tl.fromTo($(".l2"),{opacity:0,y:30,filter:"blur(8px)"},{opacity:1,y:0,filter:"blur(0px)",duration:${d(8)}},${t(wNada2)});
${targets.map(([x, y], k) => `tl.to([$(".c${k}")],{x:${x - pos[k][0]},y:${y - pos[k][1]},duration:${d(12)},ease:"power3.inOut"},${t(wMist - 2)});tl.to($(".ck${k}"),{x:${x - pos[k][0]},y:${y - pos[k][1]},opacity:0,duration:${d(12)},ease:"power3.inOut"},${t(wMist - 2)});`).join("\n")}
tl.to($(".c4"),{x:${790 - pos[4][0]},y:${1180 - pos[4][1]},duration:${d(12)},ease:"power3.inOut"},${t(wMist - 2)});
window.__timelines["${id}"]=tl;`;
	return {html, js};
});

/* ===== S14 — fecho com a logo (p14) ===== */
scene(14, ({id, t, d, start}) => {
	const L = "p14";
	const wAlvo = W(L, "alvomanage"), wTroca = W(L, "troca"), wEst = W(L, "estoque");
	sfx(Math.max(start + 1, wAlvo - 1), "chord.wav", 0.6, "acorde logo");
	sfx(wTroca, "pop.wav", 0.3, "Troca certa");
	sfx(wEst, "pop.wav", 0.3, "Estoque certo");
	const lw = 800, lh = Math.round((lw * 177) / 894);
	const html = `<div class="a glow" style="left:90px;top:520px;width:900px;height:640px;border-radius:50%;background:radial-gradient(closest-side,rgba(59,111,240,.22),rgba(59,111,240,0))"></div>
<img class="a lg" src="assets/img/logo-claro.png" alt="AlvoManage" style="left:${(1080 - lw) / 2}px;top:700px;width:${lw}px;height:${lh}px;filter:drop-shadow(0 2px 8px rgba(0,0,0,.5))">
<div class="a t1" style="left:60px;top:980px;width:960px;text-align:center;font-size:76px;font-weight:800;letter-spacing:-0.02em">Troca certa.</div>
<div class="a t2" style="left:60px;top:1080px;width:960px;text-align:center;font-size:76px;font-weight:800;letter-spacing:-0.02em;color:${C.y}">Estoque certo.</div>
<div class="a url" style="left:60px;top:1240px;width:960px;text-align:center;font-size:40px;font-weight:600;color:${C.muted}">app.alvomanage.com</div>`;
	const js = `${helpers(id)}
tl.fromTo($(".lg"),{opacity:0,scale:.88,filter:"blur(14px)"},{opacity:1,scale:1,filter:"blur(0px)",duration:${d(14)},ease:"power3.out"},0);
tl.fromTo($(".glow"),{opacity:0,scale:.7},{opacity:1,scale:1,duration:${d(30)},ease:"power2.out"},0);
tl.fromTo($(".t1"),{opacity:0,y:30},{opacity:1,y:0,duration:${d(8)},ease:"power2.out"},${t(wTroca)});
tl.fromTo($(".t2"),{opacity:0,y:30},{opacity:1,y:0,duration:${d(8)},ease:"power2.out"},${t(wEst)});
tl.fromTo($(".url"),{opacity:0},{opacity:1,duration:${d(10)}},${t(wEst + 18)});
window.__timelines["${id}"]=tl;`;
	return {html, js};
});

/* ---------------- breath cues: never a dry cut ---------------- */
for (let i = 1; i < STARTS.length; i++) {
	const f = STARTS[i] - 1;
	if (cues.some((c) => Math.abs(c.frame - f) <= 6)) continue;
	sfx(f, "whoosh-soft.wav", 0.4, `corte ${i + 1}`);
}
cues.sort((a, b) => a.frame - b.frame);

/* ---------------- music lane: +2 dB vs video 1, ducked under the voice ---------------- */
const MUSIC = +(0.32 * 1.26).toFixed(3); // video 1 peak 0.32, +2 dB
const DUCK = +(MUSIC * 0.35).toFixed(3);
const pts = [];
const push = (f, v) => pts.push({t: sec(f), v});
// Under the voice the bed sits at 35%; in each 12-frame breath it swells back
// (triangle up to 75% of full) so the breath is never dry; full after the last line.
push(0, DUCK);
for (const [i, l] of NAR.lines.entries()) {
	const e = l.frame + l.durationInFrames;
	if (i > 0) push(l.frame, DUCK);
	push(e, DUCK);
	const next = NAR.lines[i + 1];
	if (next) push(Math.min(e + 6, next.frame - 3), +(MUSIC * 0.75).toFixed(3));
	else push(e + 8, MUSIC);
}
push(TOTAL - 24, MUSIC);
push(TOTAL, 0);
// drop duplicate times
const lane = pts.filter((p, k) => k === 0 || p.t > pts[k - 1].t);

/* ---------------- write files ---------------- */
for (const s of scenes) {
	const html = `<!doctype html>
<html lang="pt-BR">
<head><meta charset="UTF-8" /><title>${s.id}</title></head>
<body>
<template>
<style>
${baseCss(s.id)}
</style>
<div id="${s.id}" data-composition-id="${s.id}" data-width="1080" data-height="1920" data-duration="${sec(s.end - s.start)}">
${s.html}
</div>
<script>
(() => {
${s.js}
})();
</script>
</template>
</body>
</html>
`;
	fs.writeFileSync(`${ROOT}compositions/${s.id}.html`, html);
}

const hosts = scenes.map((s) => `      <div id="host-${s.id}" class="clip scene" data-composition-id="${s.id}" data-composition-src="compositions/${s.id}.html" data-start="${sec(s.start)}" data-duration="${sec(s.end - s.start)}" data-track-index="0" data-width="1080" data-height="1920"></div>`).join("\n");
const voices = NAR.lines.map((l) => `      <audio id="vo-${l.id}" src="assets/audio/vo/${l.file}" data-start="${sec(l.frame)}" data-duration="${l.duration_s}" data-track-index="2" data-volume="1"></audio>`).join("\n");
// Effect durations from the wav headers; overlapping effects go to separate lanes (tracks 4..).
const wavLen = (f) => +((fs.statSync(`${ROOT}assets/audio/${f}`).size - 44) / (SR_OUT * 4)).toFixed(3);
const laneEnd = [];
const sfxTags = cues.map((c, k) => {
	const dur = wavLen(c.file);
	const st = sec(c.frame);
	let lane = laneEnd.findIndex((e) => e <= st);
	if (lane < 0) { lane = laneEnd.length; laneEnd.push(0); }
	laneEnd[lane] = st + dur + 0.01;
	return `      <audio id="fx-${String(k + 1).padStart(2, "0")}" src="assets/audio/${c.file}" data-start="${st}" data-duration="${dur}" data-track-index="${4 + lane}" data-volume="${c.vol}" data-label="${c.name}"></audio>`;
}).join("\n");

const index = `<!doctype html>
<html lang="pt-BR" data-resolution="portrait">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1080, height=1920" />
    <title>AlvoManage 3 — Troca certa, estoque certo</title>
    <!-- GENERATED by tools/build.mjs — edit the builder, not this file -->
    <script src="assets/gsap.min.js"></script>
    <style>
${FONT_FACES}
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { margin: 0; width: 1080px; height: 1920px; overflow: hidden; background: #0E1116; }
      #root { position: relative; width: 100%; height: 100%; overflow: hidden; background: #0E1116; font-family: "Inter", sans-serif; }
      #bg { position: absolute; inset: 0; background: radial-gradient(120% 70% at 50% 35%, #18202C 0%, #0E1116 60%, #0A0C10 100%); }
      .scene { position: absolute; inset: 0; z-index: 1; }
      #corner-logo { position: absolute; left: 64px; top: 250px; width: 210px; height: ${Math.round((210 * 177) / 894)}px; opacity: 0.92; filter: drop-shadow(0 1px 4px rgba(0, 0, 0, 0.55)); z-index: 50; }
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="${sec(TOTAL)}" data-width="1080" data-height="1920">
      <div id="bg" class="clip" data-start="0" data-duration="${sec(TOTAL)}" data-track-index="9"></div>
${hosts}
      <img id="corner-logo" class="clip" src="assets/img/logo-claro.png" alt="AlvoManage" data-start="0" data-duration="${sec(TOTAL)}" data-track-index="1" />
${voices}
      <audio id="music" src="assets/audio/score.wav" data-start="0" data-duration="${sec(TOTAL)}" data-track-index="3" data-volume="1"
        data-automation='${JSON.stringify({version: 1, lanes: [{target: "volume", points: lane}]})}'></audio>
${sfxTags}
    </div>
    <script>
      const tl = gsap.timeline({ paused: true });
      window.__timelines["main"] = tl;
    </script>
  </body>
</html>
`;
fs.writeFileSync(ROOT + "index.html", index);
fs.writeFileSync(ROOT + "cues.json", JSON.stringify({total: TOTAL, starts: STARTS, ends: ENDS, cues, lane}, null, 1));
console.log("scenes", scenes.map((s) => `${s.id} ${s.start}-${s.end}`).join(" | "));
console.log("total frames", TOTAL, "=", sec(TOTAL), "s;", cues.length, "sfx cues");
void LEN;
