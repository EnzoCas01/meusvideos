#!/usr/bin/env bash
# Renderiza uma composição sem IA: confere a composição e a RAM, renderiza com 1 núcleo e mede o resultado.
# Uso: tools/render.sh <Composicao> <saida.mp4>
# Saída: uma linha JSON {"ok":true,"arquivo":...,"duracao":s,"video":n,"audio":n,"segundos":t} ou {"ok":false,"erro":...}
set -uo pipefail
cd "$(dirname "$0")/.."
COMP=${1:?composição}; OUT=${2:?saída}
falha() { jq -cn --arg e "$1" '{ok:false, erro:$e}'; exit 1; }

grep -q "id=\"$COMP\"" src/Root.tsx || falha "composição $COMP não está registrada em src/Root.tsx"
for i in $(seq 1 60); do
  pgrep -f "generate-narration|remotion (render|still)|bruto.py" >/dev/null || break
  sleep 10   # um processo pesado por vez: espera narração/render/transcrição em andamento
done
LIVRE=$(awk '/MemAvailable/ {print int($2/1024)}' /proc/meminfo)
[ "$LIVRE" -ge 1200 ] || falha "só ${LIVRE} MB de RAM livres (mínimo 1200); não renderizei para não derrubar a máquina"

mkdir -p "$(dirname "$OUT")"
T0=$(date +%s)
LOG=$(npx remotion render src/index.ts "$COMP" "$OUT" --concurrency=1 --log=error 2>&1) || falha "render falhou: $(echo "$LOG" | grep -v 'network requests' | tail -c 800)"
T=$(( $(date +%s) - T0 ))
P=$(ffprobe -v error -show_entries format=duration:stream=codec_type -of json "$OUT") || falha "ffprobe não leu $OUT"
echo "$P" | jq -c --arg a "$OUT" --argjson t "$T" '{ok:true, arquivo:$a, duracao:(.format.duration|tonumber*10|round/10),
  video:([.streams[]|select(.codec_type=="video")]|length), audio:([.streams[]|select(.codec_type=="audio")]|length), segundos:$t}'
