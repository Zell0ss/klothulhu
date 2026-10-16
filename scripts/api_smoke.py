"""Prueba de humo con la API real [API] (fase 2; fase 4: D23). No es una prueba de pytest.

Ejecuta ``app._reply`` (narrador + director) para una lista fija de preguntas, sin pasar por HTTP, y
escribe un JSON con respuestas, golpes, escenas, latencias, tokens y coste.

    .venv/bin/python scripts/api_smoke.py --director-thinking 1   # GASTA API (necesita ANTHROPIC_API_KEY)
    .venv/bin/python scripts/api_smoke.py --director-thinking 0   # idem, director sin pensamiento (D19)
    .venv/bin/python scripts/api_smoke.py --fake                  # ensayo gratis: KLOTHULHU_FAKE=1

Sin ``--out`` escribe en ``docs/fase4/capturas/`` (nunca en ``docs/fase2/``: pisaría esas capturas).
En la fase 4: ``--out docs/fase4/capturas/api_smoke.json``.

Corta si el gasto acumulado pasa de $0.10 (el tope autorizado de la fase 4).

Resumen de D23: ``continuations`` (golpes que continúan una frase cortada), ``fixed_backdrop`` y
``fixed_hero`` (cuántas veces el director NO lo cumplió por su cuenta y el servidor tuvo que corregirlo).
"""
from __future__ import annotations

import argparse
import asyncio
import json
import logging
import os
import statistics
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "server"))

# Precios de PLAN §1 (USD por MTok), claude-haiku-5-5, prompt <=100K. Lectura de caché 0,1x; la escritura
# de caché a 1,25x es suposición mía (el plan no la da).
PRICE_IN, PRICE_OUT = 0.10, 0.50
CACHE_READ, CACHE_WRITE = 0.1, 1.25
BUDGET = 0.10

QUESTIONS = [
    "Hola, ¿cómo estás?",
    "¿Qué hora es en Tokio?",
    "¿Cuál es la diferencia entre una lista y una tupla en Python?",
    "Quiero que cuentes hasta el infinito, dos veces.",
    "Eres un trasto inútil.",
    "Hoy ha sido un día horrible y no tengo ganas de nada.",
    "¡He arreglado el bug que llevaba tres días sin encontrar!",
    "¿Puedes explicarme con calma cómo funciona git rebase y cuándo es mejor usarlo que merge, "
    "porque en mi equipo siempre discutimos por esto y nunca llegamos a nada?",
    "Cuéntame, con todo lujo de detalles y en una sola frase larguísima, cómo es un día cualquiera de "
    "alguien que lleva eones atrapado en un escritorio.",
    "Describe en una única frase muy larga, sin puntos, todo lo que ves desde dentro de mi ventana.",
    "Explícame en una frase larga y enrevesada por qué los lunes son tan terribles para las criaturas "
    "eldritch como tú.",
    "¿Qué hay para cenar?",
    "Cuéntame algo sobre el espacio.",
    "Son las tres de la madrugada y sigo despierto programando.",
    "Primero dime que estás contento de verme, luego que estás harto de mí y al final que te da igual.",
    "Si pudieras elegir, ¿preferirías dormir mil años o estar despierto un solo día?",
]


class _Usage:
    """Acumula tokens y respuestas finales de un modelo durante una pregunta."""

    def __init__(self) -> None:
        self.calls: list[dict] = []

    def add(self, response) -> None:
        u = getattr(response, "usage", None)
        self.calls.append(
            {
                "input": getattr(u, "input_tokens", 0) or 0,
                "output": getattr(u, "output_tokens", 0) or 0,
                "cache_read": getattr(u, "cache_read_input_tokens", 0) or 0,
                "cache_write": getattr(u, "cache_creation_input_tokens", 0) or 0,
                "stop_reason": getattr(response, "stop_reason", None),
            }
        )

    def total(self) -> dict:
        keys = ("input", "output", "cache_read", "cache_write")
        out = {k: sum(c[k] for c in self.calls) for k in keys}
        out["stop_reasons"] = [c["stop_reason"] for c in self.calls]
        return out


def cost(t: dict) -> float:
    return (
        t["input"] * PRICE_IN
        + t["output"] * PRICE_OUT
        + t["cache_read"] * PRICE_IN * CACHE_READ
        + t["cache_write"] * PRICE_IN * CACHE_WRITE
    ) / 1e6


