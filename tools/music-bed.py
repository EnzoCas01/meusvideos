#!/usr/bin/env python3
"""Cama musical de Disney v2 — gera o WAV final e mede a mistura.

Trecho escolhido por medicao em tools/music-energy.py: Odyssey 184,0 s -> 243,1 s.
E o unico crescendo real da faixa (passagem esparsa em 184-202 s que vai
adensando ate o clímax em 226-243 s), com ~13 dB entre a abertura contida e o
pico — o arco que o filme pede.

O ganho nao e chutado: a cama e gerada primeiro sem reducao, a loudness de
curto prazo (ebur128 short-term) da voz e da cama e comparada sob a fala, e o
ganho sai dessa diferenca. Como o volume e linear e vem depois do compressor,
uma iteracao basta — mas a cama e regerada e MEDIDA de novo para confirmar.
"""
import json
import subprocess
import wave
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
TRACK = ROOT / "out/musica-candidatas/Odyssey.mp3"
ENERGY = ROOT / "out/musica-candidatas/odyssey-energia.json"
NARR = ROOT / "src/narration-disney.json"
VO_DIR = ROOT / "public/audio/vo-disney"
OUT_DIR = ROOT / "public/audio/disney2"
SCRATCH = ROOT / "out/musica-candidatas"

BED_WAV = OUT_DIR / "musica-cama.wav"
JSON_OUT = OUT_DIR / "musica-cama.json"
MIX_WAV = SCRATCH / "mix-teste-disney.wav"
S_TXT = SCRATCH / "_short-term.txt"

FPS = 30
FRAMES = 1773
DUR_S = FRAMES / FPS               # 59,1 s
SR = 48000
OFFSET_S = 184.0                   # escolhido por medicao
FADE_IN_S = 1.5
FADE_OUT_S = 2.5
COMP = "threshold=0.063:ratio=1.4:attack=50:release=600:makeup=1"
DUCK = 0.35                        # sob a fala
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
    run(["ffmpeg", "-v", "error", "-nostdin", "-y", "-i", str(TRACK),
         "-af", chain, "-c:a", "pcm_s16le", str(out_path)])


def speech_intervals() -> list:
    """(inicio_s, fim_s) de cada fala, dos frames absolutos do JSON."""
    data = json.loads(NARR.read_text())
    return [(ln["frame"] / FPS, (ln["frame"] + ln["durationInFrames"]) / FPS)
            for ln in data["lines"]]


def write_duck(path: Path, intervals: list) -> np.ndarray:
    """Envelope de duck: 0,35 sob a fala, 0,9 fora, rampa de ~10 frames."""
    n = int(round(DUR_S * SR))
    env = np.full(n, TAIL_GAIN)
    for a, b in intervals:
        env[int(a * SR):int(b * SR)] = DUCK
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
    """As 12 falas posicionadas no frame absoluto de cada uma."""
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
    cmd = ["ffmpeg", "-v", "error", "-nostdin", "-y"]
    for f in files:
        cmd += ["-i", str(f)]
    cmd += ["-filter_complex", ";".join(parts), "-c:a", "pcm_s16le", str(path)]
    run(cmd)


def multiply(a: Path, b: Path, out: Path) -> None:
    run(["ffmpeg", "-v", "error", "-nostdin", "-y", "-i", str(a), "-i", str(b),
         "-filter_complex", "[0][1]amultiply", "-c:a", "pcm_s16le", str(out)])


def mix(a: Path, b: Path, out: Path) -> None:
    run(["ffmpeg", "-v", "error", "-nostdin", "-y", "-i", str(a), "-i", str(b),
         "-filter_complex", "[0][1]amix=inputs=2:normalize=0:duration=longest",
         "-c:a", "pcm_s16le", str(out)])


def short_term(path: Path) -> tuple:
    """Curva de loudness de curto prazo (ebur128, janela de 3 s, passo 0,1 s)."""
    run(["ffmpeg", "-v", "error", "-nostdin", "-i", str(path), "-filter_complex",
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

    intervals = speech_intervals()
    print(f"falas: {len(intervals)}  de {intervals[0][0]:.2f} s a {intervals[-1][1]:.2f} s"
          f"  (cauda sem voz ate {DUR_S:.1f} s)")

    build_voice(SCRATCH / "voz.wav", intervals)
    duck_env = write_duck(SCRATCH / "duck.wav", intervals)

    raw_bed = SCRATCH / "cama-sem-ganho.wav"
    build_bed(0.0, raw_bed)
    multiply(raw_bed, SCRATCH / "duck.wav", SCRATCH / "cama-duck.wav")

    vt, vs = short_term(SCRATCH / "voz.wav")
    bt, bs = short_term(SCRATCH / "cama-duck.wav")
    mask = speech_mask(vt, intervals, vs)
    tail = (bt > intervals[-1][1] + 1.0) & (bt < DUR_S - FADE_OUT_S)

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
    print(f"cama na cauda   : S media {bs[tail].mean():.1f}  max {bs[tail].max():.1f} LUFS")
    print(f"faixa de ganho da cama sob fala: {bs[mask].max() - bs[mask].min():.1f} dB")

    print("\ncama (com duck) ao longo do filme, a cada 5 s:")
    for f in range(0, FRAMES, 150):
        i = int(np.argmin(np.abs(bt - f / FPS)))
        where = "voz " if mask[i] else "    "
        print(f"  frame {f:5d}  {f / FPS:5.1f} s  {where}  {bs[i]:6.1f} LUFS S")

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
        "faixa": "Odyssey — Kevin MacLeod (incompetech.com), CC BY 4.0",
        "trechoS": OFFSET_S,
        "duracaoFrames": FRAMES,
        "ganhoBase": 1.0,
        "duckSobVoz": DUCK,
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
            "camaCaudaLufsS": round(float(bs[tail].mean()), 1),
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
