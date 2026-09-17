"""Generates the spoken narration for the LifePhases film.

    tools/vs/.venv/Scripts/python.exe tools/generate-narration.py

ONE VOICE FOR THE WHOLE FILM
----------------------------
Asking the model for a designed voice (`instruct` with no reference audio)
invents a *new* speaker on every call, so the narration drifted from line to
line. Instead this script renders a single reference clip once, then clones
every line from it — same speaker, start to finish.

The reference is itself synthesised from an attribute description, so no real
person's voice is involved at any point.

Resumable: a clip already on disk is measured, not re-rendered, and
narration.json is saved after every line. Set FORCE=1 to redo everything, or
delete a single WAV to redo just that line. Deleting the reference re-rolls the
voice for the whole film.

The model weights are several GB and download on first run. CPU inference takes
roughly two to three minutes per line on a small machine; that is expected.

GROUPED LINES (batching short lines into one model call)
----------------------------------------------------------
Each call to the model costs roughly the same wall-clock time (~9-10 min on
this machine) almost regardless of how much text is in it — a script with many
one- or two-word lines (as "Comece Pequeno" has) pays that fixed overhead once
per line for no reason. To cut that cost, consecutive lines in narration.json
may share a `"grupo"` field (any string, same value = same group). When they
do, this script:

  1. Generates ONE clip for the whole group's text (each member's `text`
     joined with a single space, in order).
  2. Slices that one clip back into one WAV per line, at the midpoint of an
     internal silence, so the files on disk are named and shaped exactly as if
     each line had been generated on its own.
  3. Repositions every line after the first in the group so its `frame` keeps
     the *actual* spacing the model produced between sub-lines, offset from
     the group's first line (whose `frame` is never touched).

A group is only batched when every one of its members is still pending (see
`build_work_items`); a partially-rendered group falls back to one-by-one
generation for its missing members, because the slicer has no way to isolate
"the third sub-line" out of an audio clip covering only some of the group.

The slice count must match the group size EXACTLY. If a search over slackened
silence thresholds still can't find that many gaps, the group is abandoned and
its lines are generated individually instead — a wrong cut desyncs the film,
which is worse than falling back to the slow path for one group.

Lines with no `grupo` field behave exactly as before: one model call, one
file. This is what keeps LifePhases (whose narration.json has no such field)
unaffected.

SELF-TEST (no model, no torch)
-------------------------------
    tools/vs/.venv/Scripts/python.exe tools/generate-narration.py --self-test [dir]

Exercises the silence-based slicer against real WAVs already on disk (default:
public/audio/vo-comece-pequeno), without loading the model. See run_self_test.
"""

from __future__ import annotations

import json
import os
import struct
import sys
import wave
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# Which film to narrate. Defaults to LifePhases; another piece points these at
# its own script and its own clip folder while still cloning from the SAME
# reference voice, which is what keeps one speaker across the whole project.
#   NARRATION_JSON=src/narration-comece-pequeno.json
#   VO_DIR=public/audio/vo-comece-pequeno
NARRATION_JSON = Path(os.environ.get("NARRATION_JSON") or ROOT / "src" / "narration.json")
if not NARRATION_JSON.is_absolute():
    NARRATION_JSON = ROOT / NARRATION_JSON
OUT_DIR = Path(os.environ.get("VO_DIR") or ROOT / "public" / "audio" / "vo")
if not OUT_DIR.is_absolute():
    OUT_DIR = ROOT / OUT_DIR
# Shared on purpose: deleting this file re-rolls the voice of every film.
REF_FILE = Path(
    os.environ.get("VOICE_REF") or ROOT / "public" / "audio" / "vo" / "_voice-ref.wav"
)
CHECKPOINT = os.environ.get("OMNIVOICE_CHECKPOINT", "k2-fsa/OmniVoice")
FPS = 30

# A couple of frames of tail so the music duck never clips the last syllable.
TAIL_FRAMES = 4

