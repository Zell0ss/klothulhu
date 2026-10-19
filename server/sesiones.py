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
    contexto: list[dict] | None = None  # la foto de D43 y lo que traiga la búsqueda (D36); None = sin abrir
    eventos: list[dict] = field(default_factory=list)  # candidatos (D44) y fallos (D45)
    dia: int | None = None  # día de uso de la sesión


class Sesiones:
    def __init__(self, ttl_seconds: float, max_turnos: int = 50, clock: Callable[[], float] = time.monotonic):
        self._ttl = ttl_seconds
        self._max = max_turnos
        self._clock = clock
        self._abiertas: dict[str, tuple[Sesion, float]] = {}  # cliente -> (sesión, última actividad)
        self._pendientes: list[Sesion] = []

    def actual(self, cid: str) -> Sesion:
        """La sesión abierta del cliente, o una nueva (cuenta como actividad ahora). Si la abierta había
        caducado antes de que pasara el barrido, pasa a pendientes."""
        ahora = self._clock()
        abierta = self._abiertas.get(cid)
        if abierta is not None and ahora - abierta[1] >= self._ttl:
            self._pendientes.append(abierta[0])
            abierta = None
        if abierta is None:
            abierta = (Sesion(id=str(uuid.uuid4()), cliente=cid), ahora)
            self._abiertas[cid] = abierta
        return abierta[0]

    def cuantas(self) -> int:
        """Sesiones abiertas, sin contar las pendientes."""
        return len(self._abiertas)

    def anotar(self, cid: str, texto: str, crudo: str) -> None:
        sesion = self.actual(cid)
        sesion.turnos.append((texto, crudo))
        del sesion.turnos[: -self._max]
        self._abiertas[cid] = (sesion, self._clock())

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
