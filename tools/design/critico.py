#!/usr/bin/env python3
"""Crítico visual + refinamento automático do motor editorial.
render → crítico (DeepSeek vê o PNG + a lista de objetos com id) → Jev decide cada correção (> 50% aplica)
→ o código aplica no spec → render de novo. Máximo de 2 ciclos; sem problema aprovado, para antes.
Uso: python3 tools/design/critico.py <spec.json> <pasta> [ciclos]   → PNGs finais + critica.json (relato de cada ciclo)
O crítico só aponta; quem decide é o Jev; quem mexe é o código (vocabulário fechado de correções).
"""
import base64
import json
import os
import subprocess
import sys
import tempfile
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(RAIZ / "tools"))
from fotos import deepseek, _json_de, aprova  # noqa: E402

OPS = {
    "escala": "value = factor 0.7-1.4. Text: font size; screenshot/card/image: width.",
    "mover": "value = [dx, dy] in % of the canvas (-15..15). Only for objects NOT inside the text stack.",
    "remover": "value = null. Only for supporting objects (level 4-5): notes, arrows, decorations, floating cards.",
    "cor": "value = one of texto | suave | destaque | destaque2 (brand palette names). Text and annotations only.",
    "modo_tela": "value = one of normal | floating | tilted-left | tilted-right | perspective | card. Screenshots only.",
}
CRITERIOS = ("composition, visual hierarchy, legibility, alignment, contrast, too many elements, typography quality, "
             "screenshot treatment, cropping (anything cut by the edge that should not be), balance, negative space, "
             "brand consistency, professional look")


def jev(state, perguntas):
    r = subprocess.run(["python3", str(RAIZ / "tools/jev.py"), "-"], input=json.dumps({"state": state, "questions": perguntas}, ensure_ascii=False),
                       capture_output=True, text=True, env=os.environ)
    try:
        return json.loads(r.stdout).get("answers")
    except ValueError:
        return None


def usa(agente, custo):
    """Custo do crítico entra na conta do job do painel (mesmo usage.jsonl dos agentes)."""
    jd = os.environ.get("JOB_DIR")
    if jd and custo:
        with open(Path(jd) / "usage.jsonl", "a") as f:
            f.write(json.dumps({"agent": agente, "perfil": "deepseek-flash", "ts": time.time(),
                                "modelUsage": {"deepseek-v4-flash": {"costUSD": custo}}}) + "\n")


def objetos(layout, dims):
    """Lista curta dos objetos para o crítico: id, tipo, nível e caixa em % (o PNG mostra o resto)."""
    W, H = dims
    out = []
    for i, o in layout.items():
        if i.startswith("_") or o.get("tipo") == "fundo":
            continue
        x, y, w, h = o["caixa"]
        out.append({"id": i, "type": o.get("forma") or o.get("papel") or o["tipo"], "level": o.get("nivel"),
                    "box_pct": [round(x / W * 100), round(y / H * 100), round(w / W * 100), round(h / H * 100)],
                    **({"font_px": o["tamanho"]} if o.get("tamanho") else {}), **({"decorative_data": True} if o.get("decorativo") else {})})
    return out


def critica(png, layout, dims, avisos):
    """Problemas estruturados, cada um com objeto e correção do vocabulário. Lista vazia = nada a corrigir."""
    with tempfile.NamedTemporaryFile(suffix=".jpg") as t:
        subprocess.run(["convert", png, "-resize", "640x", "-quality", "82", t.name], check=True)
        b64 = base64.b64encode(Path(t.name).read_bytes()).decode()
    pedido = (f"Objects in this {dims[0]}x{dims[1]} social-media post (ids are what you must reference):\n{json.dumps(objetos(layout, dims), ensure_ascii=False)}\n"
              f"Measured by code: {json.dumps({'occupancy': layout.get('_meta', {}).get('ocupacao'), 'warnings': avisos}, ensure_ascii=False)}\n\n"
              f"Judge it as a senior editorial art director on: {CRITERIOS}.\n"
              "First give an overall score 0-10 (10 = top agency work, 8 = professional and publishable, 5 = amateur template). "
              "Then report ONLY real, visible problems that a top designer would fix (max 4, most important first). Do not report taste or praise. "
              "Intentional editorial devices (an arrow pointing INTO the screenshot, a card overlapping a screenshot corner, a screenshot bleeding off one edge) are NOT problems. "
              "severity: 3 = breaks the piece, 2 = clearly hurts it, 1 = minor polish. If the piece is professional, return few or no problems.\n"
              f"Each correction uses exactly one operation: {json.dumps(OPS)} An object id ending in '*' removes the whole group (e.g. 'estrela_*').\n"
              'JSON only: {"score": 0-10, "problems": [{"problem": "...", "object": "<id>", "op": "<operation>", "value": ..., "severity": 1-3}]}')
    txt, custo = deepseek("You are a strict senior art director reviewing a rendered post. You can see the image. Answer JSON only.",
                          [{"type": "image", "source": {"type": "base64", "media_type": "image/jpeg", "data": b64}}, {"type": "text", "text": pedido}], 1400)
    usa("critico", custo)
    ids = {i for i in layout if not i.startswith("_")}
    vale = lambda o: o in ids or (str(o).endswith("*") and any(i.startswith(str(o)[:-1]) for i in ids))
    d = _json_de(txt)
    probs = [p for p in d.get("problems", []) if vale(p.get("object")) and p.get("op") in OPS and int(p.get("severity") or 1) >= 2]
    try:
        nota = float(d.get("score"))
    except (TypeError, ValueError):
        nota = None
    return probs[:4], nota, custo


