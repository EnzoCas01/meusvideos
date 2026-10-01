#!/usr/bin/env python3
"""Assessor de prompts do painel: escreve prompts de post/carrossel no estilo do Enzo e APRENDE com as avaliações dele.
Quem escreve e aprende é o modelo do agente "assessor" em modelos.json (Opus pela assinatura; trocar = 1 linha lá).
- gerar: segue o guia (painel/assessor/guia.md), o PERFIL aprendido (aprendizado.md) e os exemplos avaliados;
  cada prompt termina com "Imagem: ..." descrevendo a arte no vocabulário que o Jev e o render entendem.
  O Jev confere cada prompt (> 50% aprova, < 50% reprova, 50% o Jev desempata). Quem cria a imagem continua sendo o Jev.
- aprender: relê TODAS as avaliações (prompt + nota + comentário) e reescreve aprendizado.md — regras gerais, sem repetição.
  O painel chama sozinho depois de cada avaliação; chamadas simultâneas viram uma só (trava + pendência).
Uso: echo '{"modo": "post", "tema": "", "n": 10}' | python3 tools/assessor.py
     python3 tools/assessor.py --aprender
Saída (gerar): JSON {"prompts": [{"contexto", "prompt", "nota"}], "reprovados": n, "custo": x}
"""
import contextlib
import fcntl
import json
import os
import random
import subprocess
import sys
import tempfile
import time
import uuid
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
PASTA = Path(os.environ.get("ASSESSOR_PASTA", RAIZ / "painel/assessor"))  # testes apontam para outro lugar
sys.path.insert(0, str(RAIZ / "tools"))
from fotos import aprova, deepseek, _json_de  # noqa: E402
from vocab_arte import VOCAB, SEM_FOTO  # noqa: E402

# Recursos reais do AlvoManage (levantados do código do preview; nomes de tela ainda não conferidos na interface).
# O Enzo reprovou várias vezes post sobre o que "todo sistema tem": o básico só entra como DOR de quem ainda usa papel.
FATOS = """DIFERENCIAIS (o que chama atenção e o dono não espera de um sistema):
- link de acompanhamento da OS: o cliente vê o status do conserto pelo celular, sem ligar para a loja;
- orçamento por link: o cliente aprova ou recusa pelo celular;
- fotos do aparelho na entrada ficam salvas na OS (prova do estado em que chegou);
- o aparelho é reconhecido pelo CABO USB para preencher a OS (identificação por FOTO NÃO existe hoje: nunca prometer);
- WhatsApp da loja conectado ao sistema;
- instala no celular como aplicativo pelo navegador, sem loja de apps;
- entregar a OS já lança a entrada no caixa; troca e devolução voltam ao estoque e acertam o caixa sozinhas;
- várias lojas, separadas ou juntas, com transferência de estoque entre elas; comissão por operador;
- primeiros passos guiados ao começar.
INTELIGÊNCIA ARTIFICIAL DENTRO DO SISTEMA (novidade forte; recurso dos planos com IA):
- Kronos: assistente de IA no canto da tela que tira dúvidas de como usar o sistema;
- Mythos (plano Controle e Comando): o dono pergunta sobre o próprio negócio (vendas, números da loja) e a IA responde;
- Zen: a IA preenche a OS a partir do que o cliente respondeu;
- busca por IA: o usuário escreve o que quer fazer e a IA aponta a tela certa do sistema;
- produto cadastrado por foto: tira a foto do produto e a IA preenche o cadastro.
BÁSICO (todo sistema tem; NUNCA é novidade — só serve como dor de quem ainda trabalha no papel/caderno):
OS impressa com os dados da loja; PDV com carrinho, desconto e forma de pagamento; cupom não fiscal; caixa com abertura e fechamento;
fluxo de caixa; contas a receber (fiado com vencimento); crédito na loja; estoque; cotação com fornecedores; importar produtos;
agenda; relatórios de vendas; garantia registrada; histórico de consertos do cliente."""

