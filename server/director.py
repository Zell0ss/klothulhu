"""El director de escena (D14): decide cómo se pone en escena cada tramo de la respuesta (D24).

Una segunda llamada al modelo, con *structured outputs* y en streaming (D19), después de que el narrador
haya escrito. El texto no lo toca: el ``caption`` de cada escena es el tramo tal cual. El vocabulario sale de
``fables_vocab.json``, generado del motor vendorizado (D15).
"""
from __future__ import annotations

import asyncio
import copy
import json
import logging
import time
from collections.abc import AsyncIterator
from pathlib import Path

from beats import is_cut

log = logging.getLogger("klothulhu.director")

HERE = Path(__file__).parent
MAX_PROPS = 3
# D23: acciones de desplazamiento (`from` != `to`). Es la lista del prompt y las de MOTION_TIMING con
# `kind: "travel"` del motor vendorizado: al actualizar el motor (VENDOR.md), mira ahí.
TRAVEL = frozenset({"walk", "run", "fly", "carry", "sneak", "jump", "tumble"})
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
    """Convierte la puesta en escena de un tramo en un FablesScene, o None si algo no es del vocabulario."""
    try:
        if staging["backdrop"] not in vocab["backdrops"] or staging["tone"] not in vocab["tones"]:
            return None
        h = staging["hero"]
        if h["action"] not in vocab["actions"]:
            return None
        then = h.get("then")
        if then is not None and then not in vocab["actions"]:
            return None
        if then == "approach":  # D26: solo abre una escena; el motor lo descartaría y avisaría
            then = None
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


# --- continuidad dentro de la frase (D23) -----------------------------------


def continue_scene(prev: dict | None, prev_caption: str | None, scene: dict | None) -> dict | None:
    """Si el tramo anterior está cortado, la escena conserva su fondo y partículas y sale de donde acabó.

    Pura: devuelve una copia y no toca ni ``prev`` ni ``scene``. Con ``prev``/``scene``/``prev_caption``
    en ``None`` (o el anterior sin cortar) devuelve ``scene`` tal cual.
    """
    if scene is None or prev is None or prev_caption is None or not is_cut(prev_caption):
        return scene
    out = copy.deepcopy(scene)
    out["backdrop"] = prev["backdrop"]
    if "particles" in prev:
        out["particles"] = copy.deepcopy(prev["particles"])
    else:
        out.pop("particles", None)
    start = prev["hero"]["to"]
    hero = out["hero"]
    hero["from"] = start
    if hero["action"] not in TRAVEL:
        hero["to"] = start
    return out


# --- la llamada --------------------------------------------------------------


def _user_message(question: str, beats: list[tuple[str, str]]) -> str:
    # D23: un tramo cuyo anterior está cortado continúa su frase.
    lines = "\n".join(
        f"{i}. [{emotion}]{' (continues)' if i > 1 and is_cut(beats[i - 2][0]) else ''} {caption}"
        for i, (caption, emotion) in enumerate(beats, 1)
    )
    return (
        f'The mortal asked: "{question}"\n'
        f"klothulhu's reply, in beats (in order):\n{lines}\n"
        f"Stage exactly {len(beats)} scenes, one per beat, in order."
    )


class _SceneSplitter:
    """Saca del JSON en streaming cada objeto de ``scenes`` en cuanto se cierra (D19).

    Sigue la profundidad de ``{``/``[`` y si está dentro de una cadena (con sus escapes): las llaves y
    comillas dentro de una cadena no cuentan. ``{"scenes": [ {…}, {…} ]}``: cada escena es el objeto
    que se abre y se cierra a profundidad 3.
    """

    def __init__(self) -> None:
        self.depth = 0
        self.in_str = False
        self.escaped = False
        self.buf: list[str] | None = None

    def feed(self, chunk: str) -> list[str]:
        done: list[str] = []
        for ch in chunk:
            if not self.in_str and ch in "{[":
                self.depth += 1
                if self.depth == 3 and ch == "{":
                    self.buf = []
            if self.buf is not None:
                self.buf.append(ch)
            if self.in_str:
                if self.escaped:
                    self.escaped = False
                elif ch == "\\":
                    self.escaped = True
                elif ch == '"':
                    self.in_str = False
            elif ch == '"':
                self.in_str = True
            elif ch in "}]":
                if ch == "}" and self.depth == 3 and self.buf is not None:
                    done.append("".join(self.buf))
                    self.buf = None
                self.depth -= 1
        return done


