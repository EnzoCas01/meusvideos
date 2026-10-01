#!/usr/bin/env python3
"""Fluxo de POST/CARROSSEL 100% Jev: NENHUMA outra IA (sem olho, sem glm, sem deepseek).
As palavras do post são as do Enzo (vêm no pedido). O Jev decide tema, formato,
layout e ícone; o código monta a spec e renderiza as imagens. Sempre 3 versões
(post: 3 imagens; carrossel: 3 carrosséis): a 1ª é a escolha do Jev, a 2ª e a 3ª
usam a 2ª e a 3ª opção dele em tema, receita e decoração. "Outra versão" re-decide tudo.
Uso: python3 tools/orquestrador-post.py <pasta_do_job>
A pasta tem pedido.json (gravado pelo painel): {prompt, modo: post|carrossel}.
Entrega: <pasta>/slides/slide-NN.jpg + entrega.json.
"""
import hashlib
import random
import threading
from concurrent.futures import ThreadPoolExecutor
import json
import os
import re
import subprocess
import sys
import time
import unicodedata
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
JOB = Path(sys.argv[1]).resolve() if len(sys.argv) == 2 else sys.exit(__doc__)
PEDIDO = json.loads((JOB / "pedido.json").read_text())
ENV = {**os.environ, "JOB_DIR": str(JOB)}
REGISTRO = []
FORMATO = PEDIDO["modo"]  # post | carrossel


def separa_visual(texto):
    """'... Imagem: <como a arte deve ser>' no fim do pedido: o texto do post fica sem ela; a descrição vai ao Jev e à busca de foto."""
    m = re.search(r"(?:^|\s)(?:Imagem|Visual)\s*:\s*(.+)$", texto, re.I | re.S)
    return (texto[:m.start()].strip(), m.group(1).strip()) if m else (texto.strip(), "")


TEXTO_POST, VISUAL = separa_visual(PEDIDO["prompt"])


def linha_visual(rotulo):
    """Uma linha do bloco Imagem ("- Foto: ...", "- Ícone: ...")."""
    m = re.search(rf"(?im)^[\s\-•*]*{rotulo}\s*:\s*(.+)$", VISUAL)
    return m.group(1).strip() if m else ""


FOTO_PEDIDA, ICONE_PEDIDO = linha_visual("Foto"), linha_visual("[ÍI]cone")
# texto extra do post (escrito pelo assessor): Selo: "NOVIDADE" · Pontos: "a" | "b" | "c"
_m = re.search(r'(?im)^\s*Selo\s*:\s*["“]([^"”\n]+)["”]', TEXTO_POST)
SELO = _m.group(1).strip() if _m else ""
_m = re.search(r"(?im)^\s*Pontos\s*:\s*(.+)$", TEXTO_POST)
PONTOS = [x.strip() for x in re.findall(r'["“]([^"”]+)["”]', _m.group(1))][:3] if _m else []
TEXTO_POST = re.sub(r"(?im)^\s*(?:Selo|Pontos)\s*:.*$\n?", "", TEXTO_POST).strip()
DIMS = [1080, 1920] if PEDIDO.get("formato") == "stories" else [1080, 1080]  # escolhido no painel: Stories 9:16 ou Feed 1:1
try:
    LOGO_PX = int(json.loads((RAIZ / "painel/config.json").read_text()).get("logo_px", 90))
except (OSError, ValueError):
    LOGO_PX = 90
