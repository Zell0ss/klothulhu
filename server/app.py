"""Klothulhu companion API.

One endpoint streams a reply as Server-Sent Events with this contract:

    event: emotion  data: {"emotion": "happy"}      always first, may repeat
    event: delta    data: {"text": "..."}           text chunks, tags removed
    event: searching  data: {}                      the narrator launched a web search (D58); may repeat
    event: sources    data: {"items": [{"title": "...", "url": "https://..."}], "kind": "consultadas"}
                                                    once, after the text and before the scenes, only if it
                                                    cited something (D60) or, with no citations, read
                                                    something (D61: then "kind" is there; with citations it
                                                    is not); the history never keeps it (D59)
    event: scene    data: {"index": 0, "total": 2, "emotion": "smug", "caption": "...", "scene": {...} | null}
    event: done     data: {"turns": 3}              reply finished and stored
    event: error    data: {"code": "upstream_error"}

After the narrator's text, one ``scene`` per beat (D13), staged by the director (D14) and sent as soon
as each one is ready (D19). ``scene`` is a FablesScene, or null when the director is off, fails or
returns something invalid: the client then falls back to its own staging. Scenes never enter the
history. Clients that do not know ``scene`` ignore it.

Request (POST /chat, phase 10, D56)::

    {"text": "...", "image": {"media_type": "image/jpeg", "data": "<base64>"}}

``text`` may be empty only when there is an ``image`` (one per message; jpeg, png, webp or gif, at most
``imagen.MAX_BYTES`` decoded). Errors: 422 ``empty`` / ``image_type`` / ``image_base64`` /
``image_mismatch``, 413 ``image_size``. The narrator sees the image and it stays in the short history
while its turn is among the last ones (D57); the long-term memory and the director only see a line of
text saying there was an image. It is never written to disk or to the logs.

Clients render; all model and parsing logic lives here.
"""
from __future__ import annotations

import asyncio
import hmac
import json
import logging
import os
import random
from collections.abc import AsyncIterator
from contextlib import aclosing, asynccontextmanager
from pathlib import Path

from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

import buscaweb
import busqueda
import cierre
import director
import escritor
import gasto
import imagen
import memoria
from beats import is_cut, tramos
from emotion_parser import EMOTIONS, EmotionStreamParser
from history import HistoryStore
from sesiones import Sesion, Sesiones

log = logging.getLogger("klothulhu")
if os.getenv("LOGCENTRAL_LOG_DIR"):
    import registro

    registro.configurar(os.environ["LOGCENTRAL_LOG_DIR"])  # D42
else:
    logging.basicConfig(level=os.getenv("KLOTHULHU_LOG_LEVEL", "INFO"))

# D57 (la imagen nunca sale en los logs) y D42 (con LogCentral los logs acaban en Grafana Cloud): en DEBUG,
# el SDK de Anthropic vuelca la petición entera, con el base64 de la imagen. Que se cumpla no puede depender
# de que nadie suba el nivel: las librerías se quedan en INFO como mínimo (o más alto, si la raíz ya lo está).
# `httpx2` y `httpcore2` son los nombres que usa el SDK 1.15; `httpx` y `httpcore`, por si se cambia o se
# inyecta otro cliente.
_LOGGERS_DE_LIBRERIAS = ("anthropic", "httpx", "httpx2", "httpcore", "httpcore2")


def _acotar_loggers_de_librerias() -> None:
    nivel = max(logging.INFO, logging.getLogger().getEffectiveLevel())
    for nombre in _LOGGERS_DE_LIBRERIAS:
        logging.getLogger(nombre).setLevel(nivel)


_acotar_loggers_de_librerias()

# --- settings -------------------------------------------------------------

