#!/usr/bin/env bash
# Roda um agente do projeto no modelo definido em modelos.json.
# Uso: tools/agente.sh <agente> "<tarefa completa e autocontida>"
#      tools/agente.sh               (lista qual modelo cada agente usa)
# Registra ▶/■ em ds.log (o painel lê as etapas daí), a atividade ao vivo em
# $JOB_DIR/<agente>-atividade.log, os tokens em $JOB_DIR/usage.jsonl, e imprime o resultado final.
set -uo pipefail
cd "$(dirname "$0")/.."
CFG=modelos.json

if [ $# -eq 0 ]; then
  jq -r '.perfis as $p | .agentes | to_entries[] | "\(.key)\t\(.value)\t\($p[.value].modelo // "PERFIL INEXISTENTE")"' "$CFG" | column -t
  exit 0
fi
[ $# -eq 2 ] || { echo "uso: tools/agente.sh <agente> \"<tarefa>\"  |  tools/agente.sh <agente> @arquivo.txt" >&2; exit 2; }
AG=$1; TAREFA=$2
if [[ $TAREFA == @* ]]; then
  [ -r "${TAREFA:1}" ] || { echo "arquivo da tarefa não encontrado: ${TAREFA:1}" >&2; exit 2; }
  TAREFA=$(cat "${TAREFA:1}")
fi

[ -f ".claude/agents/$AG.md" ] || { echo "agente desconhecido: $AG (existem: $(ls .claude/agents | sed 's/\.md$//' | tr '\n' ' '))" >&2; exit 2; }
PERFIL=${AGENTE_PERFIL:-$(jq -r --arg a "$AG" '.agentes[$a] // empty' "$CFG")}
[ -n "$PERFIL" ] || { echo "$AG não está em $CFG → agentes" >&2; exit 2; }
read -r PROV MODELO ESFORCO < <(jq -r --arg p "$PERFIL" '.perfis[$p] | "\(.provedor // "") \(.modelo // "") \(.esforco // "")"' "$CFG")
[ -n "$PROV" ] && [ -n "$MODELO" ] || { echo "perfil '$PERFIL' incompleto ou inexistente em $CFG → perfis" >&2; exit 2; }
jq -e --arg p "$PROV" '.provedores | has($p)' "$CFG" >/dev/null || { echo "provedor '$PROV' não existe em $CFG → provedores" >&2; exit 2; }
read -r URL SEGREDO VAR < <(jq -r --arg p "$PROV" '.provedores[$p] | "\(.url // "") \(.segredo // "") \(.variavel // "")"' "$CFG")

unset ANTHROPIC_BASE_URL ANTHROPIC_AUTH_TOKEN ANTHROPIC_API_KEY
if [ -n "$URL" ]; then
  [ -r "$SEGREDO" ] || { echo "segredo não encontrado: $SEGREDO" >&2; exit 2; }
  set -a; . "$SEGREDO"; set +a
  export ANTHROPIC_BASE_URL="$URL" ANTHROPIC_AUTH_TOKEN="${!VAR}"
  unset "$VAR"
fi
export ANTHROPIC_MODEL="$MODELO" ANTHROPIC_SMALL_FAST_MODEL="$MODELO" \
  ANTHROPIC_DEFAULT_HAIKU_MODEL="$MODELO" ANTHROPIC_DEFAULT_SONNET_MODEL="$MODELO" ANTHROPIC_DEFAULT_OPUS_MODEL="$MODELO"

# O diretor tem guarda própria (pode curl/cp/git, mas não delega em background nem edita cena).
if [ "$AG" = diretor ]; then SETTINGS=tools/diretor-settings.json; else SETTINGS=tools/ds-settings.json; fi
ARGS=(-p --agent "$AG" --permission-mode acceptEdits --settings "$SETTINGS" --output-format stream-json --verbose)
ESFORCO=${AGENTE_ESFORCO:-$ESFORCO}
[ -n "$ESFORCO" ] && ARGS+=(--effort "$ESFORCO")

LOG=ds.log
echo "[$(date '+%F %T')] ▶ $AG · ${TAREFA:0:110}" >> "$LOG"
if [ -n "${JOB_DIR:-}" ]; then ERRLOG="$JOB_DIR/$AG.stderr.log"; ATIV="$JOB_DIR/$AG-atividade.log"; else ERRLOG=/dev/null; ATIV=/dev/null; fi
TMP=$(mktemp); trap 'rm -f "$TMP"' EXIT
roda() {
claude "${ARGS[@]}" "$TAREFA" </dev/null > "$TMP" 2>>"$ERRLOG" &
CPID=$!
python3 -u - "$AG" "$LOG" "$ATIV" "$TMP" "$CPID" "$PERFIL" <<'PY'
import json, os, sys, time
ag, log, ativ, tmp, cpid, perfil = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4], int(sys.argv[5]), sys.argv[6]
fim = None

def vivo():
    try:
        os.kill(cpid, 0)
        return True
    except ProcessLookupError:
        return False

def anota(msg):
    if ativ != "/dev/null":
        with open(ativ, "a") as f:
            f.write(f"[{time.strftime('%H:%M:%S')}] {msg}\n")

def trata(line):
    global fim
    try:
        ev = json.loads(line)
    except ValueError:
        return
    if ev.get("type") == "assistant":
        for blk in (ev.get("message") or {}).get("content") or []:
            bt = blk.get("type")
            if bt == "tool_use":
                inp = blk.get("input") or {}
                cmd = inp.get("command") or inp.get("file_path") or json.dumps(inp, ensure_ascii=False)
                anota(f"TOOL {blk.get('name')}: {cmd[:200]}")
            elif bt == "text" and (blk.get("text") or "").strip():
                anota("FALA: " + blk["text"].strip()[:200])
            elif bt == "thinking" and (blk.get("thinking") or "").strip():
                anota(f"THINKING: +{len(blk['thinking'])} chars")
    elif ev.get("type") == "result":
        fim = ev

with open(tmp) as f:
    buf = ""
    while True:
        chunk = f.readline()
        if chunk:
            buf += chunk
            if buf.endswith("\n"):
                trata(buf); buf = ""
            continue
        if not vivo():
            for line in (buf + f.read()).splitlines():
                trata(line)
            break
        time.sleep(0.5)

agora = time.strftime('%F %T')
if fim is None:
    open(log, "a").write(f"[{agora}] ✖ {ag} · perfil={perfil} · sem resultado (ver {ag}.stderr.log)\n")
    print(f"{ag} não devolveu resultado (processo caiu ou foi negado; ver ds.log e {ag}.stderr.log)")
    sys.exit(0)
uso = fim.get("modelUsage") or {}
open(log, "a").write(
    f"[{agora}] ■ {ag} · perfil={perfil} · modelo={','.join(uso) or '?'} · {fim.get('duration_ms', 0)//1000}s"
    f" · turnos={fim.get('num_turns')} · negados={len(fim.get('permission_denials') or [])}\n")
jd = os.environ.get("JOB_DIR")
if jd and uso:
    open(os.path.join(jd, "usage.jsonl"), "a").write(json.dumps({"agent": ag, "perfil": perfil, "ts": time.time(), "modelUsage": uso}) + "\n")
print(fim.get("result", "") if fim.get("subtype") == "success" else f"{ag} terminou com erro ({fim.get('subtype')}): {fim.get('result', '')}")
PY
wait "$CPID"
}
# Limite de sessão do Claude: testa de novo a cada 30 s até voltar (o limite pode sumir antes do horário, ex.: troca de login).
# O painel congela o relógio do job enquanto existir aguardando-limite.
ESPERA=30
while :; do
  SAIDA=$(roda)
  grep -qiE 'hit your (session|usage) limit' "$TMP" || break
  echo "[$(date '+%F %T')] ⏸ $AG · limite do Claude; testa de novo em ${ESPERA}s" >> "$LOG"
  [ -n "${JOB_DIR:-}" ] && echo $(( $(date +%s) + ESPERA )) > "$JOB_DIR/aguardando-limite"
  sleep "$ESPERA"
  [ -n "${JOB_DIR:-}" ] && rm -f "$JOB_DIR/aguardando-limite"
  echo "[$(date '+%F %T')] ▶ $AG · retomando após o limite" >> "$LOG"
  TAREFA="$TAREFA

VOCÊ FOI INTERROMPIDO pelo limite de uso no meio do trabalho. Confira o que já está feito nos arquivos e continue de onde parou."
done
printf '%s\n' "$SAIDA"
