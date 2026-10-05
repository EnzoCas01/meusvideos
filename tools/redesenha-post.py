#!/usr/bin/env python3
"""Redesenha as imagens de um post/carrossel já criado, com o tamanho de logo atual do painel.
Não chama Jev nem DeepSeek: usa as specs que o orquestrador-post gravou (fotos, fundos e ícones já decididos).
Uso: python3 tools/redesenha-post.py <pasta_do_job>
"""
import json
import subprocess
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
JOB = Path(sys.argv[1]).resolve()
ent = json.loads((JOB / "entrega.json").read_text())
try:
    logo_px = int(json.loads((RAIZ / "painel/config.json").read_text()).get("logo_px", 90))
except (OSError, ValueError):
    logo_px = 90
if ent.get("motor") == "editorial":  # motor editorial: specs v2 em <job>/design/vN.json; só a logo muda de tamanho
    slides = JOB / "slides"
    for n in range(1, ent.get("versoes", 1) + 1):
        spec_f = JOB / "design" / f"v{n}.json"
        if not spec_f.exists():
            continue
        spec = json.loads(spec_f.read_text())
        for sl in spec["slides"]:
            for c in sl["camadas"]:
                if c.get("id") == "logo" and c.get("w") and c.get("h"):
                    c["h"], c["w"] = round(c["h"] * logo_px / c["w"]), logo_px
        spec_f.write_text(json.dumps(spec, ensure_ascii=False, indent=1))
        tmp = slides / f".r{n}"
        r = subprocess.run(["node", str(RAIZ / "tools/design/render.mjs"), str(spec_f), str(tmp)], cwd=RAIZ, capture_output=True, text=True)
        if r.returncode:
            sys.exit(f"render da versão {n} falhou: {(r.stdout + r.stderr)[-400:]}")
        for png in sorted(tmp.glob("slide-*.png")):
            png.replace(slides / f"v{n}-{png.name}")
        for resto in tmp.glob("*"):
            resto.unlink()
        tmp.rmdir()
    print(json.dumps({"ok": True, "logo_px": logo_px, "motor": "editorial"}))
    sys.exit(0)
base = ent["sx"][:-1]  # sx da última versão = base + letra da versão
slides = JOB / "slides"
for n in range(1, ent.get("versoes", 1) + 1):
    spec_f = RAIZ / f"src/specs/{base}{'abcdefghijklmnopqrstuvwxyz'[n - 1]}.json"
    if not spec_f.exists():
        continue
    spec = json.loads(spec_f.read_text())
    spec["logo_px"] = logo_px
    spec_f.write_text(json.dumps(spec, ensure_ascii=False, indent=1) + "\n")
    tmp = slides / f".r{n}"
    tmp.mkdir(parents=True, exist_ok=True)
    r = subprocess.run(["node", str(RAIZ / "tools/render-post-fast.mjs"), str(spec_f), str(tmp)], cwd=RAIZ, capture_output=True, text=True)
    if r.returncode:
        sys.exit(f"render da versão {n} falhou: {(r.stdout + r.stderr)[-400:]}")
    for png in sorted(tmp.glob("*.png")):
        png.replace(slides / f"v{n}-{png.name}")
    tmp.rmdir()
print(json.dumps({"ok": True, "logo_px": logo_px}))
