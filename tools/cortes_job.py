"""Job de CORTES do painel: live/vídeo longo → vários clipes 9:16 com legenda (AutoClip em vendor/autoclip).

Uso (painel): vendor/autoclip/.venv/bin/python tools/cortes_job.py <dir-do-job>
Lê <dir>/pedido.json {brutos:[...], cortes:{estilo}}; grava <dir>/progresso.json {pct, msg} durante
e, no fim, <dir>/corte-NN.mp4 + <dir>/cortes.json [{arquivo, titulo, gancho, nota, duracao_s}].
"""
import asyncio
import dataclasses
import json
import statistics
import os
import shutil
import subprocess
import sys
import urllib.request
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
os.environ["AUTOCLIP_HOME"] = str(RAIZ / "vendor/autoclip-home")
# DeepSeek (API dos agentes) PROPÕE os momentos; o Jev DECIDE quais viram corte. OpenRouter é só do Jev.
for linha in Path("/root/secrets/deepseek.env").read_text().splitlines():
    if linha.startswith("DEEPSEEK_API_KEY="):
        os.environ["AUTOCLIP_OPENAI_KEY"] = linha.split("=", 1)[1].strip()
# Jev: ≥ 0,6 aprovado; 0,4–0,6 entra marcado "em dúvida" (o Enzo decide); < 0,4 fica de fora.
JEV_APROVA, JEV_DUVIDA = 0.6, 0.4

from autoclip import config, paths  # noqa: E402
from autoclip.db import store  # noqa: E402
from autoclip.db.models import Job, new_id  # noqa: E402
from autoclip.pipeline import captions, export, ingest, runner  # noqa: E402
from autoclip.pipeline.export import output_filename  # noqa: E402
from autoclip.providers import base as provedor  # noqa: E402

# A IA às vezes devolvia título em inglês (teste 27/09): o prompt do AutoClip não fala de idioma.
_prompt = provedor.load_prompt
provedor.load_prompt = lambda v: _prompt(v) + (
    "\n\n## Language\n\nWrite every `title` and `hook` in Brazilian Portuguese (pt-BR), "
    "the language of the transcript. Never in English.\n")

ESTILOS = {"bold_pop", "karaoke_fill", "clean_lower", "boxed"}
ETAPAS = {"prepare": "Preparando o vídeo", "transcribe": "Transcrevendo a fala", "highlights": "IA escolhendo os melhores momentos",
          "reframe": "Enquadrando em 9:16 (seguindo quem fala)", "captions": "Montando a legenda", "export": "Exportando os cortes"}


