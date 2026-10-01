"""Assessor por assinatura: Claude principal, Codex como reserva configurável."""
import json
import os
import re
import subprocess
import tempfile
import time
from datetime import datetime, timezone, timedelta
from pathlib import Path


def salva(pasta, nome, dados):
    pasta.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(mode='w', dir=pasta, delete=False) as f:
        json.dump(dados, f, ensure_ascii=False)
        tmp=f.name
    os.replace(tmp,pasta/nome)


def chama(perfil,sistema,pedido):
    prov=perfil['provedor']
    if prov=='codex':
        with tempfile.TemporaryDirectory(prefix='assessor-codex-') as d:
            p=Path(d); schema=p/'saida.schema.json'; saida=p/'saida.json'
            schema.write_text(json.dumps({'type':'object','properties':{'texto':{'type':'string'}},'required':['texto'],'additionalProperties':False}))
            cmd=['codex','exec','--ignore-user-config','--ignore-rules','--ephemeral','--skip-git-repo-check','--sandbox','read-only','--model',perfil['modelo'],
                 '-c','model_reasoning_effort='+json.dumps(perfil.get('esforco','medium')),
                 '-c','project_doc_max_bytes=0','-c','features.shell_tool=false','-c','features.unified_exec=false','-c','features.code_mode_host=false',
                 '-c','web_search="disabled"','--output-schema',str(schema),'--output-last-message',str(saida),'-']
            entrada=('Você atua exclusivamente como assessor de conteúdo. Gere texto a partir do contexto fornecido, sem consultar arquivos, executar comandos ou usar ferramentas. '
                     'No campo texto da resposta, coloque exatamente o resultado solicitado (JSON ou Markdown).\n\nINSTRUÇÕES:\n'+sistema+'\n\nPEDIDO:\n'+pedido)
            r=subprocess.run(cmd,input=entrada,capture_output=True,text=True,cwd=d,timeout=900)
            if r.returncode or not saida.exists():
                raise RuntimeError(f"assessor ({perfil['modelo']}): {(r.stderr or r.stdout)[-500:]}")
            try: texto=json.loads(saida.read_text())['texto']
            except (ValueError,KeyError): raise RuntimeError('Codex devolveu resposta fora do formato texto.')
            if not str(texto).strip(): raise RuntimeError('Codex devolveu texto vazio.')
            return texto,0.0
    if prov=='anthropic':
        env={k:v for k,v in os.environ.items() if k not in ('ANTHROPIC_BASE_URL','ANTHROPIC_AUTH_TOKEN','ANTHROPIC_API_KEY')}
        cmd=['claude','-p','--model',perfil['modelo'],'--system-prompt',sistema,'--tools','','--setting-sources','','--no-session-persistence','--output-format','json']
        if perfil.get('esforco'): cmd+=['--effort',perfil['esforco']]
        r=subprocess.run(cmd,input=pedido,capture_output=True,text=True,env=env,cwd=tempfile.gettempdir(),timeout=900)
        try: d=json.loads(r.stdout)
        except ValueError: raise RuntimeError(f"assessor ({perfil['modelo']}): {(r.stderr or r.stdout)[-300:]}")
        if r.returncode or d.get('is_error') or not d.get('result','').strip():
            raise RuntimeError(f"assessor ({perfil['modelo']}): {str(d.get('result'))[:300]}")
        return d['result'],0.0
    if prov=='deepseek':
        from fotos import deepseek
        return deepseek(sistema,pedido,max_tokens=8000)
    raise RuntimeError('Provedor do assessor não suportado: '+prov)


def escreve_com_reserva(raiz,pasta,sistema,pedido):
    cfg=json.loads((raiz/'modelos.json').read_text())
    principal=cfg['agentes'].get('assessor','deepseek-flash')
    ordem=[principal]+cfg.get('reservas',{}).get('assessor',[])
    try: pausa=json.loads((pasta/'provedor-pausa.json').read_text())
    except (OSError,ValueError): pausa={}
    erros=[]
    for i,nome in enumerate(ordem):
        perfil=cfg['perfis'][nome]
        if i==0 and pausa.get('perfil')==nome and pausa.get('tentar_em',0)>time.time():
            erros.append(pausa.get('erro','Principal temporariamente indisponível'))
            continue
        try:
            texto,custo=chama(perfil,sistema,pedido)
            salva(pasta,'provedor-atual.json',{'perfil':nome,'modelo':perfil['modelo'],'reserva':i>0,'em':int(time.time()),'motivo':erros[-1] if erros else None})
            return texto,custo
        except (RuntimeError,subprocess.TimeoutExpired,OSError) as e:
            erro=str(e);erros.append(erro)
            if i==0:
                tentar=time.time()+900
                m=re.search(r'resets (\d+):(\d+)(am|pm) \(UTC\)',erro,re.I)
                if m:
                    agora=datetime.now(timezone.utc)
                    alvo=agora.replace(hour=int(m[1])%12+(12 if m[3].lower()=='pm' else 0),minute=int(m[2]),second=30,microsecond=0)
                    if alvo<=agora: alvo+=timedelta(days=1)
                    tentar=alvo.timestamp()
                salva(pasta,'provedor-pausa.json',{'perfil':nome,'erro':erro[-500:],'tentar_em':tentar})
    raise RuntimeError('Principal e reserva do assessor falharam: '+' | '.join(erros))
