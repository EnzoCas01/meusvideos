#!/usr/bin/env python3
"""Biblioteca de fotos do painel + busca de fotos reais (Pexels/Pixabay) guiada pelo DeepSeek.
Nenhuma IA gera imagem: o DeepSeek só escreve a busca e confere a descrição dos resultados.

  from fotos import foto_para   ->  foto_para(assunto, jev, log) = caminho absoluto da foto ou None

Biblioteca: painel/fotos.json = [{id, arquivo, descricao, origem, credito}] ; arquivos em public/fotos/.
"""
import json
import random
import os
import re
import time
import urllib.parse
import urllib.request
import uuid
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
INDICE = Path(os.environ.get("FOTOS_INDICE", RAIZ / "painel/fotos.json"))  # testes apontam para outro lugar
PASTA = Path(os.environ.get("FOTOS_PASTA", RAIZ / "public/fotos"))
TENTATIVAS = 3
NOTA_MIN = 5  # DeepSeek 0-10: acima de 5 aprova, abaixo reprova, 5 cravado o Jev desempata


def aprova(valor, jev, estado, pergunta):
    """Regra única do Enzo: > 50% aprova, < 50% reprova; 50% cravado = o Jev decide (sim/não)."""
    if valor is None:
        return False
    if valor > 0.5:
        return True
    if valor < 0.5 or not jev:
        return False
    a, _ = jev(estado, etapa="desempate (50%)", perguntas={"decisao": {"type": "choice", "instructions": pergunta,
               "criteria": {"sim": "Yes.", "nao": "No."}}})
    return bool(a) and a["decisao"]["choice"] == "sim"


def confere(assunto, descricao, jev, tentativa):
    """2ª conferência pelo Jev: a foto mostra exatamente o que o post fala? Na dúvida, fica fora."""
    if not jev:
        return True
    a, _ = jev({"post_subject_in_portuguese": assunto, "photo_description": descricao}, etapa="foto: confere", perguntas={"exata": {
        "type": "noul", "instructions": "Would someone looking at this photo immediately connect it to what this post says? "
        "Answer false if the photo is generic or about something else.",
        "criteria": {"true": "Yes, the photo clearly shows what the post talks about.", "false": "No, it is generic, off-topic or only loosely related."}}})
    ok = bool(a) and aprova(a["exata"].get("noul"), jev, {"post_subject_in_portuguese": assunto, "photo_description": descricao},
                            "Does this photo clearly show what the post talks about?")
    tentativa.setdefault("conferidas", []).append({"descricao": descricao[:120], "jev": (a or {}).get("exata", {}).get("noul"), "aprovada": ok})
    return ok
RECENTES = RAIZ / "out/painel/.fotos-recentes.json"  # só o ENDEREÇO das últimas fotos usadas (não a imagem): evita repetir


def _segredo(arq, nome):
    for linha in Path(arq).read_text().splitlines():
        if linha.strip().startswith(nome + "="):
            return linha.split("=", 1)[1].strip().strip('"').strip("'")
    return ""


def biblioteca():
    try:
        return json.loads(INDICE.read_text())
    except (OSError, ValueError):
        return []


def _salva(lista):
    INDICE.write_text(json.dumps(lista, ensure_ascii=False, indent=1))


def _http(url, headers=None, dados=None, timeout=40):
    req = urllib.request.Request(url, data=dados, headers={"User-Agent": "meusvideos-painel", **(headers or {})})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()


def deepseek(sistema, pergunta, max_tokens=1800):
    """Uma chamada curta ao DeepSeek (endpoint compatível com Anthropic). Devolve (texto, custo_aprox)."""
    corpo = json.dumps({"model": "deepseek-v4-flash", "max_tokens": max_tokens, "thinking": {"type": "disabled"}, "system": sistema,
                        "messages": [{"role": "user", "content": pergunta}]}).encode()
    d = json.loads(_http("https://api.deepseek.com/anthropic/v1/messages", {
        "x-api-key": _segredo("/root/secrets/deepseek.env", "DEEPSEEK_API_KEY"),
        "anthropic-version": "2023-06-01", "content-type": "application/json"}, corpo, 90))
    texto = "".join(b.get("text", "") for b in d.get("content", []) if b.get("type") == "text")
    u = d.get("usage") or {}
    return texto, (u.get("input_tokens", 0) * 0.27 + u.get("output_tokens", 0) * 1.1) / 1e6


