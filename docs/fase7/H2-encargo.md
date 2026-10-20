---
proyecto: klothulhu
fase: 7
hito: H2
titulo: recordar
fecha: 2026-10-20
decisiones: "vault 30-projects/klothulhu/ficha.md § Decisiones (D43-D46; también D34-D37, D40-D42)"
gasto_autorizado: "solo el paso [API] T8 (calibración), hasta $0,05; autorizado por Josem en el chat del arquitecto el 2026-10-20 y lanzado por él"
---

Responde a: 6495a4c (H1-informe, anexo de la parada 2). H1 está aprobado y desplegado (diario, 2026-10-20).

# H2 · Recordar

> **Para:** el claudcoder. **Desde:** el claudquitecto. Sustituye al boceto del §7 de `PLAN.md`.

## 0. Qué y por qué

klothulhu empieza a **usar** sus recuerdos:
- **D43:** los más fuertes van en el prompt del narrador;
- **D36, D44:** una búsqueda en paralelo trae, para el mensaje siguiente, los que vengan a cuento;
- **D45:** al cerrar, un repaso dice cuáles usó (se refuerzan) y qué fallos hubo;
- **D46:** lo que se apaga, se poda.

**Contrato:** cambia el esquema de BD (tabla nueva `memoria_eventos`) y `/health` añade `sesiones`.
Ni el SSE ni el cliente cambian.

**Las normativas de H1 no se tocan.** Tienen que seguir en verde sin editarlas. El diseño de abajo
está hecho para eso: el repaso va en una llamada aparte y `cerrar()` solo gana un argumento opcional.

**Fuera de alcance:**
- la ocurrencia tardía (D38, H4);
- la nota de despertar en el saludo;
- el sueño (enfoque C);
- cambiar el prompt del escritor;
- el cliente.

## 1. Lista previa (convención §4)

- **¿Borra o sobrescribe datos?** Sí: la poda marca `borrado` y quita puntos de Qdrant, y el
  refuerzo actualiza `usos`.
  - Las normativas usan `AlmacenEnMemoria`.
  - `tests/test_memoria_bd.py` amplía el contrato contra `klothulhu_test` / `klothulhu_memoria_test`
    (las mismas reglas que en H1).
  - El esquema solo usa `CREATE … IF NOT EXISTS`. No hay `DROP`, y nada se borra de MariaDB.
- **¿API externa?** Sí, las mismas de H1: `claude-haiku-5-5` para el juez y el repaso, y
  `text-embedding-3-small` para un embedding por mensaje.
  - Precios y reglas como en el plan §1: `effort: low`, salida estructurada, sin `temperature` y
    mirando `stop_reason`.
  - **Coste estimado:**
    - la búsqueda, unos $0,0000004 por mensaje;
    - el juez, $0,00004 por candidato que pasa el umbral;
    - el repaso, $0,0003 por sesión con recuerdos.

    Una semana de uso no llega a $0,05, y el freno de $1 sigue mandando.
  - El único paso de pago es **[API] T8**, con tope de $0,05. Se informa el coste de cada modelo.
- **¿Toca producción?** Al cerrar H2, lo hace Josem:
  - merge;
  - `scripts/memoria.py --env-file /etc/klothulhu/klothulhu.env crear` (crea `memoria_eventos`);
  - reinicio.

  `KLOTHULHU_MEMORIA` ya vale 1 en producción, así que **los recuerdos entran en las respuestas en
  cuanto se reinicie**.

## 2. Contratos

### 2.1 `memoria.py` (puro)

- Constantes nuevas: `FUERZA_MINIMA = 0.05` (D46), `CONTEXTO_N = 15` y `UMBRAL = 0.45`. El umbral es
  tentativo: lo fijará la revisión de T8 (D44). Lo lee también `KLOTHULHU_MEMORIA_UMBRAL`, en `app`.