# Fixed seed per line: the same script always produces the same narration.
SEED = 7

# ── silence handling (shared by trimming and group-slicing) ────────────────
LOUD_THRESHOLD = 0.004
PAD_SECONDS = 0.04

# Grid searched, in order, when slicing a group's audio into its sub-lines.
# Outer loop varies how long a gap must be to count as a cut point; inner loop
# varies how loud a sample must be to count as speech. Ordered from the
# defaults outward, so the first match is the least surprising one.
SPLIT_MIN_SILENCE_MS = [150, 200, 100, 250, 80, 300, 60, 350, 50]
SPLIT_SILENCE_THRESHOLDS = [0.004, 0.003, 0.005, 0.002, 0.006, 0.0015, 0.008, 0.001, 0.01, 0.012]


def trim_bounds(arr, threshold: float = LOUD_THRESHOLD, pad_seconds: float = PAD_SECONDS, sample_rate: int = 24000):
    """Returns (start, end) sample indices of the loud region of `arr`, padded
    by `pad_seconds` on each side and clamped to the array. None if silent."""
    import numpy as np

    loud = np.nonzero(np.abs(arr) > threshold)[0]
    if not loud.size:
        return None
    pad = int(sample_rate * pad_seconds)
    return max(0, loud[0] - pad), min(arr.size, loud[-1] + pad)


def write_wav(path: Path, samples, sample_rate: int) -> int:
    """Writes a mono 16-bit WAV and returns the number of sample frames."""
    import numpy as np

    arr = np.asarray(samples, dtype=np.float32).squeeze()
    while arr.ndim > 1:
        arr = arr.mean(axis=int(np.argmin(arr.shape)))
    arr = np.clip(arr, -1.0, 1.0)

    # Trim digital silence at both ends, so the timing in narration.json is the
    # timing of the speech rather than of the model's lead-in.
    bounds = trim_bounds(arr, sample_rate=sample_rate)
    if bounds:
        arr = arr[bounds[0] : bounds[1]]

    pcm = (arr * 32767.0).astype("<i2").tobytes()
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "wb") as f:
        f.write(b"RIFF")
        f.write(struct.pack("<I", 36 + len(pcm)))
        f.write(b"WAVEfmt ")
        f.write(struct.pack("<IHHIIHH", 16, 1, 1, sample_rate, sample_rate * 2, 2, 16))
        f.write(b"data")
        f.write(struct.pack("<I", len(pcm)))
        f.write(pcm)
    return arr.size


def wav_frames(path: Path) -> int:
    """Number of sample frames in a mono 16-bit WAV already on disk."""
    with open(path, "rb") as f:
        head = f.read(44)
    return struct.unpack("<I", head[40:44])[0] // 2


def read_wav(path: Path):
    """Reads a mono 16-bit WAV back into a float32 array in [-1, 1] plus its
    sample rate. Used only by the self-test and by group slicing of clips
    that came straight out of the model (which hand us arrays, not files) —
    kept here mainly so the self-test can build fixtures from real clips
    without needing numpy/scipy WAV I/O elsewhere in the script."""
    import numpy as np

    with wave.open(str(path), "rb") as f:
        assert f.getsampwidth() == 2 and f.getnchannels() == 1, "expected mono 16-bit WAV"
        sr = f.getframerate()
        raw = f.readframes(f.getnframes())
    arr = np.frombuffer(raw, dtype="<i2").astype(np.float32) / 32767.0
    return arr, sr


