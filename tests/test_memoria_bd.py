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


# --- H2: consultar, reforzar, eventos, podar (D36, D45, D46) ---------------------------------------


def _v(i: int) -> list[float]:
    v = [0.0] * 1536
    v[i] = 1.0
    return v


def test_consultar_ordena_por_similitud(almacen):
    a = almacen.guardar(sesion_id="s", cliente="k", recuerdo=Recuerdo("A.", 3, "neutral", None), vector=_v(0),
                        creado_dia=1)
    b = almacen.guardar(sesion_id="s", cliente="k", recuerdo=Recuerdo("B.", 3, "neutral", None), vector=_v(1),
                        creado_dia=1)
    almacen.guardar(sesion_id="s", cliente="k", recuerdo=Recuerdo("Sin vector.", 3, "neutral", None), vector=None,
                    creado_dia=1)
    q = [0.9] + [0.0] * 1535
    q[1] = 0.1
    hits = almacen.consultar(q, 5)
    assert [h["id"] for h in hits] == [a, b]                 # el de vector=None no sale
    assert hits[0]["similitud"] > hits[1]["similitud"] and hits[0]["texto"] == "A."
    assert {"id", "texto", "importancia", "emocion", "fecha", "creado_dia", "usos", "ultimo_uso_dia",
            "similitud"} <= set(hits[0])
    assert len(almacen.consultar(q, 1)) == 1


def test_reforzar_eventos_y_podar(almacen):
    a = almacen.guardar(sesion_id="s", cliente="k", recuerdo=Recuerdo("A.", 3, "neutral", None), vector=_v(0),
                        creado_dia=1)
    b = almacen.guardar(sesion_id="s", cliente="k", recuerdo=Recuerdo("B.", 3, "neutral", None), vector=_v(1),
                        creado_dia=1)
    almacen.reforzar([a, "desconocido"], 4)
    por_id = {r["id"]: r for r in almacen.recuerdos()}
    assert (por_id[a]["usos"], por_id[a]["ultimo_uso_dia"]) == (1, 4)
    assert (por_id[b]["usos"], por_id[b]["ultimo_uso_dia"]) == (0, None)

    cuando = datetime(2026, 10, 20, 20, 1)
    almacen.anotar_eventos("s9", [
        {"tipo": "candidato", "recuerdo_id": a, "similitud": 0.6, "pertinente": True, "mensaje": "hola", "cuando": cuando},
        {"tipo": "F4", "recuerdo_id": None, "similitud": None, "pertinente": None, "mensaje": None, "cuando": cuando},
    ])
    ev = almacen.eventos()
    assert [(e["tipo"], e["sesion_id"], e["recuerdo_id"], e["pertinente"]) for e in ev] == [
        ("candidato", "s9", a, True), ("F4", "s9", None, None)]
    assert ev[0]["similitud"] == pytest.approx(0.6) and ev[0]["mensaje"] == "hola" and ev[1]["mensaje"] is None

    almacen.podar([a])
    assert [r["id"] for r in almacen.recuerdos()] == [b]
    assert [h["id"] for h in almacen.consultar(_v(0), 5)] == [b]
    almacen.podar([])                                          # no hace nada


def test_sesiones_anotadas(almacen):
    assert almacen.sesiones_anotadas() == []
    inicio = datetime(2026, 10, 19, 20, 0, tzinfo=ZoneInfo("Europe/Madrid"))
    almacen.anotar_sesion(id="s1", cliente="konnos", inicio=inicio, motivo="ttl", turnos=3, recuerdos=1, coste=0.0002)
    [s] = almacen.sesiones_anotadas()
    assert s["id"] == "s1" and s["motivo"] == "ttl" and s["turnos"] == 3
