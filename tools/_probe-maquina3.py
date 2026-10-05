"""Sonda: a cota cobre o roteiro? O endpoint /with-timestamps funciona no
plano free? A chave nunca e impressa."""
import json
import urllib.request

ENV = "/root/secrets/elevenlabs.env"
VOICE = "JBFqnCBsd6RMkjVDRZzb"


def key():
    with open(ENV, encoding="utf-8") as f:
        for row in f:
            if row.startswith("ELEVENLABS_API_KEY="):
                return row.split("=", 1)[1].strip()
    raise SystemExit("sem chave")


def call(path, body=None):
    req = urllib.request.Request(
        "https://api.elevenlabs.io/v1" + path,
        data=json.dumps(body).encode() if body else None,
        headers={"xi-api-key": key(), "Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=120) as r:
        return r.read()


sub = json.loads(call("/user/subscription"))
left = sub["character_limit"] - sub["character_count"]
print(f"cota: {left} de {sub['character_limit']} restantes "
      f"(tier {sub.get('tier')}, reset {sub.get('next_character_count_reset_unix')})")

doc = json.load(open("src/narration-maquina.json", encoding="utf-8"))
need = sum(len(l["text"]) for l in doc["lines"])
print(f"roteiro: {need} caracteres | cobre? {left >= need}")

raw = call(
    f"/text-to-speech/{VOICE}/with-timestamps?output_format=mp3_44100_96",
    {"text": "Teste de tempo.", "model_id": "eleven_multilingual_v2", "language_code": "pt"},
)
data = json.loads(raw)
print("chaves da resposta:", sorted(data.keys()))
al = data["alignment"]
print("chaves de alignment:", sorted(al.keys()))
print("caracteres:", "".join(al["characters"]))
print("inicios:", [round(t, 3) for t in al["character_start_times_seconds"]])
print("audio base64:", len(data["audio_base64"]), "bytes b64")
