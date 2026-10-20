Responde a: a38cd30 (H2-encargo) y 463dbbe (N2 corregida)

# H2 · Informe de la parada 1

## Hecho

T1-T7, un commit por tarea (60c40b4, 18cd79d, 5f25c6c, d342a6f, 7b89edb, d4025be, 538da16) y b4c0e5e (ver Desviaciones).

- **Pruebas:** normativas N1-N10 copiadas a `tests/test_fase7_h2.py` sin tocar (con la N2 corregida por el arquitecto en 463dbbe); las de H1 siguen en verde y sin editar. Con `KLOTHULHU_TEST_DB=1`: **100 pasan** (T3 contra `klothulhu_test` / `klothulhu_memoria_test`: `consultar`, `reforzar`, eventos, `podar` con borrado en Qdrant y `sesiones_anotadas`, el mismo contrato en los dos almacenes). Sin esa variable: 92 pasan y 8 se saltan. `ruff` limpio.
- **Pruebas añadidas (no normativas):** `test_registro_una_sola_linea` (un `warning` deja una línea y ya no existe el manejador 0 de loguru), `test_repasar_traduce_ids_cortos`, y el contrato ampliado de `test_memoria_bd.py`.
- **Pasada a mano** (`KLOTHULHU_FAKE=1 KLOTHULHU_MEMORIA=1 KLOTHULHU_HISTORY_TTL_MIN=1`, puerto 8791, contra `klothulhu_dev`, lanzador local en el scratchpad que **no** se sube y que solo vuelca el `system` y hace que el repaso falso marque el primer recuerdo como usado):
  - **(a)** En `klothulhu_dev` había 3 recuerdos falsos de pasadas anteriores, más 14 de relleno (importancia 1) que añadí para que quedaran recuerdos fuera de la foto inicial. El `system` del **primer** mensaje llevó los dos bloques; el segundo bloque empezaba así (recortado a lo esencial):
    ```
    Hoy es martes 2026-10-20.
    Estos son recuerdos tuyos, escritos por ti en charlas anteriores. Úsalos solo si vienen a cuento de lo que
    dice el mortal: no los recites, no los enumeres y no inventes otros. Si no vienen a cuento, ignóralos. Si el
    mortal te pregunta por algo que no aparece aquí, reconoce que no lo recuerdas.

    - Un mortal habló conmigo en modo de pruebas. (de hace 1 día de uso)
    - Un mortal habló conmigo en modo de pruebas. (de hoy)
    - …
    ```
    El primer mensaje llevó **15** recuerdos en el bloque; el segundo, **18**: la búsqueda del primero trajo los 3 que estaban fuera (F1) y entraron en el contexto del segundo (D36). Sin corchetes en el bloque.
  - **(b)** Tras el barrido (TTL 1 min), `eventos --detalle`:
    ```
    umbral 0.45
    candidatos 3 · F1 (pertinentes) 3 · F2 (cerca del umbral) 0 · juzgados no pertinentes 0
    F3 0 · F4 0 · F5 0
    F1 [2026-10-20 00:53] sim 1.00 · mensaje: hola, ¿qué tal? · recuerdo: Anécdota de relleno número 6.
    (otras dos F1 iguales: relleno 0 y 10)
    ```
    `listar` muestra `usos = 3` en el recuerdo más fuerte (el repaso del lanzador lo marcó usado en tres sesiones cerradas, incluida una por apagado). `gasto`: juez 3 llamadas, repaso 3, embedding 11, escritor 5; total $0,000267 (todo falso).

## Gasto

0 real. Los $0,000267 de `memoria_gasto` son de los falsos, en `klothulhu_dev`. T8 no se ha lanzado ni preparado.

## Desviaciones

