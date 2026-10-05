#!/usr/bin/env python3
"""Cama musical de "Coca-Cola" — gera o WAV final e mede a mistura.

Mesmo metodo do Microsoft (tools/music-bed-ms.py) e do Disney v2
(tools/music-bed.py). Trecho escolhido por medicao em
tools/music-escolha-cc.py: Tranquility, 556,0 s -> 620,0 s. E o trecho com o
melhor arco sem buraco (score 0,89) e o unico em que a subida e um crescendo de
verdade: -23,0 dB em 28 s (a virada, Candler) subindo degrau a degrau ate
-11,6 dB em 46 s e ficando no plato ate o fecho. As outras candidatas boas
falhavam aqui — Light Awash da um degrau de 7,4 dB em 2 s aos 40 s (troca de
secao da faixa, nao crescendo) e o Ever Mindful tem uma pausa de -58 dB dentro
da janela (buraco na cama, que a serie proibe). A queda do fecho vem da curva do
componente (SoundtrackCC.tsx), nao do arquivo.

O ganho nao e chutado: a cama e gerada primeiro sem reducao, a loudness de
curto prazo (ebur128 short-term) da voz e da cama e comparada sob a fala, e o
ganho sai dessa diferenca. Como o volume e linear e vem depois do compressor,
uma iteracao basta — mas a cama e regerada e MEDIDA de novo para confirmar.

O duck NAO e gravado no WAV: ele e aplicado em tempo de render por musicDuckCC
(src/utils/narration-cc.ts), e aqui entra so para medir a mistura como ela vai
soar. Por isso o duck sai do proprio narration-cocacola.json, nao de uma
constante paralela que pode divergir.
"""
import json
import subprocess
import wave
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
TRACK = ROOT / "out/musica-candidatas/Tranquility.mp3"
ENERGY = ROOT / "out/musica-candidatas/tranquility-cc-energia.json"
NARR = ROOT / "src/narration-cocacola.json"
VO_DIR = ROOT / "public/audio/vo-cocacola"
OUT_DIR = ROOT / "public/audio/cocacola"
SCRATCH = ROOT / "out/musica-candidatas"

BED_WAV = OUT_DIR / "musica-cama.wav"
JSON_OUT = OUT_DIR / "musica-cama.json"
MIX_WAV = SCRATCH / "mix-teste-cocacola.wav"
S_TXT = SCRATCH / "_short-term-cc.txt"

FPS = 30
FRAMES = 1920                      # END_CC: ultima palavra (1875) + cauda (45)
DUR_S = FRAMES / FPS               # 64,0 s
SR = 48000
OFFSET_S = 556.0                   # escolhido por medicao
FADE_IN_S = 1.5
FADE_OUT_S = 2.5
COMP = "threshold=0.063:ratio=1.4:attack=50:release=600:makeup=1"
TAIL_GAIN = 0.9                    # cauda sem voz
RAMP_FRAMES = 10                   # rampa do duck
TARGET_MARGIN_DB = 16.0            # voz - cama sob a fala (regra: >= ~15)
SILENCE = -70.0


def run(cmd: list) -> None:
    subprocess.run(cmd, check=True, capture_output=True)


def build_bed(gain_db: float, out_path: Path) -> None:
    """Recorta o trecho, comprime leve, reduz o ganho e aplica os fades."""
    fade_out_at = DUR_S - FADE_OUT_S
    chain = (
        f"atrim=start={OFFSET_S}:duration={DUR_S},asetpts=N/SR/TB,"
        f"aformat=sample_fmts=fltp:sample_rates={SR}:channel_layouts=stereo,"
        f"acompressor={COMP},"
        f"volume={gain_db:.2f}dB,"
        f"afade=t=in:st=0:d={FADE_IN_S},"
        f"afade=t=out:st={fade_out_at:.2f}:d={FADE_OUT_S}"
    )
    run(["ffmpeg", "-v", "error", "-nostdin", "-threads", "1", "-y", "-i", str(TRACK),
         "-af", chain, "-c:a", "pcm_s16le", str(out_path)])


