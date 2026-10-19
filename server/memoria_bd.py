"""Almacenes de la memoria larga: en memoria (pruebas) y MariaDB + Qdrant (D35).

Los dos cumplen el mismo contrato. Son síncronos: `cierre.cerrar()` los llama con `asyncio.to_thread`.
MariaDB es la fuente de verdad; Qdrant es un índice que se puede reconstruir (`indexado = 0` = falta).
"""
from __future__ import annotations

import logging
import uuid
from datetime import date, datetime
from pathlib import Path
from zoneinfo import ZoneInfo

from memoria import Recuerdo

log = logging.getLogger("klothulhu")

DIMENSION = 1536
ESQUEMA_SQL = Path(__file__).with_name("esquema.sql")
MADRID = ZoneInfo("Europe/Madrid")

# Una BD solo se abre con su colección: así una prueba o un script a mano nunca mezcla datos (plan §1).
PAREJAS = {
    "klothulhu_dev": "klothulhu_memoria_dev",
    "klothulhu_test": "klothulhu_memoria_test",
    "klothulhu": "klothulhu_memoria",
}


def _ahora() -> datetime:
    return datetime.now(MADRID).replace(tzinfo=None)


class AlmacenEnMemoria:
    def __init__(self) -> None:
        self._recuerdos: dict[str, dict] = {}
        self._dias: list[date] = []
        self._gasto: list[tuple] = []
        self._sesiones: list[dict] = []

    def guardar(self, *, sesion_id: str, cliente: str, recuerdo: Recuerdo, vector, creado_dia: int) -> str:
        rid = str(uuid.uuid4())
        self._recuerdos[rid] = {
            "id": rid, "texto": recuerdo.texto, "importancia": recuerdo.importancia,
            "emocion": recuerdo.emocion, "fecha": recuerdo.fecha, "sesion_id": sesion_id,
            "cliente": cliente, "creado_dia": creado_dia, "usos": 0, "ultimo_uso_dia": None,
            "indexado": vector is not None,
        }
        return rid

    def recuerdos(self) -> list[dict]:
        return [dict(r) for r in self._recuerdos.values()]

    def anotar_dia_uso(self, dia: date) -> int:
        if dia not in self._dias:
            self._dias.append(dia)
            self._dias.sort()
        return self._dias.index(dia) + 1

    def anotar_gasto(self, concepto: str, modelo: str, tokens_in: int, tokens_out: int, coste: float) -> None:
        self._gasto.append((concepto, modelo, tokens_in, tokens_out, coste))

    def gasto_total(self) -> float:
        return sum(g[4] for g in self._gasto)

    def anotar_sesion(self, *, id: str, cliente: str, inicio: datetime, motivo: str, turnos: int,
                      recuerdos: int, coste: float) -> None:
        self._sesiones.append({"id": id, "cliente": cliente, "inicio": inicio, "motivo": motivo,
                               "turnos": turnos, "recuerdos": recuerdos, "coste": coste})


