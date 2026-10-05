#!/usr/bin/env bash
# Cortes de live/vídeo longo → vários clipes 9:16 com legenda (AutoClip, vendor/autoclip).
# Uso: tools/cortes.sh <arquivo|link> [opções do `autoclip clip`, ex.: -n 5 -s karaoke_fill]
set -euo pipefail
RAIZ="$(cd "$(dirname "$0")/.." && pwd)"
export AUTOCLIP_HOME="$RAIZ/vendor/autoclip-home"
# Escolha dos cortes = a mesma API DeepSeek dos agentes (OpenRouter é só do Jev).
export AUTOCLIP_OPENAI_KEY="$(sed -n 's/^DEEPSEEK_API_KEY=//p' /root/secrets/deepseek.env)"
exec nice -n 10 "$RAIZ/vendor/autoclip/.venv/bin/autoclip" clip "$@"
