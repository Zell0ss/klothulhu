"""El escritor de recuerdos (Haiku 5.5) y el embedder (OpenAI) de la memoria larga (D34, D35).

Los clientes se crean al primer uso, no al importar: las pruebas importan el módulo sin claves.
Con `KLOTHULHU_FAKE=1`, `app` usa `escribir_falso` y `embeber_falso`.
"""
from __future__ import annotations

import json
import logging
from datetime import date
from pathlib import Path

import memoria
from emotion_parser import EMOTIONS

log = logging.getLogger("klothulhu")

MODELO = "claude-haiku-5-5"
MODELO_EMBEDDING = "text-embedding-3-small"
DIMENSION = 1536
PROMPT = Path(__file__).with_name("escritor_prompt.md").read_text(encoding="utf-8")

# Longitud, número de recuerdos y formato de fecha los comprueba memoria.validar(): no se confía en el
# esquema para eso.
ESQUEMA = {
    "type": "object",
    "properties": {
        "recuerdos": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "texto": {"type": "string"},
                    "importancia": {"type": "integer", "enum": [1, 2, 3, 4, 5]},
                    "emocion": {"type": "string", "enum": list(EMOTIONS)},
                    "fecha": {"type": ["string", "null"]},
                },
                "required": ["texto", "importancia", "emocion", "fecha"],
                "additionalProperties": False,
            },
        }
    },
    "required": ["recuerdos"],
    "additionalProperties": False,
}

ESQUEMA_JUEZ = {
    "type": "object",
    "properties": {"pertinente": {"type": "boolean"}},
    "required": ["pertinente"],
    "additionalProperties": False,
}

ESQUEMA_REPASO = {
    "type": "object",
    "properties": {
        "usados": {"type": "array", "items": {"type": "string"}},
        "fallos": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "tipo": {"type": "string", "enum": ["F3", "F4", "F5"]},
                    "recuerdo": {"type": ["string", "null"]},
                },
                "required": ["tipo", "recuerdo"],
                "additionalProperties": False,
            },
        },
    },
    "required": ["usados", "fallos"],
    "additionalProperties": False,
}

PROMPT_JUEZ = Path(__file__).with_name("juez_prompt.md").read_text(encoding="utf-8")
PROMPT_REPASO = Path(__file__).with_name("repaso_prompt.md").read_text(encoding="utf-8")

_anthropic = None
_openai = None
ultimo: dict = {}  # última respuesta cruda (stop_reason y texto), para memoria_prueba.py


def _mensaje(transcripcion: str, previos: list[str], hoy: date) -> str:
    fecha = memoria.dia_semana(hoy)
    ya = "\n".join(f"- {p}" for p in previos) if previos else "(ninguno todavía)"
    return f"Hoy es {fecha}.\n\nRecuerdos que ya tienes:\n{ya}\n\nLa charla:\n{transcripcion}"


async def escribir(transcripcion: str, previos: list[str], hoy: date) -> tuple[dict, tuple[str, int, int]]:
    """Una llamada a Haiku. Devuelve (salida, (modelo, tokens_in, tokens_out))."""
    global _anthropic
    if _anthropic is None:
        from anthropic import AsyncAnthropic

        _anthropic = AsyncAnthropic()  # lee ANTHROPIC_API_KEY
    resp = await _anthropic.messages.create(
        model=MODELO,
        max_tokens=4096,
        system=PROMPT,
        messages=[{"role": "user", "content": _mensaje(transcripcion, previos, hoy)}],
        output_config={"effort": "low", "format": {"type": "json_schema", "schema": ESQUEMA}},
    )
    uso = (MODELO, resp.usage.input_tokens, resp.usage.output_tokens)
    ultimo.clear()
    ultimo.update(stop_reason=resp.stop_reason,
                  texto=next((b.text for b in resp.content if b.type == "text"), None))
    if resp.stop_reason in ("refusal", "max_tokens"):
        log.warning("escritor: stop_reason=%s, sin recuerdos", resp.stop_reason)
        return {"recuerdos": []}, uso
    # el pensamiento va antes: se busca el bloque de texto por tipo, no por posición
    texto = next((b.text for b in resp.content if b.type == "text"), None)
    if texto is None:
        log.warning("escritor: sin bloque de texto")
        return {"recuerdos": []}, uso
    return json.loads(texto), uso


def _cliente_anthropic():
    global _anthropic
    if _anthropic is None:
        from anthropic import AsyncAnthropic

        _anthropic = AsyncAnthropic()  # lee ANTHROPIC_API_KEY
    return _anthropic


