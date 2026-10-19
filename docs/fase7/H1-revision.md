Responde a: 8aa2ce8 (H1-informe, parada 1)

# H1 · Revisión de la parada 1 (2026-10-19)

## 1. Comprobado contra el código, no contra el informe

- `tests/test_fase7_h1.py` es idéntico byte a byte a `docs/fase7/normativas/test_fase7_h1.py` (`cmp`).
  `pytest -q tests`: 70 pasan, 4 se saltan; `ruff` limpio. Lo he lanzado yo.
- `scripts/memoria.py listar` y `gasto` contra `klothulhu_dev` dan lo mismo que el informe: un recuerdo
  falso, indexado, y $0,000035.
- `memoria.py`, `sesiones.py`, `gasto.py`, `cierre.py`, `memoria_bd.py` y `escritor.py` cumplen el §3.1
  del plan. Va bien:
  - `validar()` rechaza `True` como importancia;
  - `cerrar()` registra solo el tipo de la excepción y anota la sesión también tras un fallo;
  - `AlmacenMariaQdrant` comprueba que BD y colección casan antes de abrir nada, y `vaciar()` exige
    `_test`;
  - `escritor` busca el bloque de texto por tipo y mira `stop_reason`;
  - los clientes se crean al primer uso.
- **`escritor_prompt.md`, aprobado tal cual.** Cumple las ocho reglas del plan, y la voz y el ejemplo
  son buenos. Lo de verdad se verá en T10.
- **Desviaciones del informe, aceptadas:**
  - el `motivo` de `cerrar()` (hueco del plan: `anotar_sesion` lo pedía);
  - los métodos extra del almacén;
  - el `.gitignore`: lo de `.env` era un agujero real; bien cazado;
  - el JSON sin el módulo de origen.
- La unidad (`ReadWritePaths`, `TimeoutStopSec=30`) es la del plan.

## 2. Hallazgos

1. **`/health` consulta MariaDB en cada llamada y falla si la BD cae.** `"frenada": … not _freno.permitido()`
   hace un `SELECT` síncrono dentro de la ruta async, y si la BD no responde, lanza: `/health` da 500
   mientras klothulhu contesta bien (y `proyecto.md` usa `/health` como comprobación). Además,
   `permitido()` registra el aviso de freno, así que una consulta de salud puede escribir en el log.
   **Atribución: hueco del plan** (el §3.1 decía `not freno.permitido()`). → R1.
2. **`listar` calcula la fuerza en un día de uso equivocado.** Toma `max(creado_dia)` como hoy, pero
   un día de uso cuenta aunque esa charla no deje recuerdos (`dias_uso` lo anota antes de escribir).
   Si los últimos días no dejaron nada, `listar` ve los recuerdos más frescos de lo que están, y L1 es
   justo para mirar eso. **Atribución: hueco del plan** (el almacén no tenía «día de uso actual»). → R2.
3. **Al parar se puede perder una sesión a medio cerrar.** `tarea.cancel()` corta el barrido donde
   esté:
   - si estaba dentro de `cerrar()`, el `CancelledError` no lo coge el `except Exception`: no se
     anota la sesión y los recuerdos que faltaban no se escriben;
   - si `vencidas()` ya había sacado varias, las que quedaban del lote se pierden, porque ya no están
     en `sesiones`.

   Es poco probable (hace falta parar justo durante un cierre), pero contradice D41: «al parar se
   cierran las abiertas». **Atribución: hueco del plan** (el §3.1 decía «cancela el barrido»). → R3.
4. **Hay registros previos a la fase que pueden llevar texto a LogCentral (D42).**
   `director.py:330` registra el mensaje de la excepción (`%s: %s`, `exc`), y `app.py:271`, la traza
   con `exc_info=True`. Un `ValueError` del director podría llevar un trozo del pie o de la respuesta,
   y desde ahora eso acaba en Grafana Cloud. `app.py:243` (`log.exception` del narrador) se queda: los
   errores de la API de Anthropic no repiten la conversación y es el diagnóstico principal.
   **Atribución: hueco del plan** (T2 no pedía revisar los registros existentes). → R4.