MODEL = os.getenv("KLOTHULHU_MODEL", "claude-haiku-5-5")
EFFORT = os.getenv("KLOTHULHU_EFFORT", "low")
MAX_TOKENS = int(os.getenv("KLOTHULHU_MAX_TOKENS", "1024"))  # el pensamiento cuenta para el tope
DIRECTOR_ENABLED = os.getenv("KLOTHULHU_DIRECTOR", "1") == "1"
DIRECTOR_MODEL = os.getenv("KLOTHULHU_DIRECTOR_MODEL", "claude-haiku-5-5")
DIRECTOR_EFFORT = os.getenv("KLOTHULHU_DIRECTOR_EFFORT", "low")
DIRECTOR_THINKING = os.getenv("KLOTHULHU_DIRECTOR_THINKING", "0") == "1"  # off by default (D20)
DIRECTOR_TIMEOUT = float(os.getenv("KLOTHULHU_DIRECTOR_TIMEOUT", "10"))
HISTORY_TURNS = int(os.getenv("KLOTHULHU_HISTORY_TURNS", "6"))
HISTORY_TTL_MIN = float(os.getenv("KLOTHULHU_HISTORY_TTL_MIN", "30"))
FAKE = os.getenv("KLOTHULHU_FAKE", "0") == "1"
MEMORIA = os.getenv("KLOTHULHU_MEMORIA", "0") == "1"  # memoria larga (fase 7): apagada por defecto
MEMORIA_TOPE = float(os.getenv("KLOTHULHU_MEMORIA_TOPE", "1.0"))
UMBRAL = float(os.getenv("KLOTHULHU_MEMORIA_UMBRAL", str(memoria.UMBRAL)))  # D44
DB_CONFIG = {
    "host": os.getenv("KLOTHULHU_DB_HOST", "localhost"),
    "port": int(os.getenv("KLOTHULHU_DB_PORT", "3306")),
    "user": os.getenv("KLOTHULHU_DB_USER", "klothulhu_dev"),
    "password": os.getenv("KLOTHULHU_DB_PASSWORD", ""),
    "database": os.getenv("KLOTHULHU_DB_NAME", "klothulhu_dev"),
}
QDRANT_URL = os.getenv("KLOTHULHU_QDRANT_URL", "http://localhost:6333")
QDRANT_COLECCION = os.getenv("KLOTHULHU_QDRANT_COLECCION", "klothulhu_memoria_dev")
BARRIDO_S = 60  # cada cuánto se miran las sesiones caducadas (D41)
APAGADO_S = 20  # lo que se concede a cerrar todas al parar (D41)
BUSQUEDA_TOPE = int(os.getenv("KLOTHULHU_BUSQUEDA_TOPE", str(buscaweb.TOPE_DIA)))  # D58; 0 = apagada
PROMPT_PATH = Path(os.getenv("KLOTHULHU_PROMPT", Path(__file__).with_name("prompt.md")))


def _parse_tokens(raw: str) -> dict[str, str]:
    """``konnos:secret1,pi:secret2`` -> {"secret1": "konnos", ...}"""
    tokens: dict[str, str] = {}
    for pair in filter(None, (p.strip() for p in raw.split(","))):
        client_id, _, secret = pair.partition(":")
        if not client_id or len(secret) < 16:
            raise RuntimeError(f"Bad KLOTHULHU_TOKENS entry for {client_id!r}: secret must be >= 16 chars")
        tokens[secret] = client_id
    return tokens


TOKENS = _parse_tokens(os.getenv("KLOTHULHU_TOKENS", ""))
if not TOKENS:
    # Fail closed: never serve without auth, even inside the tailnet.
    raise RuntimeError("KLOTHULHU_TOKENS is empty; refusing to start")

SYSTEM_PROMPT = PROMPT_PATH.read_text(encoding="utf-8")
VOCAB = director.load_vocab()
history = HistoryStore(HISTORY_TURNS, HISTORY_TTL_MIN * 60)
sesiones = Sesiones(HISTORY_TTL_MIN * 60)  # siempre existe; solo se llena con MEMORIA (D41)
_almacen = None  # se abre en lifespan, con MEMORIA
_freno: gasto.Freno | None = None
_busquedas: set[asyncio.Task] = set()  # las búsquedas en curso (D36), para esperarlas al parar
_locks: dict[str, asyncio.Lock] = {}
_cuota = buscaweb.Cuota(BUSQUEDA_TOPE)  # búsquedas web que quedan hoy (D58); en memoria del proceso

_anthropic = None
if not FAKE:
    from anthropic import AsyncAnthropic

    _anthropic = AsyncAnthropic()  # reads ANTHROPIC_API_KEY
    _acotar_loggers_de_librerias()  # el SDK pone DEBUG al importarse con ANTHROPIC_LOG=debug (D57)