# ---------- Jev decide quais candidatos viram corte (a DeepSeek só propõe) ----------
def deepseek_json(prompt: str) -> dict:
    corpo = {"model": "deepseek-flash", "messages": [{"role": "user", "content": prompt}],
             "response_format": {"type": "json_object"}}
    req = urllib.request.Request("https://api.deepseek.com/chat/completions", data=json.dumps(corpo).encode(), headers={
        "Authorization": f"Bearer {os.environ['AUTOCLIP_OPENAI_KEY']}", "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=180) as r:
        return json.loads(json.load(r)["choices"][0]["message"]["content"])


PERGUNTA_JEV = {"funciona": {
    "type": "noul",
    "instructions": "Would this clip work on its own as a short video (TikTok / Reels / Shorts) for a stranger who never saw the live?",
    "criteria": {"true": "The first seconds grab attention, it is fully understandable without the rest of the live, "
                         "and something lands by the end (an idea, advice, emotion, surprise or a strong line).",
                 "false": "Weak or slow opening, depends on context from elsewhere in the live, or it meanders without a payoff."}}}


JEV_NOTA: dict = {}  # clip.id → probabilidade do Jev (vai para cortes.json)


def jev_escolhe(clips, transcript, relato: list) -> list:
    """Traduz os candidatos para inglês (DeepSeek, 1 chamada; o Jev lê melhor inglês) e pergunta ao Jev um por um.

    Jev fora do ar = ficam os candidatos da DeepSeek, com aviso no resumo.
    """
    if not clips:
        return clips
    textos = {str(i): transcript.text_between(c.start_word, c.end_word) for i, c in enumerate(clips)}
    try:
        en = deepseek_json("Translate each value of this JSON from Portuguese to natural English. Return the same keys, "
                           'each value an object {"title", "speech"}.\n' + json.dumps(
                               {k: {"title": clips[int(k)].title, "speech": v} for k, v in textos.items()}, ensure_ascii=False))
    except Exception as e:  # noqa: BLE001
        relato.append(f"⚠️ Tradução falhou ({e}); o Jev julgou o texto em português.")
        en = {}
    aprovados, custo = [], 0.0
    for i, c in enumerate(clips):
        t = en.get(str(i)) or {}
        state = {"clip_title": t.get("title") or c.title, "speech": t.get("speech") or textos[str(i)],
                 "duration_seconds": round(c.end_s - c.start_s)}
        r = subprocess.run([sys.executable, str(RAIZ / "tools/jev.py"), "-"], capture_output=True, text=True,
                           input=json.dumps({"state": state, "questions": PERGUNTA_JEV}, ensure_ascii=False))
        try:
            dj = json.loads(r.stdout)
            p = dj["answers"]["funciona"]["noul"]
        except Exception:  # noqa: BLE001
            relato.append(f"⚠️ Jev não respondeu ({(r.stdout or r.stderr)[:200]}): ficaram os {len(clips)} candidatos da DeepSeek.")
            return clips
        custo += (dj.get("usage") or {}).get("cost") or 0
        marca_ = "✅" if p >= JEV_APROVA else "⚠️ dúvida" if p >= JEV_DUVIDA else "❌"
        relato.append(f"{marca_} {c.title} — Jev {round(p * 100)}% · DeepSeek nota {c.score}")
        if p >= JEV_DUVIDA:
            JEV_NOTA[c.id] = p
            aprovados.append(c)
    duvida = sum(JEV_NOTA[c.id] < JEV_APROVA for c in aprovados)
    relato.insert(0, f"Jev: {len(aprovados) - duvida} aprovados, {duvida} em dúvida, {len(clips) - len(aprovados)} fora "
                     f"— de {len(clips)} momentos propostos pela DeepSeek (Jev US$ {custo:.5f}).")
    return aprovados


def liga_jev(relato: list, marca) -> None:
    original = runner.PipelineRunner._stage_highlights

    async def com_jev(self, transcript, silences):
        clips = await original(self, transcript, silences)
        marca(55, "Jev decidindo quais momentos viram corte")
        return jev_escolhe(clips, transcript, relato)

    runner.PipelineRunner._stage_highlights = com_jev

# ---------- live com tela + webcam: tela inteira em cima, rosto da webcam embaixo ----------
W, H_TELA, H_ROSTO = 1080, 608, 1312  # 1080x1920 no total


def detecta_webcam(video: Path, dur: float, w: int, h: int, amostras: int = 16):
    """Rosto pequeno, parado e perto da borda em quase toda a live = webcam sobre a tela.

    YuNet (OpenCV), não o MediaPipe do AutoClip: o MediaPipe não enxerga rosto de ~5% do quadro.
    Devolve o recorte (x, y, largura, altura) da webcam em pixels da fonte, ou None.
    """
    import cv2

    modelo = Path(os.environ["AUTOCLIP_HOME"]) / "models/face_detection_yunet_2023mar.onnx"
    det = cv2.FaceDetectorYN.create(str(modelo), "", (w, h), 0.7)
    cap = cv2.VideoCapture(str(video))
    rostos = []  # (cx, cy, largura, altura) do maior rosto de cada amostra
    cinzas = []
    for i in range(amostras):
        cap.set(cv2.CAP_PROP_POS_MSEC, dur * 1000 * (i + 0.5) / amostras)
        ok, quadro = cap.read()
        if not ok:
            continue
        det.setInputSize((quadro.shape[1], quadro.shape[0]))
        _, achados = det.detect(quadro)
        if achados is not None and len(achados):
            x, y, fw, fh = max(achados, key=lambda r: r[2] * r[3])[:4]
            rostos.append((x + fw / 2, y + fh / 2, fw, fh))
            cinzas.append(cv2.cvtColor(quadro, cv2.COLOR_BGR2GRAY))
    cap.release()
    if len(rostos) < amostras * 0.6:
        return None
    cx, cy, fw, fh = (statistics.median(r[i] for r in rostos) for i in range(4))
    parado = statistics.pstdev(r[0] for r in rostos) < 0.05 * w and statistics.pstdev(r[1] for r in rostos) < 0.05 * h
    pequeno = fw < 0.12 * w
    na_borda = not (0.3 * w < cx < 0.7 * w and 0.3 * h < cy < 0.7 * h)
    if not (parado and pequeno and na_borda):
        return None
    # janela da webcam: bordas reais quando aparecem; senão estimativa pelo tamanho do rosto
    x0, x1, y0, y1 = janela_webcam(cinzas, cx, cy, fw, fh, w, h)
    bw, bh = x1 - x0, y1 - y0
    ch = bh
    cw = ch * W / H_ROSTO
    if cw > bw:
        cw, ch = bw, bw * H_ROSTO / W
    x = min(max(cx - cw / 2, x0), x1 - cw)
    y = min(max(cy - 0.42 * ch, y0), y1 - ch)
    return tuple(int(v) // 2 * 2 for v in (x, y, cw, ch))


def janela_webcam(cinzas, cx, cy, fw, fh, w, h):
    """Acha as 4 bordas da janela da webcam: a linha de corte que se repete em todos os quadros.

    Para cada lado, olha a faixa entre o rosto e ~3,5 rostos de distância e pega a maior variação
    de brilho entre linhas/colunas vizinhas (mediana entre as amostras, que ignora o que muda na tela).
    Borda fraca = sem janela visível (webcam colada na borda do quadro): usa a borda do quadro/estimativa.
    """
    import numpy as np

    pilha = np.stack(cinzas).astype(np.int16)
    fx0, fx1 = int(max(cx - fw, 0)), int(min(cx + fw, w))
    fy0, fy1 = int(max(cy - fh, 0)), int(min(cy + fh, h))
    linhas = np.median(np.abs(np.diff(pilha[:, :, fx0:fx1], axis=1)).mean(axis=2), axis=0)  # borda entre y e y+1
    colunas = np.median(np.abs(np.diff(pilha[:, fy0:fy1, :], axis=2)).mean(axis=1), axis=0)

    def borda(perfil, a, b, padrao):
        a, b = int(max(a, 0)), int(min(b, len(perfil)))
        if b - a < 3:
            return padrao
        trecho = perfil[a:b]
        i = int(trecho.argmax())
        return a + i + 1 if trecho[i] > 4 * (np.median(trecho) + 1) else padrao

    y0 = borda(linhas, cy - 3.5 * fh, cy - fh, max(cy - 1.5 * fh, 0))
    y1 = borda(linhas, cy + fh, cy + 3.5 * fh, min(cy + 1.6 * fh, h))
    x0 = borda(colunas, cx - 4 * fw, cx - fw, max(cx - 2.5 * fw, 0))
    x1 = borda(colunas, cx + fw, cx + 4 * fw, min(cx + 2.5 * fw, w))
    return x0, x1, y0, y1


def liga_tela_e_rosto(cam) -> None:
    """Troca só a montagem da imagem do AutoClip; transcrição, escolha e legenda seguem dele."""
    x, y, cw, ch = cam

    def filtro(request, *, subtitle_name, fonts_name="fonts"):
        g = (f"[0:v]split=2[a][b];"
             f"[a]scale={W}:{H_TELA}:force_original_aspect_ratio=decrease:flags=lanczos,"
             f"pad={W}:{H_TELA}:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1[tela];"
             f"[b]crop={cw}:{ch}:{x}:{y},scale={W}:{H_ROSTO}:flags=lanczos,setsar=1[rosto];"
             f"[tela][rosto]vstack,format=yuv420p[v]")
        if request.burn_captions and subtitle_name is not None:
            return g + f";[v]ass=filename={subtitle_name}:fontsdir={fonts_name}[vout]"
        return g + ";[v]null[vout]"

    export.build_video_filtergraph = filtro
    estilo = captions.get_style
    # legenda na emenda entre a tela e o rosto (base da legenda ~130 px abaixo da tela)
    captions.get_style = lambda k: dataclasses.replace(estilo(k), margin_v_ratio=(1920 - H_TELA - 130) / 1920)


def main(d: Path) -> None:
    pedido = json.loads((d / "pedido.json").read_text())
    c = pedido.get("cortes") or {}
    bruto = RAIZ / pedido["brutos"][0]
    progresso = d / "progresso.json"

    def marca(pct: float, msg: str) -> None:
        progresso.write_text(json.dumps({"pct": round(pct), "msg": msg}, ensure_ascii=False))

    settings = config.load()
    # A IA decide quantos: o prompt do AutoClip só devolve momento com nota ≥ 50 e não "enche" a lista.
    # 30 é só teto de segurança (cada corte leva ~1 min de CPU para exportar).
    settings.clips.max_clips = 30
    if c.get("estilo") in ESTILOS:
        settings.export.caption_style = c["estilo"]

    paths.ensure_layout()
    marca(1, "Preparando o vídeo")
    # move=True: não duplica a live no disco (o upload do painel é consumido aqui)
    source = store.create_source(ingest.ingest_file(bruto, move=True, title=pedido.get("prompt") or bruto.name))
    layout = "normal"
    if source.width and source.width > source.height:
        marca(2, "Procurando webcam sobre a tela")
        cam = detecta_webcam(Path(source.path), source.duration_s, source.width, source.height)
        if cam:
            liga_tela_e_rosto(cam)
            layout = "tela+rosto"
    relato: list = []
    liga_jev(relato, marca)
    job = store.create_job(Job(id=new_id(), source_id=source.id, provider=settings.active_provider,
                               settings=settings.model_dump(mode="json")))
    clips = asyncio.run(runner.PipelineRunner(
        job, source, settings=settings,
        on_progress=lambda e: marca(2 + e.overall * 96, ETAPAS.get(str(e.stage), str(e.stage))),
    ).run())

    saida = paths.exports_dir() / job.id
    feitos = sorted(saida.glob("*.mp4"), key=lambda p: p.stat().st_mtime)
    por_nome = {p.name: p for p in feitos}
    lista = []
    for clip in sorted(clips, key=lambda x: x.rank or 999):
        origem = por_nome.pop(output_filename(clip.title or f"clip-{clip.rank}", settings.export.ratio), None)
        if not origem:
            continue
        nome = f"corte-{len(lista) + 1:02d}.mp4"
        shutil.move(origem, d / nome)
        lista.append({"arquivo": nome, "titulo": clip.title, "gancho": clip.hook, "nota": clip.score,
                      "duracao_s": round(clip.end_s - clip.start_s), "layout": layout,
                      "jev": round(JEV_NOTA[clip.id], 2) if clip.id in JEV_NOTA else None})
    for resto in por_nome.values():  # nome fora do previsto: não perder o corte
        nome = f"corte-{len(lista) + 1:02d}.mp4"
        shutil.move(resto, d / nome)
        lista.append({"arquivo": nome, "titulo": resto.stem, "gancho": "", "nota": None, "duracao_s": None, "layout": layout})
    (d / "cortes.json").write_text(json.dumps(lista, ensure_ascii=False, indent=1))

    # intermediários ocupam GBs numa live: só os cortes ficam
    shutil.rmtree(saida, ignore_errors=True)
    shutil.rmtree(paths.source_media_dir(source.id), ignore_errors=True)
    shutil.rmtree(paths.job_work_dir(job.id), ignore_errors=True)
    marca(100, f"{len(lista)} cortes prontos")
    print(f"{len(lista)} cortes ({layout}).\n" + "\n".join(relato))


if __name__ == "__main__":
    main(Path(sys.argv[1]))