# PAUTA: o código escolhe o tema e o jeito de contar (os menos usados), para os prompts não ficarem sempre iguais.
# Cada tema é uma dor real do empresário ligada a um FATO do produto (nada fora dos FATOS).
TEMAS = {
    "cliente ligando para saber do conserto": "link de acompanhamento da OS",
    "orçamento parado esperando o cliente decidir": "orçamento por link, o cliente aprova pelo celular",
    "briga por risco ou dano que 'não estava lá'": "fotos do aparelho na entrada salvas na OS",
    "fila e demora para abrir a OS no balcão": "o aparelho é reconhecido pelo cabo USB",
    "IA que responde os números da sua loja": "Mythos: o dono pergunta sobre vendas e números e a IA responde",
    "IA que preenche a OS sozinha": "Zen: a IA monta a OS com o que o cliente respondeu",
    "um assistente de IA dentro do sistema": "Kronos: assistente de IA no canto da tela",
    "achar qualquer tela só escrevendo o que quer": "busca por IA aponta a tela certa",
    "cadastrar produto sem digitar": "produto cadastrado por foto pela IA",
    "o sistema que trabalha enquanto você conserta": "IA (Zen, Kronos, Mythos) + link de acompanhamento + caixa que se acerta sozinho",
    "a assistência do futuro já existe": "o conjunto: IA no sistema, cliente acompanhando pelo celular, app pelo navegador",
    "funcionário novo chamando o dono para tudo": "assistente que tira dúvidas na própria tela",
    "conversa com cliente perdida no WhatsApp pessoal": "WhatsApp da loja conectado ao sistema",
    "dono preso na loja sem poder sair": "o sistema vira app no celular pelo navegador",
    "caixa que não bate no fim do dia": "entrega da OS lança no caixa; troca e devolução acertam caixa e estoque sozinhas",
    "abrir a segunda loja sem virar bagunça": "várias lojas, separadas ou juntas, com transferência de estoque",
    "equipe e comissão no fim do mês": "comissão por operador",
    "medo de largar o caderno e trocar de sistema": "primeiros passos guiados ao começar",
    "fiado que some no caderno": "contas a receber com vencimento (só como dor de quem usa caderno)",
    "loja que parece amadora para o cliente": "OS impressa com os dados da loja + link de acompanhamento",
    "cliente que volta e ninguém lembra o que foi feito": "histórico de consertos do cliente",
    "venda perdida porque o produto estava na outra loja": "estoque das lojas e transferência entre elas",
}
ANGULOS = {
    "dor → solução": "abre na cena do problema e mostra o que muda",
    "você sabia": "abre com uma curiosidade: algo que o dono não sabia que um sistema faz",
    "antes × depois": "contraste direto entre o jeito antigo e o jeito com o AlvoManage",
    "lista": "\"3 sinais de que…\" ou \"2 coisas que…\" (contagem de itens, nunca estatística inventada)",
    "fala do cliente": "abre com uma frase que o cliente fala no balcão, entre aspas",
    "erro comum": "aponta um erro que muito dono comete sem perceber",
    "bastidor": "um momento do dia do dono da loja, contado de perto",
    "pergunta provocativa": "uma pergunta que faz o empresário pensar no próprio negócio",
    "caderno × sistema": "compara o caderno/papel com o sistema num detalhe concreto",
    "novidade": "anuncia como lançamento: o que é, o que faz, por que muda o jogo (selo NOVIDADE combina)",
    "demonstração": "mostra como funciona em 2 ou 3 passos simples",
    "visão grande": "fala do tamanho da mudança para o negócio, de dono para dono, sem exagero nem número inventado",
}


# Vocabulário da arte: o MESMO que o orquestrador lê (tools/vocab_arte.py). O assessor escolhe a chave; o código escreve a frase exata.
CAMPOS_ARTE = {"composicao": "composicao", "solucao": "solucao", "posicao_foto": "foto_layout", "tratamento_foto": "foto_efeito", "estilo_icone": "icone_estilo", "fundo": "fundo_estilo",
               "luz": "luz", "sombra": "sombra", "destaque": "destaque", "enfeite": "enfeite", "desenho": "decoracao", "texto": "alinhamento"}
ROTULOS = {"composicao": "Composição", "solucao": "Solução", "posicao_foto": "Posição da foto", "tratamento_foto": "Tratamento da foto", "estilo_icone": "Estilo do ícone", "fundo": "Fundo",
           "luz": "Luz", "sombra": "Sombra", "destaque": "Destaque", "enfeite": "Enfeite", "desenho": "Desenho", "texto": "Texto"}
