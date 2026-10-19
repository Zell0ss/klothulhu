"""LogCentral para klothulhu (D42): el `logging` estándar sale como JSON con source «klothulhu»."""
from __future__ import annotations

import logging
import os
from pathlib import Path

from logcentral_client import get_logger
from loguru import logger as _loguru

_manejador: logging.Handler | None = None


class _PuenteLoguru(logging.Handler):
    def __init__(self, destino) -> None:
        super().__init__()
        self._destino = destino

    def emit(self, record: logging.LogRecord) -> None:
        try:
            # opt(depth=...) no hace falta: el módulo de origen no se usa en el JSON de LogCentral
            self._destino.log(record.levelname, record.getMessage())
        except Exception:
            self.handleError(record)


def configurar(log_dir: str | os.PathLike) -> None:
    """Idempotente: llamarla dos veces no duplica líneas."""
    global _manejador
    try:
        _loguru.remove(0)  # el de loguru por defecto: sin quitarlo, cada línea sale dos veces en journalctl
    except ValueError:
        pass  # ya quitado: idempotente
    destino = get_logger("klothulhu", Path(log_dir))
    raiz = logging.getLogger()
    if _manejador is not None:
        raiz.removeHandler(_manejador)
    _manejador = _PuenteLoguru(destino)
    raiz.addHandler(_manejador)
    if raiz.level == logging.NOTSET or raiz.level > logging.INFO:
        raiz.setLevel(logging.INFO)