JEV = ["python3", str(RAIZ / "tools/jev.py"), "-"]
CONF_MIN = 0.5
VERSOES = 3
# fundo de cada versão: o Jev escolhe (versão n = n-ésima opção dele); fundo_var sorteado muda ângulo/posição
FUNDOS_EN = {
    "solido": "Plain solid brand colour. Clean, lets the content speak.",
    "gradiente": "Smooth diagonal colour gradient. Modern, soft depth.",
    "brilho": "Radial glow from the centre. Premium, spotlight feel.",
    "dividido_baixo": "Diagonal colour band along the bottom edge. Dynamic.",
    "dividido_topo": "Diagonal colour band along the top edge. Dynamic.",
    "faixa_lateral": "Thin accent stripe down one side. Editorial, structured.",
    "circulos": "Big soft circles in two corners. Friendly, rounded.",
    "listras": "Diagonal stripes. Energetic, bold.",
    "pontos": "Dot grid pattern (little dots / bolinhas). Techy, organised.",
    "duas_cores": "Background split in two colour blocks. Graphic, modern.",
    "invertido": "Light background with dark text (inverted theme). Clean, bright.",
}
FUNDOS = list(FUNDOS_EN)
LUZES = {
    "nenhuma": "No light effect.",
    "holofote": "A soft spotlight from the top centre lighting the content. Stage, premium, 'look here'.",
    "raios": "Light rays coming from a top corner. Revelation, hope, energetic.",
    "bokeh": "Blurred glowing light dots (bolinhas de luz) scattered around. Magical, festive, modern.",
    "vinheta": "Darker edges that focus the eye on the centre. Cinematic, dramatic.",
    "brilho_canto": "A warm glow from one top corner. Subtle premium lighting.",
}
SOMBRAS = {
    "nenhuma": "Flat text, no shadow.",
    "suave": "Soft drop shadow under the text. Depth and legibility, subtle.",
    "forte": "Hard, offset shadow under the text. Bold, poster-like impact.",
    "brilho": "Glowing halo in the accent colour around the text. Neon, techy, eye-catching.",
}
JEV_LOG = []  # cada pergunta ao Jev, para o painel mostrar como ele decidiu
SOLUCOES = {
    "balao": "The solution in a large speech bubble, connected to the visual.",
    "antes_depois": "Title is the before state, an arrow leads to the prominent solution as after.",
    "simples": "The solution sentence as normal text under the title.",
    "faixa": "The solution sentence inside a strong full-width band in the accent colour. Bold, impossible to miss.",
    "cartao": "The solution sentence inside a card with an accent bar, like a highlighted answer.",
    "grande": "The solution sentence big and in the accent colour, like a second headline.",
}
VARIA = ["tema", "receita", "decoracao", "icone_estilo", "enfeite", "destaque", "fundo_estilo", "luz", "sombra", "solucao"]  # o que muda de uma versão para outra
# Pedido escrito com todas as letras vale nas 3 versões (o Jev decide só o que o pedido não disse).
PEDIDOS_EXPLICITOS = [
    ("luz", r"bolinhas? de luz|bokeh|luzes desfocad", "bokeh"),
    ("luz", r"holofote|spot ?light|luz de palco", "holofote"),
    ("luz", r"raios? de luz|feixes? de luz|raios de sol", "raios"),
    ("luz", r"vinheta|bordas escur", "vinheta"),
    ("sombra", r"neon|texto brilhando|brilho no texto|letras? brilhando", "brilho"),
    ("sombra", r"sombra forte|sombra dura", "forte"),
    ("sombra", r"sombra suave|sombra leve", "suave"),
    ("fundo_estilo", r"listras|listrad", "listras"),
    ("fundo_estilo", r"fundo (?:de |com )?(?:bolinhas|pontinhos|pontilhad)|bolinhas no fundo|\bpoa\b", "pontos"),
    ("fundo_estilo", r"degrade|gradiente", "gradiente"),
    ("fundo_estilo", r"fundo claro|fundo branco", "invertido"),
    ("fundo_estilo", r"faixa lateral", "faixa_lateral"),
    ("fundo_estilo", r"fundo (?:de |com )?circulos", "circulos"),
    ("fundo_estilo", r"fundo liso", "solido"),
]
# Pedido genérico ("com luz", "com sombra"): o Jev escolhe QUAL, mas "nenhuma" não vale.
PEDIDOS_GENERICOS = [("luz", r"\bluz\b|\bluzes\b|ilumina|brilhant"), ("sombra", r"\bsombra")]
sys.path.insert(0, str(RAIZ / "tools"))
from fotos import fotos_para  # noqa: E402  biblioteca de fotos + busca pelo DeepSeek (Pexels/Pixabay)
from vocab_arte import VOCAB, SEM_FOTO, escolhas_visuais  # noqa: E402  mesmas frases que o assessor escreve no bloco Imagem
# A foto é sempre um PEDAÇO da arte; o resto é o fundo na cor da marca (pedido do Enzo: nada de foto no fundo inteiro).
FOTO_LAYOUTS = {
    "topo_cartao": "Photo as a rounded card in the upper part, text centred below. Safe for any photo with a clear subject.",
    "circulo": "Photo cropped in a circle at the top with a brand-colour ring. Best for a single object, hands or a face.",
    "polaroid": "Photo as a slightly tilted instant-photo print with a white border and shadow. Friendly, human, real-life scenes.",
    "arco": "Photo inside an arch-shaped window (rounded top, straight bottom). Elegant, modern, good for vertical subjects.",
    "recorte_diagonal": "Photo across the top with a diagonal bottom edge cutting into the colour background. Dynamic, energetic.",
    "metade_superior": "Photo across the top part that fades smoothly into the background colour. Cinematic, good for wide scenes.",
}
ICONE_ESTILOS = {
    "circulo_suave": "Outline icon inside a soft circle. Clean and neutral.",
    "preenchido": "Big solid (filled) icon in the accent colour, no container. Bold and modern.",
    "selo_quadrado": "Icon inside a rounded square badge filled with the accent colour. App-like, confident.",
    "aneis": "Icon surrounded by two thin concentric rings. Elegant, techy.",
    "marca_dagua": "Huge faint icon as a background watermark plus the normal icon. Editorial, layered.",
    "brilho": "Icon with a soft glowing halo behind it. Premium, highlighted.",
    "mancha": "Icon over an organic colour blob shape. Friendly, playful.",
}
ENFEITES = {
    "nenhum": "No extra ornament; minimal.",
    "brilhos": "A few small sparkle stars around the content. Celebratory, positive.",
    "seta": "A hand-drawn curved arrow pointing to the main visual. Informal, attention-grabbing.",
    "ondas": "Soft wave shapes along the bottom edge. Fluid, calm.",
    "cantos": "Corner brackets framing the content. Structured, technical.",
    "confete": "Small scattered dots and shapes. Energetic, fun.",
    "granulado": "Subtle film grain texture over the background. Modern, tactile.",
}
DESTAQUES = {
    "cor": "Subtitle in the accent colour.",
    "linha": "An accent underline bar under the title.",
    "selo": "Subtitle inside a rounded label/pill.",
    "peso": "Bigger, heavier title for more impact.",
}
FOTO_EFEITOS = {
    "nenhum": "Keep the photo natural. Best when it is already clean and colourful.",
    "duotone_marca": "Recolour the photo in the two brand colours. Strong identity; best for busy or off-palette photos.",
    "escurecer": "Slightly darken and desaturate so the brand colours and text stand out.",
    "moldura": "Brand-colour frame and shadow around the photo. Best for card, arch or circle.",
    "preto_e_branco": "Black and white photo; the brand colours carry all the colour. Sober and premium.",
    "contraste": "Vivid colours and stronger contrast. Punchy, eye-catching.",
}
TEMAS_ORDEM = ["escuro_clean", "luxo_dourado", "energia_viva", "editorial_claro", "azul_amarelo", "vermelho_impacto", "preto_branco", "verde_negocio", "roxo_premium", "laranja_energia"]


# Descritivo dos temas em inglês (o Jev acerta mais em inglês).
TEMAS_EN = {
    "escuro_clean": "Dark neutral background, white text, strong yellow accent — safe for any subject.",
    "luxo_dourado": "Deep black with gold and an art-deco display font — premium and celebratory.",
    "energia_viva": "Deep blue with electric cyan and heavy black type — energy, technology, youth.",
    "editorial_claro": "Light paper background, ink text, sober red accent — magazine, clean, informative.",
    "azul_amarelo": "Deep professional blue with bright yellow accent — trustworthy SaaS, management and technology.",
    "vermelho_impacto": "Deep red, white and near-black — urgency, promotion, food, action and strong calls.",
    "preto_branco": "Pure black and white with restrained grey — elegant, editorial and highly minimal.",
    "verde_negocio": "Deep green with mint accent — finance, growth, health and sustainability.",
    "roxo_premium": "Deep violet with lavender accent — creative, premium and digital products.",
    "laranja_energia": "Dark warm brown with vivid orange — energetic, approachable and commercial.",
}

