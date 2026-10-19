"""La búsqueda en paralelo de la memoria (D36, D44).

Corre mientras el narrador contesta el mensaje N; lo que trae entra en el contexto de la sesión y lo
ve el narrador en el mensaje N+1. Nunca lanza. Los logs llevan ids, sin texto del mensaje ni de los
recuerdos (D42); el texto va solo a `sesion.eventos`, que acaba en MariaDB.
"""
from __future__ import annotations

import asyncio
import logging
from datetime import datetime
from zoneinfo import ZoneInfo

log = logging.getLogger("klothulhu")

MADRID = ZoneInfo("Europe/Madrid")
CANDIDATOS = 3


async def buscar(texto: str, sesion, *, embedder, indice, juez, freno, umbral: float) -> None:
    try:
        if sesion.contexto is None:
            sesion.contexto = []
        if not await asyncio.to_thread(freno.permitido):
            return
        vector, uso = await embedder(texto)
        await asyncio.to_thread(freno.anotar, "embedding", *uso)
    except Exception as e:  # sin embedding no hay búsqueda; el mensaje se contesta igual
        log.warning("búsqueda: embedding fallido (%s)", type(e).__name__)
        return
    try:
        hits = await asyncio.to_thread(indice.consultar, vector, CANDIDATOS + len(sesion.contexto))
        ya = {r["id"] for r in sesion.contexto}
        for hit in [h for h in hits if h["id"] not in ya][:CANDIDATOS]:
            evento = {"tipo": "candidato", "recuerdo_id": hit["id"], "similitud": hit["similitud"],
                      "pertinente": None, "mensaje": texto, "cuando": datetime.now(MADRID)}
            sesion.eventos.append(evento)
            if hit["similitud"] < umbral or not await asyncio.to_thread(freno.permitido):
                continue
            try:
                pertinente, uso = await juez(texto, hit["texto"])
                await asyncio.to_thread(freno.anotar, "juez", *uso)
            except Exception as e:  # el candidato queda sin juzgar (pertinente = None)
                log.warning("búsqueda: juez fallido (%s)", type(e).__name__)
                continue
            evento["pertinente"] = pertinente
            if pertinente:
                sesion.contexto.append({k: v for k, v in hit.items() if k != "similitud"})
                log.info("F1 en sesión %s: recuerdo %s", sesion.id, hit["id"])
    except Exception as e:
        log.warning("búsqueda interrumpida (%s)", type(e).__name__)
