#!/usr/bin/env python3
"""PreToolUse hook para os agentes da DeepSeek (tools/ds.sh).

Allowlist, não denylist: só libera comandos que batem com um padrão seguro e
conhecido para este projeto (ffmpeg, remotion, node/python3 dentro do repo,
inspeção de processos, git local sem force/push). Tudo que não bate é negado
— sem "ask", porque a sessão roda sem terminal (-p) e um "ask" travaria.
"""
import json
import re
import sys

PROJECT = "/root/meusvideos"

ALLOW = [
    r"^pgrep\b", r"^ps\b", r"^pkill\s+-0\b",
    r"^ls\b", r"^cat\b", r"^head\b", r"^tail\b", r"^wc\b", r"^find\s+\S", r"^grep\b", r"^du\b", r"^df\b", r"^file\b",
    r"^echo\b", r"^mkdir\s+-p\s+\S", r"^cd\s+",
    r"^ffmpeg\b", r"^ffprobe\b",
    r"^node\s+tools/", r"^node\s+node_modules/", r"^npx\s+remotion\s+(still|render|compositions)\b",
    r"^npx\s+eslint\b", r"^npx\s+tsc\b", r"^node_modules/\.bin/eslint\b",
    r"^python3\s+tools/", r"^python3\s+-m\s+edge_tts\b", r"^\.venv-whisper/bin/python\s+tools/bruto\.py\s",
    r"^git\s+(status|diff|add|log|show)\b",
    # controle de shell (for/while/if) — permite loops de inspeção como
    # `for f in *.wav; do ffprobe ... "$f"; done`; cada pedaço da cadeia
    # ainda passa pelo allowlist individualmente.
    r"^for\s", r"^while\s", r"^if\s", r"^then\b", r"^else\b", r"^elif\s", r"^fi\b",
    r"^do\s", r"^do$", r"^done\b", r"^done$",
    # Docker: SÓ o container do SearXNG (busca de imagens). `docker run` tem
    # validação própria em check_docker_run(); aqui só as operações simples,
    # todas presas ao nome "searxng" ou somente-leitura.
    r"^docker\s+ps\b", r"^docker\s+images\b",
    r"^docker\s+pull\s+searxng/searxng(:[\w.-]+)?$",
    r"^docker\s+logs\s+(--tail\s+\d+\s+)?searxng$",
    r"^docker\s+(stop|start|restart|rm|inspect)\s+searxng$",
]

# curl é liberado só para os hosts que o agente `imagem` já documentou como
# seguros/necessários (busca de imagem com licença rastreável + SearXNG
# local, se ele decidir subir um). Qualquer outro destino cai no denylist.
# Comparação é por HOSTNAME exato (ou subdomínio), nunca substring — uma
# regex tipo r"archive\.org" casaria "archive.org.attacker.com" também.
CURL_ALLOWED_HOSTS = {
    "commons.wikimedia.org": None,
    "api.openverse.org": None,
    "127.0.0.1": 8888,  # SearXNG local, se o agente subir
    "localhost": 8888,
    # Trilhas royalty-free (agente `som`): coleção do Kevin MacLeod, CC BY 4.0.
    "archive.org": None,
    "incompetech.com": None,
}

# Flags de curl que escrevem em disco fora do que o allowlist já cobre, ou
# que mudam o alvo real da requisição sem aparecer no host da URL.
CURL_FORBIDDEN_FLAGS = {
    "-o", "-O", "--output", "--output-dir", "-K", "--config",
    "-D", "--dump-header", "--resolve", "-x", "--proxy", "--proxy-user",
}


