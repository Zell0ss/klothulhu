"""Pruebas de regresión de la fase 2 (H3-revision §5, R2): un golpe que falta se ve en el registro."""
import asyncio
import json
import logging
from pathlib import Path
from types import SimpleNamespace

import director

VOCAB = director.load_vocab()
_CASES = Path(__file__).parent / "fixtures" / "director_cases.json"
STAGING = json.loads(_CASES.read_text(encoding="utf-8"))["cases"][0]["staging"]


class _Stream:
    def __init__(self, chunks, stop="end_turn"):
        self.chunks, self.stop = chunks, stop

    async def __aenter__(self):
        return self

    async def __aexit__(self, *exc):
        return False

    @property
    def text_stream(self):
        async def gen():
            for chunk in self.chunks:
                yield chunk

        return gen()

    async def get_final_message(self):
        return SimpleNamespace(stop_reason=self.stop, usage=None)


class _Client:
    def __init__(self, stream):
        self.messages = SimpleNamespace(stream=lambda **kw: stream)

    def with_options(self, **kwargs):
        return self


def _direct(stream, n):
    beats = [(f"Golpe {i}.", "neutral") for i in range(n)]

    async def run():
        gen = director.direct(
            "q", beats, client=_Client(stream), vocab=VOCAB, model="m", effort="low", timeout=5,
            thinking=False,
        )
        return [x async for x in gen]

    return asyncio.run(run())


def test_aviso_si_end_turn_con_menos_escenas(caplog):
    one = '{"scenes": [' + json.dumps(STAGING) + "]}"
    with caplog.at_level(logging.WARNING, logger="klothulhu.director"):
        out = _direct(_Stream([one]), 3)
    assert [s is not None for s in out] == [True, False, False]
    assert any("faltan 2" in r.getMessage() for r in caplog.records)


def test_sin_aviso_si_salen_todas(caplog):
    both = '{"scenes": [' + json.dumps(STAGING) + "," + json.dumps(STAGING) + "]}"
    with caplog.at_level(logging.WARNING, logger="klothulhu.director"):
        out = _direct(_Stream([both]), 2)
    assert all(s is not None for s in out)
    assert not caplog.records
