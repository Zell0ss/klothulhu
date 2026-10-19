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
