"""Klothulhu companion API.

One endpoint streams a reply as Server-Sent Events with this contract:

    event: emotion  data: {"emotion": "happy"}      always first, may repeat
    event: delta    data: {"text": "..."}           text chunks, tags removed
    event: done     data: {"turns": 3}              reply finished and stored
    event: error    data: {"code": "upstream_error"}

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
from pathlib import Path

from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from emotion_parser import EMOTIONS, EmotionStreamParser
from history import HistoryStore

log = logging.getLogger("klothulhu")
logging.basicConfig(level=os.getenv("KLOTHULHU_LOG_LEVEL", "INFO"))

# --- settings -------------------------------------------------------------

MODEL = os.getenv("KLOTHULHU_MODEL", "claude-haiku-4-5-20251001")
MAX_TOKENS = int(os.getenv("KLOTHULHU_MAX_TOKENS", "300"))
HISTORY_TURNS = int(os.getenv("KLOTHULHU_HISTORY_TURNS", "6"))
HISTORY_TTL_MIN = float(os.getenv("KLOTHULHU_HISTORY_TTL_MIN", "30"))
FAKE = os.getenv("KLOTHULHU_FAKE", "0") == "1"
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
history = HistoryStore(HISTORY_TURNS, HISTORY_TTL_MIN * 60)
_locks: dict[str, asyncio.Lock] = {}

_anthropic = None
if not FAKE:
    from anthropic import AsyncAnthropic

    _anthropic = AsyncAnthropic()  # reads ANTHROPIC_API_KEY

app = FastAPI(title="klothulhu-api", docs_url=None, redoc_url=None)

# --- auth -----------------------------------------------------------------


def client_id(authorization: str = Header(default="")) -> str:
    scheme, _, presented = authorization.partition(" ")
    if scheme.lower() == "bearer":
        for secret, cid in TOKENS.items():
            if hmac.compare_digest(presented.encode(), secret.encode()):
                return cid
    raise HTTPException(status_code=401, detail="invalid token")


# --- routes ---------------------------------------------------------------


class ChatIn(BaseModel):
    text: str = Field(min_length=1, max_length=1000)


@app.get("/health")
async def health() -> dict:
    return {"ok": True, "fake": FAKE, "model": MODEL, "emotions": EMOTIONS}


@app.delete("/history")
async def forget(cid: str = Depends(client_id)) -> dict:
    history.clear(cid)
    return {"cleared": cid}


@app.post("/chat")
async def chat(body: ChatIn, cid: str = Depends(client_id)) -> StreamingResponse:
    lock = _locks.setdefault(cid, asyncio.Lock())
    if lock.locked():
        raise HTTPException(status_code=409, detail="busy")
    return StreamingResponse(
        _reply(cid, body.text.strip(), lock),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


# --- generation -----------------------------------------------------------


def _sse(event: str, data: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"


async def _reply(cid: str, text: str, lock: asyncio.Lock) -> AsyncIterator[str]:
    async with lock:
        parser = EmotionStreamParser()
        raw: list[str] = []
        try:
            source = _fake_stream() if FAKE else _model_stream(cid, text)
            async for chunk in source:
                raw.append(chunk)
                for kind, payload in parser.feed(chunk):
                    yield _sse(kind, {"emotion": payload} if kind == "emotion" else {"text": payload})
            for kind, payload in parser.flush():
                yield _sse(kind, {"emotion": payload} if kind == "emotion" else {"text": payload})
        except Exception:  # noqa: BLE001 - any upstream failure becomes an event
            log.exception("generation failed for %s", cid)
            yield _sse("error", {"code": "upstream_error"})
            return
        if parser.unknown_tags:
            log.warning("unknown emotion tags from model: %s", parser.unknown_tags)
        # Only complete replies enter history; tags are kept so the model
        # keeps seeing the format it is expected to follow.
        history.append(cid, text, "".join(raw))
        yield _sse("done", {"turns": len(history.messages(cid)) // 2})


async def _model_stream(cid: str, text: str) -> AsyncIterator[str]:
    messages = history.messages(cid) + [{"role": "user", "content": text}]
    async with _anthropic.messages.stream(
        model=MODEL,
        max_tokens=MAX_TOKENS,
        system=SYSTEM_PROMPT,
        messages=messages,
    ) as stream:
        async for chunk in stream.text_stream:
            yield chunk


_FAKE_REPLIES = [
    "[smug] Modo de pruebas, mortal. [happy] Si lees esto, el tubo funciona de punta a punta.",
    "[confused] No hay ningún modelo detrás de mí ahora mismo. Solo ecos.",
    "[sleepy] Respuesta enlatada número tres. Ph'nglui... zzz.",
    "[annoyed] ¿Otra vez? [neutral] Vale, el streaming sigue vivo.",
]


async def _fake_stream() -> AsyncIterator[str]:
    await asyncio.sleep(1.5)  # long enough to see the thinking pose
    reply = random.choice(_FAKE_REPLIES)
    for i in range(0, len(reply), 3):
        yield reply[i : i + 3]  # small chunks to exercise split tags
        await asyncio.sleep(0.04)
