"""Pruebas normativas de la fase 2 (docs/fase2/PLAN.md, D13-D16). No editar: añadir en otro fichero."""
import asyncio
import json
import os
from pathlib import Path
from types import SimpleNamespace

os.environ.setdefault("KLOTHULHU_TOKENS", "fase2test:" + "x" * 16)
os.environ["KLOTHULHU_FAKE"] = "1"

import app  # noqa: E402
import director  # noqa: E402
from beats import CAPTION_MAX, beats  # noqa: E402

FIX = Path(__file__).parent / "fixtures"
VOCAB = director.load_vocab()
REPLY = "[confused] No tengo reloj, mortal, solo eternidad. [smug] Pero Tokio va siete horas por delante."
BEATS = [("No tengo reloj, mortal, solo eternidad.", "confused"), ("Pero Tokio va siete horas por delante.", "smug")]


def _cases(name):
    return json.loads((FIX / name).read_text(encoding="utf-8"))["cases"]


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


def _run(monkeypatch, reply, directed, cid="fase2"):
    async def fake_stream():
        for i in range(0, len(reply), 3):
            yield reply[i : i + 3]

    seen = {}

    async def fake_director(question, bs):
        seen["question"], seen["beats"] = question, [tuple(b) for b in bs]
        return directed(bs)

    monkeypatch.setattr(app, "_fake_stream", fake_stream)
    monkeypatch.setattr(app, "_director", fake_director)

    async def collect():
        return [c async for c in app._reply(cid, "¿Qué hora es?", asyncio.Lock())]

    return _events(asyncio.run(collect())), seen


def _scene_for(bs):
    staging = _cases("director_cases.json")[0]["staging"]
    return [director.build_scene(staging, caption, VOCAB) for caption, _ in bs]


# N1 — el troceo del servidor es el del cliente
def test_n1_beats_casos_compartidos():
    assert CAPTION_MAX == 70
    for c in _cases("beats_cases.json"):
        got = beats(c["text"], [tuple(m) for m in c["marks"]])
        assert [list(b) for b in got] == c["beats"], c["name"]


# N2 — build_scene acota, recorta y rechaza lo que no está en el vocabulario
def test_n2_build_scene_casos():
    for c in _cases("director_cases.json"):
        assert director.build_scene(c["staging"], c["caption"], VOCAB) == c["scene"], c["name"]


# N3 — esquema y prompt salen del vocabulario; el esquema cumple structured outputs
def test_n3_esquema_y_prompt_desde_vocab():
    s = director.output_schema(VOCAB)
    item = s["properties"]["scenes"]["items"]
    assert item["properties"]["backdrop"]["enum"] == list(VOCAB["backdrops"])
    assert item["properties"]["hero"]["properties"]["action"]["enum"] == list(VOCAB["actions"])
    assert item["properties"]["tone"]["enum"] == list(VOCAB["tones"])
    assert item["properties"]["props"]["items"]["properties"]["sprite"]["enum"] == list(VOCAB["sprites"])

    def walk(node):
        if isinstance(node, dict):
            if node.get("type") == "object":
                assert node.get("additionalProperties") is False, node
                assert set(node["required"]) == set(node["properties"]), node
            for v in node.values():
                walk(v)
        elif isinstance(node, list):
            for v in node:
                walk(v)

    walk(s)
    text = json.dumps(s)
    for banned in ("minimum", "maximum", "minLength", "maxLength", "minItems", "maxItems"):
        assert banned not in text, banned
    prompt = director.system_prompt(VOCAB)
    for name in [*VOCAB["backdrops"], *VOCAB["actions"], *VOCAB["particles"], *VOCAB["sprites"]]:
        assert name in prompt, name


# N4 — contrato SSE: texto, después una escena por golpe, después done
def test_n4_contrato_sse(monkeypatch):
    evs, seen = _run(monkeypatch, REPLY, _scene_for, cid="n4")
    kinds = [k for k, _ in evs]
    assert kinds[0] == "emotion" and kinds[-1] == "done"
    first = kinds.index("scene")
    assert set(kinds[first:-1]) == {"scene"}
    assert seen["question"] == "¿Qué hora es?"
    assert seen["beats"] == BEATS
    scenes = [d for k, d in evs if k == "scene"]
    assert [s["index"] for s in scenes] == [0, 1]
    assert all(s["total"] == 2 for s in scenes)
    assert [(s["caption"], s["emotion"]) for s in scenes] == BEATS
    assert all(s["scene"]["caption"] == s["caption"] for s in scenes)
    text = "".join(d["text"] for k, d in evs if k == "delta")
    assert text == "No tengo reloj, mortal, solo eternidad. Pero Tokio va siete horas por delante."