OBJETIVOS = {
    "promocao": "A promotion, discount, special condition or limited offer.",
    "venda": "Selling a product or service by showing its main benefit.",
    "lancamento": "Announcing something new.",
    "educativo": "Teaching a tip, fact, list or useful explanation.",
    "evento": "Inviting people to an event, appointment or date.",
    "institucional": "Building trust, authority or brand positioning.",
    "frase": "A quote, reflection or motivational message.",
}
RECEITAS = {
    "oferta_impacto": "Offer-first poster: very large offer, compact subject and a clear CTA.",
    "editorial_organico": "Editorial composition, left aligned, generous whitespace and organic corner decoration.",
    "premium_moldura": "Premium restrained poster with a thin frame, small emblem and elegant hierarchy.",
    "energia_geometrica": "Bold asymmetric typography with geometric shapes and energetic contrast.",
    "informativo_modular": "Clear information card with label, title, supporting line and visual modules.",
    "frase_autoral": "Typography-led quote card with a highlighted phrase and subtle decoration.",
}
DECORACOES = {
    "folhagem": "Elegant vector leaves or branches in the corners.",
    "arcos": "Thin arcs and concentric circles.",
    "geometria": "Rectangles, circles and angled geometric blocks.",
    "moldura": "A fine editorial frame and small corner marks.",
    "brilho": "Soft light glow and a few restrained sparkles.",
    "grade": "A subtle editorial or technical grid.",
    "interface_saas": "A polished abstract software dashboard with cards, charts and interface controls in the background.",
    "bancada_tecnica": "A clear vector scene of a modern electronics repair bench, monitor, phone and organized tools.",
    "celular": "A prominent modern smartphone silhouette related to mobile service or technology.",
    "ferramentas": "Organized repair tools such as screwdriver, wrench and precision instruments.",
    "estoque": "Boxes, shelves and inventory labels representing stock control.",
    "financeiro": "A chart, currency tokens and financial control cards.",
    "clientes": "A small group of person silhouettes and profile cards representing customers.",
    "loja": "A storefront or service counter representing a physical business.",
    "calendario": "A calendar and check marks representing appointments and deadlines.",
    "produto": "A clean product pedestal and spotlight for a launch or product announcement.",
    "bolhas": "Soft overlapping bubbles and circles framing the copy.",
    "nenhuma": "No decorative illustration; typography alone carries the design.",
}


def sem_acentos(s):
    return "".join(c for c in unicodedata.normalize("NFD", s.lower()) if unicodedata.category(c) != "Mn")


def trecho(briefing, padroes):
    for p in padroes:
        m = re.search(p, briefing, re.I)
        if m:
            return re.sub(r"\s+", " ", m.group(1)).strip(" .,:;!?")
    return ""


def conteudo_do_briefing(briefing, plano):
    """Transforma briefing em copy curta sem inventar preço, nome, prazo ou promessa."""
    explicito = [x.strip() for x in briefing.split("|") if x.strip()]
    if len(explicito) > 1:
        return explicito[0], explicito[1] if len(explicito) > 1 else "", "", explicito[2] if len(explicito) > 2 else ""

    # Prompts copiados de chats costumam vir com Markdown (**Título:**),
    # blockquote (>) e aspas curvas. Normalize só a marcação, não o conteúdo.
    briefing_limpo = re.sub(r"(?m)^\s*>\s?", "", briefing)
    briefing_limpo = re.sub(r"[*_`]+", "", briefing_limpo)

    def campo(nome):
        m = re.search(rf"(?:^|\n|\s){nome}\s*[:=]\s*[‘'\"“]([^’'\"”]+)[’'\"”]", briefing_limpo, re.I)
        return m.group(1).strip() if m else ""

    cta_padrao = ""  # botão de ação só se o pedido escrever um (pedido do Enzo, 30/09)
    titulo_dito = campo(r"t[ií]tulo(?:\s+principal)?")
    subtitulo_dito = campo("subt[ií]tulo")
    destaque_dito = campo("destaque")
    botao_dito = campo(r"(?:bot[aã]o(?:\s*/\s*CTA)?|CTA)")
    if titulo_dito:
        return titulo_dito, subtitulo_dito, destaque_dito, botao_dito or cta_padrao

    oferta = trecho(briefing, [r"(\d+(?:[,.]\d+)?\s*%\s*(?:de\s+)?desconto)", r"((?:R\$|US\$)\s*[\d.,]+)"])
    assunto = trecho(briefing, [
        r"(?:divulgar|promover|anunciar|lançar|lancar)\s+(?:um\s+|uma\s+|o\s+|a\s+)?(.+?)(?=,|\s+com\s+|\s+usando\s+|\s+em\s+tons|\s+e\s+(?:uma|um)\s+chamada|$)",
        r"(?:post|imagem|arte)\s+(?:sobre|para)\s+(.+?)(?=,|\s+com\s+|\s+usando\s+|$)",
        r"(?:produto|serviço|servico|evento)\s+['\"]([^'\"]+)['\"]",
    ])
    assunto = re.sub(r"\b(?:com|de)\s+\d+(?:[,.]\d+)?\s*%.*$", "", assunto, flags=re.I).strip()
    assunto = assunto[:64]
    obj = plano["objetivo"]
    if oferta:
        titulo = oferta.upper() if "%" not in oferta else oferta.upper().replace(" DE DESCONTO", " OFF")
        subtitulo = assunto.title() if assunto else "Condição especial"
    elif assunto:
        titulo = assunto.upper()
        subtitulo = {"lancamento": "Uma novidade para você", "educativo": "Informação que faz diferença",
                     "evento": "Reserve este momento", "institucional": "Confiança em cada detalhe"}.get(obj, "")
    else:
        # Sem dado confiável para reescrever: usa somente a primeira oração, nunca o briefing inteiro.
        titulo = re.split(r"[.!?]", briefing.strip())[0][:72].strip().upper()
        subtitulo = ""

    return titulo, subtitulo, "", cta_padrao


def diz(msg):
    with open(JOB / "orquestrador-atividade.log", "a") as f:
        f.write(f"[{time.strftime('%H:%M:%S')}] FALA: {msg}\n")
    print(msg, file=sys.stderr, flush=True)


def status(msg):
    """Etapa atual, lida pelo painel enquanto cria (mostrada nos quadrados da tela Criar)."""
    (JOB / "status.txt").write_text(msg)
    diz(msg)


def etapa(nome, texto):
    with open(RAIZ / "ds.log", "a") as f:
        f.write(f"[{time.strftime('%F %T')}] ▶ {nome} · {texto[:110]}\n")


def tem_logo():
    return any((RAIZ / "public/brand").glob("logo.*"))


def jev(state, perguntas, etapa="direção de arte"):
    t0 = time.time()
    r = subprocess.run(JEV, input=json.dumps({"state": state, "questions": perguntas}, ensure_ascii=False),
                       capture_output=True, text=True, env=ENV)
    try:
        d = json.loads(r.stdout)
    except ValueError:
        d = {}
    JEV_LOG.append({"etapa": etapa, "state": state, "ms": round((time.time() - t0) * 1000),
                    "custo": (d.get("usage") or {}).get("cost"), "erro": None if "answers" in d else f"Jev indisponível ({d.get('http_status')})",
                    "perguntas": {k: {"instrucao": q.get("instructions"), "opcoes": list((q.get("criteria") or {}).keys()),
                                      "resposta": (d.get("answers") or {}).get(k)} for k, q in perguntas.items()}})
    grava_jev()
    if r.returncode or "answers" not in d:
        return None, f"Jev indisponível ({d.get('http_status')})"
    return d["answers"], None


