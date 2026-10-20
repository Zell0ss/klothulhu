"""Regresiones de los retoques R1-R3 de la revisión de H1 (fase 7). No normativo."""
import asyncio
import os

os.environ.setdefault("KLOTHULHU_TOKENS", "fase7test:" + "x" * 16)
os.environ["KLOTHULHU_FAKE"] = "1"

import app  # noqa: E402
import gasto  # noqa: E402
from memoria_bd import AlmacenEnMemoria  # noqa: E402
from sesiones import Sesiones  # noqa: E402


class AlmacenCaido(AlmacenEnMemoria):
    def gasto_total(self):
        raise RuntimeError("BD caída")


def test_r1_health_no_consulta_la_bd(monkeypatch):
    monkeypatch.setattr(app, "MEMORIA", True)
    monkeypatch.setattr(app, "_freno", gasto.Freno(1.0, AlmacenCaido()))
    assert asyncio.run(app.health())["memoria"] == {"enabled": True, "frenada": False}


def test_r2_dia_actual():
    from datetime import date

    a = AlmacenEnMemoria()
    assert a.dia_actual() == 0
    a.anotar_dia_uso(date(2026, 10, 19))
    a.anotar_dia_uso(date(2026, 10, 20))
    a.anotar_dia_uso(date(2026, 10, 20))
    assert a.dia_actual() == 2


def test_r3_apagado_no_pierde_sesiones(monkeypatch):
    class Reloj:
        t = 0.0

        def __call__(self):
            return self.t

    reloj = Reloj()
    ses = Sesiones(ttl_seconds=10, clock=reloj)
    alm = AlmacenEnMemoria()
    cerradas: list[str] = []

    async def lento(trans, previos, hoy):
        await asyncio.sleep(0.2)
        return {"recuerdos": []}, ("claude-haiku-5-5", 1, 1)

    monkeypatch.setattr(app, "sesiones", ses)
    monkeypatch.setattr(app, "_almacen", alm)
    monkeypatch.setattr(app, "_freno", gasto.Freno(1.0, alm))
    monkeypatch.setattr(app.escritor, "escribir_falso", lento)
    monkeypatch.setattr(app, "BARRIDO_S", 0.05)
    orig = alm.anotar_sesion
    monkeypatch.setattr(alm, "anotar_sesion", lambda **kw: (cerradas.append(kw["motivo"]), orig(**kw)))

    async def escena():
        ses.anotar("a", "hola", "[happy] Hola")
        reloj.t += 11                       # «a» caduca: el barrido la empezará a cerrar
        ses.anotar("b", "hola", "[happy] Hola")  # «b» sigue abierta
        parar = asyncio.Event()
        tarea = asyncio.create_task(app._barrido(parar))
        await asyncio.sleep(0.1)            # el barrido está a mitad del cierre lento de «a»
        await app._apagar(tarea, parar)

    asyncio.run(escena())
    assert sorted(cerradas) == ["apagado", "ttl"]


# --- H2 T7: registro quita el manejador por defecto de loguru; T4: el repaso traduce ids -----------


def test_registro_una_sola_linea(tmp_path, capsys):
    import logging

    from loguru import logger

    import registro

    registro.configurar(tmp_path)
    registro.configurar(tmp_path)                         # idempotente
    assert 0 not in logger._core.handlers                 # el manejador por defecto ya no está
    logging.getLogger("klothulhu").warning("linea unica %d", 1)
    assert capsys.readouterr().err.count("linea unica 1") == 1


def test_repasar_traduce_ids_cortos(monkeypatch):
    import escritor

    visto = {}

    async def falsa(sistema, mensaje, esquema, **kw):
        visto["mensaje"] = mensaje
        return {"usados": ["r2", "r9"], "fallos": [{"tipo": "F3", "recuerdo": "r1"},
                                                    {"tipo": "F4", "recuerdo": None}]}, ("m", 1, 1)

    monkeypatch.setattr(escritor, "_estructurada", falsa)
    ctx = [{"id": "uuid-a", "texto": "Uno."}, {"id": "uuid-b", "texto": "Dos."}]
    salida, _ = asyncio.run(escritor.repasar("Mortal: hola", ctx))
    m = visto["mensaje"]
    assert "r1: Uno." in m and "r2: Dos." in m and "uuid" not in m
    assert salida == {"usados": ["uuid-b", "r9"],          # un id corto desconocido se devuelve tal cual
                      "fallos": [{"tipo": "F3", "recuerdo": "uuid-a"}, {"tipo": "F4", "recuerdo": None}]}


