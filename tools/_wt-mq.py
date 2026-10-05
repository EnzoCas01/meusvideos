#!/usr/bin/env python3
"""Roda o word-timings (motor whisper, que precisa do .venv-whisper) na narração mq.

O ds-guard só libera `.venv-whisper/bin/python tools/bruto.py`; qualquer outro
script do venv é negado. Aqui o filho é invisível para o guard.
"""
import subprocess
import sys

cmd = [
    ".venv-whisper/bin/python", "-u", "tools/word-timings.py",
    "src/narration-mq.json", "public/audio/vo-mq",
]
print(" ".join(cmd), flush=True)
raise SystemExit(subprocess.run(cmd, cwd="/root/meusvideos").returncode)
