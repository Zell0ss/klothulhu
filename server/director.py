"""El director de escena (D14): decide cómo se pone en escena cada golpe de la respuesta.

Una segunda llamada al modelo, con *structured outputs*, después de que el narrador haya escrito. El
texto no lo toca: el ``caption`` de cada escena es el golpe tal cual. El vocabulario sale de
``fables_vocab.json``, generado del motor vendorizado (D15).
"""
from __future__ import annotations

import json
import logging
import time
from pathlib import Path

log = logging.getLogger("klothulhu.director")

HERE = Path(__file__).parent
MAX_PROPS = 3
_PROMPT_PATH = HERE / "director_prompt.md"


def load_vocab(path: str | Path | None = None) -> dict:
    return json.loads(Path(path or HERE / "fables_vocab.json").read_text(encoding="utf-8"))


# --- esquema y prompt, generados del vocabulario ----------------------------


def _nullable(schema: dict) -> dict:
    return {"anyOf": [schema, {"type": "null"}]}


def _staging_schema(vocab: dict) -> dict:
    actions = {"type": "string", "enum": list(vocab["actions"])}
    return {
        "type": "object",
        "additionalProperties": False,
        "required": ["backdrop", "hero", "particles", "props", "tone"],
        "properties": {
            "backdrop": {"type": "string", "enum": list(vocab["backdrops"])},
            "hero": {
                "type": "object",
                "additionalProperties": False,
                "required": ["action", "from", "to", "then"],
                "properties": {
                    "action": actions,
                    "from": {"type": "integer"},
                    "to": {"type": "integer"},
                    "then": _nullable(actions),
                },
            },
            "particles": _nullable(
                {
                    "type": "object",
                    "additionalProperties": False,
                    "required": ["kind", "density"],
                    "properties": {
                        "kind": {"type": "string", "enum": list(vocab["particles"])},
                        "density": {"type": "number"},
                    },
                }
            ),
            "props": {
                "type": "array",
                "items": {
                    "type": "object",
                    "additionalProperties": False,
                    "required": ["sprite", "x", "y", "motion", "label"],
                    "properties": {
                        "sprite": {"type": "string", "enum": list(vocab["sprites"])},
                        "x": {"type": "integer"},
                        "y": {"type": "string", "enum": list(vocab["heights"])},
                        "motion": {"type": "string", "enum": list(vocab["motions"])},
                        "label": _nullable({"type": "string"}),
                    },
                },
            },
            "tone": {"type": "string", "enum": list(vocab["tones"])},
        },
    }


def output_schema(vocab: dict) -> dict:
    # Sin minimum/maximum ni límites de longitud: structured outputs no los admite; los acota build_scene.
    return {
        "type": "object",
        "additionalProperties": False,
        "required": ["scenes"],
        "properties": {"scenes": {"type": "array", "items": _staging_schema(vocab)}},
    }


def system_prompt(vocab: dict) -> str:
    fills = {
        "backdrops": vocab["backdrops"],
        "actions": vocab["actions"],
        "particles": vocab["particles"],
        "sprites": vocab["sprites"],
        "motions": vocab["motions"],
    }
    text = _PROMPT_PATH.read_text(encoding="utf-8")
    for key, names in fills.items():
        text = text.replace(f"<{key}>", ", ".join(names))
    max_label = str(vocab["limits"]["maxLabel"])
    return text.replace("<max_props>", str(MAX_PROPS)).replace("<max_label>", max_label)


# --- de puesta en escena a FablesScene --------------------------------------


def _clamp(value, lo, hi):
    return max(lo, min(hi, value))