class AlmacenMariaQdrant:
    """MariaDB (PyMySQL) y Qdrant, síncronos. Abre una conexión por operación: el tráfico es de una
    charla cada media hora, y así una BD que se reinicia no deja una conexión muerta."""

    def __init__(self, db: dict, qdrant_url: str, coleccion: str) -> None:
        nombre = db["database"]
        esperada = PAREJAS.get(nombre)
        if esperada is None or esperada != coleccion:
            # sin DROP ni escritura: se niega antes de abrir nada
            raise ValueError(f"BD {nombre!r} y colección {coleccion!r} no casan (esperada: {esperada!r})")
        from qdrant_client import QdrantClient

        self._db = {**db, "charset": "utf8mb4"}
        self._coleccion = coleccion
        self._qdrant = QdrantClient(url=qdrant_url)

    @property
    def nombre_bd(self) -> str:
        return self._db["database"]

    @property
    def coleccion(self) -> str:
        return self._coleccion

    def _conectar(self):
        import pymysql

        return pymysql.connect(**self._db, autocommit=True, cursorclass=pymysql.cursors.DictCursor)

    def _ejecutar(self, sql: str, params=()) -> list[dict]:
        con = self._conectar()
        try:
            with con.cursor() as cur:
                cur.execute(sql, params)
                return list(cur.fetchall())
        finally:
            con.close()

    def crear(self) -> None:
        """Aplica `esquema.sql` y crea la colección si no existe."""
        con = self._conectar()
        try:
            with con.cursor() as cur:
                for sentencia in filter(None, (s.strip() for s in _sin_comentarios(ESQUEMA_SQL).split(";"))):
                    cur.execute(sentencia)
        finally:
            con.close()
        if not self._qdrant.collection_exists(self._coleccion):
            from qdrant_client.models import Distance, VectorParams

            self._qdrant.create_collection(
                self._coleccion, vectors_config=VectorParams(size=DIMENSION, distance=Distance.COSINE)
            )

    def vaciar(self) -> None:
        """Solo para pruebas: se niega si la BD no acaba en `_test`."""
        if not self.nombre_bd.endswith("_test"):
            raise ValueError("vaciar() solo corre contra una BD _test")
        for tabla in ("recuerdos", "dias_uso", "memoria_gasto", "sesiones"):
            self._ejecutar(f"DELETE FROM {tabla}")  # noqa: S608 (nombres fijos)
        if self._qdrant.collection_exists(self._coleccion):
            self._qdrant.delete_collection(self._coleccion)
        self.crear()

    def guardar(self, *, sesion_id: str, cliente: str, recuerdo: Recuerdo, vector, creado_dia: int) -> str:
        rid = str(uuid.uuid4())
        creado = _ahora()
        indexado = False
        if vector is not None:
            try:
                from qdrant_client.models import PointStruct

                self._qdrant.upsert(self._coleccion, points=[PointStruct(id=rid, vector=vector, payload={
                    "texto": recuerdo.texto, "importancia": recuerdo.importancia, "emocion": recuerdo.emocion,
                    "fecha": recuerdo.fecha.isoformat() if recuerdo.fecha else None,
                    "creado": creado.isoformat(),
                })])
                indexado = True
            except Exception as e:  # D35: se guarda igual, sin indexar
                log.warning("qdrant no acepta %s (%s): se guarda sin indexar", rid, type(e).__name__)
        self._ejecutar(
            "INSERT INTO recuerdos (id, texto, importancia, emocion, fecha, sesion_id, cliente, creado,"
            " creado_dia, indexado) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)",
            (rid, recuerdo.texto, recuerdo.importancia, recuerdo.emocion, recuerdo.fecha, sesion_id, cliente,
             creado, creado_dia, indexado),
        )
        return rid

    def recuerdos(self) -> list[dict]:
        filas = self._ejecutar(
            "SELECT id, texto, importancia, emocion, fecha, sesion_id, cliente, creado, creado_dia, usos,"
            " ultimo_uso_dia, indexado FROM recuerdos WHERE borrado IS NULL ORDER BY creado"
        )
        for f in filas:
            f["indexado"] = bool(f["indexado"])
        return filas

    def anotar_dia_uso(self, dia: date) -> int:
        self._ejecutar("INSERT IGNORE INTO dias_uso (dia) VALUES (%s)", (dia,))
        return self._ejecutar("SELECT COUNT(*) AS n FROM dias_uso WHERE dia <= %s", (dia,))[0]["n"]

    def anotar_gasto(self, concepto: str, modelo: str, tokens_in: int, tokens_out: int, coste: float) -> None:
        self._ejecutar(
            "INSERT INTO memoria_gasto (cuando, concepto, modelo, tokens_in, tokens_out, coste)"
            " VALUES (%s,%s,%s,%s,%s,%s)",
            (_ahora(), concepto, modelo, tokens_in, tokens_out, coste),
        )

    def gasto_total(self) -> float:
        return float(self._ejecutar("SELECT COALESCE(SUM(coste), 0) AS t FROM memoria_gasto")[0]["t"])

    def anotar_sesion(self, *, id: str, cliente: str, inicio: datetime, motivo: str, turnos: int,
                      recuerdos: int, coste: float) -> None:
        if inicio.tzinfo is not None:
            inicio = inicio.astimezone(MADRID).replace(tzinfo=None)
        self._ejecutar(
            "INSERT INTO sesiones (id, cliente, inicio, cierre, motivo, turnos, recuerdos, coste)"
            " VALUES (%s,%s,%s,%s,%s,%s,%s,%s)",
            (id, cliente, inicio, _ahora(), motivo, turnos, recuerdos, coste),
        )

    def gasto_desglose(self) -> list[dict]:
        return self._ejecutar(
            "SELECT concepto, modelo, COUNT(*) AS llamadas, SUM(tokens_in) AS tokens_in,"
            " SUM(tokens_out) AS tokens_out, SUM(coste) AS coste FROM memoria_gasto GROUP BY concepto, modelo"
        )

    def sin_indexar(self) -> list[dict]:
        return self._ejecutar(
            "SELECT id, texto, importancia, emocion, fecha, creado FROM recuerdos"
            " WHERE indexado = 0 AND borrado IS NULL"
        )

    def indexar(self, rid: str, vector, payload: dict) -> None:
        """Sube a Qdrant un recuerdo ya guardado y lo marca indexado."""
        from qdrant_client.models import PointStruct

        self._qdrant.upsert(self._coleccion, points=[PointStruct(id=rid, vector=vector, payload=payload)])
        self._ejecutar("UPDATE recuerdos SET indexado = 1 WHERE id = %s", (rid,))


def _sin_comentarios(ruta: Path) -> str:
    lineas = []
    for linea in ruta.read_text(encoding="utf-8").splitlines():
        # los comentarios `--` van tras el código o en su propia línea; ningún literal del esquema los lleva
        lineas.append(linea.split("--", 1)[0])
    return "\n".join(lineas)
