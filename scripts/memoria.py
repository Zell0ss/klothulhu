#!/usr/bin/env python
"""Herramienta de la memoria larga: crear el esquema, ver los recuerdos y el gasto, reindexar.

    .venv/bin/python scripts/memoria.py [--env-file RUTA] {crear,listar,gasto,reindexar}

La primera línea de la salida dice siempre qué BD y qué colección usa.
"""
from __future__ import annotations

import argparse
import asyncio
import os
import sys
from datetime import datetime
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(RAIZ / "server"))

import escritor  # noqa: E402
import memoria  # noqa: E402
from memoria_bd import AlmacenMariaQdrant  # noqa: E402


def _cargar_env(ruta: Path) -> None:
    """KEY=valor por línea; el entorno ya puesto manda sobre el fichero."""
    for linea in ruta.read_text(encoding="utf-8").splitlines():
        linea = linea.strip()
        if not linea or linea.startswith("#") or "=" not in linea:
            continue
        k, _, v = linea.partition("=")
        os.environ.setdefault(k.strip(), v.strip().strip("'\""))


def _almacen() -> AlmacenMariaQdrant:
    db = {
        "host": os.getenv("KLOTHULHU_DB_HOST", "localhost"),
        "port": int(os.getenv("KLOTHULHU_DB_PORT", "3306")),
        "user": os.getenv("KLOTHULHU_DB_USER", "klothulhu_dev"),
        "password": os.getenv("KLOTHULHU_DB_PASSWORD", ""),
        "database": os.getenv("KLOTHULHU_DB_NAME", "klothulhu_dev"),
    }
    alm = AlmacenMariaQdrant(
        db, os.getenv("KLOTHULHU_QDRANT_URL", "http://localhost:6333"),
        os.getenv("KLOTHULHU_QDRANT_COLECCION", "klothulhu_memoria_dev"),
    )
    print(f"BD {alm.nombre_bd} · colección {alm.coleccion}")
    return alm


def _listar(alm: AlmacenMariaQdrant) -> None:
    rs = alm.recuerdos()
    dia = (max((r["creado_dia"] for r in rs), default=1))  # sin días de uso reales aquí: el último visto
    filas = []
    for r in rs:
        ultimo = r["ultimo_uso_dia"] if r["ultimo_uso_dia"] is not None else r["creado_dia"]
        f = memoria.fuerza(r["importancia"], r["emocion"], dia - ultimo, r["usos"])
        filas.append((f, r))
    filas.sort(key=lambda x: x[0], reverse=True)
    print(f"{len(rs)} recuerdos (fuerza calculada en el día de uso {dia})")
    print("id        fuerza imp emoción   fecha       usos idx creado             texto")
    for f, r in filas:
        idx = "sí" if r["indexado"] else "no"
        print(f"{r['id'][:8]}  {f:5.2f}  {r['importancia']:>3} {r['emocion']:<9} {r['fecha'] or '-'!s:<11} "
              f"{r['usos']:>4} {idx:>3} {r['creado']:%Y-%m-%d %H:%M}  {r['texto']}")


def _gasto(alm: AlmacenMariaQdrant) -> None:
    print(f"total: ${alm.gasto_total():.6f}")
    for g in alm.gasto_desglose():
        print(f"  {g['concepto']:<10} {g['modelo']:<24} {g['llamadas']:>4} llamadas  "
              f"in={g['tokens_in']} out={g['tokens_out']}  ${float(g['coste']):.6f}")


def _reindexar(alm: AlmacenMariaQdrant) -> None:
    pendientes = alm.sin_indexar()
    print(f"{len(pendientes)} recuerdos sin indexar")
    hechos = 0
    for r in pendientes:
        try:
            vector, uso = asyncio.run(escritor.embeber(r["texto"]))
            alm.anotar_gasto("embedding", uso[0], uso[1], uso[2], _coste(uso))
            creado = r["creado"] if isinstance(r["creado"], datetime) else None
            alm.indexar(r["id"], vector, {
                "texto": r["texto"], "importancia": r["importancia"], "emocion": r["emocion"],
                "fecha": r["fecha"].isoformat() if r["fecha"] else None,
                "creado": creado.isoformat() if creado else None,
            })
            hechos += 1
        except Exception as e:
            print(f"  {r['id'][:8]}: falla ({type(e).__name__})")
    print(f"{hechos} indexados")


def _coste(uso) -> float:
    import gasto

    return gasto.coste(*uso)


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--env-file", type=Path, default=RAIZ / ".env")
    ap.add_argument("orden", choices=["crear", "listar", "gasto", "reindexar"])
    args = ap.parse_args()
    if args.env_file.exists():
        _cargar_env(args.env_file)
    alm = _almacen()
    {"crear": lambda a: (a.crear(), print("esquema y colección listos")), "listar": _listar,
     "gasto": _gasto, "reindexar": _reindexar}[args.orden](alm)


if __name__ == "__main__":
    main()