TRAVA = threading.RLock()  # as versões se preparam em paralelo: arquivos compartilhados passam por aqui


def grava_jev(**extra):
    with TRAVA:
        atual = {}
        try:
            atual = json.loads((JOB / "jev.json").read_text())
        except (OSError, ValueError):
            pass
        atual.update({"formato": FORMATO, "pedido": PEDIDO["prompt"], "chamadas": JEV_LOG, **extra})
        (JOB / "jev.json").write_text(json.dumps(atual, ensure_ascii=False, indent=1))


def blocos():
    """As palavras do Enzo. Post: 1 bloco (título | subtítulo | cta). Carrossel: N blocos separados por '||'."""
    texto = TEXTO_POST
    if FORMATO == "carrossel":
        out = []
        for b in texto.split("||"):
            p = [x.strip() for x in b.split("|") if x.strip()]
            out.append((p[0] if p else "", p[1] if len(p) > 1 else "", "", p[2] if len(p) > 2 else ""))
        out = [b for b in out if b[0]]
        if len(out) < 2:
            raise RuntimeError("carrossel precisa de pelo menos 2 slides: separe cada slide com || (ex.: frase 1 || frase 2 || frase 3)")
        if len(out) > 6:
            out = out[:6]
        return out
    p = [x.strip() for x in texto.split("|") if x.strip()]
    if not p:
        raise RuntimeError("o pedido não tem texto: escreva a frase do post no prompt")
    return [(p[0], p[1] if len(p) > 1 else "", "", p[2] if len(p) > 2 else "")]


def decide(briefing):
    """Uma direção de arte completa em uma chamada do Jev. Incerto → defaults seguros."""
    a, erro = jev({"creative_brief_in_portuguese": briefing,
                   "rule": "The brief may end with 'Imagem:' describing the wanted look (light, shadow, background, mood, photo). "
                           "That description is the author's direct order: pick the options that match it."}, {
        "objetivo": {"type": "choice", "instructions": "What is the primary communication goal of this social-media post?", "criteria": OBJETIVOS},
        "tema": {"type": "choice", "instructions": "Which colour theme best fits the requested mood and subject?",
                 "criteria": TEMAS_EN},
        "formato": {"type": "choice", "instructions": "Which feed format gives this brief the strongest composition?",
                    "criteria": {"quadrado": "Square 1080x1080: concise, iconic and balanced.", "vertical": "Portrait 1080x1350: more hierarchy, copy and decorative room."}},
        "receita": {"type": "choice", "instructions": "Which complete art-direction recipe best translates the brief?", "criteria": RECEITAS},
        "alinhamento": {"type": "choice", "instructions": "Which text alignment creates the best hierarchy? House default: image and text CENTRED. Choose left or asymmetric only if the brief explicitly asks for it.",
                        "criteria": {"esquerda": "Editorial and confident left alignment.", "centro": "Formal, iconic and balanced centre alignment.", "assimetrico": "Dynamic offset composition with controlled asymmetry."}},
        "densidade": {"type": "choice", "instructions": "How much visual information should the poster carry?",
                      "criteria": {"minimalista": "Very restrained, much whitespace.", "equilibrada": "Clear hierarchy with supporting detail.", "expressiva": "Bold, energetic and visually rich without clutter."}},
        "hierarquia": {"type": "choice", "instructions": "What must the viewer notice first?",
                       "criteria": {"oferta": "The discount, price or special condition.", "assunto": "The product, service or event name.", "beneficio": "The outcome or benefit.", "mensagem": "The quote or core message."}},
        "decoracao": {"type": "choice", "instructions": "Which local vector decoration best supports the requested style?", "criteria": DECORACOES},
        "decoracao_posicao": {"type": "choice", "instructions": "Where should decoration sit without competing with copy?",
                             "criteria": {"cantos_opostos": "Two opposite corners frame the content.", "topo": "A visual accent above the headline.", "lateral": "A side illustration balances left/right composition.", "fundo": "Large low-opacity shapes create depth behind content."}},
        "decoracao_intensidade": {"type": "choice", "instructions": "How visually prominent should decoration be?",
                                 "criteria": {"discreta": "Small and subtle.", "media": "Clearly visible but secondary.", "marcante": "A strong visual device, still behind the message."}},
        "icone_estilo": {"type": "choice", "instructions": "Which icon treatment fits this post best?", "criteria": ICONE_ESTILOS},
        "enfeite": {"type": "choice", "instructions": "Which small ornament (if any) fits the mood of this post?", "criteria": ENFEITES},
        "destaque": {"type": "choice", "instructions": "How should the key words be emphasized?",
                     "criteria": {"cor": "Accent colour on the key words.", "peso": "Heavier weight and size contrast.", "selo": "A compact badge or label.", "linha": "Editorial underline or rule."}},
        "fundo_estilo": {"type": "choice", "instructions": "Which background treatment fits the brief best?", "criteria": FUNDOS_EN},
        "luz": {"type": "choice", "instructions": "Which light effect fits the brief? If the brief asks for light, glow or light dots, never choose 'nenhuma'.", "criteria": LUZES},
        "sombra": {"type": "choice", "instructions": "Which text shadow fits the brief? If the brief asks for shadow or neon, never choose 'nenhuma'.", "criteria": SOMBRAS},
        "composicao": {"type": "choice", "instructions": "Choose the spatial composition requested in the brief.", "criteria": VOCAB["composicao"]},
        "solucao": {"type": "choice", "instructions": "How should the solution sentence (subtitle) be shown? The author finds a small plain description at the bottom boring: prefer a format that makes it stand out.", "criteria": SOLUCOES},
        "cta": {"type": "choice", "instructions": "Which CTA type is appropriate using no facts beyond the brief?",
                "criteria": {"agendar": "Book an appointment.", "comprar": "Learn more or buy.", "participar": "Reserve a place or participate.", "conhecer": "Discover the subject.", "nenhum": "No CTA is appropriate."}},
    })
    if not a:
        diz(f"Jev não respondeu ({erro}): usando direção editorial segura")
        return {"objetivo": "institucional", "tema": "escuro_clean", "formato": "vertical", "receita": "editorial_organico",
                "alinhamento": "centro", "densidade": "equilibrada", "hierarquia": "assunto", "decoracao": "moldura",
                "decoracao_posicao": "cantos_opostos", "decoracao_intensidade": "discreta",
                "destaque": "cor", "icone_estilo": "circulo_suave", "enfeite": "nenhum", "cta": "nenhum",
                "fundo_estilo": "gradiente", "luz": "nenhuma", "sombra": "suave", "solucao": "faixa", "composicao": "icone_topo"}, {}
    defaults = {"objetivo": "institucional", "tema": "escuro_clean", "formato": "vertical", "receita": "editorial_organico",
                "alinhamento": "centro", "densidade": "equilibrada", "hierarquia": "assunto", "decoracao": "moldura",
                "decoracao_posicao": "cantos_opostos", "decoracao_intensidade": "discreta",
                "destaque": "cor", "icone_estilo": "circulo_suave", "enfeite": "nenhum", "cta": "nenhum",
                "fundo_estilo": "gradiente", "luz": "nenhuma", "sombra": "suave", "solucao": "faixa", "composicao": "icone_topo"}
    d = {k: (a[k]["choice"] if (a.get(k) or {}).get("confidence", 0) >= CONF_MIN else v) for k, v in defaults.items()}
    if not re.search(r"esquerda|assim[eé]tric|(?<!faixa )lateral", sem_acentos(briefing)):
        d["alinhamento"] = "centro"  # padrão da casa quando o pedido não diz o layout
    REGISTRO.append("- Jev dirigiu: " + ", ".join(f"{k}={v}" for k, v in d.items()))
    return d, a


