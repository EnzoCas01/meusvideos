// TEMPORARIO - sondagem de candidatos no Wikimedia Commons. Apagar ao terminar.
const consultas = process.argv.slice(2);
const dorme = (ms) => new Promise((r) => setTimeout(r, ms));

const busca = async (q) => {
	const u = new URL("https://commons.wikimedia.org/w/api.php");
	u.search = new URLSearchParams({
		action: "query", generator: "search", gsrsearch: `${q} filetype:video`, gsrnamespace: "6",
		gsrlimit: "30", prop: "imageinfo", iiprop: "url|size|mime|mediatype|extmetadata", format: "json",
	});
	for (let t = 0; t < 4; t++) {
		const r = await fetch(u, {headers: {"user-agent": "meusvideos/1.0"}, signal: AbortSignal.timeout(30000)});
		const txt = await r.text();
		if (txt.startsWith("{")) return JSON.parse(txt);
		await dorme(8000 * (t + 1));
	}
	throw new Error("rate limit");
};

for (const q of consultas) {
	let d;
	try {
		d = await busca(q);
	} catch (e) {
		console.log(`## ${q} -> ERRO ${e.message}`);
		continue;
	}
	const cand = Object.values(d.query?.pages ?? {})
		.map((p) => ({t: p.title, i: p.imageinfo?.[0]}))
		.filter((x) => x.i?.mediatype === "VIDEO")
		.filter((x) => Math.max(x.i.width, x.i.height) >= 1280)
		.filter((x) => !x.i.duration || x.i.duration <= 45)
		.map((x) => `${x.i.width}x${x.i.height} ${(x.i.duration ?? 0).toFixed(1)}s ${x.t.slice(5, 80)}`);
	console.log(`## ${q} -> ${cand.length}`);
	for (const c of cand.slice(0, 10)) console.log("   " + c);
	await dorme(7000);
}