VISUAL = ("""A IMAGEM é tão importante quanto o texto: descreva a arte INTEIRA no campo "imagem", como um diretor de arte.
A arte é montada pelo Jev (código, sem IA de imagem): foto real de banco de fotos OU um ícone, sobre fundo nas cores da logo.
- "foto": a cena real e concreta, com detalhes que dá para achar num banco de fotos (quem, o quê, onde, ângulo, luz da cena).
  Ex.: "close de mão de técnico segurando celular com a tela trincada sobre bancada com ferramentas, luz quente".
  Use "sem foto" quando o assunto é recurso do sistema que foto nenhuma mostra; aí descreva o "icone".
- "icone" (só se sem foto): o objeto que o ícone mostra, em palavras simples (ex.: "celular com lupa", "caderno", "cadeado").
- "clima": 1 frase sobre o sentimento da arte (ex.: "tenso, problema do dia a dia" / "alívio, tudo sob controle").
- Os demais campos são escolhas FECHADAS: use exatamente uma das chaves abaixo (as cores são as da logo; não escolha cor).
  "composicao": use visual_lateral para foto/ícone ao lado da solução, icone_topo para imagem acima ou icone_baixo abaixo. O título sempre fica fora da foto. Em visual_lateral, escolha foto em cartão: a foto ocupa uma coluna e a solução a outra.
  "texto": centralizado ou à esquerda; na composição visual_lateral, a solução ocupa a coluna ao lado da imagem.
  "solucao": como a frase da solução (subtítulo) aparece. O Enzo acha CHATO o bloquinho pequeno embaixo: prefira faixa, cartão ou grande.
  A arte não pode ficar VAZIA (pedido do Enzo): use "selo" e "pontos" para dar informação e preencher bem o espaço.
  Combine com a mensagem: respeite primeiro o perfil aprendido, incluindo proibições; problema NÃO obriga vinheta ou sombra e novidade NÃO obriga holofote. Não contradiga os campos nas instruções extras.
""" + "\n".join(f"  {c}: " + " | ".join(f"{k} ({f})" for k, f in VOCAB[campo].items()) for c, campo in CAMPOS_ARTE.items()))


def bloco_imagem(img):
    """Bloco "Imagem:" do prompt, uma linha por item, com as frases exatas do vocabulário (valor fora da lista cai fora)."""
    if not isinstance(img, dict):
        return f" Imagem: {img}" if str(img or "").strip() else ""
    foto = str(img.get("foto", "")).strip()
    sem = not foto or foto.lower().startswith(SEM_FOTO)
    ls = [f"- Foto: {SEM_FOTO if sem else foto}"]
    if sem and str(img.get("icone", "")).strip():
        ls.append(f"- Ícone: {str(img['icone']).strip()}")
    for c, campo in CAMPOS_ARTE.items():
        if (c in ("posicao_foto", "tratamento_foto") and sem) or (c == "estilo_icone" and not sem):
            continue
        frase = VOCAB[campo].get(str(img.get(c, "")).strip())
        if frase:
            ls.append(f"- {ROTULOS[c]}: {frase}")
    if str(img.get("clima", "")).strip():
        ls.append(f"- Clima: {str(img['clima']).strip()}")
    for x in (img.get("extras") or []):  # liberdade do assessor: pedidos novos que a lista não cobre (o Jev lê)
        if str(x).strip():
            ls.append(f"- {str(x).strip()}")
    return "\nImagem:\n" + "\n".join(ls)


def le(nome, padrao):
    try:
        f = PASTA / nome
        return f.read_text() if nome.endswith(".md") else json.loads(f.read_text())
    except (OSError, ValueError):
        return padrao


def escreve(sistema, pedido):
    """Texto do modelo do agente 'assessor' (modelos.json). Claude = assinatura (custo 0 aqui); outro provedor = DeepSeek."""
    cfg = json.loads((RAIZ / "modelos.json").read_text())
    perfil = cfg["perfis"][cfg["agentes"].get("assessor", "deepseek-flash")]
    if perfil.get("provedor") != "anthropic":
        return deepseek(sistema, pedido, max_tokens=8000)
    env = {k: v for k, v in os.environ.items() if k not in ("ANTHROPIC_BASE_URL", "ANTHROPIC_AUTH_TOKEN", "ANTHROPIC_API_KEY")}
    cmd = ["claude", "-p", "--model", perfil["modelo"], "--system-prompt", sistema, "--tools", "", "--setting-sources", "",
           "--no-session-persistence", "--output-format", "json"] + (["--effort", perfil["esforco"]] if perfil.get("esforco") else [])
    r = subprocess.run(cmd, input=pedido, capture_output=True, text=True, env=env, cwd=tempfile.gettempdir(), timeout=900)
    try:
        d = json.loads(r.stdout)
    except ValueError:
        raise RuntimeError(f"assessor ({perfil['modelo']}) não respondeu: {(r.stderr or r.stdout)[-300:]}")
    if d.get("is_error"):
        raise RuntimeError(f"assessor ({perfil['modelo']}): {str(d.get('result'))[:300]}")
    return d.get("result", ""), 0.0


def jev(state, perguntas, etapa=""):
    r = subprocess.run(["python3", str(RAIZ / "tools/jev.py"), "-"], input=json.dumps({"state": state, "questions": perguntas}, ensure_ascii=False),
                       capture_output=True, text=True)
    try:
        d = json.loads(r.stdout)
    except ValueError:
        return None, "sem resposta"
    return (d.get("answers"), None) if "answers" in d else (None, "sem resposta")


