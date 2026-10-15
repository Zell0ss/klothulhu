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

---

## Anexo 2 — las dos pasadas de R6 (2026-10-15)

Responde a: 24c9af4 (H3-revision, R1 aprobado)

Josem lanzó las dos pasadas con su clave, una vez cada una, completas (13/13, sin cortes ni errores):
`api_smoke-think1.json` y `api_smoke-think0.json`, cada una con su galería (`galeria-think<n>.html`). Todo con
commit. Los números salen de esos JSON.

### Gasto

| Pasada | Narrador | Director | Total |
|---|---|---|---|
| `thinking=1` | $0.0017 | $0.0045 | $0.0062 |
| `thinking=0` | $0.0017 | $0.0041 | $0.0058 |

Gasto de H3: **$0.0120**. Total de la fase: **$0.0187** de $1. Autorizado por Josem el 2026-10-15 (tope de la
fase en la ventana del arquitecto; «sí» en esta ventana al paso [API]); las dos pasadas las lanzó él.

### Comparación (encargo §5)

| | `thinking=1` | `thinking=0` | H2 (referencia) |
|---|---|---|---|
| **Primera escena del director**, mediana | **1,65 s** | **1,59 s** | 3,26 s (todas juntas al final) |
| Primera escena, máxima | 4,90 s | 2,70 s | 7,56 s |
| Director entero, mediana / máxima | 3,00 / 5,77 s | 2,80 / 3,96 s | 3,26 / 7,56 s |
| Hasta `done` (total), mediana / máxima | 4,21 / 7,68 s | 4,07 / 5,73 s | 3,6–9,0 s |
| Golpes `null` | **3 de 59** | **0 de 51** | 0 de 61 |
| Golpes de ≤3 palabras | 3 de 59 (**5,1 %**) | 2 de 51 (**3,9 %**) | 15 de 61 (25 %) |
| Fondos distintos | **7 de 7** | **7 de 7** | 3 de 7 |
| Acciones distintas / accesorios por escena | 14 / 1,38 | 16 / 1,57 | — |
| `cache_read` del director (desde la 2ª) | 2.609 | 2.608 | 2.443 |
| `refusal` | ninguno | ninguno | ninguno |

Los golpes de ≤3 palabras que quedan son frases completas («Trasto, dices.», «Lo siento, mortal.», «¿Necesitas
algo?»), no colas huérfanas.

### Indicadores del encargo §5

1. **D19, ≤ 1,5 s hasta la primera escena: no se cumple, por poco.** Con el mejor modo (`thinking=0`) la
   mediana es 1,59 s; con pensamiento, 1,65 s. Mejora mucho respecto a esperar a todas (3,26 s), pero no llega
   al umbral. El pensamiento apenas cambia la mediana; sí la cola (4,90 s frente a 2,70 s).
2. **D19, sin pensamiento:** `thinking=0` **no** sube los `null` (0 frente a 3), **no** empobrece los fondos (7 de
   7 en las dos) y tiene más variedad de acciones y accesorios. Por el criterio, no hay razón para dejar el
   valor por defecto en `1`; eso lo decide el arquitecto.
3. **D18: se cumple.** 5,1 % y 3,9 %. El límite era ≤ 5 %: la pasada con pensamiento queda en el filo (3 de 59,
   las tres frases completas).
4. **Fondos: se cumple.** 7 de 7 en las dos (antes, 3).

### Un hallazgo sin atribuir

En `thinking=1`, pregunta 11 («Son las tres de la madrugada…»), el director devolvió **una sola escena para 4
golpes** y acabó en `end_turn` (112 tokens de salida): los otros 3 salieron `null`. No hubo `warning`, porque
`direct` solo avisa si `stop_reason != end_turn` o si algo falla. No es un fallo del código (el diseño completa
con `None`), pero el registro no lo distingue de un golpe bueno. Una línea de `log.warning` cuando salgan menos
escenas que golpes con `end_turn` lo haría visible. No lo he tocado: es un cambio de código fuera del encargo.

### Desviaciones

Ninguna.

### Decisiones que necesito

Del arquitecto o de Josem:

1. ¿Valor por defecto de `KLOTHULHU_DIRECTOR_THINKING`: `0` (según la comparación) o se queda en `1`?
2. ¿Se acepta 1,6 s de mediana hasta la primera escena (umbral 1,5 s) o se replantea D19?
3. ¿Añado el `log.warning` de escenas de menos con `end_turn`?
4. Voz (D16) y escenas (D14): las galerías son para Josem.

Parada de H3.

---

## Anexo 3 — retoque R2 (D20)

Responde a: 26c6d87 (H3-revision §5)

- `KLOTHULHU_DIRECTOR_THINKING` vale **`0` por defecto** en `app.py`, `klothulhu.env.example` y el README. El
  docstring de `app.py` no mencionaba el ajuste, así que no cambia. La firma de `direct(...)` sigue con
  `thinking=True` por defecto.
- `director.direct`: `log.warning` cuando el stream acaba en `end_turn` con menos escenas que golpes («faltan N»).
- Pruebas de regresión mías, en `tests/test_fase2_extra.py` (con `caplog`): avisa si faltan, no avisa si salen todas.
- Verificación: `pytest` 26 pasan, `ruff` limpio, `npm test` 17 pasan. Gasto: 0.
- Desviaciones: ninguna. Decisiones que necesito: ninguna.

Parada de H3. Sigue el despliegue de Josem (PLAN §6), que no toco.