def check_curl(part: str):
    """curl só para os hosts do CURL_ALLOWED_HOSTS, por hostname exato/subdomínio
    (nunca substring), sem flag que grave arquivo, leia config ou troque o proxy."""
    import shlex
    from urllib.parse import urlparse
    try:
        tokens = shlex.split(part)
    except ValueError:
        return False, "curl mal formado"
    if not tokens or tokens[0] != "curl":
        return False, "não é curl"
    urls = []
    for tok in tokens[1:]:
        flag = tok.split("=", 1)[0]
        if flag in CURL_FORBIDDEN_FLAGS:
            return False, f"flag curl proibido: {tok}"
        if tok.startswith("-"):
            continue
        urls.append(tok)
    if not urls:
        return False, "curl sem URL"
    for u in urls:
        p = urlparse(u)
        if p.scheme not in ("http", "https"):
            return False, f"esquema de URL não permitido: {u[:80]!r}"
        host = (p.hostname or "").lower()
        allowed_port = next(
            (port for h, port in CURL_ALLOWED_HOSTS.items() if host == h or host.endswith("." + h)),
            "not-allowed",
        )
        if allowed_port == "not-allowed":
            return False, f"host não permitido: {host or u[:80]!r}"
        if allowed_port is not None and p.port != allowed_port:
            return False, f"porta não permitida para {host}: {p.port}"
    return True, ""

DENY_RAW = [
    r"\bsudo\b", r"\brm\s+-[a-z]*r", r"\bsystemctl\b", r"\bservice\s+\w+\s+(stop|restart)\b",
    r"\bkill\s+-9\b|\bkillall\b", r"/home/producao", r"--force\b", r"\bmkfs\b", r"\bdd\s+if=",
    r"\bshutdown\b|\breboot\b", r"\bcrontab\b", r">\s*/etc/", r"/root/\.ssh", r"\bcurl\b.*\|\s*sh",
    r"\bchmod\s+-R\s+777\b", r"\.\./\.\./",
    # `find` com qualquer flag de execução vira RCE arbitrário via allowlist.
    r"\bfind\b[^;&|\n]*-(exec|execdir|delete|fprint|fprintf|ok|okdir)\b",
]

# Substituição de comando ($(...) e crase) expande DENTRO de aspas duplas em
# bash — "echo "$(evil)"" ainda executa evil. Por isso é checada contra o
# comando CRU, sem nenhum stripping, nunca contra a versão com aspas
# removidas (que esconderia justamente esse caso).
DENY_RAW_ALWAYS = [r"\$\(", r"`", r"<\(", r">\("]

# Redirecionamento/injeção que só é operador FORA de aspas — dentro de "..."
# ou '...' é texto literal (ex.: uma URL com "&" na query string). Checados
# contra a versão SEM o conteúdo de strings entre aspas (ver strip_quoted).
# Inclui > / >> / < / << porque, sem isto, qualquer comando do allowlist
# (mesmo `echo`) pode sobrescrever ou ler arquivo arbitrário só por estar
# concatenado depois — o allowlist casa só o INÍCIO da string (re.match).
DENY_STRIPPED = [
    r"\|\|", r"\n", r"(?<!&)&(?!&)", r">>?", r"<<?",
]


SEARXNG_DIR = "/root/meusvideos/searxng"
DOCKER_RUN_FORBIDDEN = {
    "--privileged", "--pid", "--network", "--net", "--ipc", "--uts", "--userns",
    "--cap-add", "--device", "--security-opt", "--volumes-from", "--mount",
    "--env-file", "--add-host", "--group-add", "--entrypoint",
}