def monta(item, modo):
    fim = bloco_imagem(item.get("imagem"))
    selo = str(item.get("selo") or "").strip().replace('"', "")[:28]
    pontos = [str(x).strip().replace('"', "")[:40] for x in (item.get("pontos") or []) if str(x).strip()][:3]
    extra = (f'\nSelo: "{selo}"' if selo else "") + ("\nPontos: " + " | ".join(f'"{x}"' for x in pontos) if pontos else "")
    fim = extra + fim
    if modo == "carrossel":
        sl = [s for s in item.get("slides", []) if s.get("frase")]
        return " || ".join(f"{s['frase'].strip()} | {s.get('legenda', '').strip()}" for s in sl) + fim if 2 <= len(sl) <= 6 else ""
    if not item.get("titulo"):
        return ""
    return (f'Título: "{item["titulo"].strip()}"\nSubtítulo: "{item.get("subtitulo", "").strip()}"\n'
            f'Post do Instagram do AlvoManage para donos de assistência técnica e lojas, sobre {item.get("contexto", "o sistema")}.' + fim)


def historico(limite=None):
    """Tudo que o Enzo já avaliou, com o prompt junto do comentário (comentário solto — "todo sistema tem isso" — não ensina nada)."""
    ex = le("exemplos.json", [])
    vistos = {e["texto"][:120] for e in ex}
    try:  # "Não gostei" do botão AlvoManage guardava só o id ("post:6"): busca o texto no banco
        banco = json.loads((RAIZ / "painel/alvomanage-prompts.json").read_text())
    except (OSError, ValueError):
        banco = {}

    def texto_de(origem):
        m, _, i = origem.partition(":")
        return (banco.get(m) or [{}] * (int(i) + 1))[int(i)].get("prompt", "") if m in ("post", "carrossel") and i.isdigit() and int(i) < len(banco.get(m) or []) else origem
    antigos = [{"texto": texto_de(r.get("origem", "")), "bom": r["regra"].startswith("Fazer como"), "motivo": r["regra"].split(":", 1)[-1].strip()}
               for r in le("regras.json", []) if r.get("origem", "")[:120] not in vistos]
    antigos = [e for e in antigos if len(e["texto"]) > 20]
    tudo = antigos + ex
    return tudo[-limite:] if limite else tudo


def arte_usada(v):
    """O que uma versão da arte pronta usou, nas frases do bloco Imagem (jev.json → versoes)."""
    if v.get("slides"):
        return "; ".join(f"slide {i + 1}: {arte_usada(sl)}" for i, sl in enumerate(v["slides"]))
    partes = []
    lay = str(v.get("foto_layout") or "").split(":")[-1].strip()
    partes.append(VOCAB["foto_layout"].get(lay, "com foto") if v.get("foto_layout") else "sem foto (ícone)")
    for campo in ("foto_efeito", "fundo_estilo", "luz", "sombra", "destaque", "enfeite", "decoracao", "icone_estilo", "alinhamento", "solucao", "composicao"):
        frase = VOCAB[campo].get(str(v.get(campo) or ""))
        if frase and not (campo == "icone_estilo" and v.get("foto_layout")):
            partes.append(frase)
    return ", ".join(partes)


def linhas(itens):
    out = []
    for e in itens:
        if e.get("origem") == "arte":  # avaliação da IMAGEM pronta, não do texto do prompt
            qual = f"versão {e['versao']}" if e.get("versao") else "as 3 versões"
            l = f"- {'👍' if e['bom'] else '👎'} ARTE PRONTA ({qual}) feita a partir do prompt: {e['texto']}"
            if e.get("texto_da_versao"):
                l += f"\n  texto desta versão (reescrito): {e['texto_da_versao']}"
            for v in e.get("arte") or []:
                l += f"\n  versão {v.get('n')} usou: {arte_usada(v)}"
        else:
            l = f"- {'👍' if e['bom'] else '👎'} {e['texto']}"
        out.append(l + (f"\n  comentário do Enzo: {e['motivo']}" if e.get("motivo") else ""))
    return "\n".join(out)