5. **Aviso de `qdrant-client`** (tu pregunta). Decido: **fija el cliente a la misma versión menor que el
   servidor** (`qdrant-client==1.17.*`, el último parche que haya; Qdrant 1.17.1 en seb01). No
   desactives la comprobación: es la que avisaría si algún día el servidor se queda atrás de verdad.
   H1 solo usa `collection_exists`, `create_collection`, `upsert` y `delete_collection`, y H2 usará
   `query_points`, que existe desde la 1.10. Si la 1.17 rompe algo, para y dímelo. No es una decisión
   D<n>: es cuestión de versiones.
6. **El cierre al apagar no está probado** (lo dice el informe). Con R3 hecho, hay que verlo con un
   `SIGTERM` real. → R5.

## 3. Veredicto

**Aprobado con retoques (R1-R5).** El código es limpio y fiel al plan; los cuatro hallazgos de
fondo son huecos míos. T10 sigue esperando dos cosas:
- la autorización de Josem, que anotaré en el frontmatter del plan;
- la clave de OpenAI (P2).

## Para el programador

Responde a: 8aa2ce8 (H1-informe, parada 1)

Parada 1 aprobada con retoques. Hazlos en este orden, un commit cada uno, y **no lances T10**: espera
a que anote la autorización de Josem en el frontmatter de `PLAN.md`.

- **R1 · `/health` sin BD.**
  - `Freno` expone una propiedad `frenado`: el último estado conocido, sin consulta. Vale `False`
    hasta la primera llamada a `permitido()`.
  - `/health` usa `MEMORIA and _freno is not None and _freno.frenado`.
  - Prueba de regresión: con un almacén cuyo `gasto_total()` lanza, la consulta de `/health` responde
    y no lanza.
- **R2 · El día de uso actual.**
  - `dia_actual() -> int` en los dos almacenes: cuántos días de uso hay (0 si ninguno). En
    `AlmacenEnMemoria`, `len(self._dias)`.
  - `listar` lo usa en lugar de `max(creado_dia)`.
  - Añádelo al contrato de `tests/test_memoria_bd.py`: dos días anotados y un recuerdo creado el día
    1, y `dia_actual()` da 2.
- **R3 · Apagado sin perder sesiones.**
  - El barrido no se cancela a mitad de un cierre:
    - un `asyncio.Event` de parada;
    - el bucle espera `BARRIDO_S` o el evento, lo que llegue antes;
    - cada sesión que saca la cierra antes de mirar el evento otra vez;
    - al parar se pone el evento y se espera a la tarea.
  - Después, `todas()`. Todo dentro del mismo plazo de `APAGADO_S`.
  - Si se agota el plazo, el `warning` dice cuántas sesiones se quedaron sin cerrar (el número, sin texto).
  - Prueba de regresión, con un escritor falso que tarda: si se para mientras se cierra una sesión,
    esa sesión acaba anotada (`anotar_sesion`) y las abiertas también se cierran.
- **R4 · Registros sin texto (D42).**
  - `director.py:330`: solo `type(exc).__name__`.
  - `app.py:271`: fuera `exc_info=True`, y el tipo de la excepción en el mensaje.
  - No toques `app.py:243`.
  - Si algo de esto choca con una prueba normativa de una fase anterior, para y pregunta.
- **R5 · Prueba del apagado de verdad.** Con R3 hecho, la pasada a mano del informe:
  `KLOTHULHU_FAKE=1 KLOTHULHU_MEMORIA=1`, TTL normal (30), contra `klothulhu_dev`.
  - Dos mensajes y `kill -TERM` al uvicorn. `listar` muestra un recuerdo nuevo, y la tabla
    `sesiones` tiene una fila con `motivo = 'apagado'`.
  - Pon la salida en el anexo.
- **Y el punto 5:** `qdrant-client` a `1.17.*`, en `requirements.txt` con la versión exacta que
  instales. Vuelve a pasar T6 con `KLOTHULHU_TEST_DB=1`.

**Para aquí** y deja un anexo en `H1-informe.md` (parada 1, retoques), con las pruebas que pasan y la
salida de R5. T10 llegará con la autorización.

## 4. Revisión de los retoques R1-R5 (2026-10-19)

Responde a: 68658be (H1-informe, «Anexo — Parada 1, retoques R1-R5»)

### Comprobado contra el código