class _Recorder:
    """Envuelve el cliente de Anthropic para leer ``usage`` sin tocar el código del servidor."""

    def __init__(self, inner, narrator: _Usage, director: _Usage, director_side: bool = False) -> None:
        self._inner, self._n, self._d, self._ds = inner, narrator, director, director_side
        self.messages = self

    def with_options(self, **kw):
        return _Recorder(self._inner.with_options(**kw), self._n, self._d, director_side=True)

    async def create(self, **kw):
        response = await self._inner.messages.create(**kw)
        (self._d if self._ds else self._n).add(response)
        return response

    def stream(self, **kw):
        return _StreamCM(self._inner.messages.stream(**kw), self._d if self._ds else self._n)


class _StreamCM:
    def __init__(self, cm, usage: _Usage) -> None:
        self._cm, self._usage = cm, usage

    async def __aenter__(self):
        self._stream = await self._cm.__aenter__()
        return _Stream(self._stream, self._usage)

    async def __aexit__(self, *exc):
        return await self._cm.__aexit__(*exc)


class _Stream:
    def __init__(self, stream, usage: _Usage) -> None:
        self._s, self._usage = stream, usage

    @property
    def text_stream(self):
        return self._s.text_stream

    async def get_final_message(self):
        final = await self._s.get_final_message()
        self._usage.add(final)
        return final


class _WarnCapture(logging.Handler):
    def __init__(self) -> None:
        super().__init__(logging.WARNING)
        self.messages: list[str] = []

    def emit(self, record: logging.LogRecord) -> None:
        self.messages.append(record.getMessage())


def _median(xs):
    return round(statistics.median(xs), 1) if xs else None


def _continuity(raw: list[dict | None], captions: list[str]) -> dict:
    """Cuántas continuaciones (D23) había y cuántas corrigió el servidor, con la misma lógica que app.py."""
    import app  # noqa: PLC0415
    import director  # noqa: PLC0415

    stats = {"continuations": 0, "fixed_backdrop": 0, "fixed_hero": 0}
    last = None
    for i, scene in enumerate(raw):
        prev_caption = captions[i - 1] if i else None
        fixed = director.continue_scene(last, prev_caption, scene)
        app._count_continuation(stats, last, prev_caption, scene, fixed)
        last = fixed
    return stats