def aprender():
    """Reescreve aprendizado.md a partir de todas as avaliações. Trava: se já estiver rodando, deixa pendência e sai."""
    PASTA.mkdir(parents=True, exist_ok=True)
    trava, pend = open(PASTA / ".aprender.lock", "w"), PASTA / ".aprender.pendente"
    try:
        fcntl.flock(trava, fcntl.LOCK_EX | fcntl.LOCK_NB)
    except BlockingIOError:
        pend.touch()
        return "já estava aprendendo: esta avaliação entra na próxima rodada"
    while True:
        pend.unlink(missing_ok=True)
        hist = historico()
        if not hist:
            return "nada avaliado ainda"
        sistema = ("Você é o assessor de conteúdo do Instagram do AlvoManage (sistema para assistência técnica e lojas). "
                   "Seu trabalho agora é APRENDER o gosto do dono (Enzo) a partir das avaliações dele e escrever o PERFIL DE ESTILO que "
                   "você mesmo vai seguir ao escrever os próximos prompts. O Enzo escreve rápido e com erros de digitação: interprete a intenção. "
                   "Transforme comentários soltos em regras GERAIS e acionáveis (o que fazer, o que evitar, por quê), cada uma com um exemplo curto. "
                   "Junte regras repetidas; se duas se contradizem, vale a mais recente. Não invente preferência que as avaliações não mostram. "
                   "Você tem TOTAL LIBERDADE para criar regras de FORMATO novas: mandar acrescentar linhas, informações ou pedidos novos ao prompt e "
                   "deixá-lo maior, quando o Enzo ensinar algo que o formato atual não cobre.")
        pedido = (f"GUIA ESCRITO PELO ENZO:\n{le('guia.md', '')}\n\nPERFIL ATUAL (reescreva por inteiro):\n{le('aprendizado.md', '(vazio)')}\n\n"
                  f"FATOS DO PRODUTO:\n{FATOS}\n\nTODAS AS AVALIAÇÕES (mais antigas primeiro):\n{linhas(hist)}\n\n"
                  "As avaliações marcadas ARTE PRONTA são sobre a IMAGEM final (o que ela usou está listado): delas saem as regras de imagem "
                  "(que foto, posição, tratamento, luz, sombra, fundo, destaque, enfeite, desenho combinam com o gosto dele, e quais ele rejeita).\n"
                  "Escreva o PERFIL em Markdown, em português, com no máximo 32 regras no total, nestas seções:\n"
                  "## O que ele aprova\n## O que ele reprova\n## Assuntos gastos (não usar como tema principal)\n## Tom e forma\n"
                  "## Imagem que ele gosta (use os nomes do bloco Imagem)\n"
                  "Responda SÓ o Markdown do perfil, sem introdução.")
        texto, _ = escreve(sistema, pedido)
        if texto.strip().startswith("#") or "## " in texto:
            (PASTA / "aprendizado.md").write_text(texto.strip() + "\n")
        revisar_estoque()  # os prontos passam a seguir a lição nova (avaliação que chegar no meio vira outra volta)
        if not pend.exists():
            return f"aprendeu com {len(hist)} avaliações"


FORMATO_IMAGEM = ('"imagem": {"foto": "...", "icone": "...", "clima": "...", "posicao_foto": "<chave>", "tratamento_foto": "<chave>", '
                  '"estilo_icone": "<chave>", "fundo": "<chave>", "luz": "<chave>", "sombra": "<chave>", "destaque": "<chave>", '
                  '"enfeite": "<chave>", "desenho": "<chave>", "texto": "<chave>", "solucao": "<chave>", "composicao": "<chave>", "extras": ["<detalhes adicionais de cena e intenção; posicionamentos devem usar as opções executáveis acima>"]}')
FORMATO = {"post": '{"contexto": "<assunto em 2-5 palavras>", "titulo": "...", "subtitulo": "...", "selo": "<1-2 palavras ou vazio>", '
                    '"pontos": ["<até 3 informações curtas, até 28 letras cada>"], ' + FORMATO_IMAGEM + '}',
           "carrossel": '{"contexto": "<assunto em 2-5 palavras>", "slides": [{"frase": "...", "legenda": "..."}], ' + FORMATO_IMAGEM + '}'}


