import { readFileSync, mkdirSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
export const puppeteer = require('puppeteer');
export const env = Object.fromEntries(readFileSync(new URL('../.env', import.meta.url), 'utf8').split(/\r?\n/).filter((l) => /^[A-Z_]+=/.test(l)).map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]));
export const base = (env.SISTEMA_URL || 'https://app.alvomanage.com').replace(/\/$/, '');
export const wait = (ms) => new Promise((r) => setTimeout(r, ms));
export const IMG = 'public/images/alvomanage';
export const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');

const CUR = () => {
  if (window.__cur && document.body && document.body.contains(window.__cur)) return;
  if (!document.body) return;
  const svg = "<svg xmlns='http://www.w3.org/2000/svg' width='28' height='40' viewBox='0 0 28 40'><path d='M2 2 L2 31 L9 24 L14 36 L19 34 L14 22 L24 22 Z' fill='white' stroke='black' stroke-width='2' stroke-linejoin='round'/></svg>";
  const c = document.createElement('div');
  c.style.cssText = 'position:fixed;left:' + (window.__mx || 600) + 'px;top:' + (window.__my || 400) + 'px;z-index:2147483647;pointer-events:none;width:28px;height:40px;background:url("data:image/svg+xml;utf8,' + encodeURIComponent(svg) + '") no-repeat;filter:drop-shadow(2px 3px 3px rgba(0,0,0,.5));';
  document.body.appendChild(c);
  window.__cur = c;
  if (!window.__curL) {
    window.__curL = 1;
    document.addEventListener('mousemove', (e) => { window.__mx = e.clientX; window.__my = e.clientY; if (window.__cur) { window.__cur.style.left = e.clientX + 'px'; window.__cur.style.top = e.clientY + 'px'; } }, true);
  }
};
export const setup = async (pg) => {
  await pg.bringToFront().catch(() => {});
  const cs = await pg.createCDPSession(); await cs.send('Emulation.setFocusEmulationEnabled', { enabled: true }).catch(() => {});
  const code = `(${CUR.toString()})();window.addEventListener('DOMContentLoaded',()=>{(${CUR.toString()})()});setInterval(()=>{(${CUR.toString()})()},400);`;
  await pg.evaluateOnNewDocument(code);
  await pg.evaluate(code).catch(() => {});
};
export const connect = async () => {
  const b = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9333', defaultViewport: null });
  const pages = (await b.pages()).filter((x) => !x.url().startsWith('devtools'));
  return { b, pages };
};
export const breathe = async (pg, ms) => {
  const [x0, y0] = await pg.evaluate(() => [window.__mx || 600, window.__my || 400]).catch(() => [600, 400]);
  const t0 = Date.now(); let k = 0;
  while (Date.now() - t0 < ms) { k++; await pg.mouse.move(x0 + Math.sin(k / 3) * 14, y0 + Math.cos(k / 4) * 8, { steps: 2 }).catch(() => {}); await wait(40); }
};
export const breatheUntil = async (pg, promise, max = 15000) => {
  let done = false; promise.then(() => { done = true; }, () => { done = true; });
  const t0 = Date.now();
  while (!done && Date.now() - t0 < max) await breathe(pg, 150);
};
export const glide = (pg, x, y, steps = 18) => pg.mouse.move(x, y, { steps });
export const center = async (h) => { const bx = await h.asElement()?.boundingBox(); return bx && { x: bx.x + bx.width / 2, y: bx.y + bx.height / 2, bbox: bx }; };
export const idle = async (pg, ms, box = { x: 450, y: 250, w: 600, h: 300 }) => {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) await pg.mouse.move(box.x + Math.random() * box.w, box.y + Math.random() * box.h, { steps: 10 }).catch(() => {});
};
const ease = (v) => v * v * (3 - 2 * v);
// rola a pagina suavemente com a roda, mouse sempre em movimento leve
export const read = async (pg, { total = 1400, chunk = 250, box = { x: 450, y: 250, w: 600, h: 300 } } = {}) => {
  for (let done = 0; done < total; done += chunk) {
    const n = 8;
    for (let i = 1; i <= n; i++) {
      await pg.mouse.wheel({ deltaY: chunk * (ease(i / n) - ease((i - 1) / n)) });
      if (i % 2 === 0) await pg.mouse.move(box.x + Math.random() * box.w, box.y + Math.random() * box.h, { steps: 2 }).catch(() => {});
      await wait(50);
    }
  }
};
export const readUp = async (pg, total = 3000) => {
  for (let i = 0; i < 10; i++) { await pg.mouse.wheel({ deltaY: -total / 10 }); await pg.mouse.move(500 + i * 20, 300 + (i % 3) * 40, { steps: 2 }); await wait(60); }
};
export const login = async (p) => {
  await p.goto(`${base}/administrativo`, { waitUntil: 'networkidle2', timeout: 60000 }).catch(() => {});
  if (!p.url().includes('/auth/login')) return 'ja logado';
  await p.waitForSelector('input[type=email]', { timeout: 20000 });
  await wait(1500);
  await p.evaluate(() => [...document.querySelectorAll('button')].find((x) => /Apenas Essenciais/.test(x.innerText))?.click());
  await wait(3500);
  await p.waitForSelector('input[type=email]', { timeout: 20000 });
  await p.type('input[type=email]', env.SISTEMA_USER, { delay: 40 });
  await p.type('input[type=password]', env.SISTEMA_PASS, { delay: 40 });
  await p.evaluate(() => [...document.querySelectorAll('button[type=submit]')].find((x) => x.innerText.trim() === 'Entrar')?.click());
  await p.waitForFunction(() => !location.href.includes('/auth/login'), { timeout: 30000 }).catch(() => {});
  await wait(3000);
  return 'logou';
};
export const abrir = async (pg, rota) => { await pg.goto(`${base}/administrativo/${rota}`.replace(/\/$/, ''), { waitUntil: 'networkidle2', timeout: 60000 }).catch(() => {}); await wait(1500); };

