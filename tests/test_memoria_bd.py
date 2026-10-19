"""Contrato de los almacenes (fase 7, T6). No normativo.

El almacén en memoria corre siempre; el real, solo con `KLOTHULHU_TEST_DB=1` y contra
`klothulhu_test` / `klothulhu_memoria_test` (vaciadas al empezar), con vectores falsos y sin OpenAI.
Las credenciales salen del entorno o del `.env` del repo (usuario `klothulhu_dev`).
"""
import os
from datetime import date, datetime
from pathlib import Path
from zoneinfo import ZoneInfo

import pytest

from memoria import Recuerdo
from memoria_bd import AlmacenEnMemoria, AlmacenMariaQdrant

REAL = os.getenv("KLOTHULHU_TEST_DB") == "1"
VECTOR = [0.1] * 1536


def _env() -> dict:
    out: dict = {}
    ruta = Path(__file__).resolve().parent.parent / ".env"
    if ruta.exists():
        for linea in ruta.read_text(encoding="utf-8").splitlines():
            if "=" in linea and not linea.lstrip().startswith("#"):
                k, _, v = linea.partition("=")
                out[k.strip()] = v.strip()
    out.update({k: v for k, v in os.environ.items() if k.startswith("KLOTHULHU_DB_")})
    return out


def _real() -> AlmacenMariaQdrant:
    e = _env()
    db = {"host": e.get("KLOTHULHU_DB_HOST", "localhost"), "port": int(e.get("KLOTHULHU_DB_PORT", "3306")),
          "user": e.get("KLOTHULHU_DB_USER", "klothulhu_dev"), "password": e.get("KLOTHULHU_DB_PASSWORD", ""),
          "database": "klothulhu_test"}
    alm = AlmacenMariaQdrant(db, os.getenv("KLOTHULHU_QDRANT_URL", "http://localhost:6333"),
                             "klothulhu_memoria_test")
    alm.crear()
    alm.vaciar()
    return alm


@pytest.fixture(params=["memoria", pytest.param("real", marks=pytest.mark.skipif(
    not REAL, reason="KLOTHULHU_TEST_DB=1 para la BD de test"))])
def almacen(request):
    return AlmacenEnMemoria() if request.param == "memoria" else _real()


def test_guardar_y_listar(almacen):
    r = Recuerdo("El mortal tiene un gato.", 4, "happy", date(2026, 10, 22))
    rid = almacen.guardar(sesion_id="s1", cliente="konnos", recuerdo=r, vector=VECTOR, creado_dia=1)
    otro = Recuerdo("Sin vector.", 2, "neutral", None)
    sin = almacen.guardar(sesion_id="s1", cliente="konnos", recuerdo=otro, vector=None, creado_dia=1)
    por_id = {x["id"]: x for x in almacen.recuerdos()}
    assert por_id[rid]["texto"] == "El mortal tiene un gato." and por_id[rid]["indexado"] is True
    assert por_id[rid]["fecha"] == date(2026, 10, 22) and por_id[rid]["usos"] == 0
    assert por_id[sin]["indexado"] is False and por_id[sin]["ultimo_uso_dia"] is None
    assert {"id", "texto", "importancia", "emocion", "fecha", "sesion_id", "cliente", "creado_dia", "usos",
            "ultimo_uso_dia", "indexado"} <= set(por_id[rid])


def test_dias_de_uso_idempotente(almacen):
    assert almacen.anotar_dia_uso(date(2026, 10, 19)) == 1
    assert almacen.anotar_dia_uso(date(2026, 10, 20)) == 2
    assert almacen.anotar_dia_uso(date(2026, 10, 19)) == 1


def test_gasto_y_sesion(almacen):
    assert almacen.gasto_total() == 0
    almacen.anotar_gasto("escritor", "claude-haiku-5-5", 1000, 200, 0.0002)
    almacen.anotar_gasto("embedding", "text-embedding-3-small", 12, 0, 2.4e-7)
    assert almacen.gasto_total() == pytest.approx(0.00020024)
    inicio = datetime(2026, 10, 19, 20, 0, tzinfo=ZoneInfo("Europe/Madrid"))
    almacen.anotar_sesion(id="s1", cliente="konnos", inicio=inicio, motivo="ttl", turnos=3, recuerdos=1,
                          coste=0.0002)


def test_se_niega_con_nombres_que_no_casan():
    base = {"host": "localhost", "user": "u", "password": "p"}
    url = "http://localhost:6333"
    with pytest.raises(ValueError):
        AlmacenMariaQdrant({**base, "database": "klothulhu_test"}, url, "klothulhu_memoria")
    with pytest.raises(ValueError):
        AlmacenMariaQdrant({**base, "database": "otra"}, url, "klothulhu_memoria_test")


@pytest.mark.skipif(not REAL, reason="KLOTHULHU_TEST_DB=1 para la BD de test")
def test_vaciar_solo_en_test():
    alm = _real()
    alm._db["database"] = "klothulhu_dev"
    with pytest.raises(ValueError):
        alm.vaciar()


def test_dia_actual(almacen):
    assert almacen.dia_actual() == 0
    almacen.anotar_dia_uso(date(2026, 10, 19))
    almacen.anotar_dia_uso(date(2026, 10, 20))
    almacen.guardar(sesion_id="s1", cliente="konnos", recuerdo=Recuerdo("Uno.", 3, "neutral", None),
                    vector=None, creado_dia=1)
    assert almacen.dia_actual() == 2
