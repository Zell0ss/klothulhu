"""Cerrar una sesión: el escritor decide qué recordar y se guarda (D34, D35, D40, D42).

Nunca lanza. Los logs llevan ids, cuentas y coste; jamás texto de mensajes ni de recuerdos, ni el
mensaje de una excepción (puede llevarlo).
"""
from __future__ import annotations

import asyncio
import logging

import memoria

log = logging.getLogger("klothulhu")


async def cerrar(sesion, *, almacen, escritor, embedder, freno, motivo: str = "ttl") -> int:
    guardados = 0
    gastado = 0.0
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
