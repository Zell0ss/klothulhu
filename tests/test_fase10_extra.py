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
