"""Coste y freno de gasto de la memoria (D40)."""
from __future__ import annotations

import logging

log = logging.getLogger("klothulhu")

# $ por millón de tokens (entrada, salida). Fuente: skill claude-api (2026-10-19) y Sebastian
# (core/memoria/embedder.py). Si cambian, se cambian aquí.
PRECIOS: dict[str, tuple[float, float]] = {
    "claude-haiku-5-5": (0.10, 0.50),
    "text-embedding-3-small": (0.02, 0.0),
}


def coste(modelo: str, tokens_in: int, tokens_out: int = 0) -> float:
    """KeyError con un modelo desconocido, a propósito: no se gasta sin saber cuánto."""
    p_in, p_out = PRECIOS[modelo]
    return (tokens_in * p_in + tokens_out * p_out) / 1_000_000


class Freno:
    """Corta el gasto al llegar al tope. Cuenta lo que hay en la BD, así que sobrevive al reinicio."""

    def __init__(self, tope: float, almacen) -> None:
        self._tope = tope
        self._almacen = almacen
        self._frenado = False

    def permitido(self) -> bool:
        ok = self._almacen.gasto_total() < self._tope
        if not ok and not self._frenado:
            log.warning("freno de gasto: tope %.4f alcanzado, la memoria deja de escribir", self._tope)
        self._frenado = not ok
        return ok

    def anotar(self, concepto: str, modelo: str, tokens_in: int, tokens_out: int) -> float:
        c = coste(modelo, tokens_in, tokens_out)
        self._almacen.anotar_gasto(concepto, modelo, tokens_in, tokens_out, c)
        return c