# N5 — si el director falla, la respuesta sigue: escenas null, sin error
def test_n5_director_falla_no_rompe(monkeypatch):
    def boom(bs):
        raise RuntimeError("director caído")

    evs, _ = _run(monkeypatch, REPLY, boom, cid="n5")
    kinds = [k for k, _ in evs]
    assert "error" not in kinds and kinds[-1] == "done"
    scenes = [d for k, d in evs if k == "scene"]
    assert len(scenes) == 2 and all(s["scene"] is None for s in scenes)


# N6 — escenas de menos o de más se ajustan al número de golpes
def test_n6_numero_de_escenas(monkeypatch):
    evs, _ = _run(monkeypatch, REPLY, lambda bs: _scene_for(bs)[:1], cid="n6a")
    scenes = [d for k, d in evs if k == "scene"]
    assert len(scenes) == 2 and scenes[0]["scene"] is not None and scenes[1]["scene"] is None
    evs, _ = _run(monkeypatch, REPLY, lambda bs: _scene_for(bs) * 2, cid="n6b")
    assert len([d for k, d in evs if k == "scene"]) == 2


# N7 — el historial guarda el texto del narrador, nunca las escenas
def test_n7_historial(monkeypatch):
    _run(monkeypatch, REPLY, _scene_for, cid="n7")
    msgs = app.history.messages("n7")
    assert msgs[-1]["content"] == REPLY
    assert "scene" not in json.dumps(msgs)


# N8 — director apagado: escenas null y no se le llama
def test_n8_director_apagado(monkeypatch):
    monkeypatch.setattr(app, "DIRECTOR_ENABLED", False)
    evs, seen = _run(monkeypatch, REPLY, _scene_for, cid="n8")
    scenes = [d for k, d in evs if k == "scene"]
    assert len(scenes) == 2 and all(s["scene"] is None for s in scenes)
    assert "beats" not in seen


# N9 — respuesta vacía: ni escenas ni director, pero done
def test_n9_respuesta_vacia(monkeypatch):
    evs, seen = _run(monkeypatch, "", _scene_for, cid="n9")
    kinds = [k for k, _ in evs]
    assert "scene" not in kinds and kinds[-1] == "done"
    assert "beats" not in seen


# N10 — /health anuncia el director
def test_n10_health():
    h = asyncio.run(app.health())
    assert set(h["director"]) == {"enabled", "model"}


# N11 — el director falso da escenas válidas, una por golpe
def test_n11_fake_direct():
    out = asyncio.run(director.fake_direct("q", BEATS))
    assert len(out) == 2
    for scene, (caption, _) in zip(out, BEATS):
        assert scene["caption"] == caption
        assert scene["backdrop"] in VOCAB["backdrops"]
        assert scene["hero"]["action"] in VOCAB["actions"]


class _Messages:
    def __init__(self, payload=None, exc=None, stop="end_turn", text=None):
        self.payload, self.exc, self.stop, self.text, self.kwargs = payload, exc, stop, text, None

    async def create(self, **kwargs):
        self.kwargs = kwargs
        if self.exc:
            raise self.exc
        body = self.text if self.text is not None else json.dumps(self.payload)
        return SimpleNamespace(
            stop_reason=self.stop,
            content=[SimpleNamespace(type="thinking", thinking=""), SimpleNamespace(type="text", text=body)],
            usage=SimpleNamespace(input_tokens=10, output_tokens=5),
        )


class _Client:
    def __init__(self, messages):
        self.messages = messages
        self.options = None

    def with_options(self, **kwargs):
        self.options = kwargs
        return self


def _direct(client, bs):
    return asyncio.run(
        director.direct("¿Qué hora es?", bs, client=client, vocab=VOCAB, model="claude-haiku-5-5", effort="low", timeout=10)
    )


# N12 — direct: la llamada, la lectura por tipo de bloque y los fallos
def test_n12_direct():
    stagings = [c["staging"] for c in _cases("director_cases.json")[:2]]
    three = [*BEATS, ("Y nada más.", "neutral")]
    msgs = _Messages(payload={"scenes": stagings})
    client = _Client(msgs)
    out = _direct(client, three)
    assert out == [director.build_scene(s, c, VOCAB) for s, (c, _) in zip(stagings, three)] + [None]
    kw = msgs.kwargs
    assert kw["model"] == "claude-haiku-5-5"
    assert kw["output_config"]["effort"] == "low"
    assert kw["output_config"]["format"] == {"type": "json_schema", "schema": director.output_schema(VOCAB)}
    assert "temperature" not in kw and "top_p" not in kw and "top_k" not in kw
    assert kw["messages"][-1]["role"] == "user"
    assert "No tengo reloj, mortal, solo eternidad." in json.dumps(kw["messages"], ensure_ascii=False)
    assert client.options == {"timeout": 10, "max_retries": 1}
    for bad in (
        _Messages(exc=RuntimeError("red caída")),
        _Messages(payload={"scenes": stagings}, stop="refusal"),
        _Messages(payload={"scenes": stagings}, stop="max_tokens"),
        _Messages(text="esto no es JSON"),
    ):
        assert _direct(_Client(bad), BEATS) == [None, None]
