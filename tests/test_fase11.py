"""Pruebas normativas de la fase 11, H1 (docs/fase11/PLAN.md, D58, D59, D60).

No editar: añadir en otro fichero.
Se copia tal cual a tests/test_fase11.py. Gasto 0: nada llama a la API (el cliente de Anthropic se sustituye).
"""
import asyncio
import json
import logging
import os
from datetime import date
from types import SimpleNamespace

os.environ.setdefault("KLOTHULHU_TOKENS", "fase11test:" + "x" * 16)
os.environ["KLOTHULHU_FAKE"] = "1"

import app  # noqa: E402
import buscaweb  # noqa: E402

CONSULTA = "consulta-secreta-que-no-sale-en-los-logs"


# --- buscaweb.py: la herramienta, la cuota y lo que se lee del stream (D58) ---------------------------


def test_S1_herramienta():
    assert buscaweb.MAX_USES == 2 and buscaweb.TOPE_DIA == 30
    assert buscaweb.herramienta() == {
        "type": "web_search_20250305",
        "name": "web_search",
        "max_uses": 2,
        "user_location": {"type": "approximate", "country": "ES", "timezone": "Europe/Madrid"},
    }
    assert buscaweb.herramienta(1)["max_uses"] == 1


def test_S2_cuota_diaria():
    dia = [date(2026, 11, 20)]
    c = buscaweb.Cuota(3, hoy=lambda: dia[0])
    assert c.quedan() == 3 and buscaweb.permitidas(c) == 2  # nunca más de MAX_USES por mensaje
    c.anotar(2)
    assert c.quedan() == 1 and buscaweb.permitidas(c) == 1
    c.anotar(0)
    assert c.quedan() == 1
    c.anotar(5)  # el modelo puede pasarse de lo que quedaba: la cuota no baja de 0
    assert c.quedan() == 0 and buscaweb.permitidas(c) == 0
    dia[0] = date(2026, 11, 21)  # día nuevo, cuota nueva
    assert c.quedan() == 3
    assert buscaweb.permitidas(buscaweb.Cuota(0, hoy=lambda: dia[0])) == 0  # tope 0 = búsqueda apagada


def _ev(**d):
    return d


STREAM = [
    _ev(type="message_start", message={"id": "m"}),
    _ev(type="content_block_start", index=0, content_block={"type": "thinking", "thinking": ""}),
    _ev(type="content_block_delta", index=0, delta={"type": "thinking_delta", "thinking": "pienso"}),
    _ev(type="content_block_stop", index=0),
    _ev(type="content_block_start", index=1, content_block={"type": "text", "text": ""}),
    _ev(type="content_block_delta", index=1, delta={"type": "text_delta", "text": "[smug] Consulto"}),
    _ev(type="content_block_delta", index=1, delta={"type": "text_delta", "text": " los grimorios."}),
    _ev(type="content_block_stop", index=1),
    _ev(type="content_block_start", index=2,
        content_block={"type": "server_tool_use", "id": "s1", "name": "web_search", "input": {}}),
    _ev(type="content_block_delta", index=2,
        delta={"type": "input_json_delta", "partial_json": json.dumps({"query": CONSULTA})}),
    _ev(type="content_block_stop", index=2),
    _ev(type="content_block_start", index=3,
        content_block={"type": "web_search_tool_result", "tool_use_id": "s1", "content": []}),
    _ev(type="content_block_stop", index=3),
    _ev(type="content_block_start", index=4, content_block={"type": "text", "text": ""}),
    _ev(type="content_block_delta", index=4, delta={"type": "text_delta", "text": "[happy] Mañana llueve"}),
    _ev(type="content_block_stop", index=4),
    # Con citas, el modelo parte el texto en bloques a mitad de frase: aquí no se añade nada
    _ev(type="content_block_start", index=5, content_block={"type": "text", "text": ""}),
    _ev(type="content_block_delta", index=5, delta={"type": "citations_delta", "citation": {
        "type": "web_search_result_location", "url": "https://aemet.es/x", "title": "AEMET",
        "cited_text": "..."}}),
    _ev(type="content_block_delta", index=5, delta={"type": "text_delta", "text": ", mortal."}),
    _ev(type="content_block_stop", index=5),
    _ev(type="message_delta", delta={"stop_reason": "end_turn"}, usage={"output_tokens": 9}),
    _ev(type="message_stop"),
]


def test_S3_traductor():
    t = buscaweb.Traductor()
    out = [x for e in STREAM for x in t.feed(e)]
    textos = [x for x in out if isinstance(x, str)]
    assert "".join(textos) == "[smug] Consulto los grimorios. [happy] Mañana llueve, mortal."
    assert out.count(buscaweb.BUSCANDO) == 1
    assert out.index(buscaweb.BUSCANDO) > out.index("[smug] Consulto")  # en su sitio del stream
    assert CONSULTA not in "".join(textos) and "pienso" not in "".join(textos)
    assert buscaweb.Traductor().feed({"type": "ping"}) == []  # lo desconocido se ignora


