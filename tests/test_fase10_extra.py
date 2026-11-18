"""Pruebas del programador de la fase 10, H1 (D56, D57). Las normativas están en test_fase10.py; estas
cubren lo que ellas no miran: logs de chat(), el tope antes de decodificar y la entrada sin imagen."""
import asyncio
import base64
import logging
import os

os.environ.setdefault("KLOTHULHU_TOKENS", "fase10test:" + "x" * 16)
os.environ["KLOTHULHU_FAKE"] = "1"

import pytest  # noqa: E402
from fastapi import HTTPException  # noqa: E402

import app  # noqa: E402
import imagen  # noqa: E402

PNG = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGP4z8AAAAMBAQDJ/pLvAAAAAElFTkSuQmCC"


def test_chat_no_deja_la_imagen_en_los_logs(caplog):
    caplog.set_level(logging.DEBUG)
    body = app.ChatIn(text="mira", image={"media_type": "image/png", "data": PNG})
    r = asyncio.run(app.chat(body, cid="extra-logs"))
    asyncio.run(r.body_iterator.aclose())
    assert PNG not in caplog.text
    assert "imagen image/png" in caplog.text  # sí el tipo y el tamaño


def test_base64_enorme_se_rechaza_sin_decodificar(monkeypatch):
    def no_decodificar(*a, **k):
        raise AssertionError("no se tenía que decodificar")

    monkeypatch.setattr(imagen.base64, "b64decode", no_decodificar)
    with pytest.raises(imagen.ImagenInvalida) as e:
        imagen.validar("image/png", "A" * (imagen._MAX_B64 + 4))
    assert e.value.code == "image_size"


def test_data_que_no_es_texto():
    with pytest.raises(imagen.ImagenInvalida) as e:
        imagen.validar("image/png", None)
    assert e.value.code == "image_base64"


def test_webp_demasiado_corto_no_coincide():
    corto = base64.b64encode(b"RIFF").decode()
    with pytest.raises(imagen.ImagenInvalida) as e:
        imagen.validar("image/webp", corto)
    assert e.value.code == "image_mismatch"


def test_texto_solo_con_espacios_y_sin_imagen_es_empty():
    with pytest.raises(HTTPException) as e:
        asyncio.run(app.chat(app.ChatIn(text="  \n "), cid="extra-empty"))
    assert (e.value.status_code, e.value.detail) == (422, "empty")


def test_texto_memoria_ignora_espacios():
    assert imagen.texto_memoria("   ") == imagen.MARCA
    assert imagen.contenido("  ", "image/png", PNG)[1]["text"] == imagen.SIN_TEXTO


# --- R1 (D57, D42): las librerías no dejan la imagen en los logs, ni con el log en DEBUG ---------------

LIBS = ("anthropic", "httpx", "httpx2", "httpcore", "httpcore2")  # httpx2 y httpcore2: los del SDK 1.15


def _llamada_sdk_con_imagen():
    """Una llamada real del SDK con imagen, pero contra un transporte falso: sin red y sin gasto."""
    import anthropic
    import httpx2

    def responder(request):
        return httpx2.Response(200, json={
            "id": "msg_x", "type": "message", "role": "assistant", "model": "claude-haiku-5-5",
            "content": [{"type": "text", "text": "hola"}], "stop_reason": "end_turn", "stop_sequence": None,
            "usage": {"input_tokens": 1, "output_tokens": 1},
        })

    cliente = anthropic.AsyncAnthropic(
        api_key="x", http_client=httpx2.AsyncClient(transport=httpx2.MockTransport(responder)), max_retries=0)
    asyncio.run(cliente.messages.create(
        model="claude-haiku-5-5", max_tokens=5,
        messages=[{"role": "user", "content": imagen.contenido("mira", "image/png", PNG)}]))


def _niveles_originales():
    return {n: logging.getLogger(n).level for n in LIBS}


def _restaurar(niveles):
    for n, nivel in niveles.items():
        logging.getLogger(n).setLevel(nivel)


def test_R1_con_la_raiz_en_debug_la_imagen_no_sale_en_los_logs(caplog):
    caplog.set_level(logging.DEBUG)
    antes = _niveles_originales()
    try:
        # Control: sin el recorte, el SDK sí vuelca la petición entera (si no, la prueba no detectaría nada).
        for n in LIBS:
            logging.getLogger(n).setLevel(logging.NOTSET)
        _llamada_sdk_con_imagen()
        assert PNG in caplog.text, "el control no ve la fuga: la prueba no sirve"
        caplog.clear()
        # Con el recorte de app.py, no.
        app._acotar_loggers_de_librerias()
        _llamada_sdk_con_imagen()
        assert PNG not in caplog.text
    finally:
        _restaurar(antes)


def _niveles_tras_importar_app(**env):
    import subprocess
    import sys
    from pathlib import Path

    server = Path(__file__).resolve().parent.parent / "server"
    codigo = ("import logging, app\n"
              f"print({{n: logging.getLogger(n).getEffectiveLevel() for n in {LIBS!r}}})")
    out = subprocess.run(
        [sys.executable, "-c", codigo], cwd=server, capture_output=True, text=True, timeout=60,
        env={**os.environ, "KLOTHULHU_TOKENS": "r1test:" + "x" * 16, "KLOTHULHU_FAKE": "1", **env},
    )
    assert out.returncode == 0, out.stderr[-500:]
    import ast

    return ast.literal_eval(out.stdout.strip().splitlines()[-1])


def test_R1_niveles_de_los_loggers_de_las_librerias():
    # La raíz en DEBUG: las librerías, a INFO como mínimo.
    assert set(_niveles_tras_importar_app(KLOTHULHU_LOG_LEVEL="DEBUG").values()) == {logging.INFO}
    # La raíz en WARNING: no se bajan a INFO.
    assert set(_niveles_tras_importar_app(KLOTHULHU_LOG_LEVEL="WARNING").values()) == {logging.WARNING}
    # Con ANTHROPIC_LOG=debug el SDK pone DEBUG al importarse (app lo importa sin FAKE): se acota otra vez.
    n = _niveles_tras_importar_app(
        KLOTHULHU_LOG_LEVEL="DEBUG", KLOTHULHU_FAKE="0", ANTHROPIC_API_KEY="x", ANTHROPIC_LOG="debug")
    assert set(n.values()) == {logging.INFO}, n
