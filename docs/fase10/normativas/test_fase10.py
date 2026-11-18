"""Pruebas normativas de la fase 10, H1 (docs/fase10/PLAN.md, D56, D57). No editar: añadir en otro fichero.

Se copia tal cual a tests/test_fase10.py. Gasto 0: nada llama a la API.
"""
import asyncio
import base64
import logging
import os

os.environ.setdefault("KLOTHULHU_TOKENS", "fase10test:" + "x" * 16)
os.environ["KLOTHULHU_FAKE"] = "1"

import pytest  # noqa: E402
from fastapi import HTTPException  # noqa: E402
from fastapi.responses import StreamingResponse  # noqa: E402

import app  # noqa: E402
import imagen  # noqa: E402
from history import HistoryStore  # noqa: E402

PNG = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGP4z8AAAAMBAQDJ/pLvAAAAAElFTkSuQmCC"
B64 = lambda raw: base64.b64encode(raw).decode()  # noqa: E731
JPEG = B64(b"\xff\xd8\xff\xe0" + b"\x00" * 32)
GIF = B64(b"GIF89a" + b"\x00" * 32)
WEBP = B64(b"RIFF\x24\x00\x00\x00WEBPVP8 " + b"\x00" * 32)
REPLY = "[happy] Veo un píxel, mortal. [smug] Uno solo, y aun así lo juzgo."


# --- imagen.py: validación y contenido (D56) -----------------------------------------------------


def test_I1_validar_formatos():
    for mt, data in [("image/png", PNG), ("image/jpeg", JPEG), ("image/gif", GIF), ("image/webp", WEBP)]:
        raw = imagen.validar(mt, data)
        assert isinstance(raw, bytes) and raw == base64.b64decode(data)
    assert set(imagen.MEDIA_TYPES) == {"image/jpeg", "image/png", "image/webp", "image/gif"}


def _code(mt, data):
    with pytest.raises(imagen.ImagenInvalida) as e:
        imagen.validar(mt, data)
    return e.value.code


def test_I2_validar_errores():
    assert _code("image/bmp", PNG) == "image_type"
    assert _code("image/png", "esto no es base64 !!!") == "image_base64"
    assert _code("image/png", "") == "image_base64"
    assert _code("image/jpeg", PNG) == "image_mismatch"  # el contenido manda, no lo que se declara
    grande = B64(b"\x89PNG\r\n\x1a\n" + b"\x00" * imagen.MAX_BYTES)
    assert _code("image/png", grande) == "image_size"
    assert imagen.MAX_BYTES == 4_000_000
    assert issubclass(imagen.ImagenInvalida, ValueError)


def test_I3_contenido():
    c = imagen.contenido("¿Qué es esto?", "image/png", PNG)
    assert c == [
        {"type": "image", "source": {"type": "base64", "media_type": "image/png", "data": PNG}},
        {"type": "text", "text": "¿Qué es esto?"},
    ]
    sin = imagen.contenido("", "image/png", PNG)
    assert sin[1] == {"type": "text", "text": imagen.SIN_TEXTO}
    for t in (imagen.SIN_TEXTO, imagen.MARCA):
        assert t.strip() and "[" not in t and "]" not in t  # los corchetes son de las emociones


def test_I4_texto_memoria():
    assert imagen.texto_memoria("") == imagen.MARCA
    t = imagen.texto_memoria("mira mi gato")
    assert t.startswith(imagen.MARCA) and t.endswith("mira mi gato")


# --- el endpoint: qué entra (D56) -------------------------------------------------------------------


def _chat(text="", image=None, cid="fase10-chat"):
    body = app.ChatIn(text=text, image=image)
    return asyncio.run(app.chat(body, cid=cid))


def _status(**kw):
    with pytest.raises(HTTPException) as e:
        _chat(**kw)
    return e.value.status_code, e.value.detail


def test_I5_chat_entrada():
    assert _status() == (422, "empty")
    assert _status(text="   ") == (422, "empty")
    assert _status(image={"media_type": "image/bmp", "data": PNG}) == (422, "image_type")
    assert _status(image={"media_type": "image/jpeg", "data": PNG}) == (422, "image_mismatch")
    grande = B64(b"\x89PNG\r\n\x1a\n" + b"\x00" * imagen.MAX_BYTES)
    assert _status(image={"media_type": "image/png", "data": grande}) == (413, "image_size")
    for kw in ({"text": "hola"}, {"image": {"media_type": "image/png", "data": PNG}},
               {"text": "mira", "image": {"media_type": "image/png", "data": PNG}}):
        r = _chat(**kw)
        assert isinstance(r, StreamingResponse)
        asyncio.run(r.body_iterator.aclose())
    with pytest.raises(Exception):
        app.ChatIn(text="x" * 1001)  # el tope de texto sigue


