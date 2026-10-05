"""Caminho EDITORIAL de post/carrossel (chave "✨ Editorial" no painel). O clássico segue intocado no orquestrador-post.
Jev dirige numa chamada (sistema de cada versão, par tipográfico, modo, elemento flutuante, anotação, ênfase do título, tela)
→ monta.mjs compõe as 3 versões dentro do Brand Kit → critico.refina (render + crítica visual + Jev, máx. 2 ciclos)
→ slides/vN-slide-NN.png, no mesmo formato de entrega do clássico.
As 3 versões são ESTRATÉGIAS diferentes: V1 tela em destaque · V2 tipográfica · V3 camadas/cartões (mesma mensagem e fatos).
"""
import json
import re
import shutil
import subprocess
import tempfile
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[2]
FAMILIAS = [["SAAS_EDITORIAL", "FEATURE_SHOWCASE", "PRODUCT_EXPLAINER"], ["TIPOGRAFICO", "EDITORIAL_CLEAN"], ["CARDS_FLUTUANTES", "PROMOTIONAL"]]
FAMILIAS_SEM_VISUAL = [["EDITORIAL_CLEAN"], ["TIPOGRAFICO"], ["PROMOTIONAL", "DESTAQUE_NUMERO"]]
MIOLO = [["PRODUCT_EXPLAINER", "FEATURE_SHOWCASE", "EDITORIAL_CLEAN"], ["EDITORIAL_CLEAN", "TIPOGRAFICO"], ["CARDS_FLUTUANTES", "FEATURE_SHOWCASE", "PRODUCT_EXPLAINER"]]
MIOLO_SEM_VISUAL = [["EDITORIAL_CLEAN", "TIPOGRAFICO"], ["TIPOGRAFICO", "EDITORIAL_CLEAN"], ["EDITORIAL_CLEAN", "TIPOGRAFICO"]]
FLUTUANTES = {"metrica": "A small metric card (label, big value, trend line) floating on the screenshot corner.",
              "notificacao": "A phone-style notification card (icon, title, short text) floating on the screenshot corner.",
              "crescimento": "A small growth indicator chip (arrow up and a percentage).",
              "nenhum": "No floating element; keep it clean."}
ANOTACOES = {"marcador": "A highlighter stroke behind the key words of the headline.", "sublinhado": "A hand-drawn wavy underline under the key words.",
             "circulo": "A hand-drawn circle around the key words.", "nenhuma": "No annotation on the headline."}
MODOS = {"escuro": "Dark brand background with light text. Bold, premium, tech.", "claro": "Light background with dark text. Clean, airy, editorial."}
PARADAS = set("a o as os e de da do das dos em no na nos nas um uma uns umas para pra por com sem que se seu sua seus suas ao aos à às é mais muito já".split())


def _linha(texto, rotulo):
    m = re.search(rf"(?im)^\s*{rotulo}\s*:\s*[\"“]?([^\"”\n]+)", texto)
    return m.group(1).strip() if m else ""


def _candidatos(titulo):
    """Trechos do título que podem virar ênfase: palavras fortes e pares de palavras (o Jev escolhe, não inventa)."""
    ps = re.findall(r"[\wÀ-ÿ$%]+", titulo)
    fortes = [p for p in ps if p.lower() not in PARADAS and len(p) > 3]
    pares = [f"{a} {b}" for a, b in zip(ps, ps[1:]) if a.lower() not in PARADAS and len(f"{a} {b}") > 6]
    vistos, out = set(), []
    for c in pares + fortes:
        if c.lower() not in vistos:
            vistos.add(c.lower())
            out.append(c)
    return out[:12]


def _com_enfase(titulo, trecho):
    i = titulo.lower().find(trecho.lower())
    return titulo if i < 0 or "**" in titulo else f"{titulo[:i]}**{titulo[i:i + len(trecho)]}**{titulo[i + len(trecho):]}"


