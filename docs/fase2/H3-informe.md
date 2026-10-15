# Fase 2 · H3 — informe

Responde a: 2ba9fbf (H2-revision y H3-encargo)

## Hecho

R1–R5 hechos y R6 preparado (falta lanzarlo Josem). Commit del código: ver el log de `fase2`.

- **R1 (D18)** Corte equilibrado en `server/beats.py` y `desktop/renderer/scenes.js`, con el mismo algoritmo del
  encargo. Pasan los 17 casos de `beats_cases.json` en los dos lados (N1 y F2). No he tenido que tocar mis pruebas
  de `scenes.extra.test.js`.
- **R2 (D19)** `director.direct` y `fake_direct` son generadores asíncronos:
  - `messages.stream` con `thinking={"type": "disabled"}` si `thinking` es falso;
  - troceo del JSON carácter a carácter (`_SceneSplitter`: profundidad, cadenas y escapes);
  - `asyncio.timeout(timeout)` alrededor de todo el stream;
  - suelta siempre exactamente `len(beats)` elementos y nunca lanza;
  - registro con ms a la primera escena y totales, tokens, `thinking` y escenas que faltaron.
- **R3** `_director` es un iterable asíncrono; `_reply` manda cada `scene` en cuanto llega (cierra el iterador con
  `aclosing`), y si falla a mitad completa con `null` sin evento `error`. Ajuste `KLOTHULHU_DIRECTOR_THINKING`
  (por defecto `1`) en `klothulhu.env.example`, el README y el docstring.
- **R4** `director_prompt.md`: guía de significados por fondo y la frase «Use the whole range of backdrops…»;
  quitado «slightly ominous». `prompt.md`: el retoque de la regla de 70.
- **R5** `tests/test_fase2.py` sustituido entero por la versión 2 (diff vacío con el bloque del encargo).
- **R6** `scripts/api_smoke.py`: `--director-thinking {0,1}`; escribe `api_smoke-think<n>.json` (no pisa los de H2);
  añade ms hasta la primera escena (mediana y máxima), ms totales, golpes ≤3 palabras (con su lista y %) y fondos
  distintos. La galería: `node desktop/scripts/gallery.js <json> <html>`.

Verificación: `pytest -q tests` 23 pasan, `ruff check .` limpio, `npm test` 17 pasan, `npm run check` ok.
Comprobado con la firma que `anthropic==1.15.0` acepta `thinking` y `output_config` en `messages.stream`.
Ensayo del script con `--fake` y envoltorio de uso probado con un stream simulado (narrador y director por
separado). **No probado contra el SDK real** hasta que Josem lo lance.

## Gasto

0. No he llamado a la API. El gasto de R6 (~$0.015) lo lanza Josem. Total de la fase hasta ahora: $0.0067 de $1.

## Desviaciones

1. `thinking` tiene valor por defecto `True` en `direct(...)` (el encargo la pone sin valor). Las pruebas siempre la
   pasan; así el comportamiento sin argumento es el de H2.
2. El resumen de `api_smoke` añade `beats_up_to_3_words_list` y `director_first_scene_ms_*`; el campo
   `narrator_ms.until_text_done` ahora resta el tiempo a la primera escena del director.

## Decisiones que necesito

Ninguna.

## R6 — para Josem (parar aquí)

Dos pasadas de las mismas 13 preguntas, **primero con pensamiento y luego sin él**, con la clave en su shell:

```bash
cd /data/klothulhu-fase2
ANTHROPIC_API_KEY=… .venv/bin/python scripts/api_smoke.py --director-thinking 1
node desktop/scripts/gallery.js docs/fase2/capturas/api_smoke-think1.json docs/fase2/capturas/galeria-think1.html
ANTHROPIC_API_KEY=… .venv/bin/python scripts/api_smoke.py --director-thinking 0
node desktop/scripts/gallery.js docs/fase2/capturas/api_smoke-think0.json docs/fase2/capturas/galeria-think0.html
```

Corte a $0.50 por pasada. Si falla a mitad, no se relanza entero sin decirlo. Después escribo el anexo con las
dos pasadas comparadas contra los criterios del §5 del encargo.

---

## Anexo — retoque R1 de la revisión (plazo del director)

Responde a: 24c9af4 (H3-revision)

- `director.direct`: una sola hora límite (`loop.time() + timeout`) y `asyncio.timeout_at(limite)` **solo** en cada
  espera (entrada al gestor del stream, cada `anext` de `text_stream` y `get_final_message()`). Ningún `yield`
  queda dentro de un `timeout`. El gestor del stream se cierra siempre en un `finally`, con un plazo de 2 s
  propio para que cerrar no pueda colgar la respuesta (añadido mío).
- `tests/test_fase2_plazo.py` copiado tal cual (N15). `ruff.toml`: `E501` exento para ese fichero, como el otro
  normativo.
- Verificación: `pytest` 24 pasan (N15 incluida), `ruff` limpio, `npm test` 17 pasan.
- Gasto: 0.

Desviación: el `timeout(2)` del cierre del stream no estaba en la revisión. **Decisiones que necesito:** ninguna.

Siguiente: Josem lanza las dos pasadas de R6 (órdenes de este informe, §R6). Para.
