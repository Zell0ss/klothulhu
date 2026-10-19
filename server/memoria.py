"""Memoria larga de klothulhu: recuerdos, validación de lo que escribe el escritor y fuerza (fase 7).

Todo puro: sin red ni BD. La fuerza decide qué recuerdos pesan más (D34); la validación no se fía
del esquema del escritor para longitud, número ni fecha.
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import date

from emotion_parser import EMOTIONS

MAX_RECUERDOS = 3
MAX_TEXTO = 400
VIDA_BASE = 7  # días de uso en que un recuerdo sin usos pierde la mitad de su fuerza (D34)
PESO_EMOCION = 1.25  # lo que no es neutral pesa más (D34)


@dataclass(frozen=True)
class Recuerdo:
    texto: str
    importancia: int
    emocion: str
    fecha: date | None


def _fecha(valor) -> tuple[bool, date | None]:
    """(válida, fecha): `None` es válido; el resto tiene que ser AAAA-MM-DD."""
    if valor is None:
        return True, None
    if not isinstance(valor, str) or len(valor) != 10:
        return False, None
    try:
        return True, date.fromisoformat(valor)
    except ValueError:
        return False, None


def validar(salida) -> list[Recuerdo]:
    """Recuerdos válidos de la salida del escritor, como mucho `MAX_RECUERDOS`. Nunca lanza."""
    try:
        elementos = salida.get("recuerdos") if isinstance(salida, dict) else None
        if not isinstance(elementos, list):
            return []
        validos: list[Recuerdo] = []
        for e in elementos:
            if not isinstance(e, dict):
                continue
            texto = e.get("texto")
            importancia = e.get("importancia")
            emocion = e.get("emocion")
            if not isinstance(texto, str) or not (texto := texto.strip()) or len(texto) > MAX_TEXTO:
                continue
            # bool es un int en Python: True no es una importancia
            if isinstance(importancia, bool) or not isinstance(importancia, int) or not 1 <= importancia <= 5:
                continue
            if emocion not in EMOTIONS:
                continue
            ok, fecha = _fecha(e.get("fecha"))
            if not ok:
                continue
            validos.append(Recuerdo(texto, importancia, emocion, fecha))
            if len(validos) == MAX_RECUERDOS:
                break
        return validos
    except Exception:  # la salida viene de un modelo: ninguna forma rara debe romper el cierre
        return []


def fuerza(importancia: int, emocion: str, dias_sin_uso: float, usos: int) -> float:
    """D34: importancia y emoción fijan el techo; los días sin uso lo bajan y cada uso alarga la vida."""
    peso = 1 if emocion == "neutral" else PESO_EMOCION
    return importancia / 5 * peso * 0.5 ** (dias_sin_uso / (VIDA_BASE * (1 + usos)))


def mas_fuertes(recuerdos: list[dict], dia_actual: int, n: int = 15) -> list[dict]:
    """Los `n` recuerdos de más fuerza hoy, de mayor a menor."""

    def f(r: dict) -> float:
        ultimo = r["ultimo_uso_dia"] if r.get("ultimo_uso_dia") is not None else r["creado_dia"]
        return fuerza(r["importancia"], r["emocion"], dia_actual - ultimo, r.get("usos", 0))

    return sorted(recuerdos, key=f, reverse=True)[:n]


def transcripcion(turnos: list[tuple[str, str]]) -> str:
    """La charla como la lee el escritor; lo de klothulhu va con sus etiquetas de emoción."""
    return "\n".join(f"Mortal: {u}\nKlothulhu: {k}" for u, k in turnos)
