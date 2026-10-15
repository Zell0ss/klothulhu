"""Prueba normativa de la fase 2 (H3-revision §2.1, D19): el plazo del director no cancela a quien lo consume.
No editar: añadir en otro fichero."""
import asyncio
import json
from pathlib import Path
from types import SimpleNamespace

import director

VOCAB = director.load_vocab()
STAGING = json.loads((Path(__file__).parent / "fixtures" / "director_cases.json").read_text(encoding="utf-8"))[
    "cases"
][0]["staging"]


class _HangingStream:
    """Suelta la primera escena entera y después se queda colgado."""

    async def __aenter__(self):
        return self

    async def __aexit__(self, *exc):
        return False

    @property
    def text_stream(self):
        async def gen():
            yield '{"scenes": [' + json.dumps(STAGING) + ", "
            await asyncio.sleep(3600)

        return gen()

    async def get_final_message(self):
        return SimpleNamespace(stop_reason="end_turn", usage=None)


class _Messages:
    def stream(self, **kwargs):
        return _HangingStream()


class _Client:
    messages = _Messages()

    def with_options(self, **kwargs):
        return self


# N15 — el plazo vence mientras el consumidor está ocupado: ni lo cancela ni se pierde la primera escena
def test_n15_plazo_no_cancela_al_consumidor():
    async def consume():
        got = []
        gen = director.direct(
            "q", [("A.", "happy"), ("B.", "sleepy")], client=_Client(), vocab=VOCAB, model="claude-haiku-5-5",
            effort="low", timeout=0.2, thinking=False,
        )
        async for scene in gen:
            got.append(scene is not None)
            await asyncio.sleep(0.5)  # más que el plazo: como escribir en un socket lento
        return got

    assert asyncio.run(consume()) == [True, False]
