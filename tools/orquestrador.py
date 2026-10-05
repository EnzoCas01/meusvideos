#!/usr/bin/env python3
"""Orquestrador do vídeo: o CÓDIGO comanda o fluxo; modelos só fazem o trabalho de cada etapa e o Jev decide.

Uso: python3 tools/orquestrador.py <pasta_do_job>      (a pasta tem pedido.json, gravado pelo painel)
Fluxo: triagem (Jev escolhe modo e degrau de modelo) → plano (diretor, uma vez) → agentes na ordem, cada entrega
conferida por código (falhou: repete com o erro; falhou de novo: sobe um degrau da escada de modelos) →
render (script) → revisão cena a cena (olho + Jev) → correções (máx. 2 voltas) → entrega em <pasta>/video.mp4.
Imprime no fim o resumo que o painel mostra.
"""
import json
import os
import re
import shutil
import subprocess
import sys
import time
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
AGENTE = os.environ.get("ORQ_AGENTE", str(RAIZ / "tools/agente.sh"))
RENDER = os.environ.get("ORQ_RENDER", str(RAIZ / "tools/render.sh"))
REVISAO = os.environ.get("ORQ_REVISAO", str(RAIZ / "tools/revisao.py"))
LIMITE_AGENTE_S = 90 * 60
VOLTAS_REVISAO = 2
ORDEM = {"novo": ["imagem", "narracao", "motion", "som"], "bruto": ["narracao", "imagem", "motion", "som"]}

JOB = Path(sys.argv[1]).resolve() if len(sys.argv) == 2 else sys.exit(__doc__)
PEDIDO = json.loads((JOB / "pedido.json").read_text())
MODELOS = json.loads((RAIZ / "modelos.json").read_text())
ENV = {**os.environ, "JOB_DIR": str(JOB)}
REGISTRO = []  # linhas do resumo final
USADOS = {}    # agente -> perfis usados


def diz(msg):
    """Registro do orquestrador: vai para a linha 'agora' do painel e para o resumo."""
    with open(JOB / "orquestrador-atividade.log", "a") as f:
        f.write(f"[{time.strftime('%H:%M:%S')}] FALA: {msg}\n")
    print(msg, file=sys.stderr, flush=True)


def etapa(nome, texto):
    with open(RAIZ / "ds.log", "a") as f:
        f.write(f"[{time.strftime('%F %T')}] ▶ {nome} · {texto[:110]}\n")


def jev(state, perguntas):
    r = subprocess.run([sys.executable, str(RAIZ / "tools/jev.py"), "-"], input=json.dumps({"state": state, "questions": perguntas}, ensure_ascii=False),
                       capture_output=True, text=True, env=ENV)
    try:
        d = json.loads(r.stdout)
    except ValueError:
        d = {}
    if r.returncode or "answers" not in d:
        diz(f"Jev indisponível ({d.get('http_status')}): seguindo com o padrão mais barato")
        return None
    return d["answers"]