def sistema_redator():
    """Tudo que o redator precisa saber: guia, perfil aprendido, avaliações, fatos do produto e vocabulário da imagem."""
    guia, perfil = le("guia.md", ""), le("aprendizado.md", "")
    hist = historico()
    bons, ruins = [e for e in hist if e["bom"]][-15:], [e for e in hist if not e["bom"]][-15:]
    return ("Você é o redator de posts do Instagram do AlvoManage, em português do Brasil. Quem lê é o DONO de assistência técnica ou loja, um empresário. "
            "Instruções extras são preservadas, mas expresse os posicionamentos usando os campos executáveis. O GUIA atualizado prevalece sobre regras antigas contraditórias do perfil. Siga o GUIA do dono e o PERFIL que você aprendeu com as avaliações dele; imite os aprovados e nunca faça como os reprovados. "
            "Cada post tem que ser CURIOSO e realmente IMPORTANTE para o negócio: dinheiro que some, tempo perdido, cliente que não volta, briga com cliente, "
            "equipe, controle de várias lojas — algo que ele não sabia que um sistema faz, ou uma dor real resolvida de um jeito que surpreende. "
            "Também fale de COISAS GRANDES: as novidades e a INTELIGÊNCIA ARTIFICIAL dentro do sistema, o que muda no negócio — não só perguntas sobre acontecimentos do balcão. "
            "O que todo sistema tem nunca é novidade. A descrição da IMAGEM tem que ser detalhada e combinar com a mensagem. "
            "Você tem LIBERDADE para acrescentar ao prompt o que o Enzo ensinou e a lista não cobre (campo \"extras\" da imagem, selo, pontos) e deixá-lo tão longo quanto precisar. "
            "Use só os FATOS do produto; nunca invente número, preço ou recurso. Responda só JSON.\n\n"
            f"GUIA DO DONO:\n{guia}\n\nPERFIL APRENDIDO:\n{perfil or '- (nenhum ainda)'}\n\n"
            f"APROVADOS PELO ENZO:\n{linhas(bons) or '- (nenhum ainda)'}\n\nREPROVADOS PELO ENZO:\n{linhas(ruins) or '- (nenhum ainda)'}\n\n"
            f"FATOS DO PRODUTO:\n{FATOS}\n\n{VISUAL}")


def confere_lote(itens):
    """[(item, prompt)] → o Jev confere cada um contra guia + perfil (> 50% aprova)."""
    regras = [l.strip().lstrip("-• ").strip() for l in (le("guia.md", "") + "\n" + le("aprendizado.md", "")).splitlines() if l.strip().startswith(("-", "•"))][:50]

    def confere(par):
        it, p = par
        a, _ = jev({"author_rules_pt": regras, "instagram_post_prompt_pt": p}, perguntas={"segue": {
            "type": "noul", "instructions": "Does this Instagram post prompt follow the author's rules AND feel curious and important to a business owner "
            "(a real pain of the shop, or something he did not know a system could do)? Product news, AI capabilities and concrete demonstrations are valid; do not require a pain/question opening. Answer false if it is vague, a disconnected list of features, "
            "something every management system has presented as news, or breaks a rule.",
            "criteria": {"true": "Follows the rules and is curious, concrete and important.", "false": "Vague, generic, obvious or breaks a rule."}}})
        nota = (a or {}).get("segue", {}).get("noul")
        ok = aprova(nota, jev, {"instagram_post_prompt_pt": p}, "Is this a curious, concrete Instagram post prompt for a business owner?")
        return {"contexto": it.get("contexto", ""), "prompt": p, "item": it, "nota": nota, "ok": ok}

    with ThreadPoolExecutor(5) as ex:
        return list(ex.map(confere, itens))


def escolhe_pautas(n, uso, fora=()):
    """n pares (tema, ângulo) menos usados; tema que já está no estoque (fora) só se faltar opção."""
    conta = {}
    for u in uso:
        conta[u] = conta.get(u, 0) + 1
    tema_uso = {t: sum(v for k, v in conta.items() if k.startswith(t + "|")) for t in TEMAS}
    temas = sorted(TEMAS, key=lambda t: (t in fora, tema_uso[t], random.random()))
    out = []
    for i in range(n):
        t = temas[i % len(temas)]
        a = min(ANGULOS, key=lambda a: (conta.get(f"{t}|{a}", 0), any(p[1] == a for p in out), random.random()))
        conta[f"{t}|{a}"] = conta.get(f"{t}|{a}", 0) + 1
        out.append((t, a))
    return out


