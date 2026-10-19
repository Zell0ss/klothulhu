"""El escritor de recuerdos (Haiku 5.5) y el embedder (OpenAI) de la memoria larga (D34, D35).

Los clientes se crean al primer uso, no al importar: las pruebas importan el módulo sin claves.
Con `KLOTHULHU_FAKE=1`, `app` usa `escribir_falso` y `embeber_falso`.
"""
from __future__ import annotations

import json
import logging
from datetime import date
from pathlib import Path

from emotion_parser import EMOTIONS

log = logging.getLogger("klothulhu")

MODELO = "claude-haiku-5-5"
MODELO_EMBEDDING = "text-embedding-3-small"
DIMENSION = 1536
PROMPT = Path(__file__).with_name("escritor_prompt.md").read_text(encoding="utf-8")

_DIAS = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"]

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

_anthropic = None
_openai = None


def _mensaje(transcripcion: str, previos: list[str], hoy: date) -> str:
    fecha = f"{_DIAS[hoy.weekday()]} {hoy.isoformat()}"  # sin `locale`: el servidor no lo tiene fiable
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
    if resp.stop_reason in ("refusal", "max_tokens"):
        log.warning("escritor: stop_reason=%s, sin recuerdos", resp.stop_reason)
        return {"recuerdos": []}, uso
    # el pensamiento va antes: se busca el bloque de texto por tipo, no por posición
    texto = next((b.text for b in resp.content if b.type == "text"), None)
    if texto is None:
        log.warning("escritor: sin bloque de texto")
        return {"recuerdos": []}, uso
    return json.loads(texto), uso


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