def speech_intervals() -> list:
    """(inicio_s, fim_s) de cada fala, dos frames absolutos do JSON."""
    data = json.loads(NARR.read_text())
    return [(ln["frame"] / FPS, (ln["frame"] + ln["durationInFrames"]) / FPS)
            for ln in data["lines"]]


def write_duck(path: Path, intervals: list, duck: float) -> np.ndarray:
    """Envelope de duck: `duck` sob a fala, TAIL_GAIN fora, rampa de ~10 frames."""
    n = int(round(DUR_S * SR))
    env = np.full(n, TAIL_GAIN)
    for a, b in intervals:
        env[int(a * SR):int(b * SR)] = duck
    k = max(1, int(round(RAMP_FRAMES / FPS * SR)))
    env = np.convolve(env, np.ones(k) / k, mode="same")
    pcm = (np.stack([env, env], axis=1) * 32767.0).astype("<i2")
    with wave.open(str(path), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    return env


def build_voice(path: Path, intervals: list) -> None:
    """As 13 falas posicionadas no frame absoluto de cada uma."""
    files = sorted(VO_DIR.glob("*.wav"))
    assert len(files) == len(intervals), f"{len(files)} wavs para {len(intervals)} falas"
    parts, labels = [], []
    for i, (a, _) in enumerate(intervals):
        parts.append(f"[{i}]adelay={int(round(a * 1000))}:all=1[v{i}]")
        labels.append(f"[v{i}]")
    parts.append(
        f"{''.join(labels)}amix=inputs={len(labels)}:normalize=0:duration=longest,"
        f"apad,atrim=0:{DUR_S},aformat=sample_rates={SR}:channel_layouts=stereo"
    )
    cmd = ["ffmpeg", "-v", "error", "-nostdin", "-threads", "1", "-y"]
    for f in files:
        cmd += ["-i", str(f)]
    cmd += ["-filter_complex", ";".join(parts), "-c:a", "pcm_s16le", str(path)]
    run(cmd)


def multiply(a: Path, b: Path, out: Path) -> None:
    run(["ffmpeg", "-v", "error", "-nostdin", "-threads", "1", "-y", "-i", str(a), "-i", str(b),
         "-filter_complex", "[0][1]amultiply", "-c:a", "pcm_s16le", str(out)])


def mix(a: Path, b: Path, out: Path) -> None:
    run(["ffmpeg", "-v", "error", "-nostdin", "-threads", "1", "-y", "-i", str(a), "-i", str(b),
         "-filter_complex", "[0][1]amix=inputs=2:normalize=0:duration=longest",
         "-c:a", "pcm_s16le", str(out)])


def short_term(path: Path) -> tuple:
    """Curva de loudness de curto prazo (ebur128, janela de 3 s, passo de 0,1 s)."""
    run(["ffmpeg", "-v", "error", "-nostdin", "-threads", "1", "-i", str(path), "-filter_complex",
         f"ebur128=metadata=1,ametadata=mode=print:file={S_TXT}", "-f", "null", "-"])
    times, vals, t = [], [], 0.0
    for line in S_TXT.read_text().splitlines():
        if "pts_time:" in line:
            t = float(line.split("pts_time:")[1].split()[0])
        elif line.startswith("lavfi.r128.S="):
            try:
                v = float(line.split("=", 1)[1])
            except ValueError:
                v = SILENCE
            times.append(t)
            vals.append(max(v, SILENCE))
    return np.array(times), np.array(vals)


def speech_mask(times: np.ndarray, intervals: list, voice_s: np.ndarray) -> np.ndarray:
    """Instantes cuja janela de 3 s esta majoritariamente coberta por fala.

    Dois descartes: antes de 3 s o ebur128 ainda nao tem janela cheia (S invalido),
    e instante sem voz medida nao e fala — sem isso o silencio entre falas entra
    na conta e o ganho sai absurdamente baixo.
    """
    mask = np.zeros(len(times), dtype=bool)
    for i, t in enumerate(times):
        if t < 3.0 or voice_s[i] <= SILENCE + 1.0:
            continue
        if not any(a <= t <= b for a, b in intervals):
            continue  # fala ja acabou: o duck soltou, nao vale como "sob a fala"
        lo, hi = t - 3.0, t
        cover = 0.0
        for a, b in intervals:
            cover += max(0.0, min(hi, b) - max(lo, a))
        mask[i] = cover >= 2.0
    return mask


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    SCRATCH.mkdir(parents=True, exist_ok=True)

    narr = json.loads(NARR.read_text())
    duck = float(narr["duckMusicTo"])
    intervals = speech_intervals()
    print(f"falas: {len(intervals)}  de {intervals[0][0]:.2f} s a {intervals[-1][1]:.2f} s"
          f"  (cauda sem voz ate {DUR_S:.1f} s)   duck do JSON: {duck}")

    build_voice(SCRATCH / "voz.wav", intervals)
    write_duck(SCRATCH / "duck.wav", intervals, duck)

    raw_bed = SCRATCH / "cama-sem-ganho.wav"
    build_bed(0.0, raw_bed)
    multiply(raw_bed, SCRATCH / "duck.wav", SCRATCH / "cama-duck.wav")

    vt, vs = short_term(SCRATCH / "voz.wav")
    bt, bs = short_term(SCRATCH / "cama-duck.wav")
    mask = speech_mask(vt, intervals, vs)
    # "no claro" = instante em que o duck esta solto. Aqui tambem nao ha cauda
    # depois da ultima fala (a voz acaba onde o fade comeca), entao o que
    # interessa e todo instante sem voz, onde a cama toca em volume de cauda.
    clear = np.array([
        t > 3.0 and t < DUR_S - FADE_OUT_S / 2 and not any(a <= t <= b for a, b in intervals)
        for t in bt
    ])

    margin0 = vs[mask] - bs[mask]
    gain_db = -(TARGET_MARGIN_DB - float(margin0.min()))
    print(f"\nmargem sem reducao: min {margin0.min():.1f} dB  media {margin0.mean():.1f} dB"
          f"  -> ganho resolvido {gain_db:+.1f} dB")
    idxs0 = np.flatnonzero(mask)
    print("piores instantes com a faixa em volume natural (voz - cama):")
    for i in idxs0[np.argsort(margin0)[:5]]:
        print(f"  {vt[i]:6.1f} s  voz {vs[i]:6.1f}  cama {bs[i]:6.1f}"
              f"  -> {vs[i] - bs[i]:+5.1f} dB")

    build_bed(gain_db, BED_WAV)
    multiply(BED_WAV, SCRATCH / "duck.wav", SCRATCH / "cama-duck.wav")
    bt, bs = short_term(SCRATCH / "cama-duck.wav")
    mix(SCRATCH / "voz.wav", SCRATCH / "cama-duck.wav", MIX_WAV)

    margin = vs[mask] - bs[mask]
    idxs = np.flatnonzero(mask)
    print(f"\ncurva S: {len(vt)} pontos de {vt[0]:.2f} s a {vt[-1]:.2f} s"
          f"  (passo {np.median(np.diff(vt)):.3f} s)  mascara de fala: {mask.sum()}")
    print("piores instantes (voz - cama):")
    for i in idxs[np.argsort(margin)[:5]]:
        print(f"  {vt[i]:6.1f} s  voz {vs[i]:6.1f}  cama {bs[i]:6.1f}  -> {vs[i] - bs[i]:+5.1f} dB")
    print("instantes de mascara com voz mais baixa:")
    for i in idxs[np.argsort(vs[idxs])[:5]]:
        print(f"  {vt[i]:6.1f} s  voz {vs[i]:6.1f}  cama {bs[i]:6.1f}")

    print(f"\nvoz   sob a fala: S media {vs[mask].mean():.1f}  min {vs[mask].min():.1f} LUFS")
    print(f"cama  sob a fala: S media {bs[mask].mean():.1f}  max {bs[mask].max():.1f} LUFS")
    print(f"margem voz-cama : min {margin.min():.1f} dB  media {margin.mean():.1f} dB"
          f"   (regra: >= ~15)")
    print(f"cama no claro   : S media {bs[clear].mean():.1f}  max {bs[clear].max():.1f} LUFS"
          f"   ({clear.sum()} instantes)")
    print(f"faixa de ganho da cama sob fala: {bs[mask].max() - bs[mask].min():.1f} dB")

    print("\nARCO da cama (WAV sem duck) ao longo do filme, a cada 5 s:")
    rt, rs = short_term(BED_WAV)
    floor = float(np.percentile(rs, 2))
    for f in range(0, FRAMES, 150):
        i = int(np.argmin(np.abs(rt - f / FPS)))
        bar = "#" * int(max(0.0, rs[i] - floor))
        print(f"  frame {f:5d}  {f / FPS:5.1f} s  {rs[i]:6.1f} LUFS S  {bar}")

    # Frames medidos: degraus de subida e pico, do envelope de 2 s da faixa.
    db = np.array(json.loads(ENERGY.read_text())["db"])
    env = np.convolve(db, np.ones(4) / 4, mode="same")
    n = int(round(DUR_S / 0.5))
    i0 = int(OFFSET_S / 0.5)
    seg = env[i0:i0 + n]
    trend = np.convolve(seg, np.ones(12) / 12, mode="same")
    K = 12  # comparacao: 6 s adiante contra 6 s atras
    pos = np.arange(K, n - 2 * K, 2)  # um ponto por segundo
    diff = np.array([trend[j + K:j + 2 * K].mean() - trend[j - K:j].mean() for j in pos])
    chosen = []
    for idx in np.argsort(diff)[::-1]:
        if diff[idx] < 2.0:
            break
        if all(abs(pos[idx] - pos[c]) >= 4 * K for c in chosen):
            chosen.append(int(idx))
    lifts = [(round(float(pos[c] * 0.5 * FPS)), round(float(diff[c]), 1))
             for c in sorted(chosen, key=lambda c: pos[c])]
    peak_frame = round(int(np.argmax(seg)) * 0.5 * FPS)
    print(f"\nsubidas medidas (frame, degrau): {lifts}")
    print(f"pico da cama: frame {peak_frame} ({peak_frame / FPS:.1f} s)")

    JSON_OUT.write_text(json.dumps({
        "arquivo": BED_WAV.name,
        "faixa": "Tranquility — Kevin MacLeod (incompetech.com), CC BY 4.0",
        "trechoS": OFFSET_S,
        "duracaoFrames": FRAMES,
        "ganhoBase": 1.0,
        "duckSobVoz": duck,
        "volumeCauda": TAIL_GAIN,
        "rampaDuckFrames": RAMP_FRAMES,
        "fadeInFrames": round(FADE_IN_S * FPS),
        "fadeOutFrames": round(FADE_OUT_S * FPS),
        "frames": {
            "subidas": [f for f, _ in lifts],
            "inicioDaSubida": lifts[-1][0] if lifts else 0,
            "pico": peak_frame,
        },
        "medido": {
            "ganhoDb": round(gain_db, 1),
            "vozSobFalaLufsS": round(float(vs[mask].mean()), 1),
            "camaSobFalaLufsS": round(float(bs[mask].mean()), 1),
            "margemMinDb": round(float(margin.min()), 1),
            "camaCaudaLufsS": round(float(bs[clear].mean()), 1),
        },
    }, indent=1, ensure_ascii=False) + "\n")

    for tmp in (raw_bed, SCRATCH / "duck.wav", SCRATCH / "cama-duck.wav",
                SCRATCH / "voz.wav", S_TXT):
        tmp.unlink(missing_ok=True)

    print(f"\ncama: {BED_WAV}")
    print(f"teste de mistura: {MIX_WAV}")
    print(f"parametros: {JSON_OUT}")


if __name__ == "__main__":
    main()