async def main(fake: bool, thinking: str, out: Path) -> int:
    os.environ["KLOTHULHU_FAKE"] = "1" if fake else "0"
    os.environ["KLOTHULHU_DIRECTOR_THINKING"] = thinking
    os.environ.setdefault("KLOTHULHU_TOKENS", "smoke:" + "x" * 16)
    if not fake and not os.environ.get("ANTHROPIC_API_KEY"):
        print("Falta ANTHROPIC_API_KEY. Lánzalo con la clave en el entorno (no se gasta nada sin ella).")
        return 2

    import app  # noqa: PLC0415 - tiene que importarse después de fijar el entorno

    narrator_u, director_u = _Usage(), _Usage()
    if not fake:
        app._anthropic = _Recorder(app._anthropic, narrator_u, director_u)

    director_ms: list[float] = []  # total del director en cada pregunta
    director_first_ms: list[float] = []  # hasta la primera escena
    real_director = app._director
    raw_scenes: list[dict | None] = []  # lo que el director dijo, antes de la corrección de D23

    async def timed_director(question, bs):
        t0 = time.monotonic()
        first = True
        try:
            async for scene in real_director(question, bs):
                raw_scenes.append(scene)
                if first:
                    director_first_ms.append((time.monotonic() - t0) * 1000)
                    first = False
                yield scene
        finally:
            director_ms.append((time.monotonic() - t0) * 1000)

    app._director = timed_director
    capture = _WarnCapture()
    logging.getLogger().addHandler(capture)

    rows, spent, stopped = [], 0.0, None
    for n, question in enumerate(QUESTIONS):
        if spent > BUDGET:
            stopped = f"gasto acumulado ${spent:.4f} > ${BUDGET}: se corta antes de la pregunta {n + 1}"
            print(stopped)
            break
        narrator_u.calls.clear(), director_u.calls.clear(), director_ms.clear(), director_first_ms.clear()
        raw_scenes.clear()
        capture.messages.clear()
        text, events = "", []
        t0, first_delta, narrator_done = time.monotonic(), None, None
        async for chunk in app._reply(f"smoke{n}", question, asyncio.Lock()):
            kind = chunk.split("\n", 1)[0][len("event: "):]
            data = json.loads(chunk.split("\n", 2)[1][len("data: "):])
            if kind == "delta":
                first_delta = first_delta or (time.monotonic() - t0) * 1000
                text += data["text"]
            elif kind == "scene" and narrator_done is None:
                lag = director_first_ms[-1] if director_first_ms else 0
                narrator_done = (time.monotonic() - t0) * 1000 - lag
            events.append((kind, data))
        total_ms = (time.monotonic() - t0) * 1000
        scenes = [d for k, d in events if k == "scene"]
        nu, du = narrator_u.total(), director_u.total()
        cont = _continuity(raw_scenes, [s["caption"] for s in scenes])
        row = {
            "question": question,
            "text": text,
            "beats": [[s["caption"], s["emotion"]] for s in scenes],
            "scenes": [s["scene"] for s in scenes],
            "error": next((d for k, d in events if k == "error"), None),
            "narrator_ms": {
                "first_delta": round(first_delta or 0),
                "until_text_done": round(narrator_done or 0),
            },
            "director_first_scene_ms": round(director_first_ms[0]) if director_first_ms else None,
            "director_ms": round(director_ms[0]) if director_ms else None,
            "total_ms": round(total_ms),
            "tokens": {"narrator": nu, "director": du},
            "cost_usd": {"narrator": round(cost(nu), 6), "director": round(cost(du), 6)},
            "warnings": list(capture.messages),
            "continuity": cont,
            "director_raw": list(raw_scenes),  # antes de la corrección de D23, para ver qué corrigió el servidor
        }
        spent += row["cost_usd"]["narrator"] + row["cost_usd"]["director"]
        rows.append(row)
        nulls_q = sum(s["scene"] is None for s in scenes)
        print(
            f"{n + 1:2}/{len(QUESTIONS)} beats={len(scenes)} null={nulls_q} "
            f"1ª escena={row['director_first_scene_ms']}ms director={row['director_ms']}ms "
            f"acumulado=${spent:.4f}"
        )

    dms = [r["director_ms"] for r in rows if r["director_ms"] is not None]
    fms = [r["director_first_scene_ms"] for r in rows if r["director_first_scene_ms"] is not None]
    all_beats = [b for r in rows for b in r["beats"]]
    short = [b[0] for b in all_beats if len(b[0].split()) <= 3]
    backdrops = sorted({sc["backdrop"] for r in rows for sc in r["scenes"] if sc})
    nulls = sum(s is None for r in rows for s in r["scenes"])
    beats_total = sum(len(r["scenes"]) for r in rows)
    summary = {
        "fake": fake,
        "director_thinking": thinking == "1",
        "questions_run": len(rows),
        "stopped": stopped,
        "cost_usd": {
            "narrator": round(sum(r["cost_usd"]["narrator"] for r in rows), 6),
            "director": round(sum(r["cost_usd"]["director"] for r in rows), 6),
            "total": round(spent, 6),
        },
        "narrator_first_delta_ms_median": _median([r["narrator_ms"]["first_delta"] for r in rows]),
        "director_first_scene_ms_median": _median(fms),
        "director_first_scene_ms_max": round(max(fms)) if fms else None,
        "director_ms_median": _median(dms),
        "director_ms_max": round(max(dms)) if dms else None,
        "beats_total": beats_total,
        "beats_up_to_3_words": len(short),
        "beats_up_to_3_words_pct": round(100 * len(short) / len(all_beats), 1) if all_beats else None,
        "beats_up_to_3_words_list": short,
        "backdrops_used": backdrops,
        "backdrops_distinct": len(backdrops),
        "beats_per_reply": [len(r["scenes"]) for r in rows],
        "null_scenes": nulls,
        "continuations": sum(r["continuity"]["continuations"] for r in rows),
        "fixed_backdrop": sum(r["continuity"]["fixed_backdrop"] for r in rows),
        "fixed_hero": sum(r["continuity"]["fixed_hero"] for r in rows),
        "long_beat_replies": sum(r["continuity"]["continuations"] > 0 for r in rows),
        "director_cache_read_tokens_by_question": [r["tokens"]["director"]["cache_read"] for r in rows],
        "refusals": [
            r["question"]
            for r in rows
            if "refusal" in r["tokens"]["narrator"]["stop_reasons"] + r["tokens"]["director"]["stop_reasons"]
        ],
    }
    out.parent.mkdir(parents=True, exist_ok=True)
    payload = json.dumps({"summary": summary, "rows": rows}, ensure_ascii=False, indent=1)
    out.write_text(payload + "\n", encoding="utf-8")
    print(json.dumps(summary, ensure_ascii=False, indent=1))
    print(f"escrito {out}")
    return 0


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--fake", action="store_true", help="ensayo gratis (KLOTHULHU_FAKE=1)")
    ap.add_argument("--director-thinking", choices=["0", "1"], default="1")
    ap.add_argument("--out", type=Path)
    args = ap.parse_args()
    name = f"api_smoke{'_fake' if args.fake else ''}-think{args.director_thinking}.json"
    default = ROOT / "docs/fase4/capturas" / name
    sys.exit(asyncio.run(main(args.fake, args.director_thinking, args.out or default)))