async def _cerrar_sesion(sesion, motivo: str) -> None:
    escribir, embeber = (escritor.escribir_falso, escritor.embeber_falso) if FAKE else (
        escritor.escribir, escritor.embeber)
    repasar = escritor.repasar_falso if FAKE else escritor.repasar
    await cierre.cerrar(sesion, almacen=_almacen, escritor=escribir, embedder=embeber, freno=_freno,
                        motivo=motivo, repasador=repasar)


def _system(sesion: Sesion | None):
    """El prompt del narrador. Con memoria, un bloque más: fecha o recuerdos, y el autorretrato (D48)."""
    if sesion is None:
        return SYSTEM_PROMPT
    hoy = sesion.inicio.date()  # D47: hoy es siempre el día de inicio de la sesión, sin hora
    contexto = sesion.contexto or []
    arriba = memoria.bloque(contexto, sesion.dia, hoy) if contexto else memoria.cabecera(hoy)
    texto = arriba + "\n\n" + memoria.autorretrato(sesion.total, len(contexto))  # D48
    return [{"type": "text", "text": SYSTEM_PROMPT}, {"type": "text", "text": texto}]


async def _preparar_memoria(cid: str, text: str) -> Sesion:
    """Con MEMORIA: la sesión del cliente, su foto de recuerdos si es nueva (D43) y la búsqueda en
    paralelo para el mensaje siguiente (D36). Nunca lanza. Sin texto (solo imagen, D57) la sesión se abre
    igual, pero no se busca."""
    sesion = sesiones.actual(cid)
    if sesion.contexto is None:
        hoy = sesion.inicio.date()
        try:
            if _almacen is None:
                raise RuntimeError("sin almacén")
            sesion.dia = await asyncio.to_thread(_almacen.anotar_dia_uso, hoy)
            rs = await asyncio.to_thread(_almacen.recuerdos)
            sesion.total = len(rs)  # D48: la lista que ya se lee para la foto, sin consulta nueva
            sesion.contexto = memoria.contexto_inicial(rs, sesion.dia, hoy)
        except Exception as e:  # sin recuerdos, klothulhu contesta igual
            log.warning("memoria: sin contexto para la sesión %s (%s)", sesion.id, type(e).__name__)
            sesion.contexto = []
    if text and _almacen is not None and _freno is not None:
        embeber, juzgar = (escritor.embeber_falso, escritor.juzgar_falso) if FAKE else (
            escritor.embeber, escritor.juzgar)
        tarea = asyncio.create_task(busqueda.buscar(
            text, sesion, embedder=embeber, indice=_almacen, juez=juzgar, freno=_freno, umbral=UMBRAL))
        _busquedas.add(tarea)
        tarea.add_done_callback(_busquedas.discard)
    return sesion


async def _barrido(parar: asyncio.Event) -> None:
    """Cierra las sesiones caducadas cada BARRIDO_S. Nunca se cancela a mitad de un cierre: la parada
    se pide con el evento y se mira entre sesión y sesión (R3)."""
    while not parar.is_set():
        try:
            await asyncio.wait_for(parar.wait(), BARRIDO_S)
        except TimeoutError:
            pass
        for s in sesiones.vencidas():
            await _cerrar_sesion(s, "ttl")  # las que saca las cierra todas, aunque llegue la parada


async def _apagar(tarea: asyncio.Task, parar: asyncio.Event) -> None:
    """D41: acaba el cierre en curso y cierra las abiertas, todo dentro de APAGADO_S."""

    abiertas: list = []

    async def cerrar_todo():
        parar.set()
        pendientes = list(_busquedas)
        for b in pendientes:
            b.cancel()
        if pendientes:
            await asyncio.wait(pendientes, timeout=2)  # D36: como mucho 2 s dentro de APAGADO_S
        await tarea
        abiertas.extend(sesiones.todas())
        while abiertas:
            await _cerrar_sesion(abiertas[0], "apagado")
            abiertas.pop(0)

    try:
        await asyncio.wait_for(cerrar_todo(), APAGADO_S)
    except TimeoutError:
        log.warning("apagado: no dio tiempo; %d sesiones sin cerrar", len(abiertas) + len(sesiones.todas()))