- **N2:** daba por hecho que el 2026-10-20 era lunes; es martes. Lo avisé, el arquitecto la corrigió (463dbbe) y la copié de nuevo. No edité la normativa.
- **`_system(sesion)` se calcula también con `KLOTHULHU_FAKE=1`** (b4c0e5e): antes solo se llamaba al construir la petición real, y sin eso no se puede enseñar el bloque en una pasada falsa. El resultado solo se usa sin FAKE.
- **Juez sin pensamiento:** `juzgar` pide `thinking: disabled` (como el director, D20) para recortar latencia, además de `effort: low` y salida estructurada. Con `max_tokens` 1024; el repaso, 2048 y con pensamiento por defecto. **Sin probar contra la API real** hasta T8.
- `memoria.dia_semana()` sustituye a la lista de días que tenía `escritor.py` (mismo resultado, una sola fuente).
- `memoria_prompt.md` (el texto del bloque) es mío, para revisión; añade una frase: si el mortal pregunta por algo que no aparece, que reconozca que no lo recuerda.
- **Sesiones sin recuerdos que cerrar:** `cerrar()` anota eventos y poda también cuando no hay repaso (p. ej. contexto vacío o freno del repaso); el encargo lo implicaba en 2.5 punto 2.
- `consultar()` real tolera puntos huérfanos en Qdrant: filtra por `borrado IS NULL` en MariaDB.

## No probado

- `juzgar` y `repasar` contra Haiku real, y los umbrales (T8).
- La poda real contra Qdrant fuera de las pruebas de `klothulhu_test` (sí está en T3).
- Nada de producción: `memoria_eventos` no existe allí hasta que Josem corra `crear`.

## Decisiones que necesito

Ninguna.

## Anexo — Parada 1, retoques R1-R2 y T8 preparado (2026-10-20)

Responde a: 5d2135b (H2-revision, «Para el programador»)

**Hecho** (c6b419a R1, d45df1d R2, y el commit de T8 sobre ellos):
- **R1:** `memoria_prompt.md` acota la última frase: «Si el mortal te pregunta por algo de otra charla que no está ni aquí ni en esta conversación, reconoce que no lo recuerdas; no lo inventes». El resto, igual.
- **R2:** `bloque(ctx, None, hoy)` no pone la antigüedad y el resto sigue igual. En `_reply`, si `_system()` lanza, se usa `SYSTEM_PROMPT` y queda un `warning` con el tipo de la excepción. Regresiones en `tests/test_fase7_h1_retoques.py`: `bloque` con `dia_actual=None` lleva los textos y la fecha; con un `_system` que lanza (por `monkeypatch`), `_reply` acaba en `done` y sin `error`.
- **T8 preparado, no lanzado:**
  - `tests/fixtures/calibracion.json`: 12 recuerdos míos (nada de producción), 32 mensajes (24 con algún recuerdo pertinente y 8 sin ninguno; paráfrasis como «las seis cuerdas» por la guitarra o «la pata» por el perro cojo, y temas vecinos sin pertinencia como Nueva York, la película de terror o «miedo al médico») y 2 charlas de repaso con lo que espero que salga.
  - `scripts/memoria_calibrar.py`, sin BD: embebe todo, calcula las 384 similitudes, da la distribución de pertinentes y no pertinentes, propone **el umbral más alto que deja pasar al menos el 90 % de las pertinentes** (se pierden como mucho las `floor(10 %)` más bajas), pasa por el juez las parejas que lo superan, pasa el repaso por las 2 charlas y mide la latencia (p50, p95 y máximo) del embedding (44 llamadas) y del juez. Para cada pareja guarda la similitud, la etiqueta y el veredicto del juez (`null` si no superó el umbral); todas las parejas van ordenadas por similitud en la captura, para ver los fallos uno a uno. Corta si el gasto pasa de $0,05.
  - Salida: `docs/fase7/capturas/calibracion.json`. Orden de Josem: `ANTHROPIC_API_KEY=… OPENAI_API_KEY=… .venv/bin/python scripts/memoria_calibrar.py`. Coste esperado: unos $0,003.
  - Pruebas (`tests/test_calibrar.py`, sin API): el umbral deja pasar el 90 %, percentil y coseno, el fixture es coherente y una pasada completa con falsos escribe la captura. Sin claves en el entorno, el script sale sin gastar.