def membros(layout, oid):
    return [i for i in layout if not i.startswith("_") and (i == oid or (oid.endswith("*") and i.startswith(oid[:-1])))]


def tipo(layout, oid):
    o = layout[membros(layout, oid)[0]]
    return o.get("forma") or o.get("papel") or o["tipo"]


def nivel(layout, oid):
    return min((layout[i].get("nivel") or 0) for i in membros(layout, oid))


def colisoes(layout):
    """Medido pelo código: linhas de textos diferentes que se cruzam, e texto embaixo de tela/cartão (que o cobre)."""
    textos = {i: o.get("linhas_caixas") or [o["caixa"]] for i, o in layout.items() if not i.startswith("_") and o.get("tipo") == "texto"}
    cobre = {i: [o["caixa"]] for i, o in layout.items() if not i.startswith("_") and o.get("tipo") in ("screenshot", "flutuante")}
    bate = lambda a, b: a[0] < b[0] + b[2] and b[0] < a[0] + a[2] and a[1] < b[1] + b[3] and b[1] < a[1] + a[3]
    n, ids = 0, list(textos)
    for k, a in enumerate(ids):
        for b in ids[k + 1:] + list(cobre):
            n += sum(bate(x, y) for x in textos[a] for y in (textos.get(b) or cobre[b]))
    return n


def decide(probs, layout):
    """O Jev decide cada correção (uma chamada, uma pergunta por problema). > 50% aplica; 50% cravado ele desempata."""
    if not probs:
        return []
    state = {"rules": "Brand colours and fonts are fixed. Corrections must fix a real visible problem and must not hurt the main message, "
                      "legibility or the hierarchy (headline first). Removing is acceptable only for clutter.",
             "problems": [{"n": n, **p, "object_type": tipo(layout, p["object"]), "object_level": nivel(layout, p["object"])} for n, p in enumerate(probs)]}
    a = jev(state, {f"p{n}": {"type": "noul", "instructions": f"Should correction n={n} be applied to the post?",
                              "criteria": {"true": "Yes: it fixes a real visible problem and respects the rules.", "false": "No: it is taste, harmful or breaks a rule."}}
                    for n in range(len(probs))})
    if not a:
        return []  # Jev fora do ar: não mexe (melhor a arte como está que uma correção sem decisão)
    out = []
    for n, p in enumerate(probs):
        v = (a.get(f"p{n}") or {}).get("noul")
        ok = aprova(v, lambda st, **k: (jev(st, k["perguntas"]), None), {"problem": p}, f"Apply this correction? {p['problem']}")
        out.append({**p, "jev": v, "aplicar": ok})
    return out


def acha(camadas, oid):
    """Camada pelo id, inclusive dentro de pilha. Devolve (lista_dona, índice, pilha_ou_None)."""
    for i, c in enumerate(camadas):
        if c.get("id") == oid:
            return camadas, i, None
        for j, it in enumerate(c.get("itens") or []):
            if it.get("id") == oid:
                return c["itens"], j, c
    return None, None, None


def aplica(slide, correcoes, layout, dims):
    W, H = dims
    feitas = []
    for p in correcoes:
        if not p["aplicar"]:
            continue
        if p["op"] == "remover" and p["object"].endswith("*"):
            alvo = [i for i in membros(layout, p["object"]) if (layout[i].get("nivel") or 0) >= 4]
            slide["camadas"] = [c for c in slide["camadas"] if c.get("id") not in alvo]
            feitas.append(p) if alvo else None
            continue
        lista, i, pilha = acha(slide["camadas"], p["object"])
        if lista is None:
            continue
        c, o, op, v = lista[i], layout[p["object"]], p["op"], p.get("value")
        try:
            if op == "escala":
                f = min(max(float(v), .7), 1.4)
                if c["tipo"] == "texto":
                    c["tamanho"] = round(o.get("tamanho", c.get("tamanho", 40)) * f, 1)
                    c.pop("max_altura", None)
                else:
                    c["w"] = round(o["caixa"][2] * f)
            elif op == "mover" and not pilha:
                dx, dy = [min(max(float(x), -15), 15) for x in v]
                for k in ("linha", "centralizar_y", "ancora") + (("col",) if c["tipo"] != "texto" else ()):
                    c.pop(k, None)  # posição passa a ser explícita
                c["x"] = round(c.get("x", o["caixa"][0]) + dx * W / 100)
                c["y"] = round(c.get("y", o["caixa"][1]) + dy * H / 100)
            elif op == "remover" and (o.get("nivel") or 0) >= 4:
                lista.pop(i)
                slide["camadas"] = [x for x in slide["camadas"] if not str(x.get("alvo", x.get("de", ""))).startswith(p["object"]) and not str(x.get("para", "")).startswith(p["object"])]
            elif op == "cor" and v in (slide.get("cores") or {}):
                c["cor"] = slide["cores"][v]
            elif op == "modo_tela" and c["tipo"] == "screenshot":
                c["modo"] = v
            else:
                continue
            feitas.append(p)
        except (TypeError, ValueError, KeyError):
            continue
    return feitas


