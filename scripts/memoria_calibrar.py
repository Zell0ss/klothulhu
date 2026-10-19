#!/usr/bin/env python
"""[API] Calibración del umbral de la búsqueda (fase 7, H2, T8; D44). Sin BD.

Embebe los recuerdos y los mensajes de `tests/fixtures/calibracion.json`, calcula la similitud de cada
pareja y la separa por la etiqueta (pertinente o no), propone el umbral más alto que deja pasar al menos
el 90 % de las pertinentes, pasa por el juez las parejas que lo superan, pasa el repaso por dos charlas de
muestra y mide la latencia del embedding y la del juez.

Gasta dinero (unos $0,003; tope $0,05). Lo lanza Josem, con las claves en el entorno:

    ANTHROPIC_API_KEY=... OPENAI_API_KEY=... .venv/bin/python scripts/memoria_calibrar.py

Guarda `docs/fase7/capturas/calibracion.json`.
"""
from __future__ import annotations

import asyncio
import json
import math
import os
import sys
import time
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(RAIZ / "server"))

import escritor  # noqa: E402
import gasto  # noqa: E402

TOPE = 0.05
MINIMO_PASAN = 0.90  # fracción de pertinentes que debe dejar pasar el umbral
FIXTURE = RAIZ / "tests" / "fixtures" / "calibracion.json"
SALIDA = RAIZ / "docs" / "fase7" / "capturas" / "calibracion.json"


def coseno(a: list[float], b: list[float]) -> float:
    na, nb = math.sqrt(sum(x * x for x in a)), math.sqrt(sum(x * x for x in b))
    return sum(x * y for x, y in zip(a, b, strict=True)) / (na * nb) if na and nb else 0.0


def percentil(valores: list[float], p: float) -> float | None:
    if not valores:
        return None
    v = sorted(valores)
    return v[min(len(v) - 1, max(0, math.ceil(p / 100 * len(v)) - 1))]


def distribucion(sims: list[float]) -> dict:
    if not sims:
        return {"n": 0}
    pcts = {f"p{p}": percentil(sims, p) for p in (10, 25, 50, 75, 90)}
    return {"n": len(sims), "min": min(sims), **pcts, "max": max(sims)}


def umbral_propuesto(pertinentes: list[float], minimo: float = MINIMO_PASAN) -> float:
    """El umbral más alto que deja pasar al menos `minimo` de las pertinentes: se pueden perder, como mucho,
    las `floor((1 - minimo) * n)` más bajas, y el umbral es la similitud de la siguiente."""
    v = sorted(pertinentes)
    perdidas = int((1 - minimo) * len(v) + 1e-9)
    return v[perdidas]


class Cuenta:
    """Gasto acumulado por modelo; corta antes de pasar el tope."""

    def __init__(self) -> None:
        self.por_modelo: dict[str, dict] = {}

    def anotar(self, uso: tuple[str, int, int]) -> None:
        modelo, i, o = uso
        m = self.por_modelo.setdefault(modelo, {"llamadas": 0, "in": 0, "out": 0, "coste": 0.0})
        m["llamadas"] += 1
        m["in"] += i
        m["out"] += o
        m["coste"] += gasto.coste(modelo, i, o)
        if self.total > TOPE:
            sys.exit(f"tope de ${TOPE} superado (${self.total:.4f}): parada")

    @property
    def total(self) -> float:
        return sum(m["coste"] for m in self.por_modelo.values())


def latencias(ms: list[float]) -> dict:
    return {"n": len(ms), "p50_ms": percentil(ms, 50), "p95_ms": percentil(ms, 95),
            "max_ms": max(ms) if ms else None}


