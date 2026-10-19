#!/usr/bin/env python
"""[API] Escritor real (fase 7, H1, T10): cierra las cuatro charlas de `tests/fixtures/sesiones_muestra.json`
con Haiku y OpenAI reales, contra `klothulhu_test` / `klothulhu_memoria_test` (vaciadas al empezar).

Gasta dinero (unos $0,002; tope $0,05). Lo lanza Josem, con las claves en el entorno:

    ANTHROPIC_API_KEY=... OPENAI_API_KEY=... .venv/bin/python scripts/memoria_prueba.py

Guarda `docs/fase7/capturas/escritor_real.json`.
"""
from __future__ import annotations

import asyncio
import json
import os
import sys
from datetime import datetime
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(RAIZ / "server"))

import cierre  # noqa: E402
import escritor  # noqa: E402
import gasto  # noqa: E402
from memoria_bd import AlmacenMariaQdrant  # noqa: E402
from sesiones import Sesion  # noqa: E402

TOPE = 0.05
MUESTRA = RAIZ / "tests" / "fixtures" / "sesiones_muestra.json"
SALIDA = RAIZ / "docs" / "fase7" / "capturas" / "escritor_real.json"


def _almacen_test() -> AlmacenMariaQdrant:

    env = {}
    ruta = RAIZ / ".env"
    if ruta.exists():
        for linea in ruta.read_text(encoding="utf-8").splitlines():
            if "=" in linea and not linea.lstrip().startswith("#"):
                k, _, v = linea.partition("=")
                env[k.strip()] = v.strip()
    env.update({k: v for k, v in os.environ.items() if k.startswith("KLOTHULHU_DB_")})
    db = {
        "host": env.get("KLOTHULHU_DB_HOST", "localhost"),
        "port": int(env.get("KLOTHULHU_DB_PORT", "3306")),
        "user": env.get("KLOTHULHU_DB_USER", "klothulhu_dev"),
        "password": env.get("KLOTHULHU_DB_PASSWORD", ""),
        "database": "klothulhu_test",
    }  # fija: esta prueba nunca toca otra BD
    return AlmacenMariaQdrant(db, os.getenv("KLOTHULHU_QDRANT_URL", "http://localhost:6333"),
                              "klothulhu_memoria_test")


def _resumen(r: dict) -> dict:
    campos = ("texto", "importancia", "emocion", "fecha", "indexado")
    return {k: (str(r[k]) if k == "fecha" else r[k]) for k in campos}


async def main() -> None:
    faltan = [k for k in ("ANTHROPIC_API_KEY", "OPENAI_API_KEY") if not os.getenv(k)]
    if faltan:
        sys.exit(f"faltan en el entorno: {', '.join(faltan)}")
    alm = _almacen_test()
    alm.crear()
    alm.vaciar()
    print(f"BD {alm.nombre_bd} · colección {alm.coleccion} (vaciadas)")
    freno = gasto.Freno(TOPE, alm)

    captura: dict = {}
    embeddings: list = []

    async def escribir(trans, previos, hoy):
        salida, uso = await escritor.escribir(trans, previos, hoy)
        captura.update(previos=previos, salida_cruda=escritor.ultimo.get("texto"),
                       stop_reason=escritor.ultimo.get("stop_reason"), salida=salida,
                       tokens_escritor={"modelo": uso[0], "in": uso[1], "out": uso[2]})
        return salida, uso

    async def embeber(texto):
        vector, uso = await escritor.embeber(texto)
        embeddings.append({"modelo": uso[0], "in": uso[1], "out": uso[2]})
        return vector, uso

    sesiones_json = json.loads(MUESTRA.read_text(encoding="utf-8"))
    resultado = []
    for i, m in enumerate(sesiones_json, 1):
        captura.clear()
        embeddings.clear()
        antes = {r["id"] for r in alm.recuerdos()}
        sesion = Sesion(id=f"prueba-{i}", cliente=m["cliente"], turnos=[tuple(t) for t in m["turnos"]],
                        inicio=datetime.fromisoformat(m["inicio"]))
        n = await cierre.cerrar(sesion, almacen=alm, escritor=escribir, embedder=embeber, freno=freno)
        nuevos = [r for r in alm.recuerdos() if r["id"] not in antes]
        resultado.append({"sesion": m["nombre"], **captura, "tokens_embedding": list(embeddings),
                          "recuerdos_validados": [_resumen(r) for r in nuevos], "guardados": n})
        print(f"{m['nombre']}: {n} recuerdos (stop_reason={captura.get('stop_reason')})")
        for r in nuevos:
            print(f"   [{r['importancia']} {r['emocion']} {r['fecha'] or '-'}] {r['texto']}")

    por_modelo = {
        g["modelo"]: {"llamadas": g["llamadas"], "in": int(g["tokens_in"]), "out": int(g["tokens_out"]),
                      "coste": float(g["coste"])}
        for g in alm.gasto_desglose()
    }
    total = alm.gasto_total()
    SALIDA.parent.mkdir(parents=True, exist_ok=True)
    volcado = {"sesiones": resultado, "coste_por_modelo": por_modelo, "coste_total": total}
    SALIDA.write_text(json.dumps(volcado, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"coste total ${total:.6f} → {SALIDA.relative_to(RAIZ)}")


if __name__ == "__main__":
    asyncio.run(main())