def variantes(d, a, fixos=(), obrigatorios=()):
    """VERSOES direções: a versão n usa a n-ésima opção do Jev (por probabilidade) em cada campo de VARIA.
    obrigatorios: campos que o pedido pediu sem dizer qual ("com luz") — nenhuma versão fica sem."""
    opcoes = {"tema": list(TEMAS_EN), "receita": list(RECEITAS), "decoracao": [x for x in DECORACOES if x != "nenhuma"], "foto_layout": list(FOTO_LAYOUTS),
              "icone_estilo": list(ICONE_ESTILOS), "enfeite": list(ENFEITES), "destaque": list(DESTAQUES),
              "fundo_estilo": FUNDOS, "luz": list(LUZES), "sombra": list(SOMBRAS), "solucao": list(SOLUCOES)}
    out = []
    for n in range(VERSOES):
        v = dict(d)
        for k in [k for k in VARIA if k not in fixos and k in d]:
            probs = (a.get(k) or {}).get("probabilities") or {}
            rank = [d[k]] + [x for x, _ in sorted(probs.items(), key=lambda kv: -kv[1]) if x != d[k] and x in opcoes[k]]
            rank += [x for x in opcoes[k] if x not in rank]  # Jev sem ranking: completa na ordem da lista
            if k in obrigatorios:
                rank = [x for x in rank if x != "nenhuma"]
            v[k] = rank[n % len(rank)]
        v["fundo_var"] = round(random.random(), 3)
        out.append(v)
    return out


# Biblioteca de ícones Tabler (MIT, ~2.500 úteis). Só o Jev escolhe: categoria -> família -> ícone.
TABLER = RAIZ / "node_modules/@tabler/icons"
CATS_TABLER = {
    "Devices": "Phones, tablets, printers, screens, cables, batteries and other devices.",
    "Computers": "Computers, laptops, CPUs and hardware parts.",
    "Document": "Files, folders, clipboards, receipts, reports and paperwork.",
    "E-commerce": "Shopping, carts, bags, tags, discounts, packages, store and checkout.",
    "Communication": "Messages, chat, mail, phone calls, notifications and sharing.",
    "Currencies": "Money, coins, cash, currency symbols and payments.",
    "Charts": "Charts, graphs, growth and data visualisation.",
    "Database": "Databases, storage, backups and data.",
    "Buildings": "Stores, buildings, houses, offices and warehouses.",
    "Vehicles": "Cars, trucks, motorbikes, delivery vehicles.",
    "Photography": "Cameras, photos, pictures and lenses.",
    "Electrical": "Electricity, plugs, power, circuits and batteries.",
    "Mood": "Faces and emotions: happy, sad, worried, confused.",
    "Badges": "Badges, ranks and awards.",
    "Health": "Health, medical and first aid.",
    "System": "General system concepts: users, calendar, clock, lock, shield, settings, tools, alerts, search, check, filters.",
    "Symbols": "Generic symbols and signs.",
    "Gestures": "Hands and gestures.",
    "Media": "Media players, sound, video and playback.",
    "Map": "Maps, locations, routes and navigation.",
}
USADOS_ICONES = RAIZ / "out/painel/.icones-usados.json"


def _catalogo():
    d = json.loads((TABLER / "icons.json").read_text())
    var = re.compile(r"-(off|\d+|filled|alt)$")
    estrangeira = re.compile(r"euro|dollar|yen|pound|bitcoin|rupee|yuan|won|lira|rupiah|ruble|shekel|franc|krone|peso|dinar|dirham|bahraini|taka|dong|currency-(?!real)|coin-(?!off)")
    cat = {}
    for n, v in d.items():
        if v.get("category") in CATS_TABLER and "outline" in v.get("styles", {}) and not var.search(n) and not estrangeira.search(n):
            cat.setdefault(v["category"], []).append((n, [str(t) for t in v.get("tags", [])][:6]))
    return cat


def _familias(icones):
    fam = {}
    for n, tags in icones:
        fam.setdefault(n.split("-")[0], []).append((n, tags))
    grandes = {k: v for k, v in fam.items() if len(v) > 40}
    for k, v in grandes.items():  # família grande (ex.: device-*) vira sub-famílias de 2 palavras
        del fam[k]
        for n, tags in v:
            fam.setdefault("-".join(n.split("-")[:2]), []).append((n, tags))
    return fam