def test_S4_separador_solo_tras_buscar():
    t = buscaweb.Traductor()
    evs = [
        _ev(type="content_block_start", index=0, content_block={"type": "text", "text": ""}),
        _ev(type="content_block_delta", index=0, delta={"type": "text_delta", "text": "[happy] Busco "}),
        _ev(type="content_block_start", index=1,
            content_block={"type": "server_tool_use", "id": "s1", "name": "web_search", "input": {}}),
        _ev(type="content_block_start", index=2,
            content_block={"type": "web_search_tool_result", "tool_use_id": "s1", "content": []}),
        _ev(type="content_block_start", index=3, content_block={"type": "text", "text": ""}),
        _ev(type="content_block_delta", index=3, delta={"type": "text_delta", "text": "y encuentro."}),
    ]
    out = [x for e in evs for x in t.feed(e)]
    assert "".join(x for x in out if isinstance(x, str)) == "[happy] Busco y encuentro."  # sin doble espacio


def _bloque_texto(texto, citas=None):
    return {"type": "text", "text": texto, "citations": citas}


def _cita(url, title="T"):
    return {"type": "web_search_result_location", "url": url, "title": title, "cited_text": "...",
            "encrypted_index": "zzz"}


def test_S5_fuentes():
    content = [
        _bloque_texto("[smug] Miro."),
        {"type": "server_tool_use", "id": "s1", "name": "web_search", "input": {"query": CONSULTA}},
        {"type": "web_search_tool_result", "tool_use_id": "s1", "content": [
            {"type": "web_search_result", "url": "https://no-citada.es/", "title": "No citada",
             "encrypted_content": "x"}]},
        _bloque_texto("Llueve", [_cita("https://aemet.es/x", "AEMET"), _cita("https://aemet.es/x", "AEMET")]),
        _bloque_texto(", dice", [_cita("javascript:alert(1)", "mal"), _cita("http://www.eltiempo.es/m", "")]),
    ]
    assert buscaweb.fuentes(content) == [
        {"title": "AEMET", "url": "https://aemet.es/x"},
        {"title": "eltiempo.es", "url": "http://www.eltiempo.es/m"},  # sin título, el dominio sin www
    ]
    muchas = [_bloque_texto("x", [_cita(f"https://s{i}.org/", "t" * 200) for i in range(8)])]
    f = buscaweb.fuentes(muchas)
    assert len(f) == 5 and all(len(x["title"]) <= 80 for x in f)  # como mucho 5, títulos cortos
    assert buscaweb.fuentes([_bloque_texto("sin buscar")]) == []


# --- la respuesta con búsqueda (D59, D60) ------------------------------------------------------------


REPLY_A = "[smug] Consulto los grimorios. "
REPLY_B = "[happy] Mañana llueve, mortal."
FUENTES = [{"title": "AEMET", "url": "https://aemet.es/x"}]


def _run(monkeypatch, cid, items):
    seen = {"anotar": []}

    async def model_stream(cid_, content, system):
        for x in items:
            yield x

    async def fake_director(question, bs):
        for _ in bs:
            yield None

    async def sin_memoria(cid_, text_):
        return None

    monkeypatch.setattr(app, "FAKE", False)
    monkeypatch.setattr(app, "MEMORIA", True)
    monkeypatch.setattr(app, "_model_stream", model_stream)
    monkeypatch.setattr(app, "_director", fake_director)
    monkeypatch.setattr(app, "_preparar_memoria", sin_memoria)
    monkeypatch.setattr(app.sesiones, "anotar", lambda c, t, r: seen["anotar"].append(r))
    app.history.clear(cid)

    async def collect():
        return [x async for x in app._reply(cid, "¿Llueve mañana?", asyncio.Lock())]

    return asyncio.run(collect()), seen


def _eventos(out):
    return [x.split("\n", 1)[0].removeprefix("event: ") for x in out]


def test_S6_reply_con_busqueda(monkeypatch):
    out, seen = _run(monkeypatch, "fase11-s6",
                     [REPLY_A, buscaweb.BUSCANDO, REPLY_B, buscaweb.Fuentes(FUENTES)])
    ev = _eventos(out)
    assert ev[0] == "emotion" and ev[-1] == "done" and "error" not in ev
    assert ev.count("searching") == 1 and ev.count("sources") == 1
    assert ev.index("searching") > ev.index("delta")  # el aviso llega cuando el modelo se pone a buscar
    assert ev.index("sources") < ev.index("scene") < ev.index("done")  # tras el texto, antes de escenas
    sources = json.loads(out[ev.index("sources")].split("data: ", 1)[1])
    assert sources == {"items": FUENTES}
    # D59: el historial y la memoria larga guardan solo lo que klothulhu dijo, sin enlaces ni resultados
    assert app.history.messages("fase11-s6")[-1] == {"role": "assistant", "content": REPLY_A + REPLY_B}
    assert seen["anotar"] == [REPLY_A + REPLY_B]


