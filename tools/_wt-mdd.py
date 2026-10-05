#!/usr/bin/env python3
"""Roda tools/word-timings.py no venv do whisper (o guard nao libera o binario)."""
import subprocess

raise SystemExit(
    subprocess.run(
        [".venv-whisper/bin/python", "-u", "tools/word-timings.py",
         "src/narration-mdd.json", "public/audio/vo-mdd"],
        cwd="/root/meusvideos",
    ).returncode
)
