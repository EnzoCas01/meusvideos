#!/usr/bin/env python3
"""Revisão cena por cena: código mede, o `olho` descreve cada quadro, o Jev julga, o código decide.

Uso: python3 tools/revisao.py <pasta_do_job> <video.mp4> <cenas.json> <narration.json> [plano.json]
cenas.json    = [{"n": 1, "from": 0, "durationInFrames": 85, "visual": "o que a cena deveria mostrar"}, ...]
Saída: <pasta>/revisao/revisao.json + resumo JSON no stdout {"aprovado": bool, "corrigir": {agente: [motivos]}, ...}
Ao Jev vai só texto do próprio vídeo (fala, visual planejado, descrição do quadro, 👎 do Enzo) — nada de cliente.
"""
import json
import os
import re
import subprocess
import sys
import time
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
FPS = 30

# ---- limites de decisão (revisar aqui) ----
FIEL_MIN = 0.35        # noul: a imagem combina com a fala? abaixo disto = reprova
TEXTO_MIN = 0.35       # noul: texto legível e sem sobreposição?
REPETE_MAX = 0.65      # noul: repete um 👎 do Enzo? acima disto = reprova
QUALIDADE_MIN = 1.5    # score 0-3: abaixo disto = reprova
INCERTO = (0.35, 0.65)  # noul nessa faixa = Jev incerto (não reprova sozinho; vai para o resumo)
CONF_MIN = 0.5         # confiança de score/choice abaixo disto = incerto
PRETO_MAX_S = 0.5      # trecho preto maior que isto = defeito


def sh(*cmd, **kw):
    return subprocess.run(cmd, capture_output=True, text=True, cwd=RAIZ, **kw)


def checagens(mp4, esperado_s):
    probs = []
    p = json.loads(sh("ffprobe", "-v", "error", "-show_entries", "format=duration:stream=codec_type", "-of", "json", mp4).stdout or "{}")
    tipos = [s.get("codec_type") for s in p.get("streams", [])]
    dur = float(p.get("format", {}).get("duration", 0))
    if "video" not in tipos:
        probs.append("sem trilha de vídeo")
    if "audio" not in tipos:
        probs.append("sem trilha de áudio")
    if esperado_s and abs(dur - esperado_s) > max(3, esperado_s * 0.15):
        probs.append(f"duração {dur:.1f}s, plano pedia {esperado_s}s")
    pretos = re.findall(r"black_start:([\d.]+) black_end:([\d.]+) black_duration:([\d.]+)",
                        sh("ffmpeg", "-v", "info", "-i", mp4, "-vf", f"blackdetect=d={PRETO_MAX_S}:pix_th=0.05", "-an", "-f", "null", "-").stderr)
    for a, b, d in pretos:
        if float(a) > 0.2 and float(b) < dur - 0.3:  # fade de entrada/saída não conta
            probs.append(f"tela preta de {float(d):.1f}s em {float(a):.1f}s")
    sil = sh("ffmpeg", "-v", "info", "-i", mp4, "-af", "silencedetect=n=-40dB:d=0.6", "-vn", "-f", "null", "-").stderr
    for ini, d in zip(re.findall(r"silence_start: ([\d.]+)", sil), re.findall(r"silence_duration: ([\d.]+)", sil)):
        if 0.5 < float(ini) < dur - 1.0:  # começo e fim não contam
            probs.append(f"{float(d):.1f}s sem voz em {float(ini):.1f}s")
    vol = re.search(r"mean_volume: ([-\d.]+) dB", sh("ffmpeg", "-i", mp4, "-af", "volumedetect", "-vn", "-f", "null", "-").stderr)
    if "audio" in tipos and vol and float(vol.group(1)) < -45:
        probs.append(f"áudio praticamente mudo ({vol.group(1)} dB)")
    return {"duracao": round(dur, 1), "problemas": probs}


def falas_da_cena(narr, c):
    ini, fim = c["from"], c["from"] + c["durationInFrames"]
    return " ".join(l["text"] for l in narr.get("lines", []) if ini <= l["frame"] < fim)


def perfis_olho():
    m = json.load(open(RAIZ / "modelos.json"))
    return m.get("escadas", {}).get("olho") or [m["agentes"].get("olho", "deepseek-flash")]


