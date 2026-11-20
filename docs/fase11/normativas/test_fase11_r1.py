"""Pruebas normativas del retoque R1 de la fase 11 (docs/fase11/H1-revision.md §5, D61).

No editar: añadir en otro fichero. Se copia tal cual a tests/test_fase11_r1.py. Gasto 0: nada llama a la API.
"""
import asyncio
import json
import os
from types import SimpleNamespace

os.environ.setdefault("KLOTHULHU_TOKENS", "fase11test:" + "x" * 16)
os.environ["KLOTHULHU_FAKE"] = "1"

import app  # noqa: E402
import buscaweb  # noqa: E402


def _texto(t, citas=None):
    return {"type": "text", "text": t, "citations": citas}


def _resultado(url, title):
    return {"type": "web_search_result", "url": url, "title": title, "encrypted_content": "x",
            "page_age": None}


def _busqueda(resultados):
    return [{"type": "server_tool_use", "id": "s1", "name": "web_search", "input": {"query": "q"}},
            {"type": "web_search_tool_result", "tool_use_id": "s1", "content": resultados}]


RESULTADOS = [
    _resultado("https://a.es/", "A"),
    _resultado("javascript:alert(1)", "mal"),
    _resultado("https://a.es/", "A otra vez"),
    _resultado("http://www.b.org/", ""),
    _resultado("https://c.com/", "C"),
    _resultado("https://d.com/", "D"),
]


def test_R1_consultadas_si_no_cita():
    content = [_texto("[smug] Consulto."), *_busqueda(RESULTADOS), _texto("[happy] Lloverá.")]
    f = buscaweb.fuentes_de(content)
    assert buscaweb.MAX_CONSULTADAS == 3
    assert isinstance(f, buscaweb.Fuentes) and f.tipo == "consultadas"
    assert f.items == [  # los primeros resultados, con las mismas reglas que las citas
        {"title": "A", "url": "https://a.es/"},
        {"title": "b.org", "url": "http://www.b.org/"},
        {"title": "C", "url": "https://c.com/"},
    ]


def test_R2_las_citas_mandan():
    cita = {"type": "web_search_result_location", "url": "https://d.com/", "title": "D", "cited_text": "..."}
    content = [*_busqueda(RESULTADOS), _texto("Lloverá", [cita])]
    f = buscaweb.fuentes_de(content)
    assert f.tipo == "citadas" and f.items == buscaweb.fuentes(content) == [{"title": "D", "url": "https://d.com/"}]
    assert buscaweb.Fuentes([]).tipo == "citadas"  # el valor por defecto: lo de la fase 11 sigue igual


def test_R3_sin_resultados():
    assert buscaweb.fuentes_de([_texto("sin buscar")]).items == []
    error = [{"type": "server_tool_use", "id": "s1", "name": "web_search", "input": {}},
             {"type": "web_search_tool_result", "tool_use_id": "s1",
              "content": {"type": "web_search_tool_result_error", "error_code": "unavailable"}}]
    assert buscaweb.fuentes_de([*error, _texto("No pude.")]).items == []
    assert buscaweb.fuentes_de([*_busqueda([]), _texto("Nada.")]).items == []


def _eventos(out):
    return [x.split("\n", 1)[0].removeprefix("event: ") for x in out]


def _run(monkeypatch, cid, fuentes):
    async def model_stream(cid_, content, system):
        yield "[smug] Consulto. "
        yield buscaweb.BUSCANDO
        yield "[happy] Lloverá."
        yield fuentes

    async def fake_director(question, bs):
        for _ in bs:
            yield None

    monkeypatch.setattr(app, "FAKE", False)
    monkeypatch.setattr(app, "MEMORIA", False)
    monkeypatch.setattr(app, "_model_stream", model_stream)
    monkeypatch.setattr(app, "_director", fake_director)
    app.history.clear(cid)

    async def collect():
        return [x async for x in app._reply(cid, "¿Llueve?", asyncio.Lock())]

    out = asyncio.run(collect())
    ev = _eventos(out)
    return json.loads(out[ev.index("sources")].split("data: ", 1)[1])


def test_R4_sse_kind(monkeypatch):
    items = [{"title": "A", "url": "https://a.es/"}]
    assert _run(monkeypatch, "fase11-r4", buscaweb.Fuentes(items, "consultadas")) == {
        "items": items, "kind": "consultadas"}
    assert _run(monkeypatch, "fase11-r4b", buscaweb.Fuentes(items)) == {"items": items}  # citadas: como en S6


class _Obj:
    def __init__(self, d):
        self._d = d
        self.type = d["type"]

    def model_dump(self, **_kw):
        return self._d


class _Stream:
    def __init__(self, final):
        self._final = final

    async def __aenter__(self):
        return self

    async def __aexit__(self, *a):
        return False

    def __aiter__(self):
        async def gen():
            for e in ():
                yield e
        return gen()

    async def get_final_message(self):
        return self._final


def test_R5_model_stream_usa_fuentes_de(monkeypatch):
    content = [_texto("[smug] Consulto."), *_busqueda(RESULTADOS), _texto("[happy] Lloverá.")]
    final = SimpleNamespace(
        content=[_Obj(b) for b in content], stop_reason="end_turn",
        usage=SimpleNamespace(input_tokens=1, output_tokens=1,
                              server_tool_use=SimpleNamespace(web_search_requests=1)))
    monkeypatch.setattr(app, "_anthropic",
                        SimpleNamespace(messages=SimpleNamespace(stream=lambda **kw: _Stream(final))))
    monkeypatch.setattr(app, "_cuota", buscaweb.Cuota(30))
    app.history.clear("fase11-r5")

    async def collect():
        return [x async for x in app._model_stream("fase11-r5", "¿Llueve?", app.SYSTEM_PROMPT)]

    ultimo = asyncio.run(collect())[-1]
    assert isinstance(ultimo, buscaweb.Fuentes) and ultimo.tipo == "consultadas" and len(ultimo.items) == 3