@asynccontextmanager
async def lifespan(_app: FastAPI):
    global MEMORIA, _almacen, _freno
    tarea = None
    if MEMORIA:
        try:
            from memoria_bd import AlmacenMariaQdrant

            _almacen = await asyncio.to_thread(AlmacenMariaQdrant, DB_CONFIG, QDRANT_URL, QDRANT_COLECCION)
            await asyncio.to_thread(_almacen.gasto_total)  # falla pronto si la BD está caída
            _freno = gasto.Freno(MEMORIA_TOPE, _almacen)
            parar = asyncio.Event()
            tarea = asyncio.create_task(_barrido(parar))
        except Exception as e:  # BD caída: klothulhu sigue contestando, sin memoria en este proceso
            log.error("memoria apagada: no abre el almacén (%s)", type(e).__name__)
            MEMORIA = False
    try:
        yield
    finally:
        if tarea is not None:
            await _apagar(tarea, parar)


app = FastAPI(title="klothulhu-api", docs_url=None, redoc_url=None, lifespan=lifespan)

# --- auth -----------------------------------------------------------------


def client_id(authorization: str = Header(default="")) -> str:
    scheme, _, presented = authorization.partition(" ")
    if scheme.lower() == "bearer":
        for secret, cid in TOKENS.items():
            if hmac.compare_digest(presented.encode(), secret.encode()):
                return cid
    raise HTTPException(status_code=401, detail="invalid token")


# --- routes ---------------------------------------------------------------


class ImagenIn(BaseModel):
    # Sin max_length en `data`: el 422 de Pydantic devolvería la imagen entera en el cuerpo del error.
    # Se valida a mano en imagen.validar (D56).
    media_type: str
    data: str


class ChatIn(BaseModel):
    text: str = Field(default="", max_length=1000)  # vacío solo si hay imagen (lo mira chat())
    image: ImagenIn | None = None


@app.get("/health")
async def health() -> dict:
    return {
        "ok": True,
        "fake": FAKE,
        "model": MODEL,
        "emotions": EMOTIONS,
        "director": {"enabled": DIRECTOR_ENABLED, "model": DIRECTOR_MODEL},
        "memoria": {"enabled": MEMORIA, "frenada": MEMORIA and _freno is not None and _freno.frenado},
        "sesiones": sesiones.cuantas(),
    }


@app.delete("/history")
async def forget(cid: str = Depends(client_id)) -> dict:
    history.clear(cid)
    sesiones.olvidar(cid)  # D37: Forget tira la sesión sin escribir recuerdos
    return {"cleared": cid}


