"""Sonda: o WAV existente de vo-agentes é ElevenLabs ou edge-tts?

Compara a duração exata de cada WAV de vo-agentes com a duração de um mp3
sintetizado pelo edge-tts com o MESMO texto/voz/rate/pitch do JSON. Se bater
(~1%), o pipeline usou edge; se divergir, o áudio é do ElevenLabs e as marcas
"edge" gravadas em narration-agentes.json são aproximação.
"""
import asyncio
import json
import subprocess
import sys
import tempfile
import wave


def wav_seconds(path):
    with wave.open(path, "rb") as w:
        return w.getnframes() / w.getframerate()


async def synth(text, voice, rate, pitch):
    import edge_tts

    communicate = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch)
    with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as f:
        path = f.name
    await communicate.save(path)
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=noprint_wrappers=1:nokey=1", path],
        capture_output=True, text=True, check=True,
    )
    return float(out.stdout.strip())


async def main():
    doc = json.load(open("src/narration-agentes.json", encoding="utf-8"))
    voice, rate, pitch = doc["voice"], doc["rate"], doc["pitch"]
    print(f"voz edge {voice} rate {rate} pitch {pitch}\n")
    print(f"{'id':<14} {'wav s':>7} {'edge s':>7} {'dif s':>7} {'dif %':>7}")
    for line in doc["lines"]:
        path = f"public/audio/vo-agentes/{line['id']}.wav"
        got = wav_seconds(path)
        want = await synth(line["text"], voice, rate, pitch)
        print(f"{line['id']:<14} {got:7.2f} {want:7.2f} {got - want:+7.2f} "
              f"{(got - want) / want * 100:+6.1f}%")


asyncio.run(main())
