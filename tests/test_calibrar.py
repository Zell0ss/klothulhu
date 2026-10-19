"""La calibración (fase 7, H2, T8), sin API: lo puro y una pasada completa con falsos. No normativo."""
import asyncio
import importlib.util
import json
import sys
from pathlib import Path

import pytest

import escritor

RAIZ = Path(__file__).resolve().parent.parent
_spec = importlib.util.spec_from_file_location("memoria_calibrar", RAIZ / "scripts" / "memoria_calibrar.py")
cal = importlib.util.module_from_spec(_spec)
sys.modules["memoria_calibrar"] = cal
_spec.loader.exec_module(cal)


def test_umbral_deja_pasar_el_90_por_ciento():
    sims = [i / 100 for i in range(1, 21)]                # 20 pertinentes: se pueden perder 2
    t = cal.umbral_propuesto(sims)
    assert t == 0.03 and sum(s >= t for s in sims) / 20 >= 0.9
    assert sum(s >= 0.04 for s in sims) / 20 < 0.9        # el siguiente ya no cumple


def test_percentil_y_coseno():
    assert cal.percentil([1, 2, 3, 4], 50) == 2 and cal.percentil([], 50) is None
    assert cal.coseno([1, 0], [1, 0]) == pytest.approx(1) and cal.coseno([1, 0], [0, 1]) == 0
    assert cal.coseno([0, 0], [1, 0]) == 0


def test_fixture_es_coherente():
    d = json.loads((RAIZ / "tests" / "fixtures" / "calibracion.json").read_text(encoding="utf-8"))
    ids = {r["id"] for r in d["recuerdos"]}
    assert len(ids) == 12 and 25 <= len(d["mensajes"]) <= 35
    assert all(set(m["pertinentes"]) <= ids for m in d["mensajes"])
    assert any(not m["pertinentes"] for m in d["mensajes"]) and any(m["pertinentes"] for m in d["mensajes"])
    for c in d["charlas_repaso"]:
        assert set(c["contexto"]) <= ids


def test_pasada_completa_con_falsos(monkeypatch, tmp_path):
    monkeypatch.setenv("ANTHROPIC_API_KEY", "x")
    monkeypatch.setenv("OPENAI_API_KEY", "x")
    monkeypatch.setattr(cal, "SALIDA", tmp_path / "calibracion.json")

    async def embeber(texto):
        v = [0.0] * 8
        v[sum(map(ord, texto)) % 8] = 1.0
        v[(len(texto)) % 8] += 0.5
        return v, ("text-embedding-3-small", 10, 0)

    async def juzgar(mensaje, recuerdo):
        return True, ("claude-haiku-5-5", 100, 10)

    async def repasar(trans, contexto):
        return {"usados": [contexto[0]["id"]], "fallos": []}, ("claude-haiku-5-5", 200, 20)

    monkeypatch.setattr(escritor, "embeber", embeber)
    monkeypatch.setattr(escritor, "juzgar", juzgar)
    monkeypatch.setattr(escritor, "repasar", repasar)
    asyncio.run(cal.main())
    c = json.loads((tmp_path / "calibracion.json").read_text(encoding="utf-8"))
    assert c["umbral_propuesto"] is not None and len(c["parejas"]) == 12 * len(json.loads(
        (RAIZ / "tests" / "fixtures" / "calibracion.json").read_text(encoding="utf-8"))["mensajes"])
    assert c["juez"]["parejas"] == sum(p["juez"] is not None for p in c["parejas"])
    assert all(p["etiqueta"] in (True, False) for p in c["parejas"])
    assert len(c["repaso"]) == 2
    assert set(c["coste_por_modelo"]) == {"text-embedding-3-small", "claude-haiku-5-5"}
    assert c["latencia"]["embedding"]["n"] == 44
