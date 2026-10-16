"""Pruebas normativas de la fase 4 (D23). No editar: añadir en otro fichero."""
import asyncio
import copy
import json
import os
from pathlib import Path

os.environ.setdefault("KLOTHULHU_TOKENS", "fase4test:" + "x" * 16)
os.environ["KLOTHULHU_FAKE"] = "1"

import app  # noqa: E402
import director  # noqa: E402
from beats import is_cut  # noqa: E402

FIX = Path(__file__).parent / "fixtures"
VOCAB = director.load_vocab()


def _scene(backdrop, action, frm, to, particles=None, caption="x"):
    s = {"backdrop": backdrop, "palette": {}, "hero": {"action": action, "from": frm, "to": to},
         "props": [{"sprite": "bug", "x": 50, "y": "ground", "motion": "none"}], "caption": caption,
         "tone": "work"}
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

    seen = {}

    async def fake_director(question, bs):
        seen["beats"] = [tuple(b) for b in bs]
        for (caption, _), st in zip(bs, stagings):
            yield None if st is None else {**copy.deepcopy(st), "caption": caption}

    monkeypatch.setattr(app, "_fake_stream", fake_stream)
    monkeypatch.setattr(app, "_director", fake_director)

    async def collect():
        return [c async for c in app._reply(cid, "¿Qué tal?", asyncio.Lock())]

    events = _events(asyncio.run(collect()))
    return [d["scene"] for e, d in events if e == "scene"], seen["beats"]


# G1 — is_cut: casos compartidos con isCut del cliente
def test_g1_is_cut_cases():
    for c in json.loads((FIX / "cut_cases.json").read_text(encoding="utf-8"))["cases"]:
        assert is_cut(c["caption"]) is c["cut"], c["caption"]


# G2 — continuación con desplazamiento: fondo y partículas heredados, sale del `to` anterior
def test_g2_travel():
    prev = _scene("space", "walk", 10, 70, particles="stars")
    scene = _scene("forest", "run", 20, 90)
    out = director.continue_scene(prev, "Sigo atrapado en tu escritorio,", scene)
    assert out["backdrop"] == "space"
    assert out["particles"] == {"kind": "stars", "density": 0.4}
    assert out["hero"] == {"action": "run", "from": 70, "to": 90}
    assert out["props"] == scene["props"] and out["tone"] == scene["tone"] and out["caption"] == scene["caption"]


# G3 — continuación en el sitio: from = to = el `to` anterior; `then` se conserva
def test_g3_in_place():
    prev = _scene("lab", "run", 0, 55)
    scene = _scene("volcano", "think", 20, 20, particles="sparks")
    scene["hero"]["then"] = "shrug"
    out = director.continue_scene(prev, "como si el tiempo significara", scene)
    assert out["backdrop"] == "lab"
    assert "particles" not in out  # el anterior no tenía
    assert out["hero"] == {"action": "think", "from": 55, "to": 55, "then": "shrug"}


# G4 — si el anterior acaba la frase, la escena sale tal cual
def test_g4_not_cut():
    prev = _scene("space", "walk", 10, 70)
    scene = _scene("forest", "run", 20, 90)
    assert director.continue_scene(prev, "Fin de la frase.", scene) == scene


# G5 — None en cualquier lado: no se repara nada
def test_g5_none():
    scene = _scene("forest", "run", 20, 90)
    assert director.continue_scene(None, "cortado,", scene) == scene
    assert director.continue_scene(_scene("space", "walk", 0, 10), "cortado,", None) is None
    assert director.continue_scene(_scene("space", "walk", 0, 10), None, scene) == scene


# G6 — pura: no modifica sus argumentos
def test_g6_pure():
    prev = _scene("space", "walk", 10, 70, particles="stars")
    scene = _scene("forest", "think", 20, 20)
    before = (copy.deepcopy(prev), copy.deepcopy(scene))
    director.continue_scene(prev, "cortado,", scene)
    assert (prev, scene) == before