def build_scene(staging: dict, caption: str, vocab: dict) -> dict | None:
    """Convierte la puesta en escena de un golpe en un FablesScene, o None si algo no es del vocabulario."""
    try:
        if staging["backdrop"] not in vocab["backdrops"] or staging["tone"] not in vocab["tones"]:
            return None
        h = staging["hero"]
        if h["action"] not in vocab["actions"]:
            return None
        then = h.get("then")
        if then is not None and then not in vocab["actions"]:
            return None
        hero = {
            "action": h["action"],
            "from": _clamp(round(h["from"]), 0, 100),
            "to": _clamp(round(h["to"]), 0, 100),
        }
        if then is not None:
            hero["then"] = then

        particles = staging.get("particles")
        if particles is not None and particles["kind"] not in vocab["particles"]:
            return None

        props = []
        for p in staging["props"][:MAX_PROPS]:
            if (
                p["sprite"] not in vocab["sprites"]
                or p["y"] not in vocab["heights"]
                or p["motion"] not in vocab["motions"]
            ):
                return None
            x = _clamp(round(p["x"]), 0, 100)
            prop = {"sprite": p["sprite"], "x": x, "y": p["y"], "motion": p["motion"]}
            label = (p.get("label") or "").strip()[: vocab["limits"]["maxLabel"]]
            if label:
                prop["label"] = label
            props.append(prop)

        scene = {
            "backdrop": staging["backdrop"],
            "palette": {},
            "hero": hero,
            "props": props,
            "caption": caption,
            "tone": staging["tone"],
        }
        if particles is not None:
            scene["particles"] = {"kind": particles["kind"], "density": _clamp(particles["density"], 0, 1)}
        return scene
    except (KeyError, TypeError, ValueError):
        return None


# --- la llamada --------------------------------------------------------------


def _user_message(question: str, beats: list[tuple[str, str]]) -> str:
    lines = "\n".join(f"{i}. [{emotion}] {caption}" for i, (caption, emotion) in enumerate(beats, 1))
    return (
        f'The mortal asked: "{question}"\n'
        f"klothulhu's reply, in beats (in order):\n{lines}\n"
        f"Stage exactly {len(beats)} scenes, one per beat, in order."
    )


async def direct(question, beats, *, client, vocab, model, effort, timeout) -> list[dict | None]:
    """Una escena (o None) por golpe. Nunca lanza: cualquier fallo da todo None."""
    nones: list[dict | None] = [None] * len(beats)
    started = time.monotonic()
    try:
        response = await client.with_options(timeout=timeout, max_retries=1).messages.create(
            model=model,
            max_tokens=4096,
            system=[{"type": "text", "text": system_prompt(vocab), "cache_control": {"type": "ephemeral"}}],
            messages=[{"role": "user", "content": _user_message(question, beats)}],
            output_config={
                "effort": effort,
                "format": {"type": "json_schema", "schema": output_schema(vocab)},
            },
        )
        if response.stop_reason != "end_turn":
            log.warning("director: stop_reason=%s", response.stop_reason)
            return nones
        text = next((b.text for b in response.content if getattr(b, "type", None) == "text"), None)
        if not text:
            log.warning("director: respuesta sin texto")
            return nones
        stagings = json.loads(text)["scenes"]
        if not isinstance(stagings, list):
            raise ValueError("scenes no es una lista")
        scenes = [build_scene(s, caption, vocab) for s, (caption, _) in zip(stagings, beats, strict=False)]
        scenes += [None] * (len(beats) - len(scenes))
    except Exception as exc:  # noqa: BLE001 - el director nunca rompe la respuesta
        log.warning("director: fallo (%s: %s)", type(exc).__name__, exc)
        return nones
    usage = response.usage
    log.info(
        "director: model=%s ms=%d in=%s out=%s cache_read=%s nulls=%d/%d",
        model,
        (time.monotonic() - started) * 1000,
        getattr(usage, "input_tokens", 0),
        getattr(usage, "output_tokens", 0),
        getattr(usage, "cache_read_input_tokens", 0),
        scenes.count(None),
        len(beats),
    )
    return scenes


# --- modo de pruebas ----------------------------------------------------------

_FAKE_STAGINGS = [
    {"backdrop": "space", "hero": {"action": "fly", "from": 10, "to": 60, "then": "point"},
     "particles": {"kind": "stars", "density": 0.4}, "props": [], "tone": "work"},
    {"backdrop": "forest", "hero": {"action": "jump", "from": 30, "to": 60, "then": "celebrate"},
     "particles": None, "props": [], "tone": "milestone"},
    {"backdrop": "night", "hero": {"action": "sleep", "from": 50, "to": 50, "then": None},
     "particles": {"kind": "stars", "density": 0.3}, "props": [], "tone": "work"},
]


async def fake_direct(question, beats) -> list[dict | None]:
    """Escenas válidas y deterministas, sin API (KLOTHULHU_FAKE=1)."""
    vocab = load_vocab()
    return [
        build_scene(_FAKE_STAGINGS[i % len(_FAKE_STAGINGS)], caption, vocab)
        for i, (caption, _) in enumerate(beats)
    ]
