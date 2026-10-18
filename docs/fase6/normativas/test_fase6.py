"""Pruebas normativas de la fase 6, H2 (D28, D30, D33). No editar: añadir en otro fichero."""
import os
from pathlib import Path

os.environ.setdefault("KLOTHULHU_TOKENS", "fase6test:" + "x" * 16)
os.environ["KLOTHULHU_FAKE"] = "1"

import director  # noqa: E402
from emotion_parser import EMOTIONS, EmotionStreamParser  # noqa: E402

SERVER = Path(__file__).parent.parent / "server"
VOCAB = director.load_vocab()


# Q1 — `sad` es la séptima emoción, la única nueva (D28)
def test_q1_emotions():
    assert EMOTIONS == ("neutral", "happy", "annoyed", "confused", "smug", "sleepy", "sad")
    p = EmotionStreamParser()
    events = p.feed("[sad] Lo siento, mortal.") + p.flush()
    assert events[0] == ("emotion", "sad")
    assert "".join(t for k, t in events if k == "delta") == "Lo siento, mortal."
    assert p.unknown_tags == []


# Q2 — el motor de la fase 3 de claude-fables (D33)
def test_q2_vocab():
    assert VOCAB["schemaVersion"] == 3
    assert {"sad", "despair", "emerge"} <= set(VOCAB["actions"])
    assert "emerge" not in director.TRAVEL  # en el sitio: D23 la trata como `approach`


# Q3 — `emerge`, como `approach`, solo abre una escena: el servidor lo quita de `then` (D30, D33)
def test_q3_emerge_not_then():
    staging = {"backdrop": "volcano", "hero": {"action": "angry", "from": 40, "to": 40, "then": "emerge"},
               "particles": None, "props": [], "tone": "trouble"}
    assert "then" not in director.build_scene(staging, "Temblad.", VOCAB)["hero"]
    staging["hero"] = {"action": "emerge", "from": 40, "to": 40, "then": "angry"}
    hero = director.build_scene(staging, "Temblad.", VOCAB)["hero"]
    assert hero == {"action": "emerge", "from": 40, "to": 40, "then": "angry"}
    # `sad` y `despair` sí valen como `then`
    for then in ("sad", "despair"):
        staging["hero"] = {"action": "approach", "from": 30, "to": 50, "then": then}
        assert director.build_scene(staging, "Ay.", VOCAB)["hero"]["then"] == then


# Q4 — D23 con `emerge`: en una continuación sale de donde acabó, en el sitio
def test_q4_emerge_continues_in_place():
    prev = {"backdrop": "night", "palette": {}, "hero": {"action": "walk", "from": 10, "to": 35},
            "props": [], "caption": "Desde lo más hondo", "tone": "work"}
    scene = {"backdrop": "volcano", "palette": {}, "hero": {"action": "emerge", "from": 80, "to": 80},
             "props": [], "caption": "me alzo.", "tone": "trouble"}
    out = director.continue_scene(prev, prev["caption"], scene)
    assert out["backdrop"] == "night"
    assert out["hero"] == {"action": "emerge", "from": 35, "to": 35}


# Q5 — los prompts: el narrador conoce `sad` con sus dos usos; el director, las tres acciones (D28, D30)
def test_q5_prompts():
    narrator = (SERVER / "prompt.md").read_text(encoding="utf-8")
    assert "[sleepy] [sad]" in narrator
    sad_line = next(line for line in narrator.splitlines() if line.startswith("- sad:"))
    assert "compassion" in sad_line.lower() and "own" in sad_line.lower()
    prompt = director.system_prompt(VOCAB)
    assert "sad heavy" in prompt
    for action in ("sad", "despair", "emerge"):
        assert prompt.count(action) >= 2, action  # en la lista de nombres y explicada
    emerge = prompt[prompt.index("emerge rises"):]
    assert "never in \"then\"" in emerge.split(".")[0] + emerge.split(".")[1]