# --- H2 R2: la memoria nunca tumba la respuesta ------------------------------------------------------


def test_bloque_sin_dia_actual():
    from datetime import date

    import memoria

    ctx = [{"id": "a", "texto": "Va a pilates.", "creado_dia": 1, "fecha": date(2026, 10, 22)}]
    b = memoria.bloque(ctx, None, date(2026, 10, 20))
    assert "Va a pilates." in b and "(sobre el 2026-10-22)" in b
    assert "de hoy" not in b and "días de uso" not in b


def test_reply_sobrevive_a_un_system_que_lanza(monkeypatch):
    async def stream():
        yield "[happy] Hola, mortal."

    def roto(sesion):
        raise RuntimeError("fallo del bloque")

    monkeypatch.setattr(app, "_fake_stream", stream)
    monkeypatch.setattr(app, "DIRECTOR_ENABLED", False)
    monkeypatch.setattr(app, "MEMORIA", True)
    monkeypatch.setattr(app, "_system", roto)

    async def consumir():
        return "".join([x async for x in app._reply("fase7-r2", "Hola", asyncio.Lock())])

    salida = asyncio.run(consumir())
    assert "event: done" in salida and "event: error" not in salida


# --- H2 R4-R6 (D47): fechas -----------------------------------------------------------------------------


def test_r5_bloque_lleva_la_fecha_de_escritura():
    from datetime import date, datetime

    import memoria

    ctx = [{"id": "a", "texto": "Tiene un perro viejo.", "creado_dia": 1,
            "creado": datetime(2026, 10, 19, 22, 5)},
           {"id": "b", "texto": "Sin fecha de escritura.", "creado_dia": 1},
           {"id": "c", "texto": "Con texto en iso.", "creado_dia": 1, "creado": "2026-10-22T08:00:00"}]
    b = memoria.bloque(ctx, 3, date(2026, 10, 20))
    assert "Tiene un perro viejo. (escrito el lunes 2026-10-19)" in b
    assert "Sin fecha de escritura.\n" in b + "\n" and "Sin fecha de escritura. (escrito" not in b
    assert "Con texto en iso. (escrito el jueves 2026-10-22)" in b
    assert "días de uso" not in b


def test_r5_el_almacen_en_memoria_guarda_creado_y_consultar_lo_devuelve():
    from memoria import Recuerdo

    a = AlmacenEnMemoria()
    r = Recuerdo("X.", 3, "neutral", None)
    a.guardar(sesion_id="s", cliente="k", recuerdo=r, vector=[1.0, 0.0], creado_dia=1)
    assert a.recuerdos()[0]["creado"] is not None and a.consultar([1.0, 0.0], 1)[0]["creado"] is not None


def test_r6_system_con_sesion_sin_recuerdos_lleva_la_fecha():
    from datetime import datetime
    from zoneinfo import ZoneInfo

    import memoria
    from sesiones import Sesion

    s = Sesion(id="s", cliente="k", inicio=datetime(2026, 10, 20, 23, 59, tzinfo=ZoneInfo("Europe/Madrid")))
    s.contexto = []
    assert app._system(s) == [{"type": "text", "text": app.SYSTEM_PROMPT},
                              {"type": "text", "text": "Hoy es martes 2026-10-20."}]
    assert memoria.cabecera(s.inicio.date()) == "Hoy es martes 2026-10-20."


def test_r4_el_prompt_del_escritor_prohibe_fechas_relativas():
    import escritor

    t = escritor.PROMPT
    assert "el martes 21 de octubre" in t and "«hoy»" in t and "«mañana»" in t and "«ayer»" in t