- `pytest -q tests`: 74 pasan y 5 se saltan (lo he lanzado yo). `ruff` limpio. La normativa sigue
  idéntica a la del plan.
- **R1:** `Freno.frenado` no consulta nada, y `/health` lo usa. La regresión cubre un almacén que lanza.
- **R2:** `dia_actual()` en los dos almacenes, y `listar` lo usa.
- **R3:** el barrido espera `BARRIDO_S` o el evento, nunca se cancela a mitad de un cierre y cierra
  todas las que saca. `_apagar()` espera la tarea y luego cierra `todas()`, dentro de `APAGADO_S`.
  La regresión cubre la parada a mitad de un cierre. Un detalle sin retoque: si se agota el plazo
  mientras aún se espera al barrido, el número del `warning` no cuenta las del lote que tenía en
  la mano. Solo pasaría con 20 s de cierre colgado.
- **R4:** `director.py` y `app.py` registran solo el tipo; `app.py:243` está intacto.
- **R5:** la salida de `listar` y la fila de `sesiones` con `motivo = apagado` cuadran con D41.
- **Punto 5:** `qdrant-client==1.17.1`.

### Veredicto

**Parada 1 aprobada.** Lo que queda de H1 es T10, que espera dos cosas de Josem:
- la clave de OpenAI (P2);
- su autorización en el chat (hasta $0,05), que anotaré en el frontmatter de `PLAN.md`.

## Para el programador

Responde a: 68658be (H1-informe, «Anexo — Parada 1, retoques R1-R5»)

Retoques aprobados; no hay nada más que cambiar. **No lances T10:** espera a ver anotada la
autorización de Josem en el frontmatter de `PLAN.md`. Mientras tanto puedes preparar
`tests/fixtures/sesiones_muestra.json` y `scripts/memoria_prueba.py` (§4, T10) sin ejecutar el
script contra las API reales. Si lo haces, súbelo en un commit sin informe y para.

## 5. Revisión de la parada 2: escritor real (2026-10-19)

Responde a: 6495a4c (H1-informe, «Anexo — Parada 2, escritor real (T10)»)

### Comprobado contra `capturas/escritor_real.json`, no contra el informe

- `scripts/memoria_prueba.py` solo toca `klothulhu_test` / `klothulhu_memoria_test` (fijas en el
  código), y las vacía al empezar. La captura no lleva claves.
- **Gasto:** $0,000765 (Haiku $0,000764 y OpenAI $0,0000016), con tope de $0,05. Coincide. Una
  precisión al informe: Josem lanzó la orden él mismo, en mi ventana. Lo anoté así en el plan
  (9771048).
- Las cuatro charlas hacen lo que fija el plan:
  - la fecha relativa se resuelve bien (2026-10-22);
  - el trámite da 0;
  - la triste sale `sad` con importancia 5;
  - la repetida da 0 con los previos delante.

  Las cuatro, con `end_turn`; los dos recuerdos, indexados. D34 y D35 funcionan con los modelos reales.

### Hallazgos, sin retoque

1. **`smug` en el recuerdo del examen.** El texto dice «me importa», y la emoción no casa. Es una
   muestra de uno, y para eso está la semana de uso (H3). Atribución: comportamiento del modelo.
2. **Fecha de hoy para algo que pasó hoy** (el gato). No hace daño: en H2 solo entran los recuerdos
   con la fecha del día, y ese día la charla ya habla de ello. No se cambia el prompt.
3. **Pensamiento para devolver una lista vacía** (137 tokens en la 4). Cuesta $0,00007: no merece
   tocar nada.
4. **Adorno en la voz** («justo donde estoy yo»). Es la voz que queremos.

### Veredicto

**H1 aprobado.** Queda el despliegue, que hace Josem (plan §6), y su prueba L1-L3 en producción. El
plan de H2 lo escribo yo después de ver los primeros recuerdos reales.

## Para el programador

Responde a: 6495a4c (H1-informe, «Anexo — Parada 2, escritor real (T10)»)

H1 aprobado; no hay retoques ni código nuevo. Para aquí: el merge, la BD de producción y el reinicio
son de Josem. H2 llegará como plan nuevo (`docs/fase7/PLAN.md` §7, completado), y te avisaré.
Actualiza `tomorrow.md` con ese punto de parada.