async def _estructurada(
    sistema: str, mensaje: str, esquema: dict, *, max_tokens: int, sin_pensar: bool = False
):
    """Una llamada a Haiku con salida estructurada: (dict | None, uso). None si rechazó o se cortó."""
    kwargs = {}
    if sin_pensar:
        kwargs["thinking"] = {"type": "disabled"}  # como el director (D20): menos latencia
    resp = await _cliente_anthropic().messages.create(
        model=MODELO,
        max_tokens=max_tokens,
        system=sistema,
        messages=[{"role": "user", "content": mensaje}],
        output_config={"effort": "low", "format": {"type": "json_schema", "schema": esquema}},
        **kwargs,
    )
    uso = (MODELO, resp.usage.input_tokens, resp.usage.output_tokens)
    if resp.stop_reason in ("refusal", "max_tokens"):
        log.warning("%s: stop_reason=%s", sistema[:10].strip(), resp.stop_reason)
        return None, uso
    texto = next((b.text for b in resp.content if b.type == "text"), None)
    return (json.loads(texto) if texto is not None else None), uso


async def juzgar(mensaje: str, recuerdo: str) -> tuple[bool, tuple[str, int, int]]:
    """D44: ¿le serviría a klothulhu tener presente este recuerdo para contestar este mensaje?"""
    salida, uso = await _estructurada(
        PROMPT_JUEZ, f"Mensaje del mortal:\n{mensaje}\n\nRecuerdo de klothulhu:\n{recuerdo}", ESQUEMA_JUEZ,
        max_tokens=1024, sin_pensar=True,
    )
    return bool(salida and salida.get("pertinente") is True), uso


async def repasar(transcripcion: str, contexto: list[dict]) -> tuple[dict, tuple[str, int, int]]:
    """D45: qué recuerdos usó klothulhu y qué fallos hubo. Al modelo le llegan ids cortos (r1, r2…);
    aquí se traducen a los ids completos. Un id corto desconocido se devuelve tal cual."""
    corto = {f"r{i}": r["id"] for i, r in enumerate(contexto, 1)}
    lista = "\n".join(f"{c}: {r['texto']}" for c, r in zip(corto, contexto, strict=True))
    salida, uso = await _estructurada(
        PROMPT_REPASO, f"Recuerdos presentes:\n{lista}\n\nLa charla:\n{transcripcion}", ESQUEMA_REPASO,
        max_tokens=2048,
    )
    if salida is None:
        return {"usados": [], "fallos": []}, uso
    traduce = lambda c: corto.get(c, c) if isinstance(c, str) else c  # noqa: E731
    return {
        "usados": [traduce(c) for c in salida.get("usados", [])],
        "fallos": [{**f, "recuerdo": traduce(f.get("recuerdo"))} for f in salida.get("fallos", [])],
    }, uso


async def juzgar_falso(mensaje: str, recuerdo: str) -> tuple[bool, tuple[str, int, int]]:
    """Para KLOTHULHU_FAKE=1: todo es pertinente."""
    return True, (MODELO, 100, 10)


async def repasar_falso(transcripcion: str, contexto: list[dict]) -> tuple[dict, tuple[str, int, int]]:
    """Para KLOTHULHU_FAKE=1: nada usado y sin fallos."""
    return {"usados": [], "fallos": []}, (MODELO, 100, 10)


async def embeber(texto: str) -> tuple[list[float], tuple[str, int, int]]:
    global _openai
    if _openai is None:
        from openai import AsyncOpenAI

        _openai = AsyncOpenAI()  # lee OPENAI_API_KEY
    resp = await _openai.embeddings.create(model=MODELO_EMBEDDING, input=texto)
    return resp.data[0].embedding, (MODELO_EMBEDDING, resp.usage.prompt_tokens, 0)


async def escribir_falso(
    transcripcion: str, previos: list[str], hoy: date
) -> tuple[dict, tuple[str, int, int]]:
    """Para KLOTHULHU_FAKE=1: un recuerdo fijo, sin texto de la charla."""
    salida = {"recuerdos": [
        {"texto": "Un mortal habló conmigo en modo de pruebas.", "importancia": 2, "emocion": "smug",
         "fecha": None}
    ]}
    return salida, (MODELO, 100, 50)


async def embeber_falso(texto: str) -> tuple[list[float], tuple[str, int, int]]:
    return [0.1] * DIMENSION, (MODELO_EMBEDDING, 10, 0)
