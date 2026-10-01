"""Três direções executáveis para a mesma mensagem, persistidas no prompt."""
import copy
import re
from vocab_arte import VOCAB, escolhas_visuais

COMPOSICOES = ['icone_topo', 'visual_lateral', 'icone_baixo']
SOLUCOES = ['faixa', 'cartao', 'grande', 'balao', 'antes_depois']
CAMPOS = {'composicao':'composicao','solucao':'solucao','fundo':'fundo_estilo','luz':'luz','sombra':'sombra','destaque':'destaque','enfeite':'enfeite','desenho':'decoracao','texto':'alinhamento','estilo_icone':'icone_estilo','posicao_foto':'foto_layout','tratamento_foto':'foto_efeito'}


def tres_imagens(base, propostas=()):
    base = copy.deepcopy(base) if isinstance(base, dict) else {'foto':'sem foto','extras':[str(base or '')]}
    # Preserve os pedidos de conteúdo e as proibições; varie opções executáveis.
    comps = [base.get('composicao') if base.get('composicao') in COMPOSICOES else COMPOSICOES[0]]
    comps += [x for x in COMPOSICOES if x not in comps]
    sols = [base.get('solucao') if base.get('solucao') in SOLUCOES else 'faixa']
    sols += [x for x in SOLUCOES if x not in sols]
    out=[]
    for i in range(3):
        img = {**copy.deepcopy(base), **(copy.deepcopy(propostas[i]) if i < len(propostas) and isinstance(propostas[i], dict) else {})}
        img['composicao']=comps[i]
        img['solucao']=sols[i]
        if i:
            img['estilo_icone']=['circulo_suave','selo_quadrado','aneis'][i]
            img['destaque']=['cor','selo','peso'][i]
            if not str(img.get('foto','')).lower().startswith('sem foto'):
                img['tratamento_foto']=['nenhum','moldura','contraste'][i]
                img['posicao_foto']='topo_cartao'  # suporta as três posições espaciais
        # Extras espaciais antigos pertencem à versão original; não podem contrariar o novo layout.
        if i:
            img['extras']=[x for x in img.get('extras',[]) if re.search(r'\b(sem|nunca|não|nao|evitar|evite)\b',str(x),re.I)]
        out.append(img)
    return out


def separa_direcoes(visual):
    partes=re.split(r'(?im)^\s*Imagem\s+vers[aã]o\s+([23])\s*:\s*\n?',visual)
    out=[partes[0].strip(), '', '']
    for i in range(1,len(partes),2): out[int(partes[i])-1]=partes[i+1].strip()
    return out


def direcoes_do_prompt(visual):
    partes=separa_direcoes(visual)
    base=escolhas_visuais(partes[0])
    comps=[base.get('composicao','icone_topo')]+[x for x in COMPOSICOES if x!=base.get('composicao','icone_topo')]
    sols=[base.get('solucao','faixa')]+[x for x in SOLUCOES if x!=base.get('solucao','faixa')]
    out=[]
    for i,p in enumerate(partes):
        d=escolhas_visuais(p) if p else {**base,'composicao':comps[i],'solucao':sols[i]}
        # A composição é sempre diferente entre as versões, mesmo em prompts legados.
        d['composicao']=comps[i]
        out.append((p or partes[0],d))
    return out
