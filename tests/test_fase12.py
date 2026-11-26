"""Pruebas normativas de la fase 12, H1 (docs/fase12/PLAN.md, D65).

No editar: añadir en otro fichero.
Se copia tal cual a tests/test_fase12.py. Gasto 0: nada llama a la API.
"""
import os

os.environ.setdefault("KLOTHULHU_TOKENS", "fase12test:" + "x" * 16)
os.environ["KLOTHULHU_FAKE"] = "1"

import pytest  # noqa: E402
from pydantic import ValidationError  # noqa: E402

import app  # noqa: E402


def test_T1_tope_de_texto():
    assert app.ChatIn(text="x" * 4000).text == "x" * 4000
    with pytest.raises(ValidationError):
        app.ChatIn(text="x" * 4001)


def test_T2_varias_lineas():
    texto = "primera línea\n\nsegunda, tras una vacía\n" + "y" * 100
    assert app.ChatIn(text=texto).text == texto  # los saltos de línea llegan tal cual
