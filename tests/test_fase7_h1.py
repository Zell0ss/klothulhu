"""Pruebas normativas de la fase 7, H1 (D34, D37, D40-D42). No editar: añadir en otro fichero.

Sin red, sin BD y sin Qdrant: todo con `AlmacenEnMemoria` y falsos. Las pruebas contra la BD de
test van aparte (tarea T6) y no son normativas.
"""
import asyncio
import json
import logging
import os
from datetime import date, datetime
from pathlib import Path
from zoneinfo import ZoneInfo

import pytest

os.environ.setdefault("KLOTHULHU_TOKENS", "fase7test:" + "x" * 16)
os.environ["KLOTHULHU_FAKE"] = "1"

import cierre  # noqa: E402
import escritor  # noqa: E402
import gasto  # noqa: E402
import memoria  # noqa: E402
import sesiones  # noqa: E402
from emotion_parser import EMOTIONS  # noqa: E402
from memoria import Recuerdo  # noqa: E402
from memoria_bd import AlmacenEnMemoria  # noqa: E402

SERVER = Path(__file__).parent.parent / "server"
MADRID = ZoneInfo("Europe/Madrid")
SECRETO = "TOFU-SECRETO-7731"  # si aparece en un log, D42 está roto


# --- falsos -------------------------------------------------------------------------------------


class Reloj:
    def __init__(self):
        self.t = 1000.0

    def __call__(self):
        return self.t


class EscritorFalso:
    """Mismo contrato que `escritor.escribir`: (transcripción, previos, hoy) -> (salida, uso)."""

    def __init__(self, salida=None, falla=False):
        self.salida = salida if salida is not None else {"recuerdos": []}
        self.falla = falla
        self.llamadas = []

    async def __call__(self, transcripcion, previos, hoy):
        self.llamadas.append((transcripcion, previos, hoy))
        if self.falla:
            raise RuntimeError("escritor caído")
        return self.salida, ("claude-haiku-5-5", 1000, 200)


class EmbedderFalso:
    """Mismo contrato que `escritor.embeber`: (texto) -> (vector, uso)."""

    def __init__(self, falla=False):
        self.falla = falla

    async def __call__(self, texto):
        if self.falla:
            raise RuntimeError("openai caído")
        return [0.1] * 1536, ("text-embedding-3-small", 12, 0)


def _r(texto, importancia=3, emocion="neutral", fecha=None):
    return {"texto": texto, "importancia": importancia, "emocion": emocion, "fecha": fecha}


def _sesion(sid="s1", turnos=None, dia=19):
    return sesiones.Sesion(
        id=sid,
        cliente="konnos",
        turnos=turnos or [(f"Mi gato {SECRETO} ha vuelto", "[happy] Celebro su regreso, mortal.")],
        inicio=datetime(2026, 10, dia, 20, 0, tzinfo=MADRID),
    )


# M1 — validar la salida del escritor: los inválidos se descartan, máximo 3 (D34)
def test_m1_validar():
    salida = {"recuerdos": [
        _r("  El mortal tiene un gato llamado Tofu.  ", 4, "happy"),
        _r("Examen de conducir del mortal.", 5, "neutral", "2026-10-22"),
        _r("   ", 3),                                   # vacío
        _r("x", 9),                                     # importancia fuera de 1-5
        _r("y", 3, "furioso"),                          # emoción que no existe
        _r("z", 3, "sad", "el jueves"),                 # fecha que no es ISO
        _r("a" * (memoria.MAX_TEXTO + 1), 3, "sad"),    # demasiado largo
    ]}
    assert memoria.validar(salida) == [
        Recuerdo("El mortal tiene un gato llamado Tofu.", 4, "happy", None),
        Recuerdo("Examen de conducir del mortal.", 5, "neutral", date(2026, 10, 22)),
    ]


def test_m1_validar_tope_y_basura():
    assert memoria.MAX_RECUERDOS == 3
    assert len(memoria.validar({"recuerdos": [_r(f"t{i}") for i in range(5)]})) == 3
    assert memoria.validar({}) == []
    assert memoria.validar({"recuerdos": None}) == []
    assert memoria.validar({"recuerdos": ["no soy un dict"]}) == []