- `contexto_inicial(recuerdos, dia_actual, hoy, n=CONTEXTO_N) -> list[dict]`:
  `mas_fuertes(recuerdos, dia_actual, n)` y, detrás, los que tienen `fecha == hoy` y no estaban ya,
  en su orden.
- `bloque(contexto, dia_actual, hoy) -> str` (D43). Con el contexto vacío, `""`. Si no:
  - una línea con `Hoy es <día de la semana en castellano> <AAAA-MM-DD>.`;
  - una instrucción breve: son recuerdos tuyos, escritos por ti; úsalos solo si vienen a cuento, no
    los recites ni los enumeres, no inventes otros. Va en un fichero, `server/memoria_prompt.md`, y
    el texto lo propones tú;
  - un recuerdo por línea: el texto **sin `[` ni `]`**, su antigüedad en días de uso (`de hoy`,
    `de hace 1 día de uso`, `de hace N días de uso`, contada como `dia_actual − creado_dia`) y, si
    tiene fecha, `(sobre el AAAA-MM-DD)`.
  - En todo el bloque no hay `[` ni `]`: el narrador escribe sus emociones entre corchetes y no
    debe ver otros.
- `podables(recuerdos, dia_actual, minimo=FUERZA_MINIMA) -> list[str]`: los ids cuya fuerza de hoy
  queda por debajo de `minimo`, en su orden.

### 2.2 `sesiones.py`

- `Sesion` gana tres campos con valor por defecto, para que las normativas de H1 sigan construyéndola
  igual:
  - `contexto: list[dict] | None = None` (la foto de D43, más los que traiga la búsqueda);
  - `eventos: list[dict]` (vacía; D45);
  - `dia: int | None = None` (el día de uso de la sesión).
- `actual(cid) -> Sesion`: la sesión abierta del cliente, o una nueva. Si la abierta había caducado,
  pasa a pendientes, como en `anotar()`. Una sesión recién creada cuenta como actividad «ahora».
  `anotar()` usa `actual()`.
- `cuantas() -> int`: cuántas sesiones abiertas hay, sin contar las pendientes.

### 2.3 `busqueda.py` (nuevo; D36, D44)

`async buscar(texto, sesion, *, embedder, indice, juez, freno, umbral) -> None`. Nunca lanza.
1. Si `sesion.contexto` es `None`, lo pone a `[]`. Si `not freno.permitido()`, sale.
2. `vector, uso = await embedder(texto)` y `freno.anotar("embedding", *uso)`. Si falla, sale.
3. `hits = await asyncio.to_thread(indice.consultar, vector, 3 + len(sesion.contexto))`.
4. Los 3 primeros hits cuyo `id` no está en el contexto son **candidatos**. Por cada uno se añade
   a `sesion.eventos` `{"tipo": "candidato", "recuerdo_id", "similitud", "pertinente": None,
   "mensaje": texto, "cuando": datetime}`.
5. Si `similitud >= umbral` y `freno.permitido()`:
   - `pertinente, uso = await juez(texto, hit["texto"])` y `freno.anotar("juez", *uso)`;
   - se guarda el veredicto en el evento;
   - si es pertinente, el recuerdo (sin `similitud`) se añade a `sesion.contexto` y queda un
     `log.info("F1 en sesión %s: recuerdo %s", …)`, con ids y sin texto.
   - Si el juez falla, `pertinente` se queda en `None`.

### 2.4 `escritor.py`

- `ESQUEMA_JUEZ = {"pertinente": boolean}`. `async juzgar(mensaje, recuerdo) -> (bool, uso)`, con su
  prompt en `server/juez_prompt.md`: «¿Le serviría a klothulhu tener presente este recuerdo para
  contestar este mensaje?». Ante la duda, no.