# --- la respuesta con imagen (D56, D57) -----------------------------------------------------------------


def _run(monkeypatch, text, image, cid):
    seen = {"anotar": []}

    async def model_stream(cid_, content, system):
        seen["content"] = content
        for i in range(0, len(REPLY), 3):
            yield REPLY[i:i + 3]

    async def fake_director(question, bs):
        seen["question"] = question
        for _ in bs:
            yield None

    async def sin_memoria(cid_, text_):
        return None

    monkeypatch.setattr(app, "FAKE", False)
    monkeypatch.setattr(app, "MEMORIA", True)
    monkeypatch.setattr(app, "_model_stream", model_stream)
    monkeypatch.setattr(app, "_director", fake_director)
    monkeypatch.setattr(app, "_preparar_memoria", sin_memoria)
    monkeypatch.setattr(app.sesiones, "anotar", lambda c, t, r: seen["anotar"].append(t))
    app.history.clear(cid)

    async def collect():
        return [x async for x in app._reply(cid, text, asyncio.Lock(), image=image)]

    out = "".join(asyncio.run(collect()))
    return out, seen


def test_I6_reply_con_imagen(monkeypatch, caplog):
    caplog.set_level(logging.DEBUG)
    out, seen = _run(monkeypatch, "¿Qué ves?", ("image/png", PNG), "fase10-i6")
    assert "event: done" in out and "event: error" not in out
    assert seen["content"] == imagen.contenido("¿Qué ves?", "image/png", PNG)
    msgs = app.history.messages("fase10-i6")
    assert msgs[-2] == {"role": "user", "content": imagen.contenido("¿Qué ves?", "image/png", PNG)}  # D57
    assert seen["anotar"] == [imagen.texto_memoria("¿Qué ves?")]  # la memoria larga, sin imagen
    assert seen["question"] == imagen.texto_memoria("¿Qué ves?")  # el director, tampoco
    assert PNG not in out  # nada de la imagen vuelve al cliente
    assert PNG not in caplog.text  # ni a los logs (D42)


def test_I7_reply_solo_imagen_y_solo_texto(monkeypatch):
    _, seen = _run(monkeypatch, "", ("image/png", PNG), "fase10-i7")
    assert seen["content"][1]["text"] == imagen.SIN_TEXTO
    assert seen["anotar"] == [imagen.MARCA]
    _, seen = _run(monkeypatch, "hola", None, "fase10-i7b")
    assert seen["content"] == "hola"  # sin imagen, el contenido es texto, como antes
    assert seen["anotar"] == ["hola"] and seen["question"] == "hola"


def test_I8_historial_guarda_bloques():
    class Clock:
        t = 0.0

        def __call__(self):
            return self.t

    h = HistoryStore(max_turns=2, ttl_seconds=60, clock=Clock())
    c = imagen.contenido("gato", "image/png", PNG)
    h.append("k", c, "Un gato.")
    assert h.messages("k")[0] == {"role": "user", "content": c}
    h.append("k", "q2", "a2")
    assert h.messages("k")[0]["content"] == c  # sigue dentro de las vueltas que se guardan
    h.append("k", "q3", "a3")
    assert all(m["content"] != c for m in h.messages("k"))  # y se va con ellas


def test_I9_fake_con_imagen(monkeypatch):
    monkeypatch.setattr(app, "FAKE", True)
    monkeypatch.setattr(app, "DIRECTOR_ENABLED", False)
    monkeypatch.setattr(app, "MEMORIA", False)
    app.history.clear("fase10-i9")

    async def collect():
        return [x async for x in app._reply("fase10-i9", "", asyncio.Lock(), image=("image/png", PNG))]

    out = "".join(asyncio.run(collect()))
    assert "event: done" in out and "event: error" not in out
    assert "imagen" in out.lower()  # la respuesta enlatada dice que ha recibido una imagen
