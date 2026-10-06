// Builds logo-alvomanage-claro.png from the real logo: only the near-black,
// colourless pixels ("Alvo") are pushed to white, proportionally to darkness
// and lack of saturation, so antialiased edges stay smooth. Alpha untouched.
// The yellow arrow and the blue "Manage" are saturated and fall outside.
import sharp from "sharp";
const SRC = "public/images/alvomanage/logo/logo-alvomanage.png";
const DST = "public/images/alvomanage/logo/logo-alvomanage-claro.png";
const {data, info} = await sharp(SRC).ensureAlpha().raw().toBuffer({resolveWithObject: true});
const clamp = (x) => Math.max(0, Math.min(1, x));
let changed = 0;
for (let i = 0; i < data.length; i += 4) {
	const r = data[i], g = data[i + 1], b = data[i + 2];
	const sat = Math.max(r, g, b) - Math.min(r, g, b);
	const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
	const w = clamp((200 - lum) / 150) * clamp(1 - (sat - 12) / 40);
	if (w <= 0) continue;
	changed++;
	data[i] = Math.round(r + (255 - r) * w);
	data[i + 1] = Math.round(g + (255 - g) * w);
	data[i + 2] = Math.round(b + (255 - b) * w);
}
await sharp(data, {raw: info}).png().toFile(DST);
console.log("changed px", changed, "->", DST);
