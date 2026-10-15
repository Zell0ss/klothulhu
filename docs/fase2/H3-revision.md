Responde a: b89abe9 (H3-informe)

# Fase 2 · H3 — revisión del arquitecto

**Veredicto: aprobado con un retoque (R1),** que va **antes** de las pasadas de R6, porque cambia el código
que esas pasadas ejercitan. Revisado contra el código de `fase2` (`b89abe9`).

## 1. Lo comprobado

- `tests/test_fase2.py` es idéntico a la versión 2 del encargo. `tests/fixtures/` y las pruebas de Node de las
  fases 1 y 2 están sin tocar. `pytest` da 23, `ruff` está limpio y `npm test` da 17.
- **R1 (D18):** `_split_long` y `splitLong` siguen el algoritmo del encargo línea a línea, con el mismo desempate.
- **R2 (D19):**
  - `_SceneSplitter` sigue bien la profundidad, las cadenas y los escapes.
  - `direct` suelta exactamente `len(beats)` elementos y registra lo pedido.
  - `thinking` desactivado solo cuando se pide.
- **R3:** `_reply` cierra el iterador con `aclosing`, manda cada escena en cuanto llega y rellena con `null` sin
  evento `error`.
- **R4:** los prompts, como se pidieron.

## 2. Hallazgos

| # | Hallazgo | Atribución |
|---|---|---|
| 2.1 | **El plazo del director puede cancelar a quien lo consume.** `direct` hace `yield` *dentro* de `async with asyncio.timeout(timeout)`. Si el plazo vence mientras el generador está parado en un `yield` y `_reply` está en otra espera (por ejemplo, escribiendo en el socket), `asyncio` cancela **la tarea que consume**, no el stream: la respuesta se corta sin `done`. Es un fallo conocido de los generadores asíncronos (lo describe el PEP 789). Lo he reproducido: un director que suelta una escena y se cuelga, con `timeout=0.2` y un consumidor que tarda 0,5 s entre escenas, da `CancelledError` en el consumidor. Lo prueba la N15 (abajo), que falla con el código actual | **arquitecto**: el encargo pedía literalmente «`asyncio.timeout(timeout)` alrededor de todo el stream» |

## 3. Desviaciones del informe

1. `thinking=True` por defecto en `direct(...)`: **aprobado**.
2. Campos nuevos en el resumen de `api_smoke` y el ajuste de `until_text_done`: **aprobado**.

## Para el programador

Responde a: b89abe9 (H3-informe)

**R1 · Plazo sin `yield` dentro (D19).** En `director.direct`:
- Calcula **una** hora límite (`asyncio.get_running_loop().time() + timeout`).
- Envuelve con `asyncio.timeout_at(limite)` **solo cada espera**: la entrada al gestor de `messages.stream`, cada
  `anext` de `text_stream` y `get_final_message()`. **Ningún `yield` puede quedar dentro de un `timeout`.**
- Al salir, de cualquier forma, el gestor del stream se cierra (`__aexit__`, en un `finally`).
- Lo demás no cambia: lo que falte sale `None` y nunca se lanza.

He comprobado que este patrón cumple N15 y las 14 de `test_fase2.py`.

Copia **tal cual** este bloque a `tests/test_fase2_plazo.py` (normativo; si te parece mal, para y pregunta):

```python
"""Prueba normativa de la fase 2 (H3-revision §2.1, D19): el plazo del director no cancela a quien lo consume.
No editar: añadir en otro fichero."""
import asyncio
import json
from pathlib import Path
from types import SimpleNamespace

import director

VOCAB = director.load_vocab()
STAGING = json.loads((Path(__file__).parent / "fixtures" / "director_cases.json").read_text(encoding="utf-8"))[
    "cases"
][0]["staging"]


class _HangingStream:
    """Suelta la primera escena entera y después se queda colgado."""

    async def __aenter__(self):
        return self

    async def __aexit__(self, *exc):
        return False

    @property
    def text_stream(self):
        async def gen():
            yield '{"scenes": [' + json.dumps(STAGING) + ", "
            await asyncio.sleep(3600)

        return gen()

    async def get_final_message(self):
        return SimpleNamespace(stop_reason="end_turn", usage=None)


class _Messages:
    def stream(self, **kwargs):
        return _HangingStream()


class _Client:
    messages = _Messages()

    def with_options(self, **kwargs):
        return self


# N15 — el plazo vence mientras el consumidor está ocupado: ni lo cancela ni se pierde la primera escena
def test_n15_plazo_no_cancela_al_consumidor():
    async def consume():
        got = []
        gen = director.direct(
            "q", [("A.", "happy"), ("B.", "sleepy")], client=_Client(), vocab=VOCAB, model="claude-haiku-5-5",
            effort="low", timeout=0.2, thinking=False,
        )
        async for scene in gen:
            got.append(scene is not None)
            await asyncio.sleep(0.5)  # más que el plazo: como escribir en un socket lento
        return got

    assert asyncio.run(consume()) == [True, False]
```

**Dónde parar:** `pytest`, `ruff` y `npm test` en verde, push, y un anexo corto en `H3-informe.md` con commit.
Después, **Josem lanza las dos pasadas de R6** con las órdenes de tu informe, que siguen valiendo. Tú escribes el
segundo anexo con la comparación (encargo §5), con commit, y paras.
