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