async def main() -> None:
    faltan = [k for k in ("ANTHROPIC_API_KEY", "OPENAI_API_KEY") if not os.getenv(k)]
    if faltan:
        sys.exit(f"faltan en el entorno: {', '.join(faltan)}")
    datos = json.loads(FIXTURE.read_text(encoding="utf-8"))
    recuerdos = {r["id"]: r["texto"] for r in datos["recuerdos"]}
    cuenta = Cuenta()
    lat_emb: list[float] = []

    async def embeber(texto: str) -> list[float]:
        t = time.perf_counter()
        vector, uso = await escritor.embeber(texto)
        lat_emb.append((time.perf_counter() - t) * 1000)
        cuenta.anotar(uso)
        return vector

    vec_r = {i: await embeber(t) for i, t in recuerdos.items()}
    vec_m = [await embeber(m["texto"]) for m in datos["mensajes"]]

    parejas = []
    for m, vm in zip(datos["mensajes"], vec_m, strict=True):
        for rid, vr in vec_r.items():
            parejas.append({"mensaje": m["texto"], "recuerdo_id": rid, "recuerdo": recuerdos[rid],
                            "similitud": coseno(vm, vr), "etiqueta": rid in m["pertinentes"],
                            "juez": None, "juez_ms": None})
    pert = [p["similitud"] for p in parejas if p["etiqueta"]]
    no_pert = [p["similitud"] for p in parejas if not p["etiqueta"]]
    umbral = umbral_propuesto(pert)
    print(f"{len(pert)} parejas pertinentes, {len(no_pert)} no; umbral propuesto {umbral:.3f}")

    lat_juez: list[float] = []
    for p in (p for p in parejas if p["similitud"] >= umbral):
        t = time.perf_counter()
        p["juez"], uso = await escritor.juzgar(p["mensaje"], p["recuerdo"])
        p["juez_ms"] = (time.perf_counter() - t) * 1000
        lat_juez.append(p["juez_ms"])
        cuenta.anotar(uso)
    juzgadas = [p for p in parejas if p["juez"] is not None]
    aciertos = sum(p["juez"] == p["etiqueta"] for p in juzgadas)
    matriz = {
        "verdaderos_positivos": sum(p["juez"] and p["etiqueta"] for p in juzgadas),
        "falsos_positivos": sum(p["juez"] and not p["etiqueta"] for p in juzgadas),
        "falsos_negativos": sum((not p["juez"]) and p["etiqueta"] for p in juzgadas),
        "verdaderos_negativos": sum((not p["juez"]) and not p["etiqueta"] for p in juzgadas),
        "pertinentes_bajo_el_umbral": sum(p["etiqueta"] and p["similitud"] < umbral for p in parejas),
    }

    repasos = []
    for c in datos["charlas_repaso"]:
        contexto = [{"id": i, "texto": recuerdos[i]} for i in c["contexto"]]
        trans = "\n".join(f"Mortal: {u}\nKlothulhu: {k}" for u, k in c["turnos"])
        salida, uso = await escritor.repasar(trans, contexto)
        cuenta.anotar(uso)
        repasos.append({"charla": c["nombre"], "salida": salida, "esperado": c["esperado"],
                        "tokens": {"in": uso[1], "out": uso[2]}})

    captura = {
        "umbral_propuesto": umbral,
        "criterio": f"el más alto que deja pasar al menos el {MINIMO_PASAN:.0%} de las pertinentes",
        "distribucion": {"pertinentes": distribucion(pert), "no_pertinentes": distribucion(no_pert)},
        "juez": {"parejas": len(juzgadas), "aciertos": aciertos, **matriz},
        "latencia": {"embedding": latencias(lat_emb), "juez": latencias(lat_juez)},
        "repaso": repasos,
        "coste_por_modelo": cuenta.por_modelo,
        "coste_total": cuenta.total,
        "parejas": sorted(parejas, key=lambda p: -p["similitud"]),
    }
    SALIDA.parent.mkdir(parents=True, exist_ok=True)
    SALIDA.write_text(json.dumps(captura, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"juez: {aciertos}/{len(juzgadas)} aciertos · coste total ${cuenta.total:.6f}")
    print(f"captura: {SALIDA}")


if __name__ == "__main__":
    asyncio.run(main())