# M2 — la fuerza: importancia, emoción y caída por días de uso; cada uso alarga la vida (D34)
def test_m2_fuerza():
    f = memoria.fuerza
    assert memoria.VIDA_BASE == 7 and memoria.PESO_EMOCION == 1.25
    assert f(5, "neutral", 0, 0) == pytest.approx(1.0)
    assert f(1, "neutral", 0, 0) == pytest.approx(0.2)
    assert f(5, "happy", 0, 0) == pytest.approx(1.25)
    assert f(5, "neutral", 7, 0) == pytest.approx(0.5)
    assert f(5, "neutral", 14, 1) == pytest.approx(0.5)
    assert f(3, "neutral", 10, 0) < f(3, "neutral", 5, 0)


def test_m2_mas_fuertes():
    base = {"usos": 0, "ultimo_uso_dia": None}
    rs = [
        {**base, "id": "viejo", "importancia": 5, "emocion": "neutral", "creado_dia": 1},
        {**base, "id": "nuevo", "importancia": 3, "emocion": "neutral", "creado_dia": 30},
        {**base, "id": "usado", "importancia": 5, "emocion": "neutral", "creado_dia": 1, "usos": 3,
         "ultimo_uso_dia": 29},
    ]
    # día de uso 30: «viejo» lleva 29 días sin uso; «usado», 1; «nuevo», 0
    assert [r["id"] for r in memoria.mas_fuertes(rs, 30, n=2)] == ["usado", "nuevo"]
    assert [r["id"] for r in memoria.mas_fuertes(rs, 30)] == ["usado", "nuevo", "viejo"]


# M3 — la transcripción que lee el escritor, con las etiquetas de emoción
def test_m3_transcripcion():
    t = memoria.transcripcion([("Hola", "[smug] Mortal."), ("Adiós", "[sleepy] Zzz.")])
    assert t == "Mortal: Hola\nKlothulhu: [smug] Mortal.\nMortal: Adiós\nKlothulhu: [sleepy] Zzz."


# M4 — sesiones: caducan por inactividad, guardan la charla entera hasta un tope, Forget las tira (D37, D41)
def test_m4_caducan():
    reloj = Reloj()
    s = sesiones.Sesiones(ttl_seconds=1800, max_turnos=50, clock=reloj)
    s.anotar("konnos", "a", "[happy] A")
    s.anotar("pi", "c", "C")
    reloj.t += 100
    s.anotar("konnos", "b", "[smug] B")
    reloj.t += 1750                       # pi: 1850 s sin hablar; konnos: 1750
    assert [x.cliente for x in s.vencidas()] == ["pi"]
    reloj.t += 50                         # konnos: 1800
    [k] = s.vencidas()
    assert k.cliente == "konnos" and k.turnos == [("a", "[happy] A"), ("b", "[smug] B")]
    assert isinstance(k.inicio, datetime) and k.inicio.tzinfo is not None
    assert s.vencidas() == []


def test_m4_tope_y_ids():
    s = sesiones.Sesiones(ttl_seconds=10, max_turnos=3, clock=Reloj())
    for i in range(5):
        s.anotar("konnos", f"u{i}", f"k{i}")
    [k] = s.todas()
    assert [u for u, _ in k.turnos] == ["u2", "u3", "u4"]      # se quedan las últimas
    assert s.todas() == []                                      # todas() las saca
    s.anotar("konnos", "x", "y")
    s.anotar("pi", "x", "y")
    ids = [x.id for x in s.todas()]
    assert len(set(ids)) == 2 and k.id not in ids


def test_m4_mensaje_tras_caducar_abre_otra():
    reloj = Reloj()
    s = sesiones.Sesiones(ttl_seconds=1800, clock=reloj)
    s.anotar("konnos", "vieja", "V")
    reloj.t += 1800                       # caducada, pero el barrido aún no ha pasado
    s.anotar("konnos", "nueva", "N")
    [vieja] = s.vencidas()
    assert vieja.turnos == [("vieja", "V")]
    [nueva] = s.todas()
    assert nueva.turnos == [("nueva", "N")]


def test_m4_olvidar():
    reloj = Reloj()
    s = sesiones.Sesiones(ttl_seconds=1800, clock=reloj)
    s.anotar("konnos", "algo que olvidar", "Hecho.")
    s.olvidar("konnos")
    reloj.t += 5000
    assert s.vencidas() == [] and s.todas() == []
    s.olvidar("nadie")                    # olvidar lo que no existe no falla


