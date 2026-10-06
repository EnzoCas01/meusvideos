// Abre o sistema em um Chrome visível, passa o mouse pelas abas e tira um print de cada uma.
// Uso: node tools/browser-tour.mjs --rotas=os/dashboard,produtos --out=public/images/alvomanage [--hd] [--zoom=1]
//   --rotas  rotas depois de /administrativo/ (separadas por vírgula); omitido = todas as do menu
//   --out    acervo dos prints (padrão public/images/alvomanage): <rota>.png, historico/, manifest.json e clicks.json
//   --hd     modo invisível 1920x1080 em resolução dobrada (para recortes com zoom no vídeo)
//   --zoom   zoom da página (padrão 1 = tamanho normal do Chrome)
// Credenciais vêm do .env: SISTEMA_URL, SISTEMA_USER, SISTEMA_PASS. Só navega, nunca cria nem altera nada.
import { readFileSync, mkdirSync, writeFileSync, existsSync, renameSync } from 'node:fs';
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
const hd = process.argv.includes('--hd');
const zoom = Number(arg('zoom', 1));
const out = arg('out', 'public/images/alvomanage');
const base = (env.SISTEMA_URL || 'https://app.alvomanage.com').replace(/\/$/, '');
if (!env.SISTEMA_USER || !env.SISTEMA_PASS) {
  console.error('FALTA: SISTEMA_USER e SISTEMA_PASS no .env');
  process.exit(1);
}

const ALL = ('cadastro/fornecedores cadastro/funcionarios cadastro/clientes vendas/pdv produtos vendas/devolucao ' +
  'os/dashboard os/orcamentos os/historico os/agendamento estoque/movimentacoes estoque/ajuste ' +
  'estoque/transferencias estoque/cotacao estoque/pedidos estoque/trocas financeiro/caixa financeiro/pagar ' +
  'financeiro/receber financeiro/contas financeiro/credito-loja financeiro/plano-contas financeiro/fluxo-caixa ' +
  'financeiro/formas-pagamento whatsapp pagina configuracao/meu-plano configuracao/usuarios ' +
  'configuracao/dados-empresa configuracao/marca-empresa configuracao/loja configuracao/situacoes configuracao/gerais').split(' ');
const rotas = arg('rotas', '') ? arg('rotas').split(',') : ALL;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

mkdirSync(`${out}/historico`, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const manifestPath = `${out}/manifest.json`;
const manifest = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')) : [];
const b = await puppeteer.launch({
  headless: hd ? 'new' : false,
  defaultViewport: hd ? { width: 1920, height: 1080, deviceScaleFactor: 2 } : null,
  args: hd ? [] : ['--start-maximized'],
});
const p = await b.newPage();
await p.evaluateOnNewDocument((z) => {
  window.addEventListener('DOMContentLoaded', () => {
    if (z !== 1) {
      const s = document.createElement('style');
      s.textContent = `html{zoom:${z}}`;
      document.head.appendChild(s);
    }
    const svg =
      "<svg xmlns='http://www.w3.org/2000/svg' width='28' height='40' viewBox='0 0 28 40'><path d='M2 2 L2 31 L9 24 L14 36 L19 34 L14 22 L24 22 Z' fill='white' stroke='black' stroke-width='2' stroke-linejoin='round'/></svg>";
    const c = document.createElement('div');
    c.style.cssText =
      'position:fixed;z-index:2147483647;pointer-events:none;width:28px;height:40px;background:url("data:image/svg+xml;utf8,' +
      encodeURIComponent(svg) +
      '") no-repeat;filter:drop-shadow(2px 3px 3px rgba(0,0,0,.5));transition:transform .08s;transform-origin:2px 2px';
    document.body.appendChild(c);
    document.addEventListener('mousemove', (e) => { c.style.left = e.clientX + 'px'; c.style.top = e.clientY + 'px'; }, true);
    document.addEventListener('mousedown', () => { c.style.transform = 'scale(.8)'; }, true);
    document.addEventListener('mouseup', () => { c.style.transform = 'scale(1)'; }, true);
  });
}, zoom);

await p.goto(`${base}/auth/login`, { waitUntil: 'networkidle2', timeout: 60000 });
await p.evaluate(() => [...document.querySelectorAll('button')].find((x) => /Apenas Essenciais/.test(x.innerText))?.click());
await wait(3000);
await p.waitForSelector('input[type=email]');
await p.type('input[type=email]', env.SISTEMA_USER, { delay: 40 });
await p.type('input[type=password]', env.SISTEMA_PASS, { delay: 40 });
await Promise.all([
  p.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 }).catch(() => {}),
  p.evaluate(() => [...document.querySelectorAll('button[type=submit]')].find((x) => x.innerText.trim() === 'Entrar')?.click()),
]);
await wait(3000);

const clicks = [];
await p.mouse.move(700, 450);
for (const r of rotas) {
  const href = `/administrativo/${r}`;
  const link = await p.$(`a[href="${href}"]`);
  if (link) await link.evaluate((e) => e.scrollIntoView({ block: 'center' }));
  const box = link && (await link.boundingBox());
  if (box) {
    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;
    await p.mouse.move(x, y, { steps: 35 });
    await wait(400);
    clicks.push({ rota: r, x, y, w: box.width, h: box.height });
    await p.mouse.click(x, y);
    await p.waitForNetworkIdle({ idleTime: 800, timeout: 15000 }).catch(() => {});
  }
  if (!p.url().endsWith(href)) {
    await p.goto(base + href, { waitUntil: 'networkidle2', timeout: 60000 }).catch(() => {});
  }
  await wait(2000);
  const nome = `${r.replace(/\//g, '_')}.png`;
  const alvo = `${out}/${nome}`;
  // nunca sobrescreve: a versão anterior vai para historico/ com a data
  if (existsSync(alvo)) renameSync(alvo, `${out}/historico/${nome.replace('.png', '')}_${stamp}.png`);
  await p.screenshot({ path: alvo });
  manifest.push({ arquivo: nome, rota: r, url: p.url(), data: new Date().toISOString(), modo: hd ? 'hd' : 'normal', zoom });
  console.log('ok', r, '|', p.url());
}
writeFileSync(`${out}/manifest.json`, JSON.stringify(manifest, null, 2));
writeFileSync(`${out}/clicks.json`, JSON.stringify(clicks, null, 2));
await b.close();
