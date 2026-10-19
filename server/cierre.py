"""Cerrar una sesión: el escritor decide qué recordar y se guarda (D34, D35, D40, D42); el repaso refuerza
lo usado y apunta los fallos (D45), y se poda lo apagado (D46).

Nunca lanza. Los logs llevan ids, cuentas y coste; jamás texto de mensajes ni de recuerdos, ni el
mensaje de una excepción (puede llevarlo).
"""
from __future__ import annotations

import asyncio
import logging
from datetime import datetime
from zoneinfo import ZoneInfo

import memoria

log = logging.getLogger("klothulhu")

MADRID = ZoneInfo("Europe/Madrid")


async def cerrar(sesion, *, almacen, escritor, embedder, freno, motivo: str = "ttl", repasador=None) -> int:
    if not sesion.turnos:  # actual() puede abrir sesiones que nunca llegan a tener una vuelta
        return 0
    guardados = 0
    gastado = 0.0
    dia = None
    try:
        dia = await asyncio.to_thread(almacen.anotar_dia_uso, sesion.inicio.date())
        if not await asyncio.to_thread(freno.permitido):
            log.info("sesión %s: sin cerrar, freno de gasto activo", sesion.id)
            return 0
        recuerdos = await asyncio.to_thread(almacen.recuerdos)
        previos = [r["texto"] for r in memoria.mas_fuertes(recuerdos, dia)]
        salida, uso = await escritor(memoria.transcripcion(sesion.turnos), previos, sesion.inicio.date())
        gastado += await asyncio.to_thread(freno.anotar, "escritor", *uso)
        for r in memoria.validar(salida):
            try:
                vector, uso_emb = await embedder(r.texto)
                gastado += await asyncio.to_thread(freno.anotar, "embedding", *uso_emb)
            except Exception as e:  # D35: se guarda igual, sin indexar
                log.warning("sesión %s: embedding fallido (%s)", sesion.id, type(e).__name__)
                vector = None
            await asyncio.to_thread(
                almacen.guardar, sesion_id=sesion.id, cliente=sesion.cliente, recuerdo=r, vector=vector,
                creado_dia=dia,
            )
            guardados += 1
    except Exception as e:
        log.warning("sesión %s: el cierre se interrumpió (%s)", sesion.id, type(e).__name__)
    if dia is not None:
        gastado += await _repasar(sesion, almacen, repasador, freno, dia)
    try:
        await asyncio.to_thread(
            almacen.anotar_sesion, id=sesion.id, cliente=sesion.cliente, inicio=sesion.inicio,
            motivo=motivo, turnos=len(sesion.turnos), recuerdos=guardados, coste=gastado,
        )
    except Exception as e:
        log.warning("sesión %s: no se pudo anotar (%s)", sesion.id, type(e).__name__)
    log.info("sesión %s cerrada: %d vueltas, %d recuerdos, coste %.6f", sesion.id, len(sesion.turnos),
             guardados, gastado)
    return guardados


async def _repasar(sesion, almacen, repasador, freno, dia: int) -> float:
    """Repaso (D45), eventos y poda (D46). Cada etapa falla por separado y nunca impide anotar la sesión.
    Devuelve lo gastado."""
    gastado = 0.0
    contexto = sesion.contexto or []
    ids = {r["id"] for r in contexto}
    eventos = list(sesion.eventos)
    try:
        if repasador is not None and contexto and await asyncio.to_thread(freno.permitido):
            salida, uso = await repasador(memoria.transcripcion(sesion.turnos), contexto)
            gastado += await asyncio.to_thread(freno.anotar, "repaso", *uso)
            usados = list(dict.fromkeys(i for i in salida.get("usados", []) if i in ids))
            await asyncio.to_thread(almacen.reforzar, usados, dia)
            ahora = datetime.now(MADRID)
            for f in salida.get("fallos", []):
                tipo, rid = f.get("tipo"), f.get("recuerdo")
                if tipo not in ("F3", "F4", "F5"):
                    continue
                if rid not in ids:
                    if tipo != "F4":
                        continue  # F3 y F5 sin un recuerdo del contexto no valen
                    rid = None
                eventos.append({"tipo": tipo, "recuerdo_id": rid, "similitud": None, "pertinente": None,
                                "mensaje": None, "cuando": ahora})
            log.info("sesión %s: repaso con %d usados y %d fallos", sesion.id, len(usados),
                     len(eventos) - len(sesion.eventos))
    except Exception as e:
        log.warning("sesión %s: repaso fallido (%s)", sesion.id, type(e).__name__)
    try:
        if eventos:
            await asyncio.to_thread(almacen.anotar_eventos, sesion.id, eventos)
    except Exception as e:
        log.warning("sesión %s: eventos sin anotar (%s)", sesion.id, type(e).__name__)
    try:
        rs = await asyncio.to_thread(almacen.recuerdos)
        podar = memoria.podables(rs, dia)
        if podar:
            await asyncio.to_thread(almacen.podar, podar)
            log.info("poda: %d recuerdos apagados", len(podar))
    except Exception as e:
        log.warning("sesión %s: poda fallida (%s)", sesion.id, type(e).__name__)
    return gastado
