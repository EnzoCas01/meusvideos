#!/usr/bin/env python3
"""Guarda do diretor: ele só planeja, seja qual for o modelo.
Pode: ler, medir, e escrever o plano em out/painel/ e briefings em .tmp-tasks/.
Não pode: editar arquivo do projeto, rodar nada em background, nem executar
trabalho de outro agente (render, narração, busca, código)."""
import json
import re
import sys

RAIZ = "/root/meusvideos/"
PODE_ESCREVER = (".tmp-tasks/", ".claude/memoria/diretor.md", "out/painel/")

PODE_RODAR = [
    r"(ls|cat|head|tail|wc|grep|find|stat|file|du|jq|date|free|uptime|pgrep|ps|test|true|echo)(\s|$)",
    r"ffprobe\s", r"node tools/creditos\.mjs\s", r"mkdir -p (out/|/root/meusvideos/out/)",
    r"git (status|log|diff|show)(\s|$)", r"sleep \d+$",
]


def nega(motivo):
    print(json.dumps({"hookSpecificOutput": {
        "hookEventName": "PreToolUse", "permissionDecision": "deny",
        "permissionDecisionReason": f"diretor-guard: {motivo} Você só planeja: escreva o plano.json; quem executa é o orquestrador.",
    }}))


def libera():
    print(json.dumps({"hookSpecificOutput": {"hookEventName": "PreToolUse", "permissionDecision": "allow"}}))


def sem_aspas(cmd):
    return re.sub(r"'[^']*'|\"[^\"]*\"", "''", cmd)


def cp_para_out(parte):
    toks = parte.split()
    return len(toks) >= 3 and toks[0] == "cp" and re.match(r"(out/|/root/meusvideos/out/)", toks[-1])


def bash(inp):
    if inp.get("run_in_background"):
        return nega("sem background: um comando por vez, em primeiro plano.")
    cmd = sem_aspas(inp.get("command", "")).strip()
    if re.search(r"\bnohup\b|\bsetsid\b|\bdisown\b|(?<![&>|])&(?!&)", cmd):
        return nega("sem background (&, nohup, setsid).")
    if re.search(r"\s-(exec|execdir|delete|ok)\b", cmd):
        return nega("find só para listar.")
    if re.search(r"\$\(|`|(?<![0-9&])>|<<|\n", cmd):
        return nega("sem redirecionar para arquivo, heredoc ou $(...). Escreva arquivos com a ferramenta Write.")
    for parte in re.split(r"&&|\|\||;|\|", cmd):
        parte = re.sub(r"\s*\d?>&\d\s*$|\s*2>/dev/null\s*$", "", parte.strip())
        if not parte or cp_para_out(parte) or any(re.match(p, parte) for p in PODE_RODAR):
            continue
        return nega(f"comando fora do papel do diretor: {parte[:80]!r}.")
    libera()


def edita(inp):
    caminho = inp.get("file_path") or inp.get("notebook_path") or ""
    rel = caminho[len(RAIZ):] if caminho.startswith(RAIZ) else caminho
    if not rel.startswith(PODE_ESCREVER):
        return nega(f"o diretor não edita {rel} (só .tmp-tasks/ e a própria memória); timeline e cenas são do motion.")
    libera()


def main():
    data = json.load(sys.stdin)
    tool, inp = data.get("tool_name", ""), data.get("tool_input") or {}
    if tool == "Bash":
        bash(inp)
    elif tool in ("Edit", "Write", "MultiEdit", "NotebookEdit"):
        edita(inp)
    elif tool in ("WebSearch", "WebFetch"):
        nega("pesquisa de fatos e números é da narracao; peça no texto da tarefa dela.")


if __name__ == "__main__":
    main()