def escolhe_icone(assunto):
    """Três perguntas pequenas ao Jev. Ícone já usado em OUTRO assunto sai das opções (não repete)."""
    if not (TABLER / "icons.json").exists():
        return None
    try:
        usados = json.loads(USADOS_ICONES.read_text())
    except (OSError, ValueError):
        usados = {}
    chave = hashlib.md5(assunto.strip().lower().encode()).hexdigest()[:10]
    proibidos = {n for n, dono in usados.items() if dono != chave}
    cat = _catalogo()
    a, _ = jev({"post_subject_in_portuguese": assunto}, etapa="ícone: categoria", perguntas={"categoria": {
        "type": "choice", "instructions": "Which icon category can best SHOW this subject as a picture?", "criteria": CATS_TABLER}})
    if not a:  # sem resposta do Jev: fica sem ícone. Com resposta, vale a escolha dele mesmo com pouca confiança
        return None
    # categoria sem ícone livre (todos já usados em outros assuntos) → a próxima que o Jev preferiu; antes o post ficava sem ícone
    probs = a["categoria"].get("probabilities") or {}
    ordem = [a["categoria"]["choice"]] + [c for c, _ in sorted(probs.items(), key=lambda kv: -kv[1]) if c != a["categoria"]["choice"]]
    fam = next((f for f in (_familias([x for x in cat.get(c, []) if x[0] not in proibidos]) for c in ordem) if f), None)
    if not fam:
        return None
    a2, _ = jev({"post_subject_in_portuguese": assunto}, etapa="ícone: família", perguntas={"familia": {
        "type": "choice", "instructions": "Which icon family best represents this subject?",
        "criteria": {k: "Icons like: " + ", ".join(n for n, _ in v[:6]) for k, v in fam.items()}}})
    if not a2:
        return None
    opcoes = fam.get(a2["familia"]["choice"]) or []
    if len(opcoes) == 1:
        escolhido = opcoes[0][0]
    else:
        a3, _ = jev({"post_subject_in_portuguese": assunto}, etapa="ícone: qual", perguntas={"icone": {
            "type": "choice", "instructions": "Which single icon best represents this subject?",
            "criteria": {n: f"Icon '{n}' ({', '.join(t)})" for n, t in opcoes}}})
        if not a3:
            return None
        escolhido = a3["icone"]["choice"]
    with TRAVA:
        try:
            usados = {**json.loads(USADOS_ICONES.read_text()), escolhido: chave}
        except (OSError, ValueError):
            usados = {escolhido: chave}
        USADOS_ICONES.write_text(json.dumps(dict(list(usados.items())[-80:])))  # memória dos últimos 80
    return escolhido


def cena_params(titulo, subtitulo, destaque, cta, icone, d, etiqueta=""):
    params = {"frase": titulo, "objetivo": d.get("objetivo", ""), "receita": d["receita"], "alinhamento": d["alinhamento"],
              "densidade": d["densidade"], "hierarquia": d["hierarquia"], "decoracao": d["decoracao"],
              "decoracao_posicao": d["decoracao_posicao"], "decoracao_intensidade": d["decoracao_intensidade"],
              "destaque_estilo": d["destaque"], "icone_estilo": d.get("icone_estilo", "circulo_suave"), "enfeite": d.get("enfeite", "nenhum"),
              "luz": d.get("luz", "nenhuma"), "sombra": d.get("sombra", "nenhuma"), "solucao": d.get("solucao", "simples"), "composicao": d.get("composicao", "icone_topo")}
    if SELO and not etiqueta:
        params["selo"] = SELO
    if PONTOS:
        params["pontos"] = PONTOS
    if d.get("fundo"):
        params["fundo"] = d["fundo"]
    if d.get("fundo_estilo"):
        params["fundo_estilo"], params["fundo_var"] = d["fundo_estilo"], d.get("fundo_var", .5)

    if subtitulo:
        params["subtitulo"] = subtitulo
    if destaque:
        params["destaque"] = destaque
    if cta:
        params["cta"] = cta
    if icone:
        params["icone"] = icone
    if etiqueta:
        params["etiqueta"] = etiqueta
    return params


def etiqueta(blocos, i):
    """Selo do topo: no carrossel, a posição do slide (2 / 5…) a partir do 2º."""
    return f"{i + 1} / {len(blocos)}" if len(blocos) > 1 and i > 0 else ""


COMPOSICOES = ["icone_topo", "icone_baixo", "lateral"]


def _sem_vizinho_igual(opcoes, n, primeiro=None):
    """n escolhas aleatórias em que nenhuma é igual à anterior e a última difere da primeira."""
    out = []
    for i in range(n):
        proib = {out[-1]} if out else set()
        if i == n - 1 and n > 2:
            proib.add(out[0])
        if i == 0 and primeiro:
            out.append(primeiro)
            continue
        livres = [o for o in opcoes if o not in proib] or opcoes
        out.append(random.choice(livres))
    return out


def varia_slides(cenas, fixos=()):
    """Carrossel: cada slide com composição, ícone, enfeite, destaque e fundo próprios (pedido do Enzo: nunca o início igual ao fim)."""
    n = len(cenas)
    p0 = cenas[0]["layout"]["params"]
    listas = {
        "composicao": _sem_vizinho_igual(COMPOSICOES, n, "icone_topo"),
        "icone_estilo": _sem_vizinho_igual(list(ICONE_ESTILOS), n, p0.get("icone_estilo")),
        "enfeite": _sem_vizinho_igual([e for e in ENFEITES if e != "granulado"], n, p0.get("enfeite")),
        "destaque_estilo": _sem_vizinho_igual(list(DESTAQUES), n, p0.get("destaque_estilo")),
        "fundo_estilo": _sem_vizinho_igual(FUNDOS, n, p0.get("fundo_estilo")),
    }
    for i, c in enumerate(cenas):
        prm = c["layout"]["params"]
        for k, v in listas.items():
            if k not in fixos:  # o que o pedido fixou vale em todos os slides
                prm[k] = v[i]
        prm["fundo_var"] = round(random.random(), 3)
        if prm["composicao"] == "lateral" and "alinhamento" not in fixos:
            prm["alinhamento"] = "esquerda"


def monta_spec(blocos, d, icone, n=1):
    jobid = JOB.name
    alf = "abcdefghijklmnopqrstuvwxyz"
    sx = "".join(alf[int(c, 16) % 26] for c in hashlib.md5(jobid.encode()).hexdigest()[:5]) + alf[n - 1]  # único por job e versão
    peca = "Post" + "".join(c for c in jobid[-8:-4] if c.isalpha()).title() or "PostX"
    if FORMATO == "carrossel":
        cenas = []
        for i, (t, s, x, c) in enumerate(blocos, start=1):
            cenas.append({"n": i, "layout": {"componente": "post_design", "params": cena_params(t, s, x, c, icone[i - 1], d, etiqueta(blocos, i - 1))}})
        varia_slides(cenas, d.get("fixos", ()))
        for i, c_ in enumerate(cenas):  # foto do slide (se o Jev quis foto nele)
            if (d.get("fotos_slide") or [None] * len(cenas))[i]:
                c_["layout"]["params"].update(d["fotos_slide"][i], alinhamento="centro")
        return {"formato": "post", "peca": peca, "sx": sx, "dims": DIMS, "tema": d["tema"], "logo": tem_logo(), "logo_px": LOGO_PX, "cenas": cenas}
    # Uma direção final: o Jev decide tema, receita, fundo, objeto e decoração.
    t, s, x, c = blocos[0]
    cenas = [{"n": 1, "tema": d["tema"], "layout": {"componente": "post_design", "params": cena_params(t, s, x, c, icone[0], d, etiqueta(blocos, 0))}}]
    if (d.get("fotos_slide") or [None])[0]:
        cenas[0]["layout"]["params"].update(d["fotos_slide"][0], alinhamento="centro")  # foto só encaixa com texto centralizado (à esquerda cobria a logo)
    return {"formato": "post", "peca": peca, "sx": sx, "dims": DIMS, "tema": d["tema"], "logo": tem_logo(), "logo_px": LOGO_PX, "cenas": cenas}