**Pruebas:** 98 pasan y 8 se saltan (sin `KLOTHULHU_TEST_DB`); `ruff` limpio. **Gasto:** 0. **Desviaciones:** ninguna. **Decisiones que necesito:** ninguna. Paro aquí; T8 espera la autorización de Josem.

## Anexo — Parada 2, calibración (T8) (2026-10-20)

Responde a: e2a9c7b (H2-revision §4) y 188c2dc (autorización de T8)

**Hecho:** `scripts/memoria_calibrar.py` (commit de T8) lo lanzó Josem en persona; yo no lo he ejecutado. Captura subida tal cual: `docs/fase7/capturas/calibracion.json` (384 parejas ordenadas por similitud, cada una con su etiqueta y el veredicto del juez).

**Distribución de similitudes** (12 recuerdos × 32 mensajes; 24 parejas pertinentes, 360 no):

| | n | mín | p10 | p25 | p50 | p75 | p90 | máx |
|---|---|---|---|---|---|---|---|---|
| pertinentes | 24 | 0,286 | 0,359 | 0,400 | 0,438 | 0,486 | 0,526 | 0,543 |
| no pertinentes | 360 | 0,029 | 0,116 | 0,158 | 0,206 | 0,265 | 0,300 | 0,549 |

**Umbral propuesto por el criterio del encargo** (el más alto que deja pasar ≥ 90 % de las pertinentes): **0,359**. Para comparar:

| Umbral | Pertinentes que pasan | No pertinentes que pasan |
|---|---|---|
| 0,30 | 23 / 24 | 37 / 360 |
| **0,359** | 22 / 24 | 11 / 360 |
| 0,40 | 18 / 24 | 3 / 360 |
| **0,45 (el `UMBRAL` actual)** | **11 / 24** | 2 / 360 |

Con el 0,45 provisional solo pasaría un 46 % de las pertinentes. Las dos pertinentes que quedan bajo 0,359 son «Cuéntame algo de ti» con el recuerdo de la vergüenza de klothulhu (0,344) y «¿Cómo se dice “gracias” en japonés?» con el viaje a Japón (0,286).

**Juez** sobre las 31 parejas que superan 0,359: **27 aciertos** (21 verdaderos positivos, 6 verdaderos negativos), 3 falsos positivos y 1 falso negativo.

| Pareja | Sim. | Etiqueta | Juez |
|---|---|---|---|
| «Me da miedo ir al médico» – cita con el dentista | 0,549 | no | sí |
| «Me duele la espalda otra vez» – duerme mal por el turno | 0,401 | no | sí |
| «Uf, otra vez tengo reunión a primera hora» – duerme mal por el turno | 0,370 | no | sí |
| «Esta tarde tengo clase y aún no sé qué llevar» – cocina italiana | 0,359 | sí | no |

Mi lectura, para el arquitecto: el primer falso positivo es discutible (el miedo al médico y el pavor al dentista sí se tocan; el que se quedó corto es mi etiqueta). Los otros dos son temas vecinos (cansancio y sueño) que el juez deja pasar con más generosidad de la que pedía «ante la duda, no». El falso negativo es una pareja que la propia redacción del mensaje hace ambigua («clase» sin decir de qué).

**Repaso** (2 charlas):
- **A** (colegio): `usados = [m1]`, sin fallos. Coincide con lo esperado.
- **B** (reproche): `usados = [m4]`, `fallos = [F4 sobre m4]`. Esperaba `usados = []` y además un F3 (no usó el recuerdo en el primer mensaje); el repaso ve el F4, pero considera usado el recuerdo porque la segunda respuesta lo recoge («Setenta es una cifra con peso») y no anota el F3. Es discutible cuál de los dos juicios es el correcto.