// ---- menu lateral (expande ao passar o mouse na borda; rola em .sidebar-nav-scroll; itens ficam cobertos por "Sair" se nao rolar) ----
export const openMenu = async (pg) => { await glide(pg, 400, 300, 20); await glide(pg, 24, 330, 50); await breathe(pg, 700); };
const findItem = (t) => {
  const els = [...document.querySelectorAll('aside a, aside button')].filter((e) => { const s = [...e.querySelectorAll('span')].find((x) => x.children.length === 0 && x.innerText.trim() === t); return !!s && !e.closest('.border-t'); });
  const e = els[0]; if (!e) return null;
  const r = e.getBoundingClientRect(); const sc = document.querySelector('.sidebar-nav-scroll').getBoundingClientRect();
  return { x: r.x + r.width / 2, y: r.y + r.height / 2, top: sc.top, bottom: sc.bottom, href: e.getAttribute('href') };
};
export const menuReveal = async (pg, t) => {
  for (let k = 0; k < 80; k++) {
    const it = await pg.evaluate(findItem, t);
    if (!it) return null;
    if (it.y > it.top + 30 && it.y < it.bottom - 40) return it;
    const dir = it.y > it.bottom - 40 ? 1 : -1;
    await pg.mouse.move(110 + (k % 5) * 6, 300 + (k % 7) * 8, { steps: 3 });
    for (let i = 0; i < 6; i++) { await pg.mouse.wheel({ deltaY: dir * 14 }); await wait(16); }
  }
  return pg.evaluate(findItem, t);
};
export const menuScan = async (pg, labels, hold = 450) => {
  for (const l of labels) {
    const it = await menuReveal(pg, l);
    if (it) { await glide(pg, it.x, it.y, 30); await breathe(pg, hold); }
    console.log('menu scan', l, it ? 'ok' : 'nao achei');
  }
};
export const menuClick = async (pg, label) => {
  await openMenu(pg);
  const it = await menuReveal(pg, label);
  if (!it) { console.log('DIFICULDADE: item nao achado', label); return false; }
  await glide(pg, it.x, it.y, 40); await breathe(pg, 400);
  const ok = await pg.evaluate(([x, y]) => { const e = document.elementFromPoint(x, y); return !!e?.closest('aside a, aside button') && !e.closest('.border-t'); }, [it.x, it.y]);
  if (!ok) console.log('DIFICULDADE: item coberto', label);
  const before = pg.url();
  await pg.mouse.click(it.x, it.y);
  await breatheUntil(pg, pg.waitForFunction((u) => location.href !== u, { timeout: 8000 }, before), 9000);
  await breatheUntil(pg, pg.waitForNetworkIdle({ idleTime: 800, timeout: 15000 }), 15000);
  await breathe(pg, 600);
  console.log('menu click', label, '->', pg.url());
  return pg.url() !== before;
};
export const gravar = async (pg, nome, fn, dir = IMG + '/videos', sfx = '') => {
  mkdirSync(dir, { recursive: true });
  let arquivo = `${dir}/${nome}${sfx}_${stamp}.mp4`;
  for (let i = 2; existsSync(arquivo); i++) arquivo = `${dir}/${nome}${sfx}_${stamp}_${i}.mp4`;
  const rec = await pg.screencast({ path: arquivo });
  const t0 = Date.now();
  try { await fn(); } finally { await rec.stop(); }
  console.log('gravado', arquivo, ((Date.now() - t0) / 1000).toFixed(1) + 's');
  return arquivo;
};