def roda_agente(ag, tarefa, perfil, esforco):
    arq = JOB / f"tarefa-{ag}.txt"
    arq.write_text(tarefa)
    p = subprocess.Popen([AGENTE, ag, f"@{arq}"], cwd=RAIZ, env={**ENV, "AGENTE_PERFIL": perfil, "AGENTE_ESFORCO": esforco}, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    try:
        out, _ = p.communicate(timeout=LIMITE_AGENTE_S)
    except subprocess.TimeoutExpired:
        subprocess.run(["pkill", "-TERM", "-P", str(p.pid)])
        p.kill()
        out = f"{ag} passou de {LIMITE_AGENTE_S // 60} min e foi interrompido"
    USADOS.setdefault(ag, []).append(f"{perfil}/{esforco}")
    out = (out or "").strip()
    if re.search(r"(hit your|weekly|session|usage) limit", out, re.I):
        raise RuntimeError(f"{ag} bloqueado pelo limite do Claude (assinatura): {out[:160]}")
    return out


def tsc():
    r = subprocess.run(["npx", "tsc", "--noEmit"], cwd=RAIZ, capture_output=True, text=True)
    return [] if r.returncode == 0 else ["`npx tsc --noEmit` falhou:\n" + (r.stdout + r.stderr)[-1500:]]


# ---------------- conferências (o que cada entrega PRECISA ter) ----------------
def confere(ag, plano):
    sx, peca = plano.get("sx", ""), plano.get("peca", "")
    erros = []
    if ag == "diretor":
        try:
            p = json.loads((JOB / "plano.json").read_text())
        except (OSError, ValueError) as e:
            return [f"plano.json ausente ou inválido: {e}"]
        for k in ("peca", "sx", "modo", "duracao_s", "cenas", "tarefas"):
            if k not in p:
                erros.append(f"plano.json sem o campo {k}")
        if erros:
            return erros
        if not re.fullmatch(r"[A-Z][A-Za-z0-9]{2,40}", str(p["peca"])):
            erros.append("peca precisa ser PascalCase, só letras e números")
        if not re.fullmatch(r"[a-z]{2,5}", str(p["sx"])):
            erros.append("sx precisa ter 2 a 5 letras minúsculas")
        if not PEDIDO.get("parentId") and ((RAIZ / f"src/{p['peca']}.tsx").exists() or (RAIZ / f"src/narration-{p['sx']}.json").exists()):
            erros.append(f"já existe peça com esse nome ou sufixo ({p['peca']}/{p['sx']}): escolha outro")
        if not isinstance(p["cenas"], list) or not p["cenas"]:
            erros.append("cenas vazia")
        if not PEDIDO.get("parentId") and not (p["tarefas"].get("narracao") and p["tarefas"].get("motion")):
            erros.append("tarefas de narracao e motion são obrigatórias")
        return erros
    if ag == "imagem":
        try:
            m = json.loads((JOB / "midia.json").read_text())
        except (OSError, ValueError) as e:
            return [f"midia.json ausente ou inválido: {e}"]
        if not isinstance(m, list):
            return ["midia.json precisa ser uma lista"]
        for it in m:
            if it.get("arquivo") and not (RAIZ / it["arquivo"]).exists():
                erros.append(f"arquivo citado não existe: {it['arquivo']}")
        # toda cena tem mídia (nada de tela escura só com legenda) e fotos também entram (pedido do Enzo, 23/09)
        com_midia = {it.get("cena") for it in m if it.get("arquivo") and it.get("tipo") in ("foto", "clipe")}
        sem = [c.get("n") for c in plano.get("cenas", []) if c.get("n") not in com_midia]
        if sem:
            erros.append(f"cenas sem foto nem clipe: {sem} — toda cena precisa de mídia")
        fotos, minimo = sum(1 for it in m if it.get("tipo") == "foto" and it.get("arquivo")), max(1, len(plano.get("cenas", [])) // 3)
        if fotos < minimo:
            erros.append(f"só {fotos} foto(s): use pelo menos {minimo} fotos (tools/fetch-images.mjs), não só clipes")
        return erros
    if ag == "narracao":
        f = RAIZ / f"src/narration-{sx}.json"
        try:
            n = json.loads(f.read_text())
        except (OSError, ValueError) as e:
            return [f"src/narration-{sx}.json ausente ou inválido: {e}"]
        linhas = n.get("lines") or []
        if not linhas or any(not (l.get("id") and str(l.get("text", "")).strip()) for l in linhas):
            return ["cada fala precisa de id e text"]
        if plano.get("modo") != "bruto":
            return []  # voz, pausas e tempo das palavras são feitos pelo código logo depois (voz())
        if any(not l.get("words") for l in linhas):
            erros.append("toda fala precisa de words com tempo medido")
        if plano.get("modo") == "bruto":
            if not (RAIZ / f"public/bruto/{sx}/fonte.mp4").exists():
                erros.append(f"public/bruto/{sx}/fonte.mp4 não existe (rode tools/bruto.py)")
        else:
            faltam = [l["id"] for l in linhas if not (RAIZ / f"public/audio/vo-{sx}/{l['id']}.wav").exists()]
            if faltam:
                erros.append(f"áudio faltando em public/audio/vo-{sx}/: {', '.join(faltam[:6])}")
        return erros
    if ag == "motion":
        if not (RAIZ / f"src/{peca}.tsx").exists():
            erros.append(f"src/{peca}.tsx não existe")
        if f'id="{peca}"' not in (RAIZ / "src/Root.tsx").read_text():
            erros.append(f'composição id="{peca}" não registrada em src/Root.tsx')
        try:
            c = json.loads((JOB / "cenas.json").read_text())
            if not c or any(not isinstance(x.get(k), int) for x in c for k in ("n", "from", "durationInFrames")):
                erros.append("cenas.json precisa de n, from e durationInFrames inteiros em cada cena")
        except (OSError, ValueError) as e:
            erros.append(f"cenas.json ausente ou inválido: {e}")
        return erros or tsc()
    if ag == "som":
        return tsc()
    return erros


ENTREGA = {
    "diretor": lambda p: f"Grave o plano em {JOB}/plano.json (formato do seu arquivo de agente).",
    "imagem": lambda p: f"Grave {JOB}/midia.json: lista com uma entrada por cena, [{{\"cena\": 1, \"tipo\": \"clipe|foto\", \"arquivo\": \"public/...\", \"licenca\": \"...\"}}]. TODA cena precisa de uma foto ou clipe (nenhuma cena vazia) e pelo menos {max(1, len(p.get('cenas', [])) // 3)} cenas com FOTO (busque com tools/fetch-images.mjs, não só clipes). Todo arquivo citado tem que existir. Clipe feio, escuro ou fora do assunto não entra: nesse caso use foto.",
    "narracao": lambda p: (f"Rode `.venv-whisper/bin/python tools/bruto.py {(PEDIDO.get('brutos') or ['<vídeo do Enzo>'])[0]} {p['sx']}` e corrija só o texto de palavras erradas em src/narration-{p['sx']}.json."
                           if p.get("modo") == "bruto" else
                           f"Escreva SÓ o roteiro em src/narration-{p['sx']}.json: {{\"voice\": \"pt-BR-AntonioNeural\", \"lines\": [{{\"id\": \"01-gancho\", \"text\": \"frase falada\"}}, ...]}}. "
                           "Uma fala por frase ou ideia curta, na ordem, sem reticências. NÃO gere a voz, NÃO rode tools/generate-narration-edge.py nem word-timings, NÃO use atempo: "
                           "o orquestrador gera a voz com velocidade fixa, corta as pausas e mede o tempo de cada palavra logo depois."),
    "motion": lambda p: f"Toda cena mostra a foto/clipe do midia.json ocupando o quadro: NENHUM trecho só com fundo escuro e legenda. A timeline segue exatamente os frames de src/narration-{p['sx']}.json (a voz é contínua): não crie pausa nem espera entre cenas. src/{p['peca']}.tsx exportando o componente {p['peca']}; <Composition id=\"{p['peca']}\"> registrada em src/Root.tsx (1080x1920, 30 fps, duração derivada da narração); `npx tsc --noEmit` sem erro; e {JOB}/cenas.json com os frames REAIS da timeline: [{{\"n\": 1, \"from\": 0, \"durationInFrames\": 90, \"visual\": \"o que a cena mostra\"}}].",
    "som": lambda p: "Efeitos só em eventos visuais, sempre abaixo da voz, sem trilha (salvo pedido); `npx tsc --noEmit` sem erro.",
}


def cabecalho(p, ag):
    cenas = "\n".join(f"  {c.get('n')}. {c.get('fala', '')} → {c.get('visual', '')} ({c.get('duracao_s', '?')} s)" for c in p.get("cenas", []))
    leg = f"\nLEGENDA: {PEDIDO.get('legenda', '')}" if ag == "motion" else ""
    return (f"PEÇA: {p['peca']} (sufixo {p['sx']}) · MODO: {p['modo']} · DURAÇÃO: {p.get('duracao_s')} s · 1080x1920, 30 fps\n"
            f"OBJETIVO: {p.get('objetivo', '')}\nABERTURA: {p.get('abertura', '')}\nCENAS DO PLANO:\n{cenas}{leg}\n\n")


def executa(ag, tarefa_base, plano, escolha=None):
    """Roda o agente no modelo/esforço que a triagem escolheu e confere a entrega.
    Falhou: repete com o erro. Falhou de novo: sobe um degrau na escada de modelos (esforço alto)."""
    escolha = escolha or ESCOLHAS.get(ag) or {"degrau": 0, "esforco": "medium"}
    escada = MODELOS["escadas"].get(ag) or [MODELOS["agentes"][ag]]
    erros, tentativa = [], 0
    for i in range(min(escolha["degrau"], len(escada) - 1), len(escada)):
        esforco = escolha["esforco"] if i == escolha["degrau"] else "high"
        for _ in range(2):
            tentativa += 1
            extra = f"\n\nTENTATIVA ANTERIOR FALHOU na conferência do código:\n- " + "\n- ".join(erros) + "\nCorrija isso." if erros else ""
            diz(f"{ag}: tentativa {tentativa} com {escada[i]} (esforço {esforco})")
            roda_agente(ag, f"{tarefa_base}\n\nENTREGA OBRIGATÓRIA (conferida por código):\n{ENTREGA[ag](plano)}{extra}", escada[i], esforco)
            p = json.loads((JOB / "plano.json").read_text()) if ag == "diretor" and (JOB / "plano.json").exists() else plano
            erros = confere(ag, p)
            if not erros:
                REGISTRO.append(f"- {ag}: ok com {escada[i]}, esforço {esforco} ({tentativa}ª tentativa)")
                return p
            diz(f"{ag} falhou: {erros[0][:150]}")
    REGISTRO.append(f"- {ag}: FALHOU após {tentativa} tentativas: {erros[0][:300]}")
    raise RuntimeError(f"{ag} não entregou: {'; '.join(erros)[:500]}")


# ---------------- triagem: ANTES do vídeo, o Jev julga o trabalho de cada agente; o código escolhe modelo e esforço ----------------
# O que é "fácil / médio / difícil" para cada agente — critérios que o Jev lê ao pé da letra.
DIFICULDADE = {  # em inglês: é onde o Jev acerta mais
    "diretor": ("planning this video: defining the scenes and writing each agent's task",
                ["Easy: short, direct video; the request already says almost everything.",
                 "Medium: several scenes must be structured and an approach chosen.",
                 "Hard: long story, many facts, elaborate narrative structure, or a vague request that needs a lot of creation."]),
    "imagem": ("finding good stock photos and video clips for each scene",
               ["Easy: few scenes, common subjects easy to find in stock libraries (coffee, city, people working).",
                "Medium: several scenes or somewhat specific subjects.",
                "Hard: historical images, a specific company or person, or rare subjects."]),
    "narracao": ("writing the spoken script and generating the voice",
                 ["Easy: the request already contains the full spoken text, or it is the creator's own recorded video (only transcribe).",
                  "Medium: write a short ad, tip or motivational script with no facts to research.",
                  "Hard: write a script with real facts, dates or numbers that must be researched and verified."]),
    "motion": ("building the scenes and animations in code (Remotion)",
               ["Easy: text, photos or clips with basic movement.",
                "Medium: several scenes with text animations, transitions and captions.",
                "Hard: elaborate animations, many elements, charts, data, counters or special effects."]),
    "som": ("placing sound effects on visual events",
            ["Easy: few or no effects.", "Medium: several synchronized effects.", "Hard: elaborate sound design or background music requested."]),
}
NIVEL = {0: {"degrau": 0, "esforco": "low"}, 1: {"degrau": 0, "esforco": "medium"}, 2: {"degrau": 1, "esforco": "high"}}
CONF_MIN = 0.5
ESCOLHAS = {}


def triagem():
    brutos = PEDIDO.get("brutos") or []
    edicao = bool(PEDIDO.get("parentId"))
    etapa("triagem", "Jev julga cada agente e escolhe modelo e esforço")
    tipo = "editing an already finished video" if edicao else "editing the creator's own recorded video" if brutos else "a new video"
    qs = {f"dif_{ag}": {"type": "score", "instructions": f"For this request ({tipo}; the request text is in Portuguese), how hard is the work of {oque}?", "criteria": crit}
          for ag, (oque, crit) in DIFICULDADE.items()}
    if edicao:
        for ag, q, t in [
            ("imagem", "Does this edit request require replacing or finding a photo or video clip?", "It asks for another image, another clip, or more or less media."),
            ("narracao", "Does this edit request require changing the spoken text, the voice or the speech pace?", "It asks to change what is said, the voice, the speed or the pauses of the speech."),
            ("motion", "Does this edit request require changing something visual: on-screen text, captions, layout, animation, colors, scene order or scene duration?", "It asks for a visual change or a scene timing change."),
            ("som", "Does this edit request require changing sound effects or music?", "It asks for sound effects, music or sound volume.")]:
            qs[f"agir_{ag}"] = {"type": "noul", "instructions": q, "criteria": {"true": t, "false": "The request does not ask for this."}}
    elif not brutos:
        qs["modo"] = {"type": "choice", "instructions": "What kind of video does the request describe?",
                      "criteria": {"historia": "It tells a journey through time: the story of a company, person or invention, a 'did you know', a chronology.",
                                   "livre": "Anything else: ad, promotion, tutorial, list, motivational, institutional."}}
    a = jev({"pedido": PEDIDO["prompt"][:4000], "tipo": tipo}, qs)

    linhas = []
    for ag in DIFICULDADE:
        r = (a or {}).get(f"dif_{ag}")
        if not r:
            nivel, motivo = 1, "Jev indisponível → médio"
        elif r.get("confidence", 0) < CONF_MIN:
            nivel, motivo = 1, f"Jev incerto (nota {r['score']}, conf {r['confidence']}) → médio"
        else:
            nivel, motivo = min(2, max(0, round(r["score"]))), f"nota {r['score']}/2, conf {r['confidence']}"
        escada = MODELOS["escadas"][ag]
        ESCOLHAS[ag] = dict(NIVEL[nivel])
        ESCOLHAS[ag]["perfil"] = escada[min(ESCOLHAS[ag]["degrau"], len(escada) - 1)]
        linhas.append({"agente": ag, "nivel": ["fácil", "médio", "difícil"][nivel], "perfil": ESCOLHAS[ag]["perfil"], "esforco": ESCOLHAS[ag]["esforco"], "porque": motivo})
    (JOB / "modelos-escolhidos.json").write_text(json.dumps(linhas, ensure_ascii=False, indent=1))
    REGISTRO.append("- modelos escolhidos pelo Jev: " + "; ".join(f"{l['agente']} {l['perfil']}/{l['esforco']} ({l['nivel']})" for l in linhas))

    if edicao:
        precisa = {k: (a is None or a[f"agir_{k}"]["noul"] >= 0.35) for k in ("imagem", "narracao", "motion", "som")}
        if precisa["imagem"] or precisa["narracao"]:
            precisa["motion"] = True  # mídia ou fala nova precisa ser integrada na timeline
        REGISTRO.append("- agentes da edição (Jev): " + ", ".join(k for k, v in precisa.items() if v))
        return "edicao", [k for k in ORDEM["novo"] if precisa[k]]
    if brutos:
        return "bruto", ORDEM["bruto"]
    modo = a["modo"]["choice"] if a and a["modo"].get("confidence", 0) >= CONF_MIN else "livre"
    REGISTRO.append(f"- modo (Jev): {modo}")
    return modo, ORDEM["novo"]


def pedido_ao_diretor(modo, agentes):
    base = (f"PEDIDO DO PAINEL (ninguém responde perguntas; decida sozinho).\nPedido do Enzo:\n\"\"\"{PEDIDO['prompt']}\"\"\"\n"
            f"Modo sugerido pela triagem: {modo}.\nLegenda escolhida: {PEDIDO.get('legenda', '')}\n")
    if PEDIDO.get("brutos"):
        base += f"MODO VÍDEO BRUTO: o vídeo do Enzo é {', '.join(PEDIDO['brutos'])} (a voz é a dele; não gere voz).\n"
    if modo == "edicao":
        pai = Path(PEDIDO["parent"]["dir"])
        antigo = (pai / "plano.json").read_text() if (pai / "plano.json").exists() else f"(sem plano.json) peça: {(pai / 'peca.json').read_text() if (pai / 'peca.json').exists() else '?'}\nresumo: {PEDIDO['parent'].get('resumo', '')[:2500]}"
        base = (f"EDIÇÃO de um vídeo pronto. O que o Enzo quer mudar:\n\"\"\"{PEDIDO['prompt']}\"\"\"\nPlano anterior:\n{antigo}\n"
                f"Agentes que precisam agir (triagem do Jev): {', '.join(agentes)}. Escreva tarefa só para eles; os outros ficam \"\".\n"
                f"Legenda: {PEDIDO.get('legenda', '')}\n")
    return base


def voz(plano):
    """Gera a voz com velocidade fixa, corta as pausas e mede cada palavra — tudo em código, sem agente."""
    sx = plano["sx"]
    f = RAIZ / f"src/narration-{sx}.json"
    n = json.loads(f.read_text())
    n.update({"voice": n.get("voice") or "pt-BR-AntonioNeural", "engine": "edge-tts", "headFrames": 6, "tailFrames": 12, "ellipsisPauseMs": 0})
    for l in n["lines"]:
        l["gapAfter"] = 3  # 0,1 s entre falas: a próxima começa logo que a anterior termina
        l.setdefault("frame", 0)
    f.write_text(json.dumps(n, ensure_ascii=False, indent=1))
    etapa("narracao", f"voz de {len(n['lines'])} falas (código)")
    diz(f"gerando a voz de {len(n['lines'])} falas (velocidade fixa, pausas cortadas)")
    for cmd in (["python3", "-u", "tools/generate-narration-edge.py", str(f), f"public/audio/vo-{sx}"],
                [str(RAIZ / ".venv-whisper/bin/python"), "tools/word-timings.py", str(f), f"public/audio/vo-{sx}"]):
        r = subprocess.run(cmd, cwd=RAIZ, capture_output=True, text=True, env={**ENV, "FORCE": "1", "ELEVEN": "1"})
        if r.returncode:
            raise RuntimeError(f"{cmd[1] if cmd[0] == 'python3' else cmd[1]} falhou: {(r.stdout + r.stderr)[-500:]}")
    n = json.loads(f.read_text())
    faltam = [l["id"] for l in n["lines"] if not l.get("words") or not (RAIZ / f"public/audio/vo-{sx}/{l['id']}.wav").exists()]
    if faltam:
        raise RuntimeError(f"voz sem áudio ou sem tempo de palavra em: {', '.join(faltam)}")
    fala = sum(l["durationInFrames"] for l in n["lines"]) / 30
    REGISTRO.append(f"- voz (código): {len(n['lines'])} falas, {fala:.1f} s de fala, {sum(len(l['text']) for l in n['lines']) / max(fala, 1):.1f} caracteres/s")


def entrega(plano, mp4):
    shutil.copy(mp4, JOB / "video.mp4")
    (JOB / "peca.json").write_text(json.dumps({"peca": plano["peca"], "sufixo": plano["sx"], "composicao": plano["peca"], "mp4": str(Path(mp4).relative_to(RAIZ))}, ensure_ascii=False))
    linhas = []
    try:
        for it in json.loads((JOB / "midia.json").read_text()):
            if it.get("arquivo"):
                linhas.append(f"Cena {it.get('cena')}: {it['arquivo']} — {it.get('licenca') or 'licença não informada'}")
    except (OSError, ValueError):
        pass
    (JOB / "creditos.txt").write_text("Créditos de imagens e vídeos\n\n" + ("\n".join(linhas) or "Sem mídia de terceiros.") + "\n")


def main():
    t0 = time.time()
    modo, agentes = triagem()
    diz(f"triagem: modo {modo}; agentes {', '.join(agentes)}; " + "; ".join(f"{k} {v['perfil']}/{v['esforco']}" for k, v in ESCOLHAS.items()))
    if modo == "edicao":
        pai = Path(PEDIDO["parent"]["dir"])
        for nome in ("plano.json", "cenas.json", "midia.json"):
            if (pai / nome).exists():
                shutil.copy(pai / nome, JOB / nome)
    etapa("diretor", "planejando")
    plano = executa("diretor", pedido_ao_diretor(modo, agentes) + f"\nGrave o plano em {JOB}/plano.json.", {})
    if modo != "edicao":
        agentes = [a for a in agentes if a in ("narracao", "motion") or plano["tarefas"].get(a)]
    for ag in agentes:
        tarefa = plano["tarefas"].get(ag) or ""
        if not tarefa and ag not in ("motion",):
            continue
        executa(ag, cabecalho(plano, ag) + (tarefa or "Integre na timeline as mudanças feitas pelos outros agentes nesta edição."), plano)
        if ag == "narracao" and plano.get("modo") != "bruto":
            voz(plano)

    mp4 = str(RAIZ / f"out/{plano['peca'].lower()}.mp4")
    aprovado, rev = False, {}
    for volta in range(VOLTAS_REVISAO + 1):
        etapa("render", f"{plano['peca']} (volta {volta})")
        r = subprocess.run([RENDER, plano["peca"], mp4], cwd=RAIZ, capture_output=True, text=True)
        try:
            ren = json.loads(r.stdout.strip().splitlines()[-1])
        except (ValueError, IndexError):
            ren = {"ok": False, "erro": (r.stdout + r.stderr)[-600:]}
        if not ren.get("ok"):
            diz(f"render falhou: {ren.get('erro', '')[:200]}")
            if volta == VOLTAS_REVISAO:
                raise RuntimeError(f"render falhou: {ren.get('erro')}")
            executa("motion", cabecalho(plano, "motion") + f"O RENDER FALHOU com este erro; corrija o código da peça sem mudar o conteúdo:\n{ren.get('erro')}", plano)
            continue
        diz(f"render ok: {ren.get('duracao')} s em {ren.get('segundos')} s")
        etapa("revisao", f"Jev cena a cena (volta {volta})")
        r = subprocess.run([sys.executable, REVISAO, str(JOB), mp4, str(JOB / "cenas.json"), str(RAIZ / f"src/narration-{plano['sx']}.json"), str(JOB / "plano.json")],
                           cwd=RAIZ, capture_output=True, text=True, env=ENV)
        try:
            rev = json.loads(r.stdout)
        except ValueError:
            diz(f"revisão não rodou: {(r.stdout + r.stderr)[-300:]}")
            rev = {"aprovado": False, "erro": "a revisão não rodou"}
            break
        if rev.get("aprovado"):
            aprovado = True
            break
        reprov = {ag: [f"cena {x['cena']}: {'; '.join(x['motivos'])} (hoje aparece: {x.get('descricao', '?')})" for x in lst] for ag, lst in rev["corrigir"].items()}
        diz("revisão reprovou: " + "; ".join(f"{ag} {len(v)}" for ag, v in reprov.items()))
        if volta == VOLTAS_REVISAO:
            break
        if "imagem" in reprov:
            executa("imagem", cabecalho(plano, "imagem") + "CORREÇÃO pedida pela revisão (Jev). Troque a mídia destas cenas por algo nítido, bem iluminado, profissional e fiel à fala — ou foto, se ficar melhor:\n- "
                    + "\n- ".join(reprov["imagem"]) + "\nAtualize midia.json (mesmo formato), mantendo as outras cenas.", plano)
        motivos_motion = reprov.get("motion", []) + reprov.get("render", [])
        if motivos_motion or "imagem" in reprov:
            executa("motion", cabecalho(plano, "motion") + "CORREÇÃO pedida pela revisão (Jev). Mantenha tudo que não for citado.\n"
                    + ("- " + "\n- ".join(motivos_motion) + "\n" if motivos_motion else "")
                    + ("O `imagem` trocou a mídia das cenas reprovadas: use os arquivos novos de midia.json.\n" if "imagem" in reprov else ""), plano)

    entrega(plano, mp4)
    REGISTRO.append(f"- revisão: {'APROVADO' if aprovado else 'NÃO RODOU — vídeo entregue SEM revisão' if rev.get('erro') else 'entregue COM PENDÊNCIAS (limite de voltas)'}"
                    + (f"; pendências: {json.dumps(rev.get('corrigir'), ensure_ascii=False)[:600]}" if not aprovado and rev.get("corrigir") else "")
                    + (f"; incertezas do Jev: {rev.get('incertos')}" if rev.get("incertos") else ""))
    print(f"**{plano['peca']}** · modo {plano['modo']} · {len(plano['cenas'])} cenas · {(time.time() - t0) / 60:.0f} min\n\n"
          + "\n".join(REGISTRO) + "\n\nModelos usados: " + "; ".join(f"{a}: {', '.join(p)}" for a, p in USADOS.items()))


if __name__ == "__main__":
    try:
        main()
    except RuntimeError as e:
        print("Não consegui terminar o vídeo.\n\n" + "\n".join(REGISTRO) + f"\n\nMotivo: {e}")
        sys.exit(1)