def _node(*args):
    r = subprocess.run(["node", str(RAIZ / "tools/design/monta.mjs"), *map(str, args)], capture_output=True, text=True, cwd=RAIZ)
    if r.returncode:
        raise RuntimeError(f"motor editorial: {(r.stdout + r.stderr)[-500:]}")
    return json.loads(r.stdout)


def _marca_ativa():
    """Kit cujo logo é a logo atual do painel; sem kit, identidade automática tirada da logo (como o clássico)."""
    logo = next(iter(sorted((RAIZ / "public/brand").glob("logo.*"))), None)
    for f in sorted((RAIZ / "painel/marcas").glob("*.json")):
        k = json.loads(f.read_text())
        if logo and (RAIZ / k.get("logo", "")).resolve() == logo.resolve():
            return k["id"], str(logo)
    return "-", str(logo) if logo else ""


def executa(ctx):
    """ctx: funções e dados do orquestrador-post (jev, status, diz, grava_jev, REGISTRO, JOB, PEDIDO, FORMATO, DIMS, LOGO_PX,
    TEXTO_POST, SELO, PONTOS, blocos, conteudo_do_briefing, fotos_para, VERSOES). Devolve a lista de PNGs entregues."""
    JOB, jev, status = ctx["JOB"], ctx["jev"], ctx["status"]
    prompt = ctx["PEDIDO"]["prompt"]
    apoio, nota = _linha(prompt, r"(?:Apoio|Sobret[ií]tulo)"), _linha(prompt, "Nota")
    texto = re.sub(r"(?im)^\s*(?:Apoio|Sobret[ií]tulo|Nota)\s*:.*$\n?", "", ctx["TEXTO_POST"]).strip()
    if ctx["FORMATO"] == "post" and "|" not in texto:
        bs = [ctx["conteudo_do_briefing"](texto, {"objetivo": "institucional"})]
    else:  # mesmas regras do blocos() do clássico, mas sobre o texto já sem as linhas Apoio/Nota
        partes = texto.split("||") if ctx["FORMATO"] == "carrossel" else [texto]
        bs = [(p[0], p[1] if len(p) > 1 else "", "", p[2] if len(p) > 2 else "") for p in ([x.strip() for x in b.split("|") if x.strip()] for b in partes) if p][:6]
        if ctx["FORMATO"] == "carrossel" and len(bs) < 2:
            raise RuntimeError("carrossel precisa de pelo menos 2 slides: separe cada slide com || (ex.: frase 1 || frase 2 || frase 3)")
    marca_id, logo_padrao = _marca_ativa()
    kit = _node("kit", marca_id, logo_padrao or "-")
    status("Jev dirigindo a composição editorial")

    telas = list(kit["telas"])
    if not telas:  # sem tela do sistema no kit: foto real (mesma busca do clássico), uma para o post todo
        foto_n = _linha(prompt, "Foto")
        log = []
        fs = ctx["fotos_para"](foto_n or f"{bs[0][0]}. {bs[0][1]}", jev, log, JOB / "fotos", 1, lambda m: status("Editorial: " + m), forcar=bool(foto_n))
        telas = [{"arquivo": f["caminho"], "descricao": f["descricao"], "alvos": {}, "foto": True} for f in fs[:1]]
    familias, miolo = (FAMILIAS, MIOLO) if telas else (FAMILIAS_SEM_VISUAL, MIOLO_SEM_VISUAL)

    # Uma chamada ao Jev com tudo que ele decide (perguntas em inglês: ele acerta mais)
    q = {}
    for v, fam in enumerate(familias, start=1):
        if len(fam) > 1:
            q[f"v{v}_sistema"] = {"type": "choice", "instructions": f"Version {v} of the post must follow this visual strategy family. Which composition system fits this post best?",
                                  "criteria": {s: kit["sistemas"][s] for s in fam}}
    if len(kit["pares"]) > 1:
        q["par"] = {"type": "choice", "instructions": "Which typography pairing fits this post and brand best?", "criteria": kit["pares"]}
    if len(kit["modos"]) > 1:
        q["modo"] = {"type": "choice", "instructions": "Which brand colour mode fits this post best?", "criteria": {m: MODOS[m] for m in kit["modos"]}}
    if telas:
        q["flutuante"] = {"type": "choice", "instructions": "Which floating element best supports the message next to the product image? Use real data only if the text has it.", "criteria": FLUTUANTES}
    if len(telas) > 1:
        q["tela"] = {"type": "choice", "instructions": "Which product screen best shows what this post talks about?", "criteria": {str(i): t["descricao"] for i, t in enumerate(telas)}}
    q["anotacao"] = {"type": "choice", "instructions": "How should the key words of the headline be marked?", "criteria": ANOTACOES}
    cands = {}
    for i, (t, *_r) in enumerate(bs):
        if "**" not in t and (c := _candidatos(t)):
            cands[i] = c
            q[f"enfase_{i}"] = {"type": "choice", "instructions": f"Headline {i + 1}: \"{t}\". Which exact words carry the main idea and should be emphasised?",
                                "criteria": {**{x: f"Emphasise '{x}'." for x in c}, "nenhuma": "No emphasis."}}
    a, _ = jev({"post_text_in_portuguese": "\n".join(f"{t} | {s}" for t, s, *_r in bs), "brand_style": kit["estilo"],
                "product_images": [t["descricao"] for t in telas] or "none"}, q, etapa="editorial: direção")
    a = a or {}
    pega = lambda k, padrao: (a.get(k) or {}).get("choice") or padrao
    sistemas = [pega(f"v{v + 1}_sistema", fam[0]) for v, fam in enumerate(familias)]
    if sistemas[2] == "DESTAQUE_NUMERO" and not re.search(r"\d", bs[0][0]):
        sistemas[2] = "PROMOTIONAL"  # sem número no título, não há o que destacar
    par, modo = pega("par", kit["par_padrao"]), pega("modo", kit["modos"][0])
    segundo = lambda k, lista, atual: next((x for x, _ in sorted(((a.get(k) or {}).get("probabilities") or {}).items(), key=lambda kv: -kv[1]) if x != atual), None) \
        or next((x for x in lista if x != atual), atual)
    # sem visual a diferença vem da tipografia e do modo (sempre dentro do kit): V2 = 2º par do Jev, V3 = o outro modo
    pares_v = [par, segundo("par", list(kit["pares"]), par) if not telas else par, par]
    modos_v = [modo, modo, segundo("modo", kit["modos"], modo) if not telas else modo]
    flut, anot = pega("flutuante", "metrica"), pega("anotacao", "marcador")
    tela = telas[int(pega("tela", "0"))] if telas else None
    titulos = []
    for i, (t, *_r) in enumerate(bs):
        e = pega(f"enfase_{i}", "nenhuma") if i in cands else "nenhuma"
        conf = (a.get(f"enfase_{i}") or {}).get("confidence", 0)
        titulos.append(_com_enfase(t, e) if e != "nenhuma" and e in cands.get(i, []) and conf >= .35 else t)
    ctx["REGISTRO"].append(f"- motor editorial · marca={kit['id']} · modos={modos_v} · pares={pares_v} · flutuante={flut} · anotação={anot} · versões: {', '.join(sistemas)}")

    def conteudo(i, t, s_, cta):
        n = len(bs)
        num = re.search(r"\d+(?:[.,]\d+)?\s?(?:%|x|min|h|dias?|horas?|mil)?", t)
        return {"titulo": titulos[i], "corpo": s_, "cta": cta or "", "apoio": (f"{i + 1:02d} / {n:02d}" if n > 1 and i else apoio),
                "nota": nota if i == 0 else "", "selo": ctx["SELO"], "pontos": ctx["PONTOS"], "numero": num.group(0) if num else "",
                "telas": [telas[(telas.index(tela) + i) % len(telas)]] if tela else []}

    def sem_numero(c):
        """Destaque de número: o número vira o herói e sai do título (antes: "3 dias" + "3 dias de atraso por OS")."""
        if c["numero"] and c["titulo"].replace("**", "").startswith(c["numero"]):
            resto = c["titulo"].replace("**", "")[len(c["numero"]):].strip()
            return {**c, "titulo": resto[:1].lower() + resto[1:] if resto else c["titulo"]}
        return c

    versoes = []
    for v in range(ctx["VERSOES"]):
        slides, ultimo = [], None
        for i, (t, s_, _x, cta) in enumerate(bs):
            if i == 0:
                sis = sistemas[v]
            elif i == len(bs) - 1 and len(bs) > 2 and (cta or i > 2):
                sis = "ENCERRAMENTO"
            elif re.search(r"\d", t) and ultimo != "DESTAQUE_NUMERO":
                sis = "DESTAQUE_NUMERO"
            else:
                ops = [x for x in miolo[v] if x != ultimo]
                sis = ops[(i - 1) % len(ops)]
            ultimo = sis
            slides.append({"sistema": sis, "conteudo": sem_numero(conteudo(i, t, s_, cta)) if sis == "DESTAQUE_NUMERO" else conteudo(i, t, s_, cta),
                           "direcao": {"par": pares_v[v], "flutuante": flut, "anotacao": anot, "fundo": "degrade" if v == 2 else "liso", "semente": f"{JOB.name}-{v}-{i}"}})
        versoes.append(slides)

    pasta = JOB / "design"
    pasta.mkdir(exist_ok=True)
    ped = pasta / "pedido.json"
    for v in range(ctx["VERSOES"]):  # uma composição por versão: cada uma pode ter o seu modo
        ped.write_text(json.dumps({"dims": ctx["DIMS"], "marca": {"id": None if kit["id"] == "auto" else kit["id"], "modo": modos_v[v], "logoPadrao": logo_padrao or None},
                                   "logo_px": ctx["LOGO_PX"], "versoes": [versoes[v]]}, ensure_ascii=False))
        _node("compoe", ped, pasta)
        (pasta / "v1.json").rename(pasta / f"pronta-v{v + 1}.json")
    for v in range(ctx["VERSOES"]):
        (pasta / f"pronta-v{v + 1}.json").rename(pasta / f"v{v + 1}.json")

    from design.critico import refina  # noqa: E402  (tools/ está no sys.path do orquestrador)
    ciclos = 2 if len(bs) == 1 else 1  # carrossel: 1 volta (são muitos slides)

    def faz(v):
        status(f"Editorial: versão {v} — render e crítica visual")
        spec = json.loads((pasta / f"v{v}.json").read_text())
        out = Path(tempfile.mkdtemp(dir=pasta, prefix=f".r{v}-"))
        r = refina(spec, out, ciclos)
        (pasta / f"v{v}.json").write_text(json.dumps(r["spec_final"], ensure_ascii=False, indent=1))
        arqs = []
        for png in sorted(out.glob("slide-*.png")):
            alvo = JOB / "slides" / f"v{v}-{png.name}"
            shutil.move(png, alvo)
            arqs.append(alvo.name)
        shutil.rmtree(out, ignore_errors=True)
        return v, arqs, {k: r[k] for k in ("ciclos", "notas_finais", "custo_critico_usd")}

    (JOB / "slides").mkdir(exist_ok=True)
    with ThreadPoolExecutor(ctx["VERSOES"]) as ex:
        res = list(ex.map(faz, range(1, ctx["VERSOES"] + 1)))
    ctx["grava_jev"](motor="editorial", versoes=[{"n": v, "tema": modos_v[v - 1], "par": pares_v[v - 1], "sistemas": [s["sistema"] for s in versoes[v - 1]],
                                                    "flutuante": flut, "anotacao": anot, "critica": crit} for v, _a, crit in res])
    for v, _a, crit in res:
        ctx["REGISTRO"].append(f"- versão {v}: {' → '.join(s['sistema'] for s in versoes[v - 1])} · nota do crítico {crit['notas_finais']}")
    return [x for _v, arqs, _c in res for x in arqs]