def render(spec, pasta):
    arq = Path(pasta) / ".spec-render.json"
    arq.write_text(json.dumps(spec, ensure_ascii=False))
    r = subprocess.run(["node", str(RAIZ / "tools/design/render.mjs"), str(arq), str(pasta)], capture_output=True, text=True)
    if r.returncode:
        raise RuntimeError(f"render falhou: {(r.stdout + r.stderr)[-600:]}")
    return json.loads(r.stdout)


def refina(spec, pasta, ciclos=2, nota_boa=8.5):
    """Cada slide: crítica (nota + problemas) → Jev → correções → render → o código mede colisões e o crítico dá nota
    de novo. A versão nova só fica se NÃO criou colisão e a nota NÃO caiu; senão volta à anterior e para.
    Nota ≥ nota_boa: a arte já é profissional, não mexe. Máximo de `ciclos` correções por slide."""
    import copy
    pasta = Path(pasta)
    pasta.mkdir(parents=True, exist_ok=True)
    relato, custo = [], [0.0]
    render(spec, pasta)
    lay = lambda n: json.loads((pasta / f"slide-{n + 1:02d}.layout.json").read_text())

    def avalia(n):
        probs, nota, c = critica(str(pasta / f"slide-{n + 1:02d}.png"), lay(n), spec["dims"], [])
        custo[0] += c
        return probs, nota

    estado = {}
    with ThreadPoolExecutor(4) as ex:
        for n, (probs, nota) in zip(range(len(spec["slides"])), ex.map(avalia, range(len(spec["slides"])))):
            estado[n] = {"probs": probs, "nota": nota, "colisoes": colisoes(lay(n)), "ativo": True}
            relato.append({"ciclo": 0, "slide": n + 1, "nota": nota, "colisoes": estado[n]["colisoes"]})
    for volta in range(1, ciclos + 1):
        tentou = {}
        for n, e in estado.items():
            if not e["ativo"] or (e["nota"] or 0) >= nota_boa or not e["probs"]:
                e["ativo"] = False
                continue
            antes = copy.deepcopy(spec["slides"][n])
            decisoes = decide(e["probs"], lay(n))
            feitas = aplica(spec["slides"][n], decisoes, lay(n), spec["dims"])
            relato.append({"ciclo": volta, "slide": n + 1, "problemas": decisoes, "aplicadas": len(feitas)})
            if feitas:
                tentou[n] = antes
            else:
                e["ativo"] = False
        if not tentou:
            break
        render(spec, pasta)
        for n, antes in tentou.items():
            e, col = estado[n], colisoes(lay(n))
            probs, nota = avalia(n)
            pior = col > e["colisoes"] or (nota is not None and e["nota"] is not None and nota < e["nota"])
            relato.append({"ciclo": volta, "slide": n + 1, "nota_nova": nota, "colisoes": col, "resultado": "desfeito (piorou)" if pior else "aceito"})
            if pior:
                spec["slides"][n] = antes
                e["ativo"] = False
            else:
                e.update(probs=probs, nota=nota, colisoes=col)
        if any(r.get("resultado", "").startswith("desfeito") for r in relato if r["ciclo"] == volta):
            render(spec, pasta)
    (pasta / ".spec-render.json").unlink(missing_ok=True)
    return {"ciclos": relato, "notas_finais": {n + 1: e["nota"] for n, e in estado.items()}, "custo_critico_usd": round(custo[0], 5), "spec_final": spec}


if __name__ == "__main__":
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    spec = json.loads(Path(sys.argv[1]).read_text())
    t0 = time.time()
    r = refina(spec, sys.argv[2], int(sys.argv[3]) if len(sys.argv) > 3 else 2)
    r["segundos"] = round(time.time() - t0, 1)
    (Path(sys.argv[2]) / "critica.json").write_text(json.dumps(r, ensure_ascii=False, indent=1))
    print(json.dumps({k: v for k, v in r.items() if k != "spec_final"}, ensure_ascii=False, indent=1))