def test_S7_reply_sin_busqueda(monkeypatch):
    out, _ = _run(monkeypatch, "fase11-s7", [REPLY_B])
    ev = _eventos(out)
    assert "searching" not in ev and "sources" not in ev and ev[-1] == "done"
    out, _ = _run(monkeypatch, "fase11-s7b", [REPLY_A, buscaweb.BUSCANDO, REPLY_B, buscaweb.Fuentes([])])
    assert "sources" not in _eventos(out)  # buscó, pero no citó nada: no hay evento vacío


# --- el narrador de verdad, con el cliente de Anthropic sustituido (D58) -----------------------------


class _Obj:
    def __init__(self, d):
        self._d = d
        self.type = d["type"]

    def model_dump(self, **_kw):
        return self._d


class _Stream:
    def __init__(self, events, final):
        self._events, self._final = events, final

    async def __aenter__(self):
        return self

    async def __aexit__(self, *a):
        return False

    def __aiter__(self):
        async def gen():
            for e in self._events:
                yield _Obj(e)
        return gen()

    async def get_final_message(self):
        return self._final


def _final(busquedas):
    content = [_bloque_texto("[smug] Consulto los grimorios."),
               {"type": "server_tool_use", "id": "s1", "name": "web_search", "input": {"query": CONSULTA}},
               {"type": "web_search_tool_result", "tool_use_id": "s1", "content": []},
               _bloque_texto("[happy] Mañana llueve", [_cita("https://aemet.es/x", "AEMET")]),
               _bloque_texto(", mortal.")]
    return SimpleNamespace(
        content=[_Obj(b) for b in content], stop_reason="end_turn",
        usage=SimpleNamespace(input_tokens=100, output_tokens=20, cache_read_input_tokens=0,
                              server_tool_use=SimpleNamespace(web_search_requests=busquedas)))


def _narrar(monkeypatch, cuota, caplog):
    seen = {}

    def stream(**kw):
        seen.update(kw)
        return _Stream(STREAM, _final(1))

    monkeypatch.setattr(app, "_anthropic", SimpleNamespace(messages=SimpleNamespace(stream=stream)))
    monkeypatch.setattr(app, "_cuota", cuota)
    app.history.clear("fase11-s8")
    caplog.set_level(logging.DEBUG)

    async def collect():
        return [x async for x in app._model_stream("fase11-s8", "¿Llueve mañana?", app.SYSTEM_PROMPT)]

    return asyncio.run(collect()), seen


def test_S8_model_stream_con_cuota(monkeypatch, caplog):
    cuota = buscaweb.Cuota(30)
    out, kw = _narrar(monkeypatch, cuota, caplog)
    assert kw["tools"] == [buscaweb.herramienta(2)]
    texto = "".join(x for x in out if isinstance(x, str))
    assert texto == "[smug] Consulto los grimorios. [happy] Mañana llueve, mortal."
    assert buscaweb.BUSCANDO in out
    assert isinstance(out[-1], buscaweb.Fuentes)
    assert out[-1].items == [{"title": "AEMET", "url": "https://aemet.es/x"}]
    assert cuota.quedan() == 29  # se anota lo que dice usage.server_tool_use
    assert CONSULTA not in caplog.text  # D59: la consulta nunca va a los logs (D42)


def test_S9_model_stream_sin_cuota(monkeypatch, caplog):
    cuota = buscaweb.Cuota(0)
    _, kw = _narrar(monkeypatch, cuota, caplog)
    assert "tools" not in kw  # sin cuota, el narrador no tiene la herramienta
    assert buscaweb.AGOTADA in json.dumps(kw["system"], ensure_ascii=False)  # y sabe por qué


def test_S10_fake_busca(monkeypatch):
    monkeypatch.setattr(app, "FAKE", True)
    monkeypatch.setattr(app, "DIRECTOR_ENABLED", False)
    monkeypatch.setattr(app, "MEMORIA", False)

    async def collect(text):
        app.history.clear("fase11-s10")
        return [x async for x in app._reply("fase11-s10", text, asyncio.Lock())]

    ev = _eventos(asyncio.run(collect("Busca el tiempo de mañana")))
    assert "searching" in ev and "sources" in ev and ev[-1] == "done"
    ev = _eventos(asyncio.run(collect("hola")))
    assert "searching" not in ev and "sources" not in ev
