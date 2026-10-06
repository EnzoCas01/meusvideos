// Grava a tela do navegador enquanto ele navega pelo sistema (mouse sempre andando, rolagem suave, sidebar abrindo).
// Uso: node tools/browser-record.mjs [--clipes=painel,os,link-celular,produtos,clientes] [--out=public/images/alvomanage/videos]
// Cada clipe vira <clipe>_<data>.mp4, sem sobrescrever os anteriores. Precisa do ffmpeg no PATH.
// Credenciais vêm do .env (SISTEMA_URL, SISTEMA_USER, SISTEMA_PASS). Só navega: nunca clica em Copiar, Confirmar, Limpar, Criar ou Excluir.
import { readFileSync, mkdirSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const puppeteer = require('puppeteer');
const env = Object.fromEntries(
  readFileSync(new URL('../.env', import.meta.url), 'utf8')
    .split(/\r?\n/)
    .filter((l) => /^[A-Z_]+=/.test(l))
    .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]),
);
const arg = (n, d) => process.argv.find((a) => a.startsWith(`--${n}=`))?.split('=')[1] ?? d;
const out = arg('out', 'public/images/alvomanage/videos');
const clipes = arg('clipes', 'painel,os,link-celular,produtos,clientes').split(',');
const base = (env.SISTEMA_URL || 'https://app.alvomanage.com').replace(/\/$/, '');
const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
mkdirSync(out, { recursive: true });
if (!env.SISTEMA_USER || !env.SISTEMA_PASS) {
  console.error('FALTA: SISTEMA_USER e SISTEMA_PASS no .env');
  process.exit(1);
}

// seta de mouse que se reinsere sozinha (sobrevive a recarga e aba nova)
const CUR = () => {
  if (window.__cur && document.body && document.body.contains(window.__cur)) return;
  if (!document.body) return;
  const svg =
    "<svg xmlns='http://www.w3.org/2000/svg' width='28' height='40' viewBox='0 0 28 40'><path d='M2 2 L2 31 L9 24 L14 36 L19 34 L14 22 L24 22 Z' fill='white' stroke='black' stroke-width='2' stroke-linejoin='round'/></svg>";
  const c = document.createElement('div');
  c.style.cssText =
    'position:fixed;left:' + (window.__mx || 600) + 'px;top:' + (window.__my || 400) +
    'px;z-index:2147483647;pointer-events:none;width:28px;height:40px;background:url("data:image/svg+xml;utf8,' +
    encodeURIComponent(svg) + '") no-repeat;filter:drop-shadow(2px 3px 3px rgba(0,0,0,.5));transform-origin:2px 2px';
  document.body.appendChild(c);
  window.__cur = c;
  if (!window.__curL) {
    window.__curL = 1;
    document.addEventListener('mousemove', (e) => {
      window.__mx = e.clientX; window.__my = e.clientY;
      if (window.__cur) { window.__cur.style.left = e.clientX + 'px'; window.__cur.style.top = e.clientY + 'px'; }
    }, true);
  }
};
const setup = (pg) =>
  pg.evaluateOnNewDocument(`(${CUR.toString()})();window.addEventListener('DOMContentLoaded',()=>{(${CUR.toString()})()});setInterval(()=>{(${CUR.toString()})()},500);`);

const b = await puppeteer.launch({ headless: false, defaultViewport: null, args: ['--start-maximized'] });
const p = (await b.pages())[0] ?? (await b.newPage());
await setup(p);

const glide = async (pg, x, y, steps = 45) => { await pg.mouse.move(x, y, { steps }); };
const center = async (h) => { const bx = await h.asElement()?.boundingBox(); return bx && { x: bx.x + bx.width / 2, y: bx.y + bx.height / 2 }; };
const hover = async (pg, fn, arg2) => {
  const h = await pg.evaluateHandle(fn, arg2);
  const c = await center(h);
  if (c) await glide(pg, c.x, c.y, 40);
  return c;
};
// espera mexendo o mouse em arcos curtos: a tela nunca fica parada
const idle = async (pg, ms, box = { x: 450, y: 250, w: 600, h: 300 }) => {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    await pg.mouse.move(box.x + Math.random() * box.w, box.y + Math.random() * box.h, { steps: 40 }).catch(() => {});
  }
};
// rolagem suave com a roda do mouse (rola o que estiver sob o cursor), em trechos com pausa curta
const ease = (v) => v * v * (3 - 2 * v);
const read = async (pg, { total = 1400, chunk = 300, pause = 700, box } = {}) => {
  for (let done = 0; done < total; done += chunk) {
    const n = 30;
    for (let i = 1; i <= n; i++) {
      await pg.mouse.wheel({ deltaY: chunk * (ease(i / n) - ease((i - 1) / n)) });
      await wait(16);
    }
    await idle(pg, pause, box);
  }
};
const readUp = async (pg, total = 6000, box) => {
  for (let i = 0; i < 40; i++) {
    await pg.mouse.wheel({ deltaY: -total / 40 });
    await wait(16);
  }
  await idle(pg, 600, box);
};