def find_speech_segments(arr, sample_rate: int, threshold: float, min_silence_ms: float):
    """Returns a list of (start, end) sample-index ranges, one per run of
    "loud" samples separated from its neighbours by a silent gap of at least
    `min_silence_ms`. This is the primitive both group-counting and
    group-slicing are built on: the number of segments IS the number of
    sub-lines the model appears to have spoken."""
    import numpy as np

    loud_idx = np.nonzero(np.abs(arr) > threshold)[0]
    if loud_idx.size == 0:
        return []
    min_gap = int(sample_rate * min_silence_ms / 1000)

    segments = []
    seg_start = loud_idx[0]
    prev = loud_idx[0]
    for i in loud_idx[1:]:
        if i - prev > min_gap:
            segments.append((int(seg_start), int(prev)))
            seg_start = i
        prev = i
    segments.append((int(seg_start), int(prev)))
    return segments


def _stable_match(arr, sample_rate: int, threshold: float, min_silence_ms: float, n_parts: int) -> bool:
    """A count match at one exact (threshold, min_silence_ms) can be a fluke —
    e.g. a sentence-internal comma pause happening to push the total segment
    count to exactly n_parts for the wrong reason. Before trusting a match,
    check that nudging min_silence_ms by a bit in either direction still
    yields the same count; a real group boundary is not that fragile, but a
    coincidental match usually is."""
    for offset in (-30, 30):
        ms = max(20, min_silence_ms + offset)
        if len(find_speech_segments(arr, sample_rate, threshold, ms)) != n_parts:
            return False
    return True


