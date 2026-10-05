#!/usr/bin/env python3
"""Pergunta ao Jev (TypeSafe) via OpenRouter Decisions API. Jev decide; quem chama executa.

Uso: python3 tools/jev.py pedido.json      (ou o JSON pela entrada padrão: ... | python3 tools/jev.py -)
pedido.json = {"state": ..., "questions": {<id>: {"type": "choice"|"score"|"noul", "instructions": ..., "criteria": ...}}}

Saída (JSON): http_status, tempo_ms (medido aqui, ponta a ponta), model, provider, usage (como a API devolve)
e answers — ou erro_bruto com o corpo exato do erro. Nunca imprime a chave.
ATENÇÃO: tudo que vai em "state"/"questions" sai desta máquina para OpenRouter e TypeSafe.
"""
import json
import os
import sys
import time
import urllib.error
import urllib.request

URL = "https://openrouter.ai/api/alpha/decisions"
MODELO = "typesafe/jev-1.13"
SEGREDO = "/root/secrets/openrouter.env"


def chave():
    for linha in open(SEGREDO):
        if linha.startswith("OPENROUTER_API_KEY="):
            return linha.split("=", 1)[1].strip()
    sys.exit(f"OPENROUTER_API_KEY não encontrada em {SEGREDO}")


def main():
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    pedido = json.load(sys.stdin if sys.argv[1] == "-" else open(sys.argv[1]))
    corpo = {"model": pedido.get("model", MODELO), "state": pedido["state"], "questions": pedido["questions"],
             "provider": {"data_collection": "deny"}}
    req = urllib.request.Request(URL, data=json.dumps(corpo, ensure_ascii=False).encode(), method="POST", headers={
        "Authorization": f"Bearer {chave()}", "Content-Type": "application/json",
        "HTTP-Referer": "https://srv1408471.hstgr.cloud/videos/", "X-Title": "meusvideos",
    })
    t0 = time.monotonic()
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            status, bruto = r.status, r.read().decode()
    except urllib.error.HTTPError as e:
        status, bruto = e.code, e.read().decode(errors="replace")
    ms = round((time.monotonic() - t0) * 1000)
    try:
        d = json.loads(bruto)
    except ValueError:
        d = None
    if status != 200 or not isinstance(d, dict) or "answers" not in d:
        print(json.dumps({"http_status": status, "tempo_ms": ms, "erro_bruto": bruto[:4000]}, ensure_ascii=False, indent=1))
        sys.exit(1)
    jd, uso = os.environ.get("JOB_DIR"), d.get("usage") or {}
    if jd:  # painel: custo do Jev entra na conta do vídeo
        with open(os.path.join(jd, "usage.jsonl"), "a") as f:
            f.write(json.dumps({"agent": "jev", "perfil": "jev", "ts": time.time(), "modelUsage": {MODELO: {
                "inputTokens": uso.get("input_tokens", 0), "outputTokens": uso.get("output_tokens", 0), "costUSD": uso.get("cost", 0)}}}) + "\n")
    print(json.dumps({"http_status": status, "tempo_ms": ms, "id": d.get("id"), "model": d.get("model"),
                      "provider": d.get("provider"), "usage": d.get("usage"), "answers": d["answers"]},
                     ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()