def _json_de(texto):
    m = re.search(r"\{[\s\S]*\}", texto)
    try:
        return json.loads(m.group(0)) if m else {}
    except ValueError:  # resposta cortada/mal formada: conta como "nada"
        return {}


def _candidatos(busca):
    """Fotos grátis (licença Pexels/Pixabay) com a descrição de cada uma."""
    out = []
    k = _segredo("/root/secrets/pexels.env", "PEXELS_API_KEY")
    if k:
        try:
            d = json.loads(_http("https://api.pexels.com/v1/search?" + urllib.parse.urlencode(
                {"query": busca, "per_page": 15, "page": random.randint(1, 3)}), {"Authorization": k}))
            out += [{"desc": p.get("alt") or "", "url": p["src"]["large2x"], "credito": f"Foto: {p.get('photographer', '')} / Pexels",
                     "origem": p.get("url", "")} for p in d.get("photos", [])]
        except Exception:
            pass
    k = _segredo("/root/secrets/pixabay.env", "PIXABAY_API_KEY")
    if k:
        try:
            d = json.loads(_http("https://pixabay.com/api/?" + urllib.parse.urlencode(
                {"key": k, "q": busca, "image_type": "photo", "per_page": 15, "page": random.randint(1, 2), "safesearch": "true"})))
            out += [{"desc": h.get("tags", ""), "url": h.get("largeImageURL") or h.get("webformatURL"), "credito": f"Foto: {h.get('user', '')} / Pixabay",
                     "origem": h.get("pageURL", "")} for h in d.get("hits", [])]
        except Exception:
            pass
    recentes = set(_recentes())
    out = [c for c in out if c["url"] and c["desc"] and c["url"] not in recentes]
    random.shuffle(out)
    return out[:20]


def _recentes():
    try:
        return json.loads(RECENTES.read_text())
    except (OSError, ValueError):
        return []


SISTEMA = ("You pick real stock photos for Instagram posts of AlvoManage, a management system for phone/electronics repair shops "
           "and small stores in Brazil. Photos must show the subject concretely (repair bench, phone repair, store counter, "
           "customer receiving a phone, cash register, stock shelves...). Never pick photos with visible brand logos as the focus, "
           "with text as the main element, or unrelated/generic scenes. Answer ONLY with JSON.")


def _baixa(c, descricao, busca, pasta):
    """Baixa só para a pasta DAQUELA criação (não vai para a biblioteca) e anota o endereço como usado."""
    pasta.mkdir(parents=True, exist_ok=True)
    arq = pasta / f"{uuid.uuid4().hex[:10]}.jpg"
    arq.write_bytes(_http(c["url"], timeout=60))
    RECENTES.write_text(json.dumps((_recentes() + [c["url"]])[-120:]))
    return {"id": arq.stem, "caminho": str(arq), "descricao": descricao or c["desc"], "origem": c["origem"], "credito": c["credito"], "busca": busca}


