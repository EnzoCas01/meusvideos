#!/usr/bin/env python3
"""Guard do diretor rodando pelo painel: o allowlist dos agentes + chamar os agentes e copiar o entregável."""
import importlib.util

spec = importlib.util.spec_from_file_location("dsguard", "/root/meusvideos/tools/ds-guard.py")
g = importlib.util.module_from_spec(spec)
spec.loader.exec_module(g)
g.ALLOW += [
    r"^tools/(ds|glm)\.sh\s",
    r"^cp\s+\S+\s+/root/meusvideos/out/painel/[\w-]+/\S+$",
]
g.main()
