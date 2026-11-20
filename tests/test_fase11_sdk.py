"""Fase 11, H1 (D58): el narrador con el SDK de verdad. Una respuesta SSE de la API, escrita a mano, entra por
un transporte de mentira (sin red, gasto 0) y sale por `app._model_stream`. Comprueba lo que las demás pruebas
dan por supuesto: que los eventos del SDK (incluidos los suyos, `text`, `citation`, `input_json`) se leen bien
con `event.model_dump()` y que `usage.server_tool_use` y `content[].citations` llegan donde se esperan."""
import asyncio
import json
import logging
import os

os.environ.setdefault("KLOTHULHU_TOKENS", "fase11sdk:" + "x" * 16)
os.environ["KLOTHULHU_FAKE"] = "1"

import httpx2  # noqa: E402  (el cliente HTTP del SDK 1.15)
from anthropic import AsyncAnthropic  # noqa: E402

import app  # noqa: E402
import buscaweb  # noqa: E402

CONSULTA = "consulta-secreta-del-sdk"
URL = "https://aemet.es/prediccion"


def _sse(eventos):
    return "".join(f"event: {e['type']}\ndata: {json.dumps(e)}\n\n" for e in eventos).encode()


def _respuesta():
    msg = {"id": "msg_1", "type": "message", "role": "assistant", "model": "claude-haiku-5-5", "content": [],
           "stop_reason": None, "stop_sequence": None,
           "usage": {"input_tokens": 120, "output_tokens": 1}}
    cita = {"type": "web_search_result_location", "url": URL, "title": "AEMET", "cited_text": "...",
            "encrypted_index": "zzz"}
    return [
        {"type": "message_start", "message": msg},
        {"type": "content_block_start", "index": 0, "content_block": {"type": "text", "text": ""}},
        {"type": "content_block_delta", "index": 0,
         "delta": {"type": "text_delta", "text": "[smug] Consulto los grimorios."}},
        {"type": "content_block_stop", "index": 0},
        {"type": "content_block_start", "index": 1, "content_block": {
            "type": "server_tool_use", "id": "srvtoolu_1", "name": "web_search", "input": {}}},
        {"type": "content_block_delta", "index": 1,
         "delta": {"type": "input_json_delta", "partial_json": json.dumps({"query": CONSULTA})}},
        {"type": "content_block_stop", "index": 1},
        {"type": "content_block_start", "index": 2, "content_block": {
            "type": "web_search_tool_result", "tool_use_id": "srvtoolu_1", "content": [
                {"type": "web_search_result", "url": URL, "title": "AEMET", "encrypted_content": "abc",
                 "page_age": None}]}},
        {"type": "content_block_stop", "index": 2},
        {"type": "content_block_start", "index": 3, "content_block": {"type": "text", "text": ""}},
        {"type": "content_block_delta", "index": 3,
         "delta": {"type": "text_delta", "text": "[happy] Mañana llueve"}},
        {"type": "content_block_stop", "index": 3},
        {"type": "content_block_start", "index": 4, "content_block": {"type": "text", "text": ""}},
        {"type": "content_block_delta", "index": 4, "delta": {"type": "citations_delta", "citation": cita}},
        {"type": "content_block_delta", "index": 4, "delta": {"type": "text_delta", "text": ", mortal."}},
        {"type": "content_block_stop", "index": 4},
        {"type": "message_delta", "delta": {"stop_reason": "end_turn", "stop_sequence": None},
         "usage": {"input_tokens": 120, "output_tokens": 40, "server_tool_use": {"web_search_requests": 1}}},
        {"type": "message_stop"},
    ]


def test_el_narrador_lee_la_respuesta_con_busqueda_del_sdk_real(monkeypatch, caplog):
    peticiones = []

    def responder(request):
        peticiones.append(json.loads(request.content))
        return httpx2.Response(200, content=_sse(_respuesta()), headers={"content-type": "text/event-stream"})

    cliente = AsyncAnthropic(api_key="x", max_retries=0,
                             http_client=httpx2.AsyncClient(transport=httpx2.MockTransport(responder)))
    cuota = buscaweb.Cuota(30)
    monkeypatch.setattr(app, "_anthropic", cliente)
    monkeypatch.setattr(app, "_cuota", cuota)
    app.history.clear("fase11-sdk")
    caplog.set_level(logging.DEBUG)

    async def collect():
        return [x async for x in app._model_stream("fase11-sdk", "¿Llueve mañana?", app.SYSTEM_PROMPT)]

    out = asyncio.run(collect())
    assert peticiones[0]["tools"] == [buscaweb.herramienta(2)]  # lo que de verdad viaja
    texto = "".join(x for x in out if isinstance(x, str))
    assert texto == "[smug] Consulto los grimorios. [happy] Mañana llueve, mortal."
    assert out.count(buscaweb.BUSCANDO) == 1
    assert isinstance(out[-1], buscaweb.Fuentes) and out[-1].items == [{"title": "AEMET", "url": URL}]
    assert cuota.quedan() == 29
    assert CONSULTA not in caplog.text and URL not in caplog.text


def test_sin_citas_el_sdk_real_deja_lo_consultado(monkeypatch, caplog):
    """R1 (D61): la misma respuesta sin citas: salen los resultados que leyó, como consultadas."""
    eventos = [e for e in _respuesta() if e.get("delta", {}).get("type") != "citations_delta"]
    cliente = AsyncAnthropic(api_key="x", max_retries=0, http_client=httpx2.AsyncClient(
        transport=httpx2.MockTransport(lambda r: httpx2.Response(
            200, content=_sse(eventos), headers={"content-type": "text/event-stream"}))))
    monkeypatch.setattr(app, "_anthropic", cliente)
    monkeypatch.setattr(app, "_cuota", buscaweb.Cuota(30))
    app.history.clear("fase11-sdk2")
    caplog.set_level(logging.DEBUG)

    async def collect():
        return [x async for x in app._model_stream("fase11-sdk2", "¿Llueve mañana?", app.SYSTEM_PROMPT)]

    ultimo = asyncio.run(collect())[-1]
    assert isinstance(ultimo, buscaweb.Fuentes) and ultimo.tipo == "consultadas"
    assert ultimo.items == [{"title": "AEMET", "url": URL}]
    assert CONSULTA not in caplog.text and URL not in caplog.text