def render_etapa(spec, n=1):
    etapa("render", f"{spec['peca']}: gerando as imagens")
    diz(f"render: gerando {len(spec['cenas'])} imagem(ns) de {spec['peca']}")
    alvo = RAIZ / f"src/specs/{spec['sx']}.json"
    alvo.write_text(json.dumps(spec, ensure_ascii=False, indent=1) + "\n")
    slides = JOB / "slides"
    tmp = slides / f".v{n}"
    tmp.mkdir(parents=True, exist_ok=True)
    for antigo in [*slides.glob(f"v{n}-slide-*.*"), *tmp.glob("*")]:
        antigo.unlink()
    # Post estático não abre Remotion/Chromium: SVG -> PNG é muito mais rápido.
    for cmd in (["node", str(RAIZ / "tools/render-post-fast.mjs"), str(alvo), str(tmp)],):
        r = subprocess.run(cmd, cwd=RAIZ, capture_output=True, text=True)
        if r.returncode:
            raise RuntimeError(f"{cmd[1].split('/')[-1]} falhou: {(r.stdout + r.stderr)[-600:]}")
    for png in sorted(tmp.glob("*.png")):
        png.rename(slides / f"v{n}-{png.name}")
    for resto in tmp.glob("*"):
        resto.unlink()
    tmp.rmdir()
    return sorted(p.name for p in slides.glob(f"v{n}-*.png"))


def outros_angulos(bs, quantos):
    """O mesmo pedido reescrito por outro ponto de vista (fatos iguais, nada inventado). Falhou = repete o original."""
    from fotos import deepseek, _json_de
    sistema = ("Você é redator de posts de Instagram em português do Brasil. Reescreve o MESMO post por ângulos diferentes, "
               "mantendo o assunto, a marca citada e os fatos. Nunca invente números, preços, prazos ou recursos. "
               "Ângulos possíveis: dor → solução; benefício direto; pergunta/curiosidade; antes × depois; bastidor. Responda só JSON.")
    try:
        if len(bs) == 1:
            t, s_ = bs[0][0], bs[0][1]
            txt, _ = deepseek(sistema, f'Post original — título: "{t}" / subtítulo: "{s_}".\nEscreva {quantos} versões com ângulos DIFERENTES entre si e do original. '
                              'Título até 45 caracteres, subtítulo até 90. JSON: {"versoes": [{"angulo": "...", "titulo": "...", "subtitulo": "..."}]}')
            vs = [[(v["titulo"].strip(), v.get("subtitulo", "").strip(), "", bs[0][3])] for v in _json_de(txt).get("versoes", []) if v.get("titulo")]
        else:
            slides = "\n".join(f"{i + 1}. {t} | {s_}" for i, (t, s_, x, c) in enumerate(bs))
            txt, _ = deepseek(sistema, f"Carrossel original (frase | legenda por slide):\n{slides}\nEscreva {quantos} carrosséis com ângulos DIFERENTES entre si e do original, "
                              f"com 3 a 6 slides cada. Frase até 40 caracteres, legenda até 80. "
                              'JSON: {"versoes": [{"angulo": "...", "slides": [{"frase": "...", "legenda": "..."}]}]}')
            vs = [[(sl["frase"].strip(), sl.get("legenda", "").strip(), "", "") for sl in v.get("slides", []) if sl.get("frase")]
                  for v in _json_de(txt).get("versoes", [])]
            vs = [v for v in vs if 2 <= len(v) <= 6]
    except Exception as e:  # sem DeepSeek: as versões seguem com o texto original
        REGISTRO.append(f"- outros ângulos: falhou ({str(e)[:80]})")
        vs = []
    return (vs + [bs] * quantos)[:quantos]