def check_docker_run(part: str):
    """`docker run` só para o SearXNG: nome fixo, porta presa ao localhost,
    volume só dentro de /root/meusvideos/searxng, imagem como ÚLTIMO argumento
    (sem comando sobrescrito) e nenhum flag que dê acesso ao host."""
    import shlex
    try:
        tokens = shlex.split(part)
    except ValueError:
        return False, "docker run mal formado"
    if len(tokens) < 3 or tokens[:2] != ["docker", "run"]:
        return False, "não é docker run"
    args = tokens[2:]
    image = args[-1]
    if not re.fullmatch(r"searxng/searxng(:[\w.-]+)?", image):
        return False, "a imagem tem de ser searxng/searxng e vir por último (sem comando extra)"
    opts = args[:-1]
    joined = " ".join(opts)
    if "--name searxng" not in joined and "--name=searxng" not in joined:
        return False, "falta --name searxng"
    if "127.0.0.1:8888:8080" not in joined:
        return False, "porta precisa ser 127.0.0.1:8888:8080 (só localhost)"
    i = 0
    while i < len(opts):
        o = opts[i]
        flag = o.split("=", 1)[0]
        if flag in DOCKER_RUN_FORBIDDEN:
            return False, f"flag proibido: {flag}"
        if o in ("-v", "--volume") or o.startswith("--volume=") or (o.startswith("-v") and len(o) > 2):
            val = o.split("=", 1)[1] if o.startswith("--volume=") else (opts[i + 1] if o in ("-v", "--volume") else o[2:])
            src = val.split(":", 1)[0]
            if not (src == SEARXNG_DIR or src.startswith(SEARXNG_DIR + "/")):
                return False, f"volume fora de {SEARXNG_DIR}: {src}"
            if o in ("-v", "--volume"):
                i += 1
        i += 1
    return True, ""


def strip_quoted(cmd: str) -> str:
    """Remove the CONTENTS of single/double-quoted spans (keep the quotes),
    so a literal `&`/`|` inside a quoted URL query string (very common in
    our curl calls to Wikimedia/Openverse) doesn't get mistaken for a shell
    metacharacter. A quote-breaking payload just ends the "quoted" region
    early, which only makes the rest of the string MORE likely to be
    scanned, never less — never used to hide danger."""
    return re.sub(r"'[^']*'|\"[^\"]*\"", "''", cmd)


def deny(reason):
    print(json.dumps({"hookSpecificOutput": {
        "hookEventName": "PreToolUse", "permissionDecision": "deny",
        "permissionDecisionReason": f"ds-guard: {reason}",
    }}))


def main():
    data = json.load(sys.stdin)
    tool_input = data.get("tool_input") or {}
    cmd = tool_input.get("command", "").strip()
    if not cmd:
        return deny("comando vazio")
    if tool_input.get("run_in_background"):
        return deny(
            "Bash em background negado: esta sessão roda em turno único (claude -p, "
            "disparado pelo painel). Não existe 'depois' para voltar e coletar o resultado — "
            "rode em primeiro plano, um comando por vez, e espere a saída antes do próximo passo."
        )
    for pattern in DENY_RAW:
        if re.search(pattern, cmd, re.IGNORECASE):
            return deny(f"padrão perigoso ({pattern})")
    for pattern in DENY_RAW_ALWAYS:
        if re.search(pattern, cmd):
            return deny(f"substituição de comando proibida ({pattern})")
    stripped = strip_quoted(cmd)
    for pattern in DENY_STRIPPED:
        if re.search(pattern, stripped, re.IGNORECASE):
            return deny(f"metacaractere perigoso fora de aspas ({pattern})")
    # cada comando de uma cadeia com && / ; / | precisa bater no allowlist
    parts = re.split(r"&&|;|\|(?!\|)", cmd)
    for part in parts:
        part = part.strip()
        if not part:
            continue
        if re.match(r"^docker\s+run\b", part):
            ok, why = check_docker_run(part)
            if not ok:
                return deny(f"docker run negado: {why}")
            continue
        if re.match(r"^curl\b", part):
            ok, why = check_curl(part)
            if not ok:
                return deny(f"curl negado: {why}")
            continue
        if not any(re.match(p, part) for p in ALLOW):
            return deny(f"fora do allowlist: {part[:80]!r}")
    print(json.dumps({"hookSpecificOutput": {"hookEventName": "PreToolUse", "permissionDecision": "allow"}}))


if __name__ == "__main__":
    main()
