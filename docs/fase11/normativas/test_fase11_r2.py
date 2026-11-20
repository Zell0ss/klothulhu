"""Pruebas normativas del retoque R2 de la fase 11 (docs/fase11/H1-revision.md §7, D62).

No editar: añadir en otro fichero. Se copia tal cual a tests/test_fase11_r2.py. Gasto 0: nada llama a la API.
"""
import asyncio
import logging
import os
from types import SimpleNamespace

os.environ.setdefault("KLOTHULHU_TOKENS", "fase11test:" + "x" * 16)
os.environ["KLOTHULHU_FAKE"] = "1"

import app  # noqa: E402
import buscaweb  # noqa: E402


def _resultado(url, title):
    return {"type": "web_search_result", "url": url, "title": title, "encrypted_content": "x",
            "page_age": None}


def test_R6_consultadas_una_por_dominio():
    content = [
        {"type": "server_tool_use", "id": "s1", "name": "web_search", "input": {"query": "q"}},
        {"type": "web_search_tool_result", "tool_use_id": "s1", "content": [
            _resultado("https://www.weather.com/es/gijon", "Gijón"),
            _resultado("https://weather.com/es/gijon/10dias", "Gijón 10 días"),
            _resultado("https://tiempo.com/gijon", "Tiempo Gijón"),
            _resultado("https://www.aemet.es/gijon", "AEMET"),
        ]},
        {"type": "text", "text": "Lloverá.", "citations": None},
    ]
    f = buscaweb.fuentes_de(content)
    assert f.tipo == "consultadas"
    assert [x["url"] for x in f.items] == [  # el cliente enseña el dominio: dos iguales no dicen nada
        "https://www.weather.com/es/gijon", "https://tiempo.com/gijon", "https://www.aemet.es/gijon"]


class _Stream:
    def __init__(self, final, textos=()):
        self._final = final
        self._textos = textos

    async def __aenter__(self):
        return self

    async def __aexit__(self, *a):
        return False

    def __aiter__(self):
        async def gen():
            for t in self._textos:
                yield SimpleNamespace(model_dump=lambda t=t: {
                    "type": "content_block_delta", "index": 0, "delta": {"type": "text_delta", "text": t}})
        return gen()

    async def get_final_message(self):
        return self._final


def _final(stop_reason):
    return SimpleNamespace(content=[], stop_reason=stop_reason,
                           usage=SimpleNamespace(input_tokens=1, output_tokens=1,
                                                 server_tool_use=SimpleNamespace(web_search_requests=1)))


def _narrar(monkeypatch, cid, stop_reason, cuota=30, textos=("[smug] Consulto los grimorios.",)):
    pedidos = []

    def stream(**kw):
        pedidos.append(kw)
        return _Stream(_final(stop_reason), textos)

    monkeypatch.setattr(app, "_anthropic", SimpleNamespace(messages=SimpleNamespace(stream=stream)))
    monkeypatch.setattr(app, "_cuota", buscaweb.Cuota(cuota))
    app.history.clear(cid)

    async def collect():
        return [x async for x in app._model_stream(cid, "¿Llueve en Gijón?", app.SYSTEM_PROMPT)]

    return asyncio.run(collect()), pedidos[0]


def test_R7_tope_de_tokens_con_herramienta(monkeypatch):
    assert app.MAX_TOKENS_BUSQUEDA > app.MAX_TOKENS
    _, kw = _narrar(monkeypatch, "fase11-r7", "end_turn")
    assert "tools" in kw and kw["max_tokens"] == app.MAX_TOKENS_BUSQUEDA
    _, kw = _narrar(monkeypatch, "fase11-r7b", "end_turn", cuota=0)
    assert "tools" not in kw and kw["max_tokens"] == app.MAX_TOKENS  # sin herramienta, como antes


def test_R8_cortada(monkeypatch, caplog):
    caplog.set_level(logging.INFO)
    for motivo in ("max_tokens", "pause_turn"):
        caplog.clear()
        out, _ = _narrar(monkeypatch, "fase11-r8-" + motivo, motivo)
        textos = [x for x in out if isinstance(x, str)]
        assert textos[-1] == buscaweb.CORTADA and isinstance(out[-1], buscaweb.Fuentes)
        assert motivo in caplog.text  # el motivo de parada va en la línea de log (solo números y el motivo)
    out, _ = _narrar(monkeypatch, "fase11-r8-ok", "end_turn")
    assert buscaweb.CORTADA not in out
    assert buscaweb.CORTADA.lstrip().startswith("[")  # empieza con su etiqueta de emoción