**Latencia:**

| | n | p50 | p95 | máx |
|---|---|---|---|---|
| Embedding | 44 | 153 ms | 311 ms | 3094 ms (un pico) |
| Juez | 31 | 946 ms | 2198 ms | 2234 ms |

El juez (con `thinking: disabled`) ronda el segundo y puede tardar dos; el embedding es rápido salvo picos.

**Gasto** (de la captura):

| Modelo | Llamadas | Tokens in / out | Coste |
|---|---|---|---|
| `claude-haiku-5-5` | 33 (31 juez + 2 repaso) | 19791 / 780 | $0,0023691 |
| `text-embedding-3-small` | 44 | 643 / 0 | $0,00001286 |
| **Total** | | | **$0,00238196** |

Autorizado por Josem en el chat del arquitecto el 2026-10-20 (hasta $0,05), anotado por el arquitecto en `H2-encargo.md` (188c2dc) y lanzado por él en persona. Un 4,8 % del tope.

**Desviaciones:** ninguna. **Decisiones que necesito:** ninguna; fijar `UMBRAL` es del arquitecto. Paro aquí.

## Anexo — Retoques de fechas R4-R6 (D47) (2026-10-20)

Responde a: 1be775f (H2-revision §6, «Para el programador»)

**Hecho** (194d455 R4, a51d827 R5, 2e302dd R6):
- **R4:** `escritor_prompt.md` prohíbe en el **texto** del recuerdo «hoy», «mañana», «ayer», «esta semana» y un día de la semana suelto; pide el día completo («el martes 21 de octubre»). El campo `fecha` y los recuerdos ya guardados no cambian.
- **R5:** `bloque()` pone `(escrito el <día> AAAA-MM-DD)` en cada línea, sacado de `creado` (acepta `datetime`, `date` o texto ISO), en lugar de la antigüedad en días de uso; sin `creado`, no pone nada. `AlmacenEnMemoria.guardar` guarda `creado` y `consultar()` lo devuelve. `dia_actual` sigue en la firma y la fuerza no cambia.
- **R6:** `memoria.cabecera(hoy)` es la única fuente de «Hoy es <día> AAAA-MM-DD.» y `bloque()` la usa. `_system()`: con `None`, `SYSTEM_PROMPT`; con sesión y sin recuerdos, `[prompt, cabecera(inicio de la sesión)]`; con recuerdos, el bloque entero. N8 nueva copiada de nuevo, sin editarla.

**Pruebas:** con `KLOTHULHU_TEST_DB=1`, **110 pasan** (normativas N1-N10 e H1 sin editar). Regresiones nuevas en `tests/test_fase7_h1_retoques.py`: un recuerdo creado el 2026-10-19 sale con «escrito el lunes 2026-10-19» (y sin `creado`, sin marca); el almacén en memoria guarda `creado` y `consultar()` lo devuelve; `_system` con sesión sin recuerdos lleva la cabecera aunque la sesión empiece a las 23:59; el prompt del escritor lleva la regla. `ruff` limpio.

**El `system` de una pasada FAKE** (`KLOTHULHU_FAKE=1`, `MEMORIA` activa, almacén en memoria; log local que no se sube):

*Sin recuerdos* (dos bloques):
```
1) <prompt.md>
2) Hoy es martes 2026-10-20.
```
*Con recuerdos* (segundo bloque):
```
Hoy es martes 2026-10-20.
Estos son recuerdos tuyos, escritos por ti en charlas anteriores. Úsalos solo si vienen a cuento… (instrucción)

- El mortal tiene examen de conducir el martes 21 de octubre. (escrito el martes 2026-10-20) (sobre el 2026-10-21)
- Tiene un perro viejo, Bruno, que cojea. (escrito el martes 2026-10-20)
```
**Gasto:** 0. **Desviaciones:** ninguna. **Decisiones que necesito:** ninguna. Paro aquí: merge y reinicio son de Josem, sin `crear`.