- `ESQUEMA_REPASO`: `{"usados": [str], "fallos": [{"tipo": "F3"|"F4"|"F5", "recuerdo": str|null}]}`.
  `async repasar(transcripcion, contexto) -> (salida, uso)`, con su prompt en
  `server/repaso_prompt.md`. Al modelo se le pasan los recuerdos con **ids cortos** (`r1`, `r2`…,
  en el orden del contexto), y `repasar` los traduce a los ids completos antes de devolver. Un id
  corto desconocido se devuelve tal cual: `cerrar()` lo descartará.
  - **usados:** los que klothulhu mencionó o en los que se apoyó al contestar.
  - **F3:** venía claramente a cuento y no lo usó.
  - **F4:** el mortal le reprocha no recordar algo («¿no te acuerdas?», «ya te lo dije»). Lleva el
    recuerdo si estaba en el contexto; si no, `null`.
  - **F5:** lo sacó sin venir a cuento.
- Falsos para `KLOTHULHU_FAKE=1`: `juzgar_falso` (siempre `True`) y `repasar_falso` (nada usado y
  sin fallos).
- `ESQUEMA`, `escribir` y `embeber` no cambian.

### 2.5 `cierre.cerrar(…, repasador=None)` (D45, D46)

El H1 se queda como está, con estos cambios:
- **0.** Si `sesion.turnos` está vacío, devuelve 0: no anota nada ni llama a nadie. `actual()` puede
  abrir sesiones que nunca llegan a tener una vuelta, si la respuesta falló.
- **Tras escribir los recuerdos (paso 5):**
  1. **Repaso:** si hay `repasador`, `sesion.contexto` tiene algo y `freno.permitido()`:
     - `salida, uso = await repasador(transcripcion, sesion.contexto)` y
       `freno.anotar("repaso", *uso)`;
     - `usados`: los ids que están en el contexto, sin repetir, van a `almacen.reforzar(ids, dia)`;
     - `fallos`: se quedan los de tipo F3, F4 o F5. F3 y F5 necesitan un recuerdo del contexto;
       en F4 es opcional, y si no está en el contexto pasa a `None`. Cada uno se convierte en un
       evento `{"tipo", "recuerdo_id", "similitud": None, "pertinente": None, "mensaje": None,
       "cuando"}`.
  2. `almacen.anotar_eventos(sesion.id, sesion.eventos + los de los fallos)`.
  3. **Poda:** `almacen.podar(memoria.podables(almacen.recuerdos(), dia))`.

Un fallo en el repaso, en los eventos o en la poda no impide anotar la sesión. Los logs, como en H1:
tipo de excepción, ids y cuentas.

### 2.6 Almacenes (`AlmacenEnMemoria` y `AlmacenMariaQdrant`, el mismo contrato)

- `consultar(vector, n) -> list[dict]`: hasta `n` recuerdos no borrados, de más a menos similares,
  con las claves de `recuerdos()` más `similitud`. En el real: Qdrant (`query_points`) y después
  MariaDB para los campos. En memoria: coseno contra los vectores guardados; los de
  `vector=None` no salen.
- `reforzar(ids, dia)`: `usos + 1` y `ultimo_uso_dia = dia`. Los ids desconocidos se ignoran.
- `anotar_eventos(sesion_id, eventos)` y `eventos() -> list[dict]` (las claves del evento, más
  `sesion_id`).
- `podar(ids)`: `borrado = ahora`, y fuera de Qdrant. Desde ese momento no sale en `recuerdos()` ni
  en `consultar()`.
- `sesiones_anotadas() -> list[dict]` (para las pruebas; en el real, la tabla `sesiones`).

`esquema.sql` añade:

```sql
CREATE TABLE IF NOT EXISTS memoria_eventos (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  sesion_id CHAR(36) NOT NULL,
  cuando DATETIME NOT NULL,
  tipo VARCHAR(16) NOT NULL,             -- candidato | F3 | F4 | F5 (F1 y F2 se derivan, D44)
  recuerdo_id CHAR(36) NULL,
  similitud DOUBLE NULL,
  pertinente BOOLEAN NULL,               -- veredicto del juez; NULL = no juzgado
  mensaje VARCHAR(1000) NULL             -- el mensaje del mortal (candidatos); nunca a los logs (D42)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2.7 `app.py`

- **En `_reply`, con `MEMORIA` y antes de llamar al narrador:**
  - `sesion = sesiones.actual(cid)`.
  - Si `sesion.contexto is None`:
    - con `_almacen`, `sesion.dia = anotar_dia_uso(hoy)` y
      `sesion.contexto = contexto_inicial(recuerdos(), sesion.dia, hoy)`, en `to_thread`;
    - si falla o no hay almacén, `contexto = []`, con un `warning` sin texto.
  - La búsqueda se lanza como tarea aparte, sin esperarla (`busqueda.buscar(text, sesion, …)`), y
    solo si hay almacén. Guarda la referencia en un `set` y quítala al acabar.
  - Hoy es la fecha de `Europe/Madrid`.
- **`_system(sesion)`:**
  - devuelve `SYSTEM_PROMPT` si `sesion` es `None` o su contexto está vacío;
  - si no, `[{"type": "text", "text": SYSTEM_PROMPT}, {"type": "text", "text": bloque(sesion.contexto, sesion.dia, sesion.inicio.date())}]`.

  `_model_stream` recibe el `system`.
- **Las normativas M8 de H1 activan `MEMORIA` sin almacén.** Con `_almacen is None` no hay ni
  contexto ni búsqueda, y nada lanza.
- `_cerrar_sesion` pasa `repasador` (`escritor.repasar`, o `repasar_falso` con `FAKE`).
- **Al parar,** antes de cerrar las sesiones, cancela las búsquedas en curso y espéralas, como
  mucho 2 s dentro de `APAGADO_S`.
- **`/health`** añade `"sesiones": sesiones.cuantas()` en el nivel superior. No va dentro de
  `memoria`, porque M8 fija ese dict.

### 2.8 Otros

- **`registro.py`, retoque:** cada línea sale dos veces en `journalctl`, porque nadie quita el
  manejador por defecto de loguru. `configurar()` lo quita, y lo hace de forma idempotente. Prueba
  de regresión: tras `configurar()`, un `warning` deja una sola línea en stderr (`capsys`).
- **`scripts/memoria.py eventos`:** un resumen de `memoria_eventos`, para H3:
  - candidatos;
  - F1 (`pertinente = 1`);
  - F2 (`similitud` en `[umbral − 0,05, umbral)`);
  - juzgados que no eran pertinentes;
  - F3, F4 y F5.

  Todo con cuentas y, con `--detalle`, el mensaje y el texto del recuerdo de cada F1, F2 y F4.
  `listar` sigue igual.

## 3. Tareas

Rama `fase7`, el mismo worktree. Una tarea, un commit, y D<n> en el código, en la costura que cada
una gobierna.

- **T1** · `memoria.py` (N1-N3).
- **T2** · `sesiones.py` (N4).
- **T3** · Almacenes, `esquema.sql` y el contrato de `test_memoria_bd.py`: `consultar`, `reforzar`,
  eventos, `podar` (que en el real también quita el punto de Qdrant) y `sesiones_anotadas`.
- **T4** · `escritor.py`, con `juez_prompt.md` y `repaso_prompt.md` (N10).
- **T5** · `busqueda.py` (N5, N9).
- **T6** · `cierre.py` (N6, N7, N9) y el cableado en `app.py` y `memoria_prompt.md` (N8).
- **T7** · El retoque de `registro.py` y `scripts/memoria.py eventos`.

**⏸ Parada 1:** las normativas de H1 y H2 en verde sin editar, todas las pruebas, `ruff` y T3
contra `klothulhu_test`. Pasada a mano con `KLOTHULHU_FAKE=1 KLOTHULHU_MEMORIA=1` contra
`klothulhu_dev`, en el puerto que no use el servicio:
- **(a)** con dos o tres recuerdos falsos en `klothulhu_dev`, el primer mensaje lleva el bloque en
  el `system`. Enséñalo con un log de depuración local, que **no** se suba;
- **(b)** tras un cierre, `eventos` muestra candidatos y `listar` muestra los `usos`.

Informe en `docs/fase7/H2-informe.md`.

- **T8 · [API] Calibración**, solo tras la revisión de la parada 1 y con la autorización anotada
  aquí (tope $0,05).
  - `tests/fixtures/calibracion.json`, escrito por ti:
    - **unos 12 recuerdos** al estilo de los reales: personales, con fechas, de klothulhu mismo.
      Puedes inspirarte en el tono de los que hay en producción, pero **no copies su texto**;
    - **unos 30 mensajes**, cada uno con la lista de recuerdos que le vendrían a cuento (a menudo
      ninguno). Mete paráfrasis («lo del cole del crío» frente a «colegio de su hijo») y temas
      vecinos que **no** son pertinentes.
  - `scripts/memoria_calibrar.py`, sin BD:
    - embebe los recuerdos y los mensajes;
    - calcula la similitud de cada pareja;
    - da la distribución de las parejas pertinentes y de las que no;
    - propone **el umbral más alto que deja pasar al menos el 90 % de las pertinentes**;
    - pasa por el juez todas las parejas que superan ese umbral y da los aciertos frente a las
      etiquetas;
    - pasa el repaso por 2 charlas de muestra con contexto;
    - mide la **latencia** del embedding (p50 y p95) y la del juez.
  - Captura en `docs/fase7/capturas/calibracion.json`, con el coste de cada modelo. La orden la
    lanza Josem.

**⏸ Parada 2:** el anexo con la captura. Yo fijo `UMBRAL` en la revisión.

## 4. Pruebas normativas

`docs/fase7/normativas/test_fase7_h2.py` se copia tal cual a `tests/test_fase7_h2.py`. **Las de H1
(`tests/test_fase7_h1.py`) siguen sin editar y en verde.** Si alguna choca con este encargo, para y
pregunta.

| # | Qué fija |
|---|---|
| N1 | La foto inicial: los 15 más fuertes, más los de hoy, sin repetir |
| N2 | El bloque: fecha, textos sin corchetes, vacío si no hay recuerdos |
| N3 | `podables()` con `FUERZA_MINIMA` |
| N4 | `actual()` y `cuantas()` |
| N5 | La búsqueda: candidatos, umbral, juez, contexto, gasto, freno y fallos |
| N6 | El repaso: refuerzo, fallos válidos, cuándo no se repasa, y la sesión vacía |
| N7 | La poda al cerrar |
| N8 | `_system()` y `sesiones` en `/health` |
| N9 | Búsqueda y repaso sin texto en los logs, y el F1 avisado |
| N10 | Esquemas y prompts del juez y del repaso |

## 5. Al cerrar H2 (Josem)

1. Merge `--ff-only` de `fase7` en `main`.
2. `sudo .venv/bin/python scripts/memoria.py --env-file /etc/klothulhu/klothulhu.env crear`.
3. `sudo systemctl restart klothulhu-api`.

**Prueba (R1-R3):**
- **R1:** habla de algo que recuerde (la quedada del 22, el pilates) y mira si lo usa con
  naturalidad, sin recitar.
- **R2:** tras cerrar la sesión, `listar` muestra `usos` > 0 en lo que usó.
- **R3:** `eventos` muestra candidatos de tus mensajes.

Después empieza la semana de uso (H3).

## Para el programador

Responde a: 6495a4c (H1-informe, anexo de la parada 2)

H2 encargado. Copia `docs/fase7/normativas/test_fase7_h2.py` a `tests/` y haz T1-T7 en orden, hasta
la **parada 1**. Las normativas de H1 no se editan y tienen que seguir en verde. **No lances T8:**
espera a que anote la autorización de Josem en el frontmatter de este fichero. Si algo del encargo
no encaja con el código, para y pregunta.
