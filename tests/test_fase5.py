"""Pruebas normativas de la fase 5 (D24-D26). No editar: añadir en otro fichero."""
import asyncio
import copy
import json
import os
from pathlib import Path

os.environ.setdefault("KLOTHULHU_TOKENS", "fase5test:" + "x" * 16)
os.environ["KLOTHULHU_FAKE"] = "1"

import app  # noqa: E402
import director  # noqa: E402
from beats import TRAMO_MAX, is_cut, tramos  # noqa: E402

FIX = Path(__file__).parent / "fixtures"
SERVER = Path(__file__).parent.parent / "server"
VOCAB = director.load_vocab()


def _scene(backdrop, action, frm, to, particles=None):
    s = {"backdrop": backdrop, "palette": {}, "hero": {"action": action, "from": frm, "to": to},
         "props": [], "caption": "x", "tone": "work"}
    if particles:
        s["particles"] = {"kind": particles, "density": 0.4}
    return s


def _events(chunks):
    out = []
    for block in "".join(chunks).split("\n\n"):
        if not block.strip():
            continue
        event = data = None
        for line in block.split("\n"):
            if line.startswith("event: "):
                event = line[len("event: "):]
            elif line.startswith("data: "):
                data = json.loads(line[len("data: "):])
        out.append((event, data))
    return out


def _run(monkeypatch, reply, stagings, cid):
    async def fake_stream():
        for i in range(0, len(reply), 3):
            yield reply[i : i + 3]

    async def fake_director(question, bs):
        for (caption, _), st in zip(bs, stagings):
            yield None if st is None else {**copy.deepcopy(st), "caption": caption}

    monkeypatch.setattr(app, "_fake_stream", fake_stream)
    monkeypatch.setattr(app, "_director", fake_director)

    async def collect():
        return [c async for c in app._reply(cid, "¿Qué tal?", asyncio.Lock())]

    return [d for e, d in _events(asyncio.run(collect())) if e == "scene"]


# H1 — tramos(): casos compartidos con tramos() del cliente (D24)
def test_h1_tramos_cases():
    for c in json.loads((FIX / "tramos_cases.json").read_text(encoding="utf-8"))["cases"]:
        got = [list(t) for t in tramos(c["text"], [tuple(m) for m in c["marks"]])]
        assert got == c["tramos"], c["name"]


# H2 — el vocabulario es el del motor de la fase 2 de claude-fables (D25, D26)
def test_h2_vocab():
    assert VOCAB["schemaVersion"] == 2
    assert TRAMO_MAX == VOCAB["limits"]["maxLongCaption"] == 500
    assert {"approach", "angry", "dazed"} <= set(VOCAB["actions"])


# H3 — una escena por tramo: una frase de 194 caracteres va entera en una sola escena (D24)
def test_h3_one_scene_per_tramo(monkeypatch):
    sentence = ("Llevo eones esperando a que alguien me pregunte algo interesante, y tú vienes a preguntarme "
                "por la hora, como si el tiempo significara algo para un ser que ya estaba aquí antes de las "
                "estrellas.")
    scenes = _run(monkeypatch, "[annoyed] " + sentence, [_scene("space", "walk", 10, 70)], "fase5-h3")
    assert len(scenes) == 1
    assert scenes[0]["caption"] == sentence and scenes[0]["emotion"] == "annoyed"


# H4 — D23 sigue valiendo entre tramos: emoción nueva a media frase (sustituye a fase 4 G7)
def test_h4_continuity_mid_sentence(monkeypatch):
    reply = "[smug] Hola, mortal, sigo atrapado en tu escritorio [annoyed] y eso me humilla. [neutral] Pero estoy bien."
    stagings = [_scene("space", "walk", 10, 70, particles="stars"), _scene("forest", "think", 20, 20),
                _scene("lab", "run", 0, 50)]
    scenes = _run(monkeypatch, reply, stagings, "fase5-h4")
    assert [d["caption"] for d in scenes] == ["Hola, mortal, sigo atrapado en tu escritorio",
                                              "y eso me humilla.", "Pero estoy bien."]
    s = [d["scene"] for d in scenes]
    assert s[1]["backdrop"] == "space" and s[1]["particles"]["kind"] == "stars"
    assert s[1]["hero"] == {"action": "think", "from": 70, "to": 70}
    assert s[2]["backdrop"] == "lab" and "particles" not in s[2]
    assert s[2]["hero"] == {"action": "run", "from": 0, "to": 50}


# H5 — una frase en tres tramos encadena con la escena ya corregida (sustituye a fase 4 G8)
def test_h5_chain(monkeypatch):
    reply = "[annoyed] Llevo eones esperando, [confused] y tú me preguntas la hora, [sleepy] como si el tiempo importara."
    stagings = [_scene("space", "walk", 10, 70, particles="stars"), _scene("forest", "run", 20, 90),
                _scene("lab", "think", 5, 5, particles="sparks")]
    scenes = _run(monkeypatch, reply, stagings, "fase5-h5")
    assert len(scenes) == 3 and is_cut(scenes[0]["caption"]) and is_cut(scenes[1]["caption"])
    s = [d["scene"] for d in scenes]
    assert [x["backdrop"] for x in s] == ["space", "space", "space"]
    assert s[1]["hero"] == {"action": "run", "from": 70, "to": 90}
    assert s[2]["hero"] == {"action": "think", "from": 90, "to": 90}


# H6 — una escena null rompe la cadena (sustituye a fase 4 G9)
def test_h6_null_breaks_chain(monkeypatch):
    reply = "[annoyed] Llevo eones esperando, [confused] y tú me preguntas la hora, [sleepy] como si el tiempo importara."
    scenes = _run(monkeypatch, reply, [_scene("space", "walk", 10, 70), None, _scene("lab", "think", 5, 5)],
                  "fase5-h6")
    assert scenes[1]["scene"] is None
    assert scenes[2]["scene"]["backdrop"] == "lab" and scenes[2]["scene"]["hero"]["from"] == 5


# H7 — `approach` solo abre una escena: el servidor lo quita de `then` (D26)
def test_h7_approach_not_then():
    staging = {"backdrop": "city", "hero": {"action": "wave", "from": 30, "to": 30, "then": "approach"},
               "particles": None, "props": [], "tone": "work"}
    assert "then" not in director.build_scene(staging, "Hola.", VOCAB)["hero"]
    staging["hero"] = {"action": "approach", "from": 30, "to": 50, "then": "angry"}
    assert director.build_scene(staging, "Hola.", VOCAB)["hero"] == {"action": "approach", "from": 30, "to": 50,
                                                                     "then": "angry"}


# H8 — los prompts: el narrador ya no escribe para captions de 70; el director conoce las acciones nuevas (D24, D26)
def test_h8_prompts():
    narrator = (SERVER / "prompt.md").read_text(encoding="utf-8")
    assert "at most 70 characters" not in narrator
    assert "own caption" not in narrator
    prompt = director.system_prompt(VOCAB)
    for action in ("approach", "angry", "dazed"):
        assert prompt.count(action) >= 2, action  # en la lista de nombres y explicada