def olhar(pasta, quadros):
    saida = pasta / "olho.json"
    lista = "\n".join(f"cena {n}: quadro {q}\n  fala: {fala or '(sem fala)'}\n  visual planejado: {vis or '(não informado)'}" for n, q, fala, vis in quadros)
    for perfil in perfis_olho():
        saida.unlink(missing_ok=True)
        sh("tools/agente.sh", "olho", f"Quadros a descrever (abra cada um com Read):\n{lista}\n\nArquivo de saída: {saida}",
           env={**os.environ, "AGENTE_PERFIL": perfil})
        try:
            d = json.loads(saida.read_text())
            if isinstance(d, list) and len(d) == len(quadros) and all("what_is_shown" in x for x in d):
                return d, perfil
        except (OSError, ValueError):
            pass
    raise SystemExit("olho não entregou descrições válidas em nenhum modelo da escada")


def perguntas(tem_defeitos):
    """Perguntas em inglês: é onde o Jev acerta mais (o olho já traduziu fala e descrição)."""
    q = {
        "fiel": {"type": "noul", "instructions": "Does what is described in `frame.what_is_shown` match what is said in `speech` or the `planned_visual`?",
                 "criteria": {"true": "What is shown illustrates or is clearly related to the speech or to the planned visual.",
                              "false": "What is shown has no relation to the speech or the planned visual, or the subject cannot be recognized."}},
        "qualidade": {"type": "score", "instructions": "How good is the visual quality of this scene according to `frame` (sharpness, lighting, look, empty area)?",
                      "criteria": ["Bad: dark, blurry, amateur-looking, or the subject is unrecognizable or tiny in the frame.",
                                   "Weak: usable, but amateur, dull, or with a large unintended empty area.",
                                   "Good: sharp, well lit, professional-looking.",
                                   "Great: sharp, well lit, professional and visually striking."]},
        "texto_ok": {"type": "noul", "instructions": "Is the on-screen text readable and free of problems? Consider `frame.text_problem`.",
                     "criteria": {"true": "There is no text, or all text is complete, readable and does not overlap other text or a face.",
                                  "false": "Some text is cut off, leaves the frame, overlaps other text, or covers a face."}},
        "responsavel": {"type": "choice", "instructions": "If this scene has any problem according to `frame`, which area must fix it?",
                        "criteria": {"imagem": "The photo or video clip is the problem: dark, blurry, amateur, ugly or off-topic.",
                                     "motion": "The problem is layout, text, captions, animation, framing or an empty area.",
                                     "nenhum": "The scene has no problem."}},
    }
    if tem_defeitos:
        q["repete"] = {"type": "noul", "instructions": "According to `frame`, does the scene show any of the defects listed in `forbidden_defects`?",
                       "criteria": {"true": "A defect from the list appears in this scene.", "false": "No defect from the list appears in this scene."}}
    return q


def jev(state, qs):
    r = subprocess.run([sys.executable, str(RAIZ / "tools/jev.py"), "-"], input=json.dumps({"state": state, "questions": qs}, ensure_ascii=False),
                       capture_output=True, text=True)
    d = json.loads(r.stdout)
    if r.returncode:
        raise SystemExit(f"Jev falhou: HTTP {d.get('http_status')} {d.get('erro_bruto', '')[:300]}")
    return d


def defeitos_do_enzo():
    f = RAIZ / ".claude/memoria/avaliacoes.md"
    if not f.exists():
        return []
    return [m.strip() for m in re.findall(r"\*\*O que está RUIM \(não repetir\):\*\* (.+)", f.read_text())][-15:]


