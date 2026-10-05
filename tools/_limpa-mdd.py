#!/usr/bin/env python3
"""Remove os scripts de sondagem da mdd (mantem _speedup-mdd.py e _wt-mdd.py)."""
import os

for name in ("_chk-mdd.py", "_chk-whisper-mdd.py", "_diag-mdd.py", "_regen-mdd.py"):
    path = os.path.join("tools", name)
    if os.path.exists(path):
        os.remove(path)
        print("removido", path)