def split_group_audio(arr, sample_rate: int, n_parts: int):
    """Tries to cut `arr` into exactly `n_parts` pieces, one per sub-line.

    Searches SPLIT_MIN_SILENCE_MS x SPLIT_SILENCE_THRESHOLDS for the first
    combination whose silence gaps produce exactly `n_parts` speech segments
    AND whose count is stable under a small nudge of min_silence_ms (see
    `_stable_match`) — a guard against accepting a split that only matches by
    coincidence, such as a comma-induced pause inside one sub-line lining up
    with the expected count. Each cut lands at the midpoint of the winning
    silence gap, not at the edge of either sub-line's speech, so both
    neighbours keep natural lead-in/lead-out silence once `write_wav` trims
    them.

    Returns (slices, threshold, min_silence_ms, segments) on success, where
    `slices` is a list of n_parts (start, end) sample-index tuples ready to be
    passed to `write_wav` as `arr[start:end]`. Returns None if no combination
    in the grid produces a stable match on exactly n_parts segments.
    """
    for min_silence_ms in SPLIT_MIN_SILENCE_MS:
        for threshold in SPLIT_SILENCE_THRESHOLDS:
            segments = find_speech_segments(arr, sample_rate, threshold, min_silence_ms)
            if len(segments) == n_parts and _stable_match(arr, sample_rate, threshold, min_silence_ms, n_parts):
                cuts = [0]
                for (_, end_i), (start_next, _) in zip(segments, segments[1:]):
                    cuts.append((end_i + start_next) // 2)
                cuts.append(arr.size)
                slices = [(cuts[i], cuts[i + 1]) for i in range(n_parts)]
                return slices, threshold, min_silence_ms, segments
    return None


def save(config: dict) -> None:
    """Writes narration.json after every line, so a kill never loses work."""
    NARRATION_JSON.write_text(
        json.dumps(config, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )


def build_work_items(lines: list[dict], out_dir: Path, force: bool) -> list[dict]:
    """Groups consecutive lines that share a `grupo` field into one work item,
    so the caller can render each group with a single model call.

    A run of same-`grupo` lines becomes a `{"type": "group", "lines": [...]}`
    item ONLY when every member is still pending (or `force` is set) — i.e.
    none of its WAVs exist yet. That is what the slicer needs: it can only
    carve "sub-line 3 of 4" out of a clip that actually contains all 4. If the
    group is partially rendered already (e.g. a previous run died mid-group),
    every one of its lines falls back to `{"type": "single", ...}`, which
    measures the ones already on disk and generates the rest one at a time —
    slower, but never guesses at a cut.

    Lines with no `grupo` (or a singleton group) always come back as `single`
    items, so a narration.json with no `grupo` field anywhere — LifePhases —
    produces exactly the same work items it always did.
    """
    items: list[dict] = []
    i = 0
    while i < len(lines):
        line = lines[i]
        grupo = line.get("grupo")
        if not grupo:
            items.append({"type": "single", "lines": [line]})
            i += 1
            continue

        j = i
        group_lines = []
        while j < len(lines) and lines[j].get("grupo") == grupo:
            group_lines.append(lines[j])
            j += 1

        pending = [l for l in group_lines if force or not (out_dir / f"{l['id']}.wav").exists()]
        if len(group_lines) > 1 and (force or len(pending) == len(group_lines)):
            items.append({"type": "group", "grupo": grupo, "lines": group_lines})
        else:
            for l in group_lines:
                items.append({"type": "single", "lines": [l]})
        i = j
    return items


def generate_single(model, sample_rate, line, ref_text, instruct, language, speed, label, force):
    """Renders (or, if already on disk, just measures) one line. Same
    behaviour as the pre-grouping script, extracted so groups can fall back
    to it line by line."""
    dest = OUT_DIR / f"{line['id']}.wav"

    if dest.exists() and not force:
        seconds = wav_frames(dest) / sample_rate
        line["durationInFrames"] = int(seconds * FPS) + TAIL_FRAMES
        print(f"{label}: mantida ({seconds:.2f}s)", flush=True)
        return

    print(f"{label}: {line['text']}", flush=True)

    import gc

    import torch

    # Same seed and same reference on every line: one speaker, one delivery.
    torch.manual_seed(SEED)
    with torch.inference_mode():
        audios = model.generate(
            text=line["text"],
            language=language,
            ref_audio=str(REF_FILE),
            ref_text=ref_text,
            instruct=instruct,
            speed=speed,
        )
    audio = audios[0] if isinstance(audios, (list, tuple)) else audios

    seconds = write_wav(dest, audio, sample_rate) / sample_rate
    line["durationInFrames"] = int(seconds * FPS) + TAIL_FRAMES
    print(f"    {seconds:.2f}s -> {line['durationInFrames']} frames", flush=True)

    del audios, audio
    gc.collect()


def generate_group(model, sample_rate, group_lines, ref_text, instruct, language, speed, label):
    """Renders a whole group in ONE model call, then slices the result back
    into one WAV per line (same file names as always). Returns a short report
    dict for the final summary; raises nothing — on a slicing failure it logs
    the fallback and generates each line individually via `generate_single`.
    """
    import gc

    import numpy as np
    import torch

    combined_text = " ".join(l["text"] for l in group_lines)
    ids = ", ".join(l["id"] for l in group_lines)
    print(f"{label}: [grupo {group_lines[0].get('grupo')}] {ids}", flush=True)
    print(f"    texto combinado: {combined_text}", flush=True)

    torch.manual_seed(SEED)
    with torch.inference_mode():
        audios = model.generate(
            text=combined_text,
            language=language,
            ref_audio=str(REF_FILE),
            ref_text=ref_text,
            instruct=instruct,
            speed=speed,
        )
    audio = audios[0] if isinstance(audios, (list, tuple)) else audios
    arr = np.asarray(audio, dtype=np.float32).squeeze()
    while arr.ndim > 1:
        arr = arr.mean(axis=int(np.argmin(arr.shape)))
    arr = np.clip(arr, -1.0, 1.0)

    del audios, audio
    gc.collect()

    n = len(group_lines)
    result = split_group_audio(arr, sample_rate, n)
    if result is None:
        print(
            f"    NÃO deu para fatiar em {n} pedaços exatos (grade de limiares esgotada); "
            f"caindo para geração individual deste grupo.",
            flush=True,
        )
        for l in group_lines:
            single_label = f"    (individual, fallback) {l['id']}"
            generate_single(model, sample_rate, l, ref_text, instruct, language, speed, single_label, force=True)
        return {"grupo": group_lines[0].get("grupo"), "fallback": True, "ids": [l["id"] for l in group_lines]}

    slices, threshold, min_silence_ms, segments = result
    print(
        f"    fatiado em {n} pedaços (threshold={threshold}, min_silence_ms={min_silence_ms})",
        flush=True,
    )

    base_frame = group_lines[0]["frame"]
    first_onset = segments[0][0]

    for idx, (line, (start, end), seg) in enumerate(zip(group_lines, slices, segments)):
        dest = OUT_DIR / f"{line['id']}.wav"
        seconds = write_wav(dest, arr[start:end], sample_rate) / sample_rate
        line["durationInFrames"] = int(seconds * FPS) + TAIL_FRAMES
        if idx == 0:
            line["frame"] = base_frame
        else:
            offset_frames = round((seg[0] - first_onset) / sample_rate * FPS)
            line["frame"] = base_frame + offset_frames
        print(
            f"    {line['id']}: {seconds:.2f}s -> {line['durationInFrames']} frames, frame={line['frame']}",
            flush=True,
        )

    return {
        "grupo": group_lines[0].get("grupo"),
        "fallback": False,
        "threshold": threshold,
        "min_silence_ms": min_silence_ms,
        "ids": [l["id"] for l in group_lines],
    }


def run_self_test(vo_dir: Path | None = None) -> int:
    """Validates the silence-based slicer WITHOUT the model or torch, using
    real clips already on disk. Two checks:

      1. Concatenate two real clips with a synthetic silence gap in between
         and confirm split_group_audio recovers exactly 2 segments whose
         trimmed durations are close to the originals.
      2. Do the same with three clips (two gaps), including a short single
         word, since the critical group in "Comece Pequeno" (G3) is exactly
         this shape — several short lines, one of them a single word.

    This is the same code path `generate_group` uses, so a pass here is real
    evidence the grid finds the right cuts before ever calling the model.
    """
    import numpy as np

    vo_dir = vo_dir or (ROOT / "public" / "audio" / "vo-comece-pequeno")
    candidates = sorted(vo_dir.glob("*.wav"))
    candidates = [p for p in candidates if not p.name.startswith("_")]
    if len(candidates) < 3:
        print(f"self-test: preciso de pelo menos 3 WAVs em {vo_dir}, achei {len(candidates)}")
        return 1

    print(f"self-test: usando clipes de {vo_dir}")
    clips = {}
    for p in candidates:
        arr, sr = read_wav(p)
        clips[p.stem] = (arr, sr)
        print(f"  {p.stem}: {arr.size / sr:.2f}s @ {sr} Hz")

    sample_rate = next(iter(clips.values()))[1]
    assert all(sr == sample_rate for _, sr in clips.values()), "clipes com sample rates diferentes"

    def make_group(names, gap_seconds):
        gap = np.zeros(int(sample_rate * gap_seconds), dtype=np.float32)
        pieces = []
        for i, name in enumerate(names):
            if i:
                pieces.append(gap)
            pieces.append(clips[name][0])
        return np.concatenate(pieces)

    ok = True

    # Check 1: two clips, a comfortable gap.
    names_2 = [candidates[0].stem, candidates[1].stem]
    combined = make_group(names_2, gap_seconds=0.5)
    result = split_group_audio(combined, sample_rate, 2)
    if result is None:
        print("FALHOU: grupo de 2 não fatiou em 2 pedaços")
        ok = False
    else:
        slices, threshold, min_ms, _ = result
        print(f"OK: grupo de 2 fatiado (threshold={threshold}, min_silence_ms={min_ms})")
        for name, (start, end) in zip(names_2, slices):
            piece = combined[start:end]
            bounds = trim_bounds(piece, sample_rate=sample_rate)
            got = (bounds[1] - bounds[0]) / sample_rate if bounds else 0.0
            want = clips[name][0].size / sample_rate
            # Original clips were themselves already trimmed by write_wav, so
            # the recovered duration should be close, not bit-identical (the
            # synthetic gap's own silence floor can shift the trim by a few ms).
            close = abs(got - want) < 0.08
            print(f"    {name}: original {want:.2f}s, recuperado {got:.2f}s {'OK' if close else 'DIVERGENTE'}")
            ok = ok and close

    # Check 2: three clips with a tighter gap, mimicking G3's short lines.
    names_3 = [candidates[0].stem, candidates[1].stem, candidates[2].stem]
    combined3 = make_group(names_3, gap_seconds=0.22)
    result3 = split_group_audio(combined3, sample_rate, 3)
    if result3 is None:
        print("FALHOU: grupo de 3 não fatiou em 3 pedaços")
        ok = False
    else:
        slices, threshold, min_ms, _ = result3
        print(f"OK: grupo de 3 fatiado (threshold={threshold}, min_silence_ms={min_ms})")
        for name, (start, end) in zip(names_3, slices):
            piece = combined3[start:end]
            bounds = trim_bounds(piece, sample_rate=sample_rate)
            got = (bounds[1] - bounds[0]) / sample_rate if bounds else 0.0
            want = clips[name][0].size / sample_rate
            close = abs(got - want) < 0.08
            print(f"    {name}: original {want:.2f}s, recuperado {got:.2f}s {'OK' if close else 'DIVERGENTE'}")
            ok = ok and close

    # Check 3: a group count that should NOT match (2 clips, asked for 3
    # parts) must come back None instead of guessing a wrong cut.
    result_wrong = split_group_audio(combined, sample_rate, 3)
    if result_wrong is not None:
        print("FALHOU: pediu 3 pedaços de um áudio com 2 falas e o slicer inventou um corte")
        ok = False
    else:
        print("OK: pedido de contagem errada (3 de um áudio de 2) volta None, como deveria")

    print("\nself-test: " + ("PASSOU" if ok else "FALHOU"))
    return 0 if ok else 1


def main() -> int:
    if "--self-test" in sys.argv:
        idx = sys.argv.index("--self-test")
        dir_arg = sys.argv[idx + 1] if idx + 1 < len(sys.argv) else None
        return run_self_test(Path(dir_arg) if dir_arg else None)

    import gc

    import torch

    # Esta máquina tem 7,9 GB e o caminho de clonagem processa a referência
    # junto com o texto alvo, então as frases longas estouravam a memória e o
    # sistema matava o processo. Três medidas contra isso:
    #   - inference_mode: não guarda grafo de autograd, que aqui não serve para nada
    #   - menos threads: cada uma reserva seus próprios buffers
    #   - gc entre falas: libera o pico da anterior antes de começar a próxima
    torch.set_num_threads(int(os.environ.get("TORCH_THREADS", "2")))

    config = json.loads(NARRATION_JSON.read_text(encoding="utf-8"))
    lines = config["lines"]
    instruct = config["voice"]
    language = config.get("language", "pt")
    speed = float(config.get("speed", 1.0))
    ref_text = config["referenceText"]
    force = bool(os.environ.get("FORCE"))

    print(f"voz: {instruct}  |  idioma: {language}  |  speed: {speed}")
    print(f"{len(lines)} falas", flush=True)

    work_items = build_work_items(lines, OUT_DIR, force)
    n_groups = sum(1 for it in work_items if it["type"] == "group")
    if n_groups:
        grouped_lines = sum(len(it["lines"]) for it in work_items if it["type"] == "group")
        print(f"{n_groups} grupo(s) cobrindo {grouped_lines} fala(s) serão renderizados em lote", flush=True)

    need_ref = force or not REF_FILE.exists()
    pending_lines = [
        l
        for it in work_items
        for l in it["lines"]
        if force or not (OUT_DIR / f"{l['id']}.wav").exists()
    ]
    # Model calls actually needed: one per group item (regardless of its
    # size) plus one per pending single line — this is the number that
    # determines wall-clock time, not the line count.
    pending_calls = sum(
        1
        for it in work_items
        if (it["type"] == "group" and any(force or not (OUT_DIR / f"{l['id']}.wav").exists() for l in it["lines"]))
        or (it["type"] == "single" and (force or not (OUT_DIR / f"{it['lines'][0]['id']}.wav").exists()))
    )

    model = None
    sample_rate = 24000

    if pending_lines or need_ref:
        from omnivoice import OmniVoice

        # bfloat16 corta pela metade a memória dos pesos e é o que faz as frases
        # longas caberem em 7,9 GB. Trocar o dtype muda levemente a numérica, e
        # portanto o timbre: ao mudar, regere TODAS as falas, nunca só algumas.
        dtype_nome = os.environ.get("DTYPE", "float32")
        dtype = {"float32": torch.float32, "bfloat16": torch.bfloat16}[dtype_nome]

        print(
            f"carregando {CHECKPOINT} ({len(pending_lines)} falas em {pending_calls} chamada(s), {dtype_nome})...",
            flush=True,
        )
        # Sem ASR — a referência já traz o próprio texto.
        model = OmniVoice.from_pretrained(
            CHECKPOINT, device_map="cpu", dtype=dtype, load_asr=False
        )
        sample_rate = int(getattr(model, "sampling_rate", 24000))
        print(f"modelo pronto, {sample_rate} Hz", flush=True)
    else:
        print("tudo em disco; apenas medindo", flush=True)

    # ── the voice itself ─────────────────────────────────────────────────
    # Rendered once from the attribute description. Every line below is cloned
    # from this clip, which is what keeps the speaker identical throughout.
    if need_ref:
        print(f"gerando a voz de referência: {ref_text}", flush=True)
        torch.manual_seed(SEED)
        audios = model.generate(text=ref_text, instruct=instruct, language=language)
        audio = audios[0] if isinstance(audios, (list, tuple)) else audios
        seconds = write_wav(REF_FILE, audio, sample_rate) / sample_rate
        print(f"    referência: {seconds:.2f}s -> {REF_FILE.name}", flush=True)

    group_reports = []
    call_no = 0
    for item in work_items:
        if item["type"] == "single":
            line = item["lines"][0]
            call_no += 1
            label = f"[{call_no}] {line['id']}"
            generate_single(model, sample_rate, line, ref_text, instruct, language, speed, label, force)
            save(config)
        else:
            call_no += 1
            label = f"[{call_no}] grupo"
            report = generate_group(model, sample_rate, item["lines"], ref_text, instruct, language, speed, label)
            group_reports.append(report)
            save(config)

    config["enabled"] = True
    save(config)

    total = sum(line["durationInFrames"] for line in lines) / FPS
    print(f"\nnarração total: {total:.1f}s")

    if group_reports:
        print("\ngrupos:")
        for r in group_reports:
            if r["fallback"]:
                print(f"  {r['grupo']}: fallback individual ({', '.join(r['ids'])})")
            else:
                print(
                    f"  {r['grupo']}: fatiado limpo em {len(r['ids'])} "
                    f"(threshold={r['threshold']}, min_silence_ms={r['min_silence_ms']}) — {', '.join(r['ids'])}"
                )

    # Flag any line that now runs into the next one, so the timing can be fixed.
    print("sobreposição:")
    clashes = 0
    for a, b in zip(lines, lines[1:]):
        end = a["frame"] + a["durationInFrames"]
        if end > b["frame"]:
            clashes += 1
            print(f"  {a['id']} termina em {end}, {b['id']} começa em {b['frame']}")
    print("  nenhuma" if clashes == 0 else f"  {clashes} para corrigir")

    print(f"\npronto -> {OUT_DIR}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