// procura, na sidebar, a folha de texto exatamente igual a t
const menuItem = (t) => {
  const els = [...document.querySelectorAll('aside *, nav *, a, button, span')].filter((e) => {
    const r = e.getBoundingClientRect();
    return e.children.length === 0 && e.innerText?.trim() === t && r.width > 0 && r.x < 400 && r.y > 50;
  });
  return els[0] ?? document.body;
};
// sidebar recolhida: leva o mouse devagar até a borda esquerda, espera abrir e passeia pelas abas
const menuTour = async (pg, labels = ['Ordens de Serviço', 'Produtos', 'Clientes', 'Financeiro']) => {
  await glide(pg, 20, 350, 60);
  await wait(1200);
  for (const l of labels) {
    const c = await hover(pg, menuItem, l);
    console.log('menu', l, c ? 'ok' : 'não achei');
    await wait(600);
  }
};
const abrir = async (pg, rota) => {
  await pg.goto(`${base}/administrativo/${rota}`, { waitUntil: 'networkidle2', timeout: 60000 }).catch(() => {});
  await wait(1500);
};
const menuClick = async (pg, label, subs, fallbackRoute) => {
  await menuTour(pg);
  const click = async (t) => {
    const c = await hover(pg, menuItem, t);
    if (c && c.x < 400) { await wait(400); await pg.mouse.click(c.x, c.y); await wait(1200); }
    return !!c;
  };
  await click(label);
  for (const s of subs) await click(s);
  await pg.waitForNetworkIdle({ idleTime: 800, timeout: 15000 }).catch(() => {});
  if (!pg.url().includes(fallbackRoute)) {
    console.log('DIFICULDADE: menu não levou a', fallbackRoute, '- estou em', pg.url(), '- uso goto');
    await abrir(pg, fallbackRoute);
  }
  await glide(pg, 700, 350, 50);
  await wait(800);
};

const gravar = async (pg, nome, fn) => {
  let arquivo = `${out}/${nome}_${stamp}.mp4`;
  for (let i = 2; existsSync(arquivo); i++) arquivo = `${out}/${nome}_${stamp}_${i}.mp4`;
  const rec = await pg.screencast({ path: arquivo });
  try { await fn(); await wait(800); } finally { await rec.stop(); }
  console.log('gravado', arquivo);
};
const hideCaixa = (pg) =>
  pg.evaluate(() => { // só esconde o aviso na tela (não altera dados)
    [...document.querySelectorAll('div,span,p,button')]
      .filter((e) => /Caixa [Ff]echado/.test(e.innerText) && e.innerText.length < 120 && e.children.length < 4)
      .forEach((e) => { e.style.visibility = 'hidden'; });
  }).catch(() => {});

// login (não gravado)
await p.goto(`${base}/auth/login`, { waitUntil: 'networkidle2' });
await p.evaluate(() => [...document.querySelectorAll('button')].find((x) => /Apenas Essenciais/.test(x.innerText))?.click());
await wait(3000);
await p.type('input[type=email]', env.SISTEMA_USER, { delay: 40 });
await p.type('input[type=password]', env.SISTEMA_PASS, { delay: 40 });
await Promise.all([
  p.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {}),
  p.evaluate(() => [...document.querySelectorAll('button[type=submit]')].find((x) => x.innerText.trim() === 'Entrar')?.click()),
]);
await wait(3000);
await p.mouse.move(600, 400, { steps: 20 });

let linkCliente = null;
const falhas = [];
const tente = async (nome, fn) => {
  try { await fn(); } catch (e) { falhas.push(nome); console.error('DIFICULDADE em', nome, ':', e.message); }
};

