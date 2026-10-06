// Cleans the real AlvoManage screenshots for video 3 (never edits originals).
// Masks: recorded mouse cursors, the "Caixa Aberto" badge and the cash buttons
// (Sangria/Fechar Caixa + clock), the "Venda Nº1 não encontrada" error, and the
// tail of the defect line ("... Estoque > Trocas, pronta pro fornecedor").
//   node hf-alvomanage-3/tools/make-prints.mjs
import sharp from "sharp";
import fs from "node:fs";
const SRC = "public/images/alvomanage/";
const OUT = "hf-alvomanage-3/assets/img/";
fs.mkdirSync(OUT, {recursive: true});
const load = async (f) => {
	const {data, info} = await sharp(SRC + f).removeAlpha().raw().toBuffer({resolveWithObject: true});
	return {data, w: info.width, h: info.height};
};
const px = (im, x, y) => { const i = (y * im.w + x) * 3; return [im.data[i], im.data[i + 1], im.data[i + 2]]; };
const put = (im, x, y, c) => { const i = (y * im.w + x) * 3; im.data[i] = c[0]; im.data[i + 1] = c[1]; im.data[i + 2] = c[2]; };
// solid fill with the colour sampled at (sx, sy)
const fill = (im, [x0, y0, x1, y1], [sx, sy]) => { const c = px(im, sx, sy); for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) put(im, x, y, c); };
// horizontal smear: every row copies the pixel just outside the rect (left or right)
const smear = (im, [x0, y0, x1, y1], side = "left") => {
	for (let y = y0; y < y1; y++) { const c = px(im, side === "left" ? x0 - 1 : x1, y); for (let x = x0; x < x1; x++) put(im, x, y, c); }
};
// copy a rect from another image, scaled in brightness (modal backdrop dims to 50%)
const patch = (im, src, [x0, y0, x1, y1], k) => {
	for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) put(im, x, y, px(src, x, y).map((v) => Math.round(v * k)));
};
const save = (im, name) => sharp(im.data, {raw: {width: im.w, height: im.h, channels: 3}}).png().toFile(OUT + name);
const cashMasks = (im) => {
	fill(im, [134, 86, 236, 118], [300, 101]); // "Caixa Aberto" badge
	fill(im, [984, 84, 1330, 120], [1340, 101]); // Sangria/Reforço, Fechar Caixa, clock
};

const pdv = await load("troca_pdv_100b.png");
const pdvClean = await load("troca_pdv_100b.png");
smear(pdv, [596, 396, 632, 442], "left"); // recorded cursor in the cart
cashMasks(pdv);
await save(pdv, "pdv.png");

const modal = await load("troca_pdv_modal_100.png");
patch(modal, pdvClean, [818, 96, 856, 120], 0.5); // cursor over the Troca button (backdrop = 50%)
fill(modal, [824, 120, 856, 142], [815, 130]);
cashMasks(modal);
await save(modal, "pdv-modal.png");

const v1 = await load("troca_pdv_venda1_100.png");
fill(v1, [512, 344, 800, 370], [700, 358]); // "Venda Nº1 não encontrada" (before the test sale existed)
smear(v1, [800, 326, 840, 376], "left"); // cursor over Verificar
cashMasks(v1);
await save(v1, "pdv-venda1.png");

const form = await load("troca_form_100.png");
smear(form, [698, 298, 726, 342], "left");
fill(form, [352, 402, 800, 422], [1000, 412]); // keep only "Não volta pro estoque à venda"
await save(form, "form.png");

const busca = await load("troca_form_busca_100.png");
smear(busca, [722, 508, 754, 552], "right");
fill(busca, [352, 402, 800, 422], [1000, 412]);
await save(busca, "form-busca.png");

const fin = await load("troca_form_preenchida_100.png");
await save(fin, "form-fin.png");

const mov = await load("troca_mov_cabo_depois_100.png");
fill(mov, [1220, 380, 1260, 426], [1200, 400]);
await save(mov, "mov.png");
fs.copyFileSync("public/images/alvomanage/logo/logo-alvomanage-claro.png", OUT + "logo-claro.png");
console.log("ok");