def gerar(modo, tema, n, evitar=(), pautas=None):
    if pautas is None and not tema:  # sem tema dado: a pauta escolhe (variedade)
        e = le("estoque.json", {})
        pautas = escolhe_pautas(n, e.get("pauta_usada", []), {x.get("pauta", "").split("|")[0] for m in ("post", "carrossel") for x in e.get(m, [])})
    if modo == "carrossel":
        pedido = (f"Escreva {n} carrosséis DIFERENTES entre si" + (f" sobre: {tema}" if tema else " sobre recursos variados") +
                  ". Cada um com 3 a 6 slides que contam uma história; o último slide não repete o primeiro. Frase até 40 caracteres, legenda até 80. "
                  '"imagem" descreve a arte do carrossel inteiro (ver regras da IMAGEM). ')
    else:
        pedido = (f"Escreva {n} posts DIFERENTES entre si" + (f" sobre: {tema}" if tema else " sobre recursos variados") +
                  ". Título até 45 caracteres, subtítulo até 90. \"imagem\" descreve a arte inteira (ver regras da IMAGEM). ")
    if pautas:
        n = len(pautas)
        pedido = pedido.replace(" sobre recursos variados", "")
        pedido += ("UM para cada pauta abaixo, na ordem (o tema diz a dor e o fato do produto; o ângulo diz o jeito de contar — "
                   "título e estrutura têm que seguir o ângulo, nada de repetir a mesma fórmula entre eles):\n" +
                   "\n".join(f"{i + 1}. Tema: {t} (fato: {TEMAS[t]}) · Ângulo: {a} — {ANGULOS[a]}" for i, (t, a) in enumerate(pautas)) + "\n")
    pedido += 'JSON: {"itens": [' + FORMATO[modo] + ']}'
    if evitar:  # assuntos que já estão prontos ou que o Enzo acabou de ver
        pedido += " Não repita estes assuntos: " + "; ".join(evitar) + "."
    corpo, custo = escreve(sistema_redator(), pedido)
    itens = [(it, monta(it, modo)) for it in _json_de(corpo).get("itens", [])]
    for i, (it, _) in enumerate(itens):
        if pautas and i < len(pautas):
            it["pauta"] = "|".join(pautas[i])
    res = confere_lote([(it, p) for it, p in itens if p])
    return {"prompts": [r for r in res if r["ok"]], "reprovados": sum(1 for r in res if not r["ok"]), "custo": custo}


# ---------- Estoque: prompts já prontos para o botão 🎯 AlvoManage entregar na hora ----------
# painel/assessor/estoque.json = {"post": [...], "carrossel": [...], "usados": [contextos já entregues]}
ALVO_ESTOQUE = {"post": 20, "carrossel": 10}


@contextlib.contextmanager
def trava(nome, esperar=True):
    """Trava entre processos (painel pode chamar várias vezes). esperar=False: devolve False se já está ocupada."""
    PASTA.mkdir(parents=True, exist_ok=True)
    f = open(PASTA / nome, "w")
    try:
        fcntl.flock(f, fcntl.LOCK_EX | (0 if esperar else fcntl.LOCK_NB))
    except BlockingIOError:
        f.close()
        yield False
        return
    try:
        yield True
    finally:
        f.close()


def estoque_muda(fn):
    with trava(".estoque.lock"):
        e = {"post": [], "carrossel": [], "usados": [], **le("estoque.json", {})}
        out = fn(e)
        (PASTA / "estoque.json").write_text(json.dumps(e, ensure_ascii=False, indent=1))
        return out


def abastecer():
    """Completa o estoque de cada formato (lotes de até 5), sem repetir assunto pronto ou recém-usado."""
    with trava(".abastecer.lock", esperar=False) as ok:
        if not ok:
            return "já estava abastecendo"
        # A atualização de direção visual revisa o estoque existente antes de repor.
        if le("estoque.json", {}).get("direcao_versao", 0) < 2:
            revisar_estoque()
            estoque_muda(lambda e: e.update(direcao_versao=2))
        feitos = 0
        for modo, alvo in ALVO_ESTOQUE.items():
            vazios = 0
            for _ in range(max(6, alvo * 2)):
                e = estoque_muda(lambda e: e)
                falta = alvo - len(e[modo])
                if falta <= 0:
                    break
                evitar = [x["contexto"] for x in e["post"] + e["carrossel"]] + e["usados"][-20:]
                pautas = escolhe_pautas(min(falta + 1, 5), e.get("pauta_usada", []), {x.get("pauta", "").split("|")[0] for x in e["post"] + e["carrossel"]})
                novos = [{"id": uuid.uuid4().hex[:10], "contexto": r["contexto"], "prompt": r["prompt"], "item": r["item"], "nota": r["nota"],
                          "pauta": r["item"].get("pauta", ""), "em": int(time.time())}
                         for r in gerar(modo, "", len(pautas), evitar, pautas)["prompts"]]
                def poe(e, m=modo, a=alvo, nv=novos, ps=pautas):
                    entra = nv[:max(0, a - len(e[m]))]
                    e[m].extend(entra)
                    e["pauta_usada"] = (e.get("pauta_usada", []) + ["|".join(p) for p in ps])[-300:]  # pedida conta como usada (mesmo se o Jev reprovou)
                    return len(entra)
                adicionados = estoque_muda(poe)
                feitos += adicionados
                vazios = 0 if adicionados else vazios + 1
                if vazios >= 3:
                    raise RuntimeError("O Jev rejeitou três lotes seguidos; estoque preservado para nova tentativa.")
        return f"abasteceu {feitos} prompt(s)"


