"""Sesiones de charla para la memoria larga (D41).

Una sesión es la charla de un cliente hasta que calla `ttl_seconds`. Guarda la charla entera (hasta
`max_turnos` vueltas) aparte del historial corto que ve el narrador. Puro: el reloj se inyecta.
"""
from __future__ import annotations

import time
import uuid
from collections.abc import Callable
from dataclasses import dataclass, field
from datetime import datetime
from zoneinfo import ZoneInfo

MADRID = ZoneInfo("Europe/Madrid")


@dataclass
class Sesion:
    id: str
    cliente: str
    turnos: list[tuple[str, str]] = field(default_factory=list)
    inicio: datetime = field(default_factory=lambda: datetime.now(MADRID))


class Sesiones:
    def __init__(self, ttl_seconds: float, max_turnos: int = 50, clock: Callable[[], float] = time.monotonic):
        self._ttl = ttl_seconds
        self._max = max_turnos
        self._clock = clock
        self._abiertas: dict[str, tuple[Sesion, float]] = {}  # cliente -> (sesión, última actividad)
        self._pendientes: list[Sesion] = []

    def anotar(self, cid: str, texto: str, crudo: str) -> None:
        ahora = self._clock()
        actual = self._abiertas.get(cid)
        if actual is not None and ahora - actual[1] >= self._ttl:
            # caducó antes de que pasara el barrido: pasa a pendientes y esta vuelta abre otra
            self._pendientes.append(actual[0])
            actual = None
        sesion = actual[0] if actual else Sesion(id=str(uuid.uuid4()), cliente=cid)
        sesion.turnos.append((texto, crudo))
        del sesion.turnos[: -self._max]
        self._abiertas[cid] = (sesion, ahora)

    def olvidar(self, cid: str) -> None:
        """Forget (D37): tira la sesión abierta sin cerrarla. Las pendientes ya caducaron: se cierran."""
        self._abiertas.pop(cid, None)

    def vencidas(self) -> list[Sesion]:
        ahora = self._clock()
        salen = [c for c, (_, t) in self._abiertas.items() if ahora - t >= self._ttl]
        out, self._pendientes = self._pendientes, []
        out.extend(self._abiertas.pop(c)[0] for c in salen)
        return out

    def todas(self) -> list[Sesion]:
        out, self._pendientes = self._pendientes, []
        out.extend(s for s, _ in self._abiertas.values())
        self._abiertas.clear()
        return out