# M5 — coste y freno: el tope cuenta lo anotado en la BD y sobrevive a un reinicio (D40)
def test_m5_coste():
    assert gasto.coste("claude-haiku-5-5", 1_000_000, 0) == pytest.approx(0.10)
    assert gasto.coste("claude-haiku-5-5", 0, 1_000_000) == pytest.approx(0.50)
    assert gasto.coste("text-embedding-3-small", 1_000_000) == pytest.approx(0.02)
    with pytest.raises(KeyError):
        gasto.coste("gpt-9", 1, 1)


def test_m5_freno():
    alm = AlmacenEnMemoria()
    fr = gasto.Freno(tope=0.001, almacen=alm)
    assert fr.permitido()
    assert fr.anotar("escritor", "claude-haiku-5-5", 5_000, 1_000) == pytest.approx(0.001)
    assert not fr.permitido()                                       # llegar al tope ya frena
    assert not gasto.Freno(tope=0.001, almacen=alm).permitido()     # otro proceso, misma BD
    assert gasto.Freno(tope=1.0, almacen=alm).permitido()           # subir el tope lo reabre
    assert alm.gasto_total() == pytest.approx(0.001)


# M6 — cerrar una sesión: escribe, anota el día de uso y el gasto, y nunca lanza (D34, D35, D40)
def test_m6_cerrar():
    alm = AlmacenEnMemoria()
    fr = gasto.Freno(tope=1.0, almacen=alm)
    esc = EscritorFalso({"recuerdos": [_r("El mortal tiene un gato.", 4, "happy"),
                                       _r("Volvió el gato.", 2, "neutral"), _r("", 3)]})
    s = _sesion()
    n = asyncio.run(cierre.cerrar(s, almacen=alm, escritor=esc, embedder=EmbedderFalso(), freno=fr))
    assert n == 2
    [(transcripcion, previos, hoy)] = esc.llamadas
    assert transcripcion == memoria.transcripcion(s.turnos)
    assert previos == [] and hoy == date(2026, 10, 19)
    rs = alm.recuerdos()
    assert {r["texto"] for r in rs} == {"El mortal tiene un gato.", "Volvió el gato."}
    assert all(r["sesion_id"] == "s1" and r["cliente"] == "konnos" and r["indexado"] for r in rs)
    assert all(r["creado_dia"] == 1 and r["usos"] == 0 for r in rs)
    esperado = gasto.coste("claude-haiku-5-5", 1000, 200) + 2 * gasto.coste("text-embedding-3-small", 12)
    assert alm.gasto_total() == pytest.approx(esperado)

    # segunda sesión, otro día: el escritor recibe los recuerdos que ya hay, el más fuerte primero
    esc2 = EscritorFalso()
    assert asyncio.run(cierre.cerrar(_sesion("s2", dia=20), almacen=alm, escritor=esc2,
                                     embedder=EmbedderFalso(), freno=fr)) == 0
    assert esc2.llamadas[0][1] == ["El mortal tiene un gato.", "Volvió el gato."]
    assert alm.anotar_dia_uso(date(2026, 10, 20)) == 2        # idempotente: ya estaba


def test_m6_fallos_no_rompen():
    alm = AlmacenEnMemoria()
    fr = gasto.Freno(tope=1.0, almacen=alm)
    # OpenAI caído: el recuerdo se guarda sin indexar
    esc = EscritorFalso({"recuerdos": [_r("Sin vector.")]})
    assert asyncio.run(cierre.cerrar(_sesion(), almacen=alm, escritor=esc,
                                     embedder=EmbedderFalso(falla=True), freno=fr)) == 1
    assert [r["indexado"] for r in alm.recuerdos()] == [False]
    # Haiku caído: nada, sin excepción
    assert asyncio.run(cierre.cerrar(_sesion("s2"), almacen=alm, escritor=EscritorFalso(falla=True),
                                     embedder=EmbedderFalso(), freno=fr)) == 0
    # salida que no es un dict: nada
    assert asyncio.run(cierre.cerrar(_sesion("s3"), almacen=alm, escritor=EscritorFalso(["basura"]),
                                     embedder=EmbedderFalso(), freno=fr)) == 0
    assert len(alm.recuerdos()) == 1