@app.post("/chat")
async def chat(body: ChatIn, cid: str = Depends(client_id)) -> StreamingResponse:
    text = body.text.strip()
    image = None
    if body.image is None:
        if not text:
            raise HTTPException(status_code=422, detail="empty")
    else:
        try:
            raw = imagen.validar(body.image.media_type, body.image.data)
        except imagen.ImagenInvalida as e:
            raise HTTPException(status_code=413 if e.code == "image_size" else 422, detail=e.code) from None
        log.info("chat %s: imagen %s, %d bytes", cid, body.image.media_type, len(raw))  # D42: nunca `data`
        image = (body.image.media_type, body.image.data)
    lock = _locks.setdefault(cid, asyncio.Lock())
    if lock.locked():
        raise HTTPException(status_code=409, detail="busy")
    return StreamingResponse(
        _reply(cid, text, lock, image=image),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


# --- generation -----------------------------------------------------------


def _sse(event: str, data: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"


async def _reply(
    cid: str, text: str, lock: asyncio.Lock, image: tuple[str, str] | None = None
) -> AsyncIterator[str]:
    """``image`` es (media_type, base64) ya validado (D56). El narrador y el historial reciben el contenido
    con la imagen; la memoria larga y el director, solo un texto que dice que la hubo (D57)."""
    async with lock:
        contenido = imagen.contenido(text, *image) if image else text
        para_otros = imagen.texto_memoria(text) if image else text
        parser = EmotionStreamParser()
        raw: list[str] = []
        shown = ""  # texto sin etiquetas, como lo reconstruye el cliente
        fuentes = None  # lo que el narrador citó al buscar (D60); nunca entra en el historial (D59)
        marks: list[tuple[int, str]] = []

        def emit(events):
            nonlocal shown
            out = []
            for kind, payload in events:
                if kind == "emotion":
                    marks.append((len(shown), payload))
                    out.append(_sse(kind, {"emotion": payload}))
                else:
                    shown += payload
                    out.append(_sse(kind, {"text": payload}))
            return out

        try:
            sesion = await _preparar_memoria(cid, text) if MEMORIA else None
            try:
                system = _system(sesion)  # también con FAKE: así se puede ver lo que vería el narrador
            except Exception as e:  # la memoria nunca tumba la respuesta
                log.warning("memoria: sin bloque de recuerdos (%s)", type(e).__name__)
                system = SYSTEM_PROMPT
            if FAKE:
                if image:
                    source = _fake_image_stream(image[1])
                elif text.lstrip().lower().startswith("busca"):
                    source = _fake_busca_stream()
                else:
                    source = _fake_stream()
            else:
                source = _model_stream(cid, contenido, system)
            async for chunk in source:
                if chunk is buscaweb.BUSCANDO:
                    yield _sse("searching", {})
                    continue
                if isinstance(chunk, buscaweb.Fuentes):
                    fuentes = chunk
                    continue
                raw.append(chunk)
                for line in emit(parser.feed(chunk)):
                    yield line
            for line in emit(parser.flush()):
                yield line
            if fuentes is not None and fuentes.items:
                datos = {"items": fuentes.items}
                if fuentes.tipo == "consultadas":
                    datos["kind"] = "consultadas"  # D61
                yield _sse("sources", datos)  # antes de las escenas (D60)
        except Exception:  # noqa: BLE001 - any upstream failure becomes an event
            log.exception("generation failed for %s", cid)
            yield _sse("error", {"code": "upstream_error"})
            return
        if parser.unknown_tags:
            log.warning("unknown emotion tags from model: %s", parser.unknown_tags)
        # Only complete replies enter history; tags are kept so the model
        # keeps seeing the format it is expected to follow.
        history.append(cid, contenido, "".join(raw))  # D57: con la imagen, mientras quede en las 6 vueltas
        if MEMORIA:
            sesiones.anotar(cid, para_otros, "".join(raw))
        bs = tramos(shown, marks)  # D24: una escena por tramo, no por golpe de 70
        sent = 0
        last = None  # la última escena emitida, ya corregida (D23)
        stats = {"continuations": 0, "fixed_backdrop": 0, "fixed_hero": 0}
        if bs and DIRECTOR_ENABLED:
            # Cada escena sale en cuanto el director la tiene lista (D19). Si falla, el resto va a null.
            try:
                async with aclosing(_director(para_otros, bs)) as scenes:
                    async for scene in scenes:
                        if sent >= len(bs):
                            break
                        prev_caption = bs[sent - 1][0] if sent else None
                        fixed = director.continue_scene(last, prev_caption, scene)
                        _count_continuation(stats, last, prev_caption, scene, fixed)
                        last = fixed
                        yield _scene_event(bs, sent, fixed)
                        sent += 1
            except Exception as exc:  # noqa: BLE001 - un director caído nunca estropea la respuesta
                log.warning("director failed (%s); sending the missing scenes as null", type(exc).__name__)
        while sent < len(bs):
            yield _scene_event(bs, sent, None)
            sent += 1
        log.info("D23 for %s: %s", cid, stats)
        yield _sse("done", {"turns": len(history.messages(cid)) // 2})


def _count_continuation(stats: dict, prev: dict | None, prev_caption: str | None,
                        scene: dict | None, fixed: dict | None) -> None:
    """Cuenta las continuaciones (D23) y cuántas hubo que corregir, fondo y personaje por separado."""
    if scene is None or prev is None or prev_caption is None or not is_cut(prev_caption):
        return
    stats["continuations"] += 1
    stats["fixed_backdrop"] += scene["backdrop"] != fixed["backdrop"]
    stats["fixed_hero"] += scene["hero"] != fixed["hero"]


def _scene_event(bs: list[tuple[str, str]], i: int, scene: dict | None) -> str:
    caption, emotion = bs[i]
    data = {"index": i, "total": len(bs), "emotion": emotion, "caption": caption, "scene": scene}
    return _sse("scene", data)


def _director(question: str, bs: list[tuple[str, str]]) -> AsyncIterator[dict | None]:
    """Escenas del director, una por tramo (D24) y según van llegando. Las pruebas la sustituyen."""
    if FAKE:
        return director.fake_direct(question, bs)
    return director.direct(
        question,
        bs,
        client=_anthropic,
        vocab=VOCAB,
        model=DIRECTOR_MODEL,
        effort=DIRECTOR_EFFORT,
        timeout=DIRECTOR_TIMEOUT,
        thinking=DIRECTOR_THINKING,
    )


async def _model_stream(cid: str, content: str | list, system) -> AsyncIterator[str | object]:
    """``content`` es el texto del usuario o, con imagen, la lista de bloques de imagen.contenido (D56).

    Cede el texto (``str``), ``buscaweb.BUSCANDO`` cada vez que el modelo lanza una búsqueda y, como último
    elemento, ``buscaweb.Fuentes`` con lo que citó (D58, D60). Con la cuota del día agotada el narrador no
    recibe la herramienta y sabe por qué."""
    messages = history.messages(cid) + [{"role": "user", "content": content}]
    n = buscaweb.permitidas(_cuota)
    extra: dict = {}
    if n > 0:
        extra["tools"] = [buscaweb.herramienta(n)]
    else:
        bloque = {"type": "text", "text": buscaweb.AGOTADA}
        system = [{"type": "text", "text": system}, bloque] if isinstance(system, str) else [*system, bloque]
    traductor = buscaweb.Traductor()
    async with _anthropic.messages.stream(
        model=MODEL,
        max_tokens=MAX_TOKENS,
        system=system,
        messages=messages,
        output_config={"effort": EFFORT},
        **extra,
    ) as stream:
        async for event in stream:
            for x in traductor.feed(event.model_dump()):
                yield x
        final = await stream.get_final_message()
    if final.stop_reason == "refusal":
        log.warning("narrator refused (stop_reason=refusal)")
    elif final.stop_reason == "pause_turn":
        log.warning("narrator paused the turn (pause_turn): the reply ends here")  # D58
    uso = final.usage
    servidor = getattr(uso, "server_tool_use", None)
    hechas = getattr(servidor, "web_search_requests", None) or 0
    _cuota.anotar(hechas)
    # D42, D59: solo números. Ni la consulta, ni las URLs, ni los resultados.
    log.info("narrador: %d búsquedas, quedan %d hoy, tokens %s entrada / %s salida", hechas, _cuota.quedan(),
             getattr(uso, "input_tokens", "?"), getattr(uso, "output_tokens", "?"))
    yield buscaweb.fuentes_de([b.model_dump() for b in final.content])


_FAKE_REPLIES = [
    "[smug] Modo de pruebas, mortal. [happy] Si lees esto, el tubo funciona de punta a punta.",
    "[confused] No hay ningún modelo detrás de mí ahora mismo. Solo ecos.",
    "[sleepy] Respuesta enlatada número tres. Ph'nglui... zzz.",
    "[annoyed] ¿Otra vez? [neutral] Vale, el streaming sigue vivo.",
]


async def _fake_stream() -> AsyncIterator[str]:
    await _fake_wait()
    async for chunk in _fake_chunks(random.choice(_FAKE_REPLIES)):
        yield chunk


async def _fake_image_stream(data: str) -> AsyncIterator[str]:
    """Con imagen (D56): una respuesta aparte que dice cuánto pesó la imagen que llegó, para comprobar a
    mano que el cliente la reduce. Se calcula del base64, sin decodificarlo."""
    kb = len(data) * 3 / 4 / 1024
    await _fake_wait()
    reply = f"[smug] Veo una imagen de {kb:.1f} KB, mortal. [happy] El tubo con imagen funciona."
    async for chunk in _fake_chunks(reply):
        yield chunk


async def _fake_busca_stream() -> AsyncIterator[str | object]:
    """Con un texto que empieza por «busca» (D58): una respuesta enlatada que avisa, «busca» y cita un enlace
    de ejemplo, para ver a mano la escena de buscar y la línea de fuentes sin gastar."""
    await _fake_wait()
    async for chunk in _fake_chunks("[smug] Consulto los grimorios, mortal. "):
        yield chunk
    yield buscaweb.BUSCANDO
    await asyncio.sleep(4)  # lo que viene a tardar una búsqueda de verdad
    async for chunk in _fake_chunks("[happy] Mañana habrá nubes y claros. Los astros no se comprometen."):
        yield chunk
    yield buscaweb.Fuentes([{"title": "Ejemplo de fuente", "url": "https://example.org/"}])


async def _fake_wait() -> None:
    await asyncio.sleep(1.5)  # long enough to see the thinking pose


async def _fake_chunks(reply: str) -> AsyncIterator[str]:
    for i in range(0, len(reply), 3):
        yield reply[i : i + 3]  # small chunks to exercise split tags
        await asyncio.sleep(0.04)