# G7 — de punta a punta: una frase cortada en dos y otra frase nueva
def test_g7_reply_two_sentences(monkeypatch):
    reply = ("[smug] Hola, mortal. Sigo atrapado en tu escritorio, lo cual es humillante para algo que "
             "devoró estrellas. [neutral] Pero estoy bien, dentro de lo que cabe en una ventana.")
    stagings = [_scene("space", "walk", 10, 70, particles="stars"), _scene("forest", "think", 20, 20),
                _scene("lab", "run", 0, 50)]
    scenes, bs = _run(monkeypatch, reply, stagings, "fase4-g7")
    assert [c for c, _ in bs] == [
        "Hola, mortal. Sigo atrapado en tu escritorio,",
        "lo cual es humillante para algo que devoró estrellas.",
        "Pero estoy bien, dentro de lo que cabe en una ventana.",
    ]
    assert scenes[0]["backdrop"] == "space" and scenes[0]["hero"] == {"action": "walk", "from": 10, "to": 70}
    assert scenes[1]["backdrop"] == "space" and scenes[1]["particles"]["kind"] == "stars"
    assert scenes[1]["hero"] == {"action": "think", "from": 70, "to": 70}
    assert scenes[2]["backdrop"] == "lab" and "particles" not in scenes[2]  # frase nueva: libre
    assert scenes[2]["hero"] == {"action": "run", "from": 0, "to": 50}


# G8 — una frase en tres trozos encadena con la escena ya corregida
def test_g8_chain(monkeypatch):
    reply = ("[annoyed] Llevo eones esperando a que alguien me pregunte algo interesante, y tú vienes a "
             "preguntarme por la hora, como si el tiempo significara algo para un ser que ya estaba aquí "
             "antes de las estrellas.")
    stagings = [_scene("space", "walk", 10, 70, particles="stars"), _scene("forest", "run", 20, 90),
                _scene("lab", "think", 5, 5, particles="sparks")]
    scenes, bs = _run(monkeypatch, reply, stagings, "fase4-g8")
    assert len(bs) == 3 and is_cut(bs[0][0]) and is_cut(bs[1][0])
    assert [s["backdrop"] for s in scenes] == ["space", "space", "space"]
    assert all(s["particles"]["kind"] == "stars" for s in scenes)
    assert scenes[1]["hero"] == {"action": "run", "from": 70, "to": 90}
    assert scenes[2]["hero"] == {"action": "think", "from": 90, "to": 90}


# G9 — una escena null rompe la cadena: la siguiente sale tal cual
def test_g9_null_breaks_chain(monkeypatch):
    reply = ("[annoyed] Llevo eones esperando a que alguien me pregunte algo interesante, y tú vienes a "
             "preguntarme por la hora, como si el tiempo significara algo para un ser que ya estaba aquí "
             "antes de las estrellas.")
    stagings = [_scene("space", "walk", 10, 70), None, _scene("lab", "think", 5, 5)]
    scenes, _ = _run(monkeypatch, reply, stagings, "fase4-g9")
    assert scenes[1] is None
    assert scenes[2]["backdrop"] == "lab" and scenes[2]["hero"]["from"] == 5


# G10 — el director ve qué golpes continúan
def test_g10_user_message():
    bs = [("Hola, mortal. Sigo atrapado en tu escritorio,", "smug"),
          ("lo cual es humillante para algo que devoró estrellas.", "smug"),
          ("Pero estoy bien.", "neutral")]
    lines = director._user_message("¿Qué tal?", bs).split("\n")
    assert "1. [smug] Hola, mortal." in "\n".join(lines) and "1. [smug] (continues)" not in "\n".join(lines)
    assert any(line.startswith("2. [smug] (continues) lo cual") for line in lines)
    assert any(line.startswith("3. [neutral] Pero estoy bien.") for line in lines)
    assert "(continues)" in director.system_prompt(VOCAB)


# G11 — TRAVEL son exactamente las de desplazamiento del prompt y están en el vocabulario
def test_g11_travel():
    assert director.TRAVEL == {"walk", "run", "fly", "carry", "sneak", "jump", "tumble"}
    assert director.TRAVEL <= set(VOCAB["actions"])