def proximo(modo):
    """Tira o próximo prompt pronto do estoque (o painel repõe em seguida)."""
    def tira(e):
        if not e[modo]:
            return None
        x = e[modo].pop(0)
        e["usados"] = (e["usados"] + [x["contexto"]])[-40:]
        return x
    x = estoque_muda(tira)
    restam = len(le("estoque.json", {}).get(modo, []))
    return {"prompt": x["prompt"], "contexto": x["contexto"], "restam": restam} if x else {"vazio": True}


def revisar_estoque():
    """Depois de uma lição: o assessor EDITA os prompts prontos para seguir o perfil novo (só o necessário);
    o que virou assunto proibido sai. O Jev confere de novo; o que ele reprovar sai e o abastecer repõe."""
    e = estoque_muda(lambda e: e)
    lista = [{"id": x["id"], "modo": m, **x["item"]} for m in ("post", "carrossel") for x in e[m] if x.get("item")]
    if not lista:
        return "estoque vazio"
    def revisa(parte):
        pedido = ("Estes prompts estão PRONTOS no estoque, mas foram escritos antes da última avaliação do Enzo. "
                  "Releia o PERFIL e as avaliações mais recentes e EDITE cada um só no que for preciso para seguir o que ele ensinou (texto e imagem). "
                  "Mantenha o tema e o jeito de contar de cada um (campo \"pauta\"). "
                  "Se o assunto agora é proibido ou gasto, ou não tem conserto, marque \"descartar\": true. Mantenha \"id\", \"modo\" e \"pauta\" de cada um.\n"
                  'Responda JSON: {"itens": [{"id": "...", "modo": "post|carrossel", "descartar": false, ...mesmos campos do formato}]}\n'
                  f"Formato de post: {FORMATO['post']}\nFormato de carrossel: {FORMATO['carrossel']}\n\n"
                  f"PROMPTS PRONTOS:\n{json.dumps(parte, ensure_ascii=False)}")
        corpo, _ = escreve(sistema_redator(), pedido)
        return [x for x in _json_de(corpo).get("itens", []) if isinstance(x, dict)]
    with ThreadPoolExecutor(3) as ex:  # 30 prontos de uma vez deixa a resposta grande demais: partes de 10
        partes = list(ex.map(revisa, [lista[i:i + 10] for i in range(0, len(lista), 10)]))
    volta = {x.get("id"): x for p_ in partes for x in p_}
    editados, sai = [], set()
    for x in lista:
        r = volta.get(x["id"])
        if not r:
            continue  # o modelo não devolveu: fica como estava
        if r.get("descartar"):
            sai.add(x["id"])
            continue
        it = {k: v for k, v in r.items() if k not in ("id", "modo", "descartar")}
        p = monta(it, x["modo"])
        if p:
            editados.append((x["id"], it, p))
        else:
            sai.add(x["id"])
    conferidos = confere_lote([(it, p) for _, it, p in editados])
    novos = {}
    for (pid, it, p), c in zip(editados, conferidos):
        if c["ok"]:
            novos[pid] = {"prompt": p, "item": it, "contexto": it.get("contexto", ""), "nota": c["nota"]}
        else:
            sai.add(pid)

    def aplica(e):
        for m in ("post", "carrossel"):
            e[m] = [{**x, **novos.get(x["id"], {})} for x in e[m] if x["id"] not in sai]  # o que foi entregue nesse meio-tempo já saiu
    estoque_muda(aplica)
    return f"revisou {len(novos)}, descartou {len(sai)}"


if __name__ == "__main__":
    arg = sys.argv[1:]
    if arg in (["--aprender"], ["--abastecer"]):
        pendente = PASTA / ".aprendizado.pendente"
        if arg == ["--aprender"] or pendente.exists():
            sinal = pendente.read_text() if pendente.exists() else None
            r = aprender()
            print(r)
            if r.startswith("já estava"):
                sys.exit(0)
            # Uma avaliação que chegou durante o aprendizado fica para a próxima rodada.
            if pendente.exists() and pendente.read_text() == sinal:
                pendente.unlink()
        print(abastecer())
        sys.exit(0)
    if len(arg) == 2 and arg[0] == "--proximo":
        print(json.dumps(proximo("carrossel" if arg[1] == "carrossel" else "post"), ensure_ascii=False))
        sys.exit(0)
    pedido = json.loads(sys.stdin.read() or "{}")
    modo = "carrossel" if pedido.get("modo") == "carrossel" else "post"
    evitar = [str(x)[:60] for x in (pedido.get("evitar") or [])][-30:]
    print(json.dumps(gerar(modo, str(pedido.get("tema", "")).strip()[:200], max(1, min(15, int(pedido.get("n", 10)))), evitar), ensure_ascii=False))