def buscar(assunto, log, pasta, quantas=3, aviso=lambda m: None, jev=None):
    """DeepSeek escreve a busca, lê as descrições e escolhe até `quantas` fotos DIFERENTES; se nada servir, muda a busca."""
    rejeitadas, achadas = [], []
    for n in range(1, TENTATIVAS + 1):
        if len(achadas) >= quantas:
            break
        aviso(f"DeepSeek pensando na busca de fotos (tentativa {n})")
        t, c1 = deepseek(SISTEMA, f"Post subject (Portuguese): {assunto}\n"
                         + (f"Searches already tried: {rejeitadas}\n" if rejeitadas else "")
                         + 'Write ONE short English stock-photo search query (2-5 words) that literally describes the scene of THIS subject. JSON: {"query": "..."}')
        busca = (_json_de(t).get("query") or "").strip()
        if not busca:
            log.append({"tentativa": n, "erro": "o DeepSeek não devolveu a busca"})
            continue
        aviso(f"DeepSeek buscando fotos: “{busca}”")
        cands = _candidatos(busca)
        tentativa = {"tentativa": n, "busca": busca, "resultados": len(cands), "custo": c1, "fotos": []}
        if cands:
            falta = quantas - len(achadas)
            lista = "\n".join(f"{i}: {c['desc'][:140]}" for i, c in enumerate(cands))
            aviso(f"DeepSeek conferindo {len(cands)} fotos de “{busca}”")
            t, c2 = deepseek(SISTEMA, f"Post subject (Portuguese): {assunto}\nCandidate photos (index: description):\n{lista}\n"
                             "Score EVERY candidate 0-10: 10 = the photo shows EXACTLY what the post talks about; 5 = same general theme only; "
                             "0 = unrelated. Be strict: a generic phone, office or shop photo that does not show this specific subject is 4 or less. "
                             'JSON: {"notas": [{"index": <int>, "nota": <0-10>, "descricao_pt": "<short Portuguese description, ONLY if nota >= 5>"}], "reason": "<short>"}')
            r = _json_de(t)
            tentativa.update({"custo": c1 + c2, "motivo": r.get("reason")})
            boas = sorted([e for e in (r.get("notas") or []) if isinstance(e.get("nota"), (int, float))
                           and aprova(e["nota"] / 10, jev, {"post_subject_in_portuguese": assunto, "photo_description": e.get("descricao_pt") or ""},
                                      "Does this photo show what the post talks about?")],
                          key=lambda e: -e["nota"])
            tentativa["notas"] = sorted([e.get("nota") for e in (r.get("notas") or []) if isinstance(e.get("nota"), (int, float))], reverse=True)[:6]
            for e in boas[:falta]:
                i = e.get("index")
                if isinstance(i, int) and 0 <= i < len(cands) and confere(assunto, e.get("descricao_pt") or cands[i]["desc"], jev, tentativa):
                    aviso(f"Baixando a foto {len(achadas) + 1}")
                    item = _baixa(cands[i], e.get("descricao_pt"), busca, pasta)
                    achadas.append(item)
                    tentativa["fotos"].append(item["id"])
        log.append(tentativa)
        rejeitadas.append(busca)
    return achadas




def fotos_para(assunto, jev, log, pasta, quantas=3, aviso=lambda m: None, forcar=False):
    """Até `quantas` fotos DIFERENTES, buscadas de novo a cada criação pelo DeepSeek (nada fica salvo na biblioteca).
    Se faltar, completa com as fotos que o Enzo enviou na aba Fotos (o Jev escolhe pela descrição). Devolve [{"caminho", "descricao", "id"}]."""
    out = []
    if jev and not forcar:  # forcar = o prompt descreveu a foto: não pergunta se vale foto
        aviso("Jev decidindo se este post fica melhor com foto")
        a, _ = jev({"post_subject_in_portuguese": assunto}, etapa="foto: vale a pena?", perguntas={"pede_foto": {
            "type": "noul", "instructions": "Can a real stock photo show EXACTLY what this post says (a concrete scene or object, e.g. a phone repair bench, "
            "a customer at a shop counter)? Abstract software features (cash flow, reports, commission, settings) are better with an icon: answer false.",
            "criteria": {"true": "A real photo can show exactly this subject.", "false": "No photo would show it exactly; use an icon."}}})
        pede = (a or {}).get("pede_foto", {}).get("noul")
        quer = aprova(pede, jev, {"post_subject_in_portuguese": assunto}, "Should this post use a real photo instead of an icon?")
        log.append({"decisao": "com foto" if quer else "sem foto (ícone)", "jev": pede})
        if not quer:
            return []
    try:
        out = buscar(assunto, log, pasta, quantas, aviso, jev)
    except Exception as e:  # sem rede/chave: segue com as enviadas (ou ícone)
        log.append({"erro": str(e)[:200]})
    lib = [f for f in biblioteca() if (RAIZ / f["arquivo"]).exists()]
    if len(out) < quantas and lib:
        aviso("Jev procurando nas fotos que você enviou")
        a, _ = jev({"post_subject_in_portuguese": assunto}, etapa="foto: suas fotos", perguntas={"foto": {
            "type": "choice", "instructions": "Which of these photos concretely shows this subject? Choose 'nenhuma' if none really fits.",
            "criteria": {f["id"]: f["descricao"][:160] for f in lib[-80:]} | {"nenhuma": "No photo fits this subject."}}})
        for fid, pr in sorted(((a or {}).get("foto", {}).get("probabilities") or {}).items(), key=lambda kv: -kv[1]):
            f = next((x for x in lib if x["id"] == fid), None)
            if f and fid != "nenhuma" and pr > 0.5 and len(out) < quantas:
                out.append({"caminho": str(RAIZ / f["arquivo"]), "descricao": f["descricao"], "id": f["id"]})
                log.append({"biblioteca": f["id"], "descricao": f["descricao"], "nota": pr})
    return out