def _scene_from_json(raw: str, caption: str, vocab: dict) -> dict | None:
    try:
        return build_scene(json.loads(raw), caption, vocab)
    except ValueError:
        return None


async def direct(
    question, beats, *, client, vocab, model, effort, timeout, thinking=True
) -> AsyncIterator[dict | None]:
    """Suelta exactamente ``len(beats)`` elementos (escena o None), en orden y en cuanto cada uno está listo.

    Nunca lanza: lo que falte, por error, ``refusal``, ``max_tokens`` o plazo agotado, sale como None (D19).
    """
    total = len(beats)
    emitted = 0
    started = time.monotonic()
    first_ms = None
    usage = None
    try:
        kwargs = {
            "model": model,
            "max_tokens": 4096,
            "system": [
                {"type": "text", "text": system_prompt(vocab), "cache_control": {"type": "ephemeral"}}
            ],
            "messages": [{"role": "user", "content": _user_message(question, beats)}],
            "output_config": {
                "effort": effort,
                "format": {"type": "json_schema", "schema": output_schema(vocab)},
            },
        }
        if not thinking:
            kwargs["thinking"] = {"type": "disabled"}
        splitter = _SceneSplitter()
        # Un solo plazo para todo, pero ningún ``yield`` dentro de un ``timeout``: si venciera con el
        # consumidor ocupado, asyncio cancelaría al consumidor y no al stream (PEP 789, H3-revision §2.1).
        deadline = asyncio.get_running_loop().time() + timeout
        manager = client.with_options(timeout=timeout, max_retries=1).messages.stream(**kwargs)
        async with asyncio.timeout_at(deadline):
            stream = await manager.__aenter__()
        try:
            chunks = stream.text_stream.__aiter__()
            while True:
                try:
                    async with asyncio.timeout_at(deadline):
                        chunk = await chunks.__anext__()
                except StopAsyncIteration:
                    break
                for raw in splitter.feed(chunk):
                    if emitted >= total:
                        continue
                    scene = _scene_from_json(raw, beats[emitted][0], vocab)
                    emitted += 1
                    if first_ms is None:
                        first_ms = (time.monotonic() - started) * 1000
                    yield scene
            async with asyncio.timeout_at(deadline):
                final = await stream.get_final_message()
        finally:
            async with asyncio.timeout(2):  # cerrar el stream no puede colgar la respuesta
                await manager.__aexit__(None, None, None)
        usage = getattr(final, "usage", None)
        if final.stop_reason != "end_turn":
            log.warning("director: stop_reason=%s", final.stop_reason)
        elif emitted < total:
            log.warning(
                "director: end_turn con %d escenas para %d golpes; faltan %d", emitted, total, total - emitted
            )
    except Exception as exc:  # noqa: BLE001 - el director nunca rompe la respuesta
        log.warning("director: fallo (%s: %s)", type(exc).__name__, exc or "sin detalle")
    nulls_late = total - emitted
    log.info(
        "director: model=%s thinking=%s first_ms=%s ms=%d in=%s out=%s cache_read=%s missing=%d/%d",
        model,
        thinking,
        None if first_ms is None else round(first_ms),
        (time.monotonic() - started) * 1000,
        getattr(usage, "input_tokens", 0),
        getattr(usage, "output_tokens", 0),
        getattr(usage, "cache_read_input_tokens", 0),
        nulls_late,
        total,
    )
    for _ in range(nulls_late):
        yield None


# --- modo de pruebas ----------------------------------------------------------

_FAKE_STAGINGS = [
    {"backdrop": "space", "hero": {"action": "fly", "from": 10, "to": 60, "then": "point"},
     "particles": {"kind": "stars", "density": 0.4}, "props": [], "tone": "work"},
    {"backdrop": "forest", "hero": {"action": "jump", "from": 30, "to": 60, "then": "celebrate"},
     "particles": None, "props": [], "tone": "milestone"},
    {"backdrop": "night", "hero": {"action": "sleep", "from": 50, "to": 50, "then": None},
     "particles": {"kind": "stars", "density": 0.3}, "props": [], "tone": "work"},
]


async def fake_direct(question, beats) -> AsyncIterator[dict | None]:
    """Escenas válidas y deterministas, sin API (KLOTHULHU_FAKE=1)."""
    vocab = load_vocab()
    for i, (caption, _) in enumerate(beats):
        yield build_scene(_FAKE_STAGINGS[i % len(_FAKE_STAGINGS)], caption, vocab)
