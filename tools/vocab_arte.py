"""Vocabulário da arte do post: fonte ÚNICA para quem escreve o prompt (assessor) e para quem lê (orquestrador-post).
campo -> {valor interno: frase em português}. A frase é o que vai escrito no bloco "Imagem:" do prompt; o orquestrador
procura essa frase exata e trava o valor nas 3 versões. As frases não podem ser pedaço umas das outras.
"""

ITENS = {  # rótulo da linha no bloco Imagem -> campo
    "Fundo": "fundo_estilo", "Luz": "luz", "Sombra": "sombra", "Destaque": "destaque", "Enfeite": "enfeite",
    "Desenho": "decoracao", "Texto": "alinhamento", "Estilo do ícone": "icone_estilo",
    "Posição da foto": "foto_layout", "Tratamento da foto": "foto_efeito", "Solução": "solucao",
}

VOCAB = {
    "fundo_estilo": {"solido": "fundo liso", "gradiente": "fundo degradê", "brilho": "fundo com brilho no centro",
                     "dividido_baixo": "faixa diagonal embaixo", "dividido_topo": "faixa diagonal em cima", "faixa_lateral": "faixa lateral",
                     "circulos": "fundo de círculos", "listras": "fundo com listras", "pontos": "fundo de bolinhas",
                     "duas_cores": "fundo em duas cores", "invertido": "fundo claro"},
    "luz": {"nenhuma": "sem luz", "holofote": "luz de holofote", "raios": "raios de luz", "bokeh": "bolinhas de luz",
            "vinheta": "vinheta escura", "brilho_canto": "brilho no canto"},
    "sombra": {"nenhuma": "sem sombra", "suave": "sombra suave", "forte": "sombra forte", "brilho": "texto neon"},
    "destaque": {"cor": "subtítulo colorido", "linha": "sublinhado no título", "selo": "subtítulo em etiqueta", "peso": "título extra forte"},
    "enfeite": {"nenhum": "sem enfeite", "brilhos": "estrelinhas", "seta": "seta desenhada", "ondas": "ondas embaixo",
                "cantos": "cantoneiras", "confete": "confete", "granulado": "textura granulada"},
    "decoracao": {"nenhuma": "sem desenho", "folhagem": "folhas no canto", "arcos": "arcos finos", "geometria": "formas geométricas",
                  "moldura": "moldura fina", "brilho": "halo decorativo", "grade": "grade técnica", "bolhas": "bolhas",
                  "interface_saas": "tela de sistema desenhada", "bancada_tecnica": "bancada técnica desenhada", "celular": "celular desenhado",
                  "ferramentas": "ferramentas desenhadas", "estoque": "caixas de estoque desenhadas", "financeiro": "gráfico financeiro desenhado",
                  "clientes": "grupo de clientes desenhado", "loja": "fachada de loja desenhada", "calendario": "calendário desenhado",
                  "produto": "pedestal de produto"},
    "alinhamento": {"centro": "texto centralizado", "esquerda": "texto à esquerda"},
    "icone_estilo": {"circulo_suave": "ícone em círculo suave", "preenchido": "ícone cheio", "selo_quadrado": "ícone em selo quadrado",
                     "aneis": "ícone com anéis", "marca_dagua": "ícone marca d'água", "brilho": "ícone com halo", "mancha": "ícone sobre mancha"},
    "foto_layout": {"topo_cartao": "foto em cartão", "circulo": "foto em círculo", "polaroid": "foto polaroide", "arco": "foto em arco",
                    "recorte_diagonal": "foto com corte diagonal", "metade_superior": "foto na metade de cima"},
    "foto_efeito": {"nenhum": "foto natural", "duotone_marca": "foto nas cores da marca", "escurecer": "foto escurecida",
                    "moldura": "foto com moldura", "preto_e_branco": "foto preto e branco", "contraste": "foto com contraste forte"},
}
VOCAB["solucao"] = {"simples": "solução em texto simples", "faixa": "solução em faixa", "cartao": "solução em cartão", "grande": "solução grande"}
SEM_FOTO = "sem foto"

VOCAB["solucao"].update({"balao": "solução em balão", "antes_depois": "solução antes e depois"})
VOCAB["composicao"] = {"icone_topo": "imagem acima do texto", "icone_baixo": "imagem abaixo do texto", "visual_lateral": "imagem ao lado da solução"}

ROTULOS_VISUAIS = {"solucao": "Solução", "composicao": "Composição", "foto_layout": "Posição da foto", "foto_efeito": "Tratamento da foto", "icone_estilo": "Estilo do ícone", "fundo_estilo": "Fundo", "luz": "Luz", "sombra": "Sombra", "destaque": "Destaque", "enfeite": "Enfeite", "decoracao": "Desenho", "alinhamento": "Texto"}


def escolhas_visuais(texto):
    """Linhas nomeadas têm precedência. Negações nunca ativam o efeito negado."""
    import re
    import unicodedata
    def normal(s):
        return "".join(c for c in unicodedata.normalize("NFD", s.lower()) if unicodedata.category(c) != "Mn")
    t = normal(texto)
    out = {}
    for campo, opcoes in VOCAB.items():
        rotulo = normal(ROTULOS_VISUAIS[campo])
        linha = re.search(rf"(?m)^[ \-•*]*{rotulo}\s*:\s*(.+)$", t)
        if linha:
            valor = next((k for k, frase in opcoes.items() if normal(frase) == linha[1].strip()), None)
            if valor:
                out[campo] = valor
                continue
        for k, frase in opcoes.items():
            for m in re.finditer(re.escape(normal(frase)), t):
                prefixo = re.split(r"[.\n;:]", t[:m.start()])[-1]
                if not re.search(r"\b(sem|nao|nunca|evitar|evite)\b", prefixo):
                    out[campo] = k
                    break
            if campo in out:
                break
    if re.search(r"sem sombra (?:no texto|nas letras)|letras sem sombra", t):
        out["sombra"] = "nenhuma"
    return out