if (clipes.includes('painel')) await tente('painel', async () => {
  await abrir(p, 'os/historico');
  await gravar(p, 'painel', async () => {
    await menuClick(p, 'Ordens de Serviço', ['Painel', 'Gerenciar O.S'], 'os/dashboard');
    await hideCaixa(p);
    await wait(500);
    await hover(p, () => [...document.querySelectorAll('div,button')].find((e) => /Em Andamento/.test(e.innerText) && e.innerText.length < 40) ?? document.body);
    await idle(p, 1200);
    await hover(p, () => [...document.querySelectorAll('button')].find((e) => /Criar ordem/.test(e.innerText)) ?? document.body); // só passa por cima
    await idle(p, 1200);
    await read(p, { total: 600 });
    await readUp(p);
  });
});

if (clipes.includes('os') || clipes.includes('link-celular')) await tente('os', async () => {
  await abrir(p, 'os/dashboard');
  await gravar(p, 'os', async () => {
    await menuClick(p, 'Ordens de Serviço', ['Histórico', 'Ordens de Serviço'], 'os/historico');
    await idle(p, 1000);
    for (const t of ['Visualizar', 'Imprimir', 'Copiar link']) {
      // só passa o mouse nos ícones da primeira linha; não clica em copiar/imprimir
      await hover(p, (title) => {
        const tr = [...document.querySelectorAll('tr')].find((x) => /^#\d+/.test(x.innerText.trim()));
        return tr?.querySelector(`[title="${title}"]`) ?? tr;
      }, t);
      await idle(p, 700, { x: 900, y: 200, w: 120, h: 60 });
    }
    const c = await hover(p, () => {
      const tr = [...document.querySelectorAll('tr')].find((x) => x.innerText.trim().startsWith('#13'));
      return tr?.querySelector('button[title="Visualizar"]');
    });
    await wait(500);
    if (c) await p.mouse.click(c.x, c.y);
    await p.waitForNetworkIdle({ idleTime: 1000, timeout: 15000 }).catch(() => {});
    await wait(1200);
    linkCliente = await p.evaluate(() => document.body.innerText.match(/https?:\/\/\S*acompanhar\/[0-9a-f-]{36}/)?.[0] ?? null);
    console.log('link de acompanhamento', linkCliente ? 'encontrado' : 'NÃO encontrado');
    // faixa LINK DO CLIENTE: passa o mouse sobre Copiar e Ver, sem clicar
    await hover(p, () => [...document.querySelectorAll('*')].find((x) => x.children.length === 0 && /LINK DO CLIENTE/i.test(x.innerText || '')) ?? document.body);
    await idle(p, 1000, { x: 400, y: 120, w: 500, h: 40 });
    await hover(p, () => [...document.querySelectorAll('button')].find((x) => x.innerText.trim() === 'Copiar') ?? document.body); // só hover
    await idle(p, 900, { x: 1050, y: 120, w: 120, h: 30 });
    await hover(p, () => [...document.querySelectorAll('button')].find((x) => x.innerText.trim() === 'Ver') ?? document.body);
    await idle(p, 1200, { x: 1150, y: 120, w: 100, h: 30 });
    await read(p, { total: 1200 });
    await readUp(p);
  });
});

if (clipes.includes('link-celular')) await tente('link-celular', async () => {
  if (!linkCliente) { console.log('DIFICULDADE: sem URL do link do cliente; pulando link-celular'); return; }
  const m = await b.newPage();
  await setup(m);
  await m.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await m.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1');
  await m.goto(linkCliente, { waitUntil: 'networkidle2', timeout: 60000 });
  await wait(1500);
  const box = { x: 60, y: 200, w: 260, h: 400 };
  await m.mouse.move(200, 300);
  await gravar(m, 'link-celular', async () => {
    await idle(m, 2500, box); // topo: status e etapas
    await read(m, { total: 1500, chunk: 500, pause: 500, box });
    await readUp(m, 2000, box);
    await idle(m, 2000, box); // termina de volta no topo
  });
  await m.close();
});

for (const [clipe, rota, label] of [['produtos', 'produtos', 'Produtos'], ['clientes', 'cadastro/clientes', 'Clientes']]) {
  if (!clipes.includes(clipe)) continue;
  await tente(clipe, async () => {
    await abrir(p, 'os/dashboard');
    await gravar(p, clipe, async () => {
      await menuClick(p, label, [label], rota);
      await idle(p, 1200);
      await read(p, { total: 700 });
      await readUp(p);
    });
  });
}
if (falhas.length) {
  console.error('FALHARAM:', falhas.join(','), '- janela aberta por 20 s');
  await p.screenshot({ path: `${out}/_erro_${stamp}.png` }).catch(() => {});
}
await wait(20000);
await b.close();
process.exit(0);