def main():
    t0 = time.time()
    briefing = PEDIDO["prompt"].strip()
    status("Jev lendo o pedido e decidindo a direção de arte")
    etapa("decisao", "post: Jev criando direção de arte completa")
    diz("Jev interpretando o briefing e dirigindo a arte")
    d, a = decide(briefing)
    if FORMATO == "post" and "|" not in TEXTO_POST:
        bs = [conteudo_do_briefing(TEXTO_POST, d)]
    else:
        bs = blocos()
    # Pedido explícito de identidade visual vence o fallback temático.
    normalizado = sem_acentos(briefing)
    if tem_logo():
        d["tema"] = "marca"  # com logo enviada, as cores SÃO as da logo (o render tira da própria logo)
        fixos = ("tema",)
    elif "azul" in normalizado and "amarelo" in normalizado:
        d["tema"] = "azul_amarelo"
        fixos = ("tema",)  # cor pedida vale nas 3 versões
    else:
        fixos = ()
    # O que o pedido diz com todas as letras vale nas 3 versões; "com luz"/"com sombra" sem dizer qual: o Jev escolhe, mas nunca "nenhuma".
    alvo, fixos, obrig = sem_acentos(VISUAL or briefing), list(fixos), []
    for campo, valor in escolhas_visuais(VISUAL or briefing).items():
        if campo in d and campo not in fixos:
            d[campo] = valor
            fixos.append(campo)
    for campo, rx, valor in PEDIDOS_EXPLICITOS:
        if campo not in fixos and any(re.search(rx, parte) and not re.search(r"\b(sem|nao|nunca|evitar|evite)\b", parte) for parte in re.split(r"[.\n;]", alvo)):
            d[campo] = valor
            fixos.append(campo)
    for campo, rx in PEDIDOS_GENERICOS:
        if campo not in fixos and any(re.search(rx, parte) and not re.search(r"\b(sem|nao|nunca|evitar|evite)\b", parte) for parte in re.split(r"[.\n;]", alvo)):
            obrig.append(campo)
            if d.get(campo) == "nenhuma":
                probs = (a.get(campo) or {}).get("probabilities") or {}
                d[campo] = max((x for x in (LUZES if campo == "luz" else SOMBRAS) if x != "nenhuma"), key=lambda x: probs.get(x, 0))
    if VISUAL:
        REGISTRO.append(f"- imagem pedida: {VISUAL}")
    if fixos or obrig:
        REGISTRO.append("- pedido explícito: " + ", ".join([f"{k}={d[k]}" for k in fixos] + [f"{k} obrigatório" for k in obrig]))
    for i, (t, s, x, c) in enumerate(bs, start=1):
        REGISTRO.append(f"- copy composta (slide {i}): \"{t}\"" + (f" | {s}" if s else "") + (f" | {x}" if x else "") + (f" | {c}" if c else ""))

    # Preserve a copy aprovada; o Jev varia apenas decisões visuais livres.
    textos = [bs for _ in range(VERSOES)]
    grava_jev(textos=[[list(x[:2]) for x in b_] for b_ in textos])

    def prepara(n):
        """Uma versão: o Jev decide slide a slide se entra foto (nenhum, alguns ou todos); sem foto, ícone."""
        bsn = textos[n - 1]
        tema_car = bsn[0][0] if len(bsn) > 1 else ""
        fotos_slide, icones, logs = [], [], []
        for i, (t, s_, x, c) in enumerate(bsn):
            pref = f"Versão {n}" + (f" · slide {i + 1}" if len(bsn) > 1 else "") + ": "
            assunto_i = f"{t}. {s_}" + (f" (slide {i + 1} de um carrossel sobre: {tema_car})" if tema_car else "")
            log_i = []
            sem_foto = sem_acentos(FOTO_PEDIDA).startswith(SEM_FOTO)
            busca = (FOTO_PEDIDA if len(bsn) == 1 else f"{assunto_i}. Foto pedida: {FOTO_PEDIDA}") if FOTO_PEDIDA and not sem_foto \
                else assunto_i + (f". Imagem pedida: {VISUAL}" if VISUAL else "")
            fs = [] if sem_foto else fotos_para(busca, jev, log_i, JOB / "fotos", 1, lambda m, pref=pref: status(pref + m), forcar=bool(FOTO_PEDIDA))
            logs += [{**e, "versao": n, "slide": i + 1} for e in log_i]
            if fs:
                status(pref + "Jev decidindo onde e como entra a foto")
                af, _ = jev({"post_subject_in_portuguese": f"{t}. {s_}", "photo_description": fs[0]["descricao"], "wanted_look_in_portuguese": VISUAL},
                            etapa=f"versão {n}{' slide ' + str(i + 1) if len(bsn) > 1 else ''}: onde e efeito da foto", perguntas={
                    "foto_layout": {"type": "choice", "instructions": "Where should this photo go? It is always only a PART of the post; the rest is the brand colour background with the text.", "criteria": FOTO_LAYOUTS},
                    "foto_efeito": {"type": "choice", "instructions": "Which treatment makes this photo look best in this post?", "criteria": FOTO_EFEITOS}})
                lay = (af or {}).get("foto_layout", {}).get("choice")
                ef = (af or {}).get("foto_efeito", {}).get("choice")
                v_ = sem_acentos(VISUAL)  # posição/tratamento escritos no prompt vencem a escolha do Jev
                lay = escolhas_visuais(VISUAL).get("foto_layout", lay)
                ef = escolhas_visuais(VISUAL).get("foto_efeito", ef)
                fotos_slide.append({"foto": fs[0]["caminho"], "foto_id": fs[0]["id"], "foto_layout": lay if lay in FOTO_LAYOUTS else "topo_cartao",
                                    "foto_efeito": ef if ef in FOTO_EFEITOS else "nenhum"})
                icones.append(None)
            else:
                if FOTO_PEDIDA and re.search(r"nunca [ií]cone|sem [ií]cone|somente foto", FOTO_PEDIDA, re.I):
                    raise RuntimeError("Não encontrei uma foto fiel à cena pedida. Como o prompt proíbe ícone, ajuste a cena ou adicione uma foto à biblioteca.")
                fotos_slide.append(None)
                status(pref + "Jev escolhendo o ícone")
                icones.append(escolhe_icone(f"{ICONE_PEDIDO} (post: {t})" if ICONE_PEDIDO and len(bsn) == 1 else f"{t}. {s_}"))
        return bsn, fotos_slide, icones, logs

    with ThreadPoolExecutor(VERSOES) as ex:  # as 3 versões se preparam ao mesmo tempo (é quase tudo espera de rede)
        prep = list(ex.map(prepara, range(1, VERSOES + 1)))
    grava_jev(fotos=[e for p_ in prep for e in p_[3]])
    for n, (bsn, fsl, ics, _) in enumerate(prep, start=1):
        REGISTRO.append(f"- versão {n}: “{bsn[0][0]}” · fotos em {sum(1 for f in fsl if f)} de {len(fsl)} slide(s)")
    jpgs = []
    for n, v in enumerate(variantes(d, a, fixos, obrig), start=1):
        bsn, fotos_slide, icone, _ = prep[n - 1]
        v["fotos_slide"], v["fixos"] = fotos_slide, fixos
        v["foto_layout"] = ", ".join(f"{k + 1}:{x['foto_layout']}" for k, x in enumerate(fotos_slide) if x) or None
        status(f"Montando a versão {n} de {VERSOES}")
        REGISTRO.append(f"- versão {n}: tema={v['tema']}, receita={v['receita']}, decoração={v['decoracao']}, fundo={v['fundo_estilo']}, luz={v['luz']}, sombra={v['sombra']}, solução={v['solucao']}")
        spec = monta_spec(bsn, v, icone, n)
        campos = ["decoracao", "fundo_estilo", "alinhamento", "densidade", "destaque_estilo", "icone_estilo", "enfeite", "luz", "sombra", "solucao", "composicao", "foto_layout", "foto_efeito"]
        aplicados = [{**{k: c["layout"]["params"].get(k) for k in campos}, "destaque": c["layout"]["params"].get("destaque_estilo")} for c in spec["cenas"]]
        grava_jev(versoes=[*json.loads((JOB / "jev.json").read_text()).get("versoes", []), {"n": n, "tema": v["tema"], **aplicados[0], "slides": aplicados}])
        jpgs += render_etapa(spec, n)
    if not jpgs:
        raise RuntimeError("nenhuma imagem foi gerada")

    (JOB / "entrega.json").write_text(json.dumps({"peca": spec["peca"], "sx": spec["sx"], "formato": FORMATO, "versoes": VERSOES, "arquivos": jpgs}, ensure_ascii=False, indent=1))
    extra = f"\n\n{VERSOES} versões: a 1ª é a escolha do Jev; as outras usam a 2ª e a 3ª opção dele."
    print(f"**{spec['peca']}** · {FORMATO} · {len(jpgs)} imagem(ns) · {(time.time() - t0) / 60:.1f} min\n\n" + "\n".join(REGISTRO) + extra)


if __name__ == "__main__":
    try:
        main()
    except RuntimeError as e:
        print("Não consegui terminar o post.\n\n" + "\n".join(REGISTRO) + f"\n\nMotivo: {e}")
        sys.exit(1)