def test_m6_freno_echado():
    alm = AlmacenEnMemoria()
    alm.anotar_gasto("escritor", "claude-haiku-5-5", 0, 0, 2.0)
    esc = EscritorFalso({"recuerdos": [_r("No debería escribirse.")]})
    assert asyncio.run(cierre.cerrar(_sesion(), almacen=alm, escritor=esc, embedder=EmbedderFalso(),
                                     freno=gasto.Freno(tope=1.0, almacen=alm))) == 0
    assert esc.llamadas == [] and alm.recuerdos() == []


# M7 — los logs no llevan texto de mensajes ni de recuerdos (D42)
def test_m7_logs_sin_texto(caplog):
    caplog.set_level(logging.DEBUG)
    alm = AlmacenEnMemoria()
    fr = gasto.Freno(tope=1.0, almacen=alm)
    esc = EscritorFalso({"recuerdos": [_r(f"El gato {SECRETO} volvió.", 4, "happy")]})
    asyncio.run(cierre.cerrar(_sesion(), almacen=alm, escritor=esc, embedder=EmbedderFalso(), freno=fr))
    asyncio.run(cierre.cerrar(_sesion("s2"), almacen=alm, escritor=EscritorFalso(falla=True),
                              embedder=EmbedderFalso(), freno=fr))
    assert caplog.records, "cerrar() debe dejar rastro en el log (ids, cuentas, coste)"
    assert SECRETO not in caplog.text


# M8 — el servidor: sesiones con la memoria encendida, Forget las tira, /health lo cuenta (D37, D41)
async def _fake_stream():
    for chunk in ("[happy] Hola, ", "mortal."):
        yield chunk


async def _consumir(gen):
    return [x async for x in gen]


def test_m8_app(monkeypatch):
    import app

    assert app.MEMORIA is False           # apagada salvo que el entorno la encienda
    assert asyncio.run(app.health())["memoria"] == {"enabled": False, "frenada": False}
    monkeypatch.setattr(app, "_fake_stream", _fake_stream)
    monkeypatch.setattr(app, "DIRECTOR_ENABLED", False)
    monkeypatch.setattr(app, "MEMORIA", True)
    asyncio.run(_consumir(app._reply("fase7-m8", "Hola", asyncio.Lock())))
    abiertas = {s.cliente: s for s in app.sesiones.todas()}
    assert abiertas["fase7-m8"].turnos == [("Hola", "[happy] Hola, mortal.")]

    asyncio.run(_consumir(app._reply("fase7-m8", "Olvida esto", asyncio.Lock())))
    asyncio.run(app.forget(cid="fase7-m8"))
    assert "fase7-m8" not in {s.cliente for s in app.sesiones.todas()}


def test_m8_app_memoria_apagada_no_anota(monkeypatch):
    import app

    monkeypatch.setattr(app, "_fake_stream", _fake_stream)
    monkeypatch.setattr(app, "DIRECTOR_ENABLED", False)
    monkeypatch.setattr(app, "MEMORIA", False)
    asyncio.run(_consumir(app._reply("fase7-m8b", "Hola", asyncio.Lock())))
    assert "fase7-m8b" not in {s.cliente for s in app.sesiones.todas()}


# M9 — el escritor: Haiku 5.5, salida estructurada con las emociones del parser (D34)
def test_m9_esquema():
    e = escritor.ESQUEMA
    assert e["required"] == ["recuerdos"] and e["additionalProperties"] is False
    item = e["properties"]["recuerdos"]["items"]
    assert set(item["required"]) == {"texto", "importancia", "emocion", "fecha"}
    assert item["additionalProperties"] is False
    assert item["properties"]["emocion"]["enum"] == list(EMOTIONS)
    assert item["properties"]["importancia"]["enum"] == [1, 2, 3, 4, 5]
    assert escritor.MODELO == "claude-haiku-5-5"
    assert escritor.MODELO_EMBEDDING == "text-embedding-3-small" and escritor.DIMENSION == 1536
    assert (SERVER / "escritor_prompt.md").read_text(encoding="utf-8").strip()


# M10 — LogCentral: el logging estándar sale como JSON con source «klothulhu» (D42)
def test_m10_logcentral(tmp_path):
    import registro

    registro.configurar(tmp_path)
    logging.getLogger("klothulhu").warning("prueba m10 %d", 7)
    ultima = json.loads((tmp_path / "klothulhu.log").read_text(encoding="utf-8").splitlines()[-1])
    assert ultima["source"] == "klothulhu"
    assert ultima["level"] == "WARNING"
    assert ultima["message"] == "prueba m10 7"