def main():
    if len(sys.argv) < 5:
        sys.exit(__doc__)
    job, mp4, cenas, narr = Path(sys.argv[1]).resolve(), str(Path(sys.argv[2]).resolve()), json.load(open(sys.argv[3])), json.load(open(sys.argv[4]))
    plano = json.load(open(sys.argv[5])) if len(sys.argv) > 5 else {}
    pasta = job / "revisao"
    pasta.mkdir(parents=True, exist_ok=True)
    t0 = time.monotonic()

    chk = checagens(mp4, plano.get("duracao_s"))
    quadros = []
    for c in cenas:
        q = pasta / f"cena-{c['n']:02d}.png"
        t = (c["from"] + c["durationInFrames"] * 0.45) / FPS
        sh("ffmpeg", "-v", "error", "-y", "-ss", f"{t:.2f}", "-i", mp4, "-frames:v", "1", "-vf", "scale=540:-1", str(q))
        quadros.append((c["n"], q, falas_da_cena(narr, c), c.get("visual", "")))
    descricoes, perfil_olho = olhar(pasta, quadros)

    defeitos = defeitos_do_enzo()
    qs = perguntas(bool(defeitos))
    resultado, custo_jev, corrigir, incertos = [], 0.0, {}, []
    for c, d in zip(cenas, descricoes):
        state = {"speech": d.get("speech_en") or falas_da_cena(narr, c) or "(no speech in this scene)", "planned_visual": d.get("planned_visual_en") or c.get("visual", ""),
                 "frame": {k: v for k, v in d.items() if k not in ("scene", "speech_en", "planned_visual_en")}}
        if defeitos:
            state["forbidden_defects"] = defeitos
        r = jev(state, qs)
        custo_jev += (r.get("usage") or {}).get("cost") or 0
        a = r["answers"]
        motivos, duvidas = [], []
        if a["fiel"]["noul"] < FIEL_MIN:
            motivos.append(f"não combina com a fala (fiel={a['fiel']['noul']})")
        midia = str(d.get("visual_type", "")).startswith(("photo", "video"))
        ruins = [f"{k}={d.get(k)}" for k, v in (("lighting", "dark"), ("sharpness", "blurry"), ("look", "amateur")) if midia and str(d.get(k, "")).startswith(v)]
        if ruins:  # regra fixa do código: foto/clipe escuro, borrado ou amador nunca passa (o Enzo reprovou isso em 23/09)
            motivos.append(f"foto/clipe ruim segundo o olho ({', '.join(ruins)})")
        if a["qualidade"]["score"] < QUALIDADE_MIN:
            motivos.append(f"qualidade visual baixa (nota {a['qualidade']['score']}/3)")
        if a["texto_ok"]["noul"] < TEXTO_MIN:
            motivos.append(f"texto com problema: {d.get('text_problem')}")
        if "repete" in a and a["repete"]["noul"] > REPETE_MAX:
            motivos.append("repete um defeito que o Enzo já reprovou")
        for k in ("fiel", "texto_ok", "repete"):
            if k in a and INCERTO[0] <= a[k]["noul"] <= INCERTO[1]:
                duvidas.append(f"{k}={a[k]['noul']}")
        for k in ("qualidade", "responsavel"):
            if a[k].get("confidence", 1) < CONF_MIN:
                duvidas.append(f"{k} confiança {a[k]['confidence']}")
        resp = a["responsavel"]["choice"]
        if motivos:
            if resp == "nenhum":  # Jev achou o problema mas não a área: código decide pelo tipo de defeito
                resp = "imagem" if any(("qualidade" in m or "combina" in m or "foto/clipe" in m) for m in motivos) else "motion"
            if ruins:
                resp = "imagem"
            corrigir.setdefault(resp, []).append({"cena": c["n"], "motivos": motivos, "descricao": d.get("what_is_shown")})
        if duvidas:
            incertos.append({"cena": c["n"], "duvidas": duvidas})
        resultado.append({"cena": c["n"], "status": "reprovada" if motivos else "ok", "motivos": motivos, "duvidas": duvidas,
                          "responsavel": resp if motivos else None, "fala": state["speech"], "olho": d, "jev": a})
    if chk["problemas"]:
        corrigir.setdefault("render", []).append({"cena": None, "motivos": chk["problemas"]})

    resumo = {"aprovado": not corrigir, "corrigir": corrigir, "incertos": incertos, "checagens": chk, "olho_perfil": perfil_olho,
              "jev_custo_usd": round(custo_jev, 6), "segundos": round(time.monotonic() - t0, 1),
              "cenas": [{k: r[k] for k in ("cena", "status", "motivos")} for r in resultado]}
    (pasta / "revisao.json").write_text(json.dumps({**resumo, "detalhe": resultado}, ensure_ascii=False, indent=1))
    print(json.dumps(resumo, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()
