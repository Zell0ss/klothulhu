"""Pruebas del programador de la fase 11, H1 (D58, D59, D60). Las normativas están en test_fase11.py; estas
cubren lo que ellas no miran: pause_turn, un resultado de búsqueda con error, la cuota con el `system` de
memoria, el log sin URLs y la petición completa que llega al SDK."""
import asyncio
import logging
import os
from types import SimpleNamespace

os.environ.setdefault("KLOTHULHU_TOKENS", "fase11extra:" + "x" * 16)
os.environ["KLOTHULHU_FAKE"] = "1"

import app  # noqa: E402
import buscaweb  # noqa: E402
from test_fase11 import CONSULTA, STREAM, _bloque_texto, _cita, _Obj, _Stream  # noqa: E402

_UNA = SimpleNamespace(web_search_requests=1)


def _final(content, stop_reason="end_turn", servidor=_UNA):
    return SimpleNamespace(
        content=[_Obj(b) for b in content], stop_reason=stop_reason,
        usage=SimpleNamespace(input_tokens=100, output_tokens=20, cache_read_input_tokens=0,
                              server_tool_use=servidor))


def _narrar(monkeypatch, caplog, events, final, system=app.SYSTEM_PROMPT, cuota=None):
    seen = {}

    def stream(**kw):
        seen.update(kw)
        return _Stream(events, final)

    monkeypatch.setattr(app, "_anthropic", SimpleNamespace(messages=SimpleNamespace(stream=stream)))
    monkeypatch.setattr(app, "_cuota", cuota or buscaweb.Cuota(30))
    app.history.clear("fase11-extra")
    caplog.set_level(logging.DEBUG)

    async def collect():
        return [x async for x in app._model_stream("fase11-extra", "¿Llueve mañana?", system)]

    return asyncio.run(collect()), seen


def test_pause_turn_avisa_en_el_log_y_la_respuesta_acaba_con_lo_que_hay(monkeypatch, caplog):
    final = _final([_bloque_texto("[smug] Consulto los grimorios.")], stop_reason="pause_turn")
    out, _ = _narrar(monkeypatch, caplog, STREAM, final)
    assert "pause_turn" in caplog.text
    assert isinstance(out[-1], buscaweb.Fuentes) and out[-1].items == []
    assert any(isinstance(x, str) for x in out)


def test_resultado_de_busqueda_con_error_no_rompe_nada(monkeypatch, caplog):
    error = {"type": "web_search_tool_result_error", "error_code": "unavailable"}
    eventos = [
        {"type": "content_block_start", "index": 0,
         "content_block": {"type": "server_tool_use", "id": "s1", "name": "web_search", "input": {}}},
        {"type": "content_block_start", "index": 1,
         "content_block": {"type": "web_search_tool_result", "tool_use_id": "s1", "content": error}},
        {"type": "content_block_start", "index": 2, "content_block": {"type": "text", "text": ""}},
        {"type": "content_block_delta", "index": 2,
         "delta": {"type": "text_delta", "text": "[sad] No he podido buscar."}},
    ]
    final = _final([
        {"type": "server_tool_use", "id": "s1", "name": "web_search", "input": {"query": CONSULTA}},
        {"type": "web_search_tool_result", "tool_use_id": "s1", "content": error},
        _bloque_texto("[sad] No he podido buscar."),
    ], servidor=None)  # una búsqueda fallida no se cobra: usage no trae server_tool_use
    cuota = buscaweb.Cuota(30)
    out, _ = _narrar(monkeypatch, caplog, eventos, final, cuota=cuota)
    assert out[0] is buscaweb.BUSCANDO
    assert "".join(x for x in out if isinstance(x, str)) == "[sad] No he podido buscar."
    assert out[-1].items == [] and cuota.quedan() == 30
    assert CONSULTA not in caplog.text


def test_el_log_solo_lleva_numeros_nunca_urls_ni_titulos(monkeypatch, caplog):
    final = _final([_bloque_texto("[happy] Llueve", [_cita("https://aemet.es/x", "AEMET-secreto")])])
    _narrar(monkeypatch, caplog, STREAM, final)
    assert "1 búsquedas, quedan 29 hoy" in caplog.text
    assert "aemet" not in caplog.text.lower() and "secreto" not in caplog.text


def test_sin_cuota_el_system_de_memoria_gana_un_bloque_mas(monkeypatch, caplog):
    system = [{"type": "text", "text": "prompt"}, {"type": "text", "text": "recuerdos"}]
    _, kw = _narrar(monkeypatch, caplog, STREAM, _final([]), system=system, cuota=buscaweb.Cuota(0))
    assert [b["text"] for b in kw["system"]] == ["prompt", "recuerdos", buscaweb.AGOTADA]
    assert system[-1]["text"] == "recuerdos" and len(system) == 2  # no se toca la lista de la sesión
    assert "tools" not in kw


def test_con_una_busqueda_de_cuota_el_modelo_recibe_max_uses_1(monkeypatch, caplog):
    cuota = buscaweb.Cuota(1)
    _, kw = _narrar(monkeypatch, caplog, STREAM, _final([]), cuota=cuota)
    assert kw["tools"] == [buscaweb.herramienta(1)]
    assert cuota.quedan() == 0  # la de ese mensaje (usage dice 1)


def test_el_prompt_habla_de_los_grimorios_y_no_pide_enlaces():
    p = app.SYSTEM_PROMPT
    assert "grimoires" in p and "without links or URLs" in p
