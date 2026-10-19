---
proyecto: klothulhu
fase: 7
titulo: memoria larga
plan: arquitecto
fecha: 2026-10-19
decisiones: "vault 30-projects/klothulhu/ficha.md § Decisiones (D34-D42; también D14, D20, D27, D29)"
gasto_autorizado: "H1: paso [API] T10, tope $0,05; lanzado por Josem en persona el 2026-10-19 (vale como autorización), gasto $0,000765"
---

# Fase 7: memoria larga

> **Para:** el claudcoder. **Desde:** el claudquitecto, 2026-10-19.
> Convención: `99-meta/arquitecto-programador/arquitecto-programador.md` (vault).
> Origen: vault `30-projects/klothulhu/propuesta-memoria.md` (borrador; sus D33-D37 son ahora D34-D38).

## 0. Qué y por qué

klothulhu tendrá memoria propia, como en Counterparts: al acabar cada charla escribe 0-3 recuerdos en su
voz, con importancia y emoción; los que se usan se refuerzan y los que no, se apagan. La fase va en
hitos (D39):

- **H1 · Escribir** (este plan, completo). Al cerrar cada sesión, Haiku 5.5 escribe los recuerdos,
  se guardan en MariaDB y en Qdrant, y Josem los ve con un script. **Ninguna respuesta cambia:** los
  recuerdos todavía no entran en el prompt. Con H1 llegan también LogCentral (D42) y el freno de gasto (D40).
- **H2 · Recordar** (boceto en §7; se completa tras la revisión de H1): los recuerdos entran en el
  prompt, la búsqueda va en paralelo (D36), se refuerzan los usados y se registran los fallos F1-F5.
- **H3 · Semana de uso**: informe con los datos. **H4 · Ocurrencia tardía**: solo si D38 la pide.

**Contrato:** H1 crea uno nuevo, el esquema de BD y la colección de Qdrant, y añade `memoria` a
`/health` (el cliente lo ignora). El SSE y el cliente no cambian. Por eso el plan es del arquitecto.

**Fuera de alcance de H1:** meter recuerdos en el prompt del narrador; buscar en Qdrant durante la
charla; reforzar, podar o borrar recuerdos; `memoria_eventos` (F1-F5); el cliente (`desktop/`); la
nota de despertar en el saludo (D29, borrador §2.3); el sueño diario (enfoque C).

## 1. Lista previa (convención §4)

- **¿Algo borra o sobrescribe datos?** Sí: escribe en MariaDB y en Qdrant.
  - Las normativas no tocan nada: usan `AlmacenEnMemoria` y falsos.
  - Las pruebas de integración (T6) y la pasada [API] (T10) usan **solo** `klothulhu_test` y
    `klothulhu_memoria_test`, y vacían sus tablas y su colección al empezar. El código **se niega** a
    abrir un almacén cuya BD y cuya colección no casen (`klothulhu_dev` ↔ `klothulhu_memoria_dev`,
    `klothulhu_test` ↔ `klothulhu_memoria_test`, `klothulhu` ↔ `klothulhu_memoria`). Las pruebas
    se niegan a correr contra un nombre que no acabe en `_test`.
  - El esquema solo usa `CREATE … IF NOT EXISTS`. Nunca hay `DROP`.
  - Hay dos usuarios de MariaDB (P1): `klothulhu_dev` no tiene permisos sobre la BD de producción.
- **¿API externa?** Sí, dos (comprobadas con la skill `claude-api` el 2026-10-19):
  - **Anthropic:** `claude-haiku-5-5`, a $0,10/$0,50 por millón de tokens de entrada y de salida (prompts de
    hasta 100K). Piensa por defecto (adaptativo) y su esfuerzo por defecto es `medium`: se fija
    `output_config.effort = "low"`. **Admite salida estructurada** (`output_config.format`, como el
    director). No admite `temperature` ni prefill. Hay que mirar `stop_reason` (`refusal`,
    `max_tokens`) antes de leer, y buscar el bloque de texto por tipo, no por posición: el pensamiento
    va antes.
  - **OpenAI:** `text-embedding-3-small`, 1536 dimensiones, a $0,02 por millón de tokens. Clave
    propia de klothulhu (`OPENAI_API_KEY`).
  - **Coste estimado:** cerrar una sesión cuesta unos $0,0005 y cada recuerdo, menos de $0,000001
    de embedding. Las pruebas que gastan dinero son el paso **[API] T10**, con tope de $0,05, y se
    informa el coste de cada modelo.
- **¿Algo toca producción?** Sí, al cerrar H1, y lo hace Josem (§6):
  - BD `klothulhu`, colección `klothulhu_memoria`, `klothulhu-api.service` (la unidad cambia) y
    `vector.toml`.
  - El código usa por defecto la BD y la colección de desarrollo. Las de producción solo aparecen en
    `/etc/klothulhu/klothulhu.env`, que solo lee la unidad.
  - La memoria arranca **apagada** (`KLOTHULHU_MEMORIA=0` por defecto): desplegar el código no cambia
    nada hasta que Josem la enciende.

## 2. Antes de empezar (Josem)

- **P1 · BD y usuarios** (como root de MariaDB). Las contraseñas las eliges tú. La de `klothulhu_dev`
  va al `.env` del worktree (P3) y la de `klothulhu`, a `/etc/klothulhu/klothulhu.env` (§6).

  ```sql
  CREATE DATABASE klothulhu      CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  CREATE DATABASE klothulhu_dev  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  CREATE DATABASE klothulhu_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  CREATE USER 'klothulhu'@'localhost'     IDENTIFIED BY '…';
  CREATE USER 'klothulhu_dev'@'localhost' IDENTIFIED BY '…';
  GRANT ALL ON klothulhu.*      TO 'klothulhu'@'localhost';
  GRANT ALL ON klothulhu_dev.*  TO 'klothulhu_dev'@'localhost';
  GRANT ALL ON klothulhu_test.* TO 'klothulhu_dev'@'localhost';
  ```
- **P2 · Clave de OpenAI** propia de klothulhu (borrador §8, en curso). H1 no la necesita hasta T10.
- **P3 · `.env` del worktree** (`/data/klothulhu-fase7/.env`, sin versionar): el programador lo crea
  desde `.env.example` (T1), y tú pones la contraseña de `klothulhu_dev`.

## 3. Contratos de H1

### 3.1 Módulos (en `server/`, planos como los de ahora: `import memoria`, sin paquete)

| Módulo | Qué | E/S |
|---|---|---|
| `memoria.py` | `Recuerdo`, `validar()`, `fuerza()`, `mas_fuertes()`, `transcripcion()`; constantes `MAX_RECUERDOS = 3`, `MAX_TEXTO = 400`, `VIDA_BASE = 7`, `PESO_EMOCION = 1.25` | puro |
| `sesiones.py` | `Sesion` y `Sesiones` (D41) | puro (reloj inyectable) |
| `gasto.py` | `PRECIOS`, `coste()`, `Freno` (D40) | a través del almacén |
| `memoria_bd.py` | `AlmacenEnMemoria` (para pruebas) y `AlmacenMariaQdrant` (PyMySQL + `qdrant-client`, síncronos); `esquema.sql` al lado | MariaDB, Qdrant |
| `escritor.py` | `escribir()` (Haiku), `embeber()` (OpenAI), `ESQUEMA`, `MODELO`, `MODELO_EMBEDDING`, `DIMENSION`; sus falsos para `KLOTHULHU_FAKE=1`; prompt en `escritor_prompt.md` | Anthropic, OpenAI |
| `cierre.py` | `async cerrar(sesion, *, almacen, escritor, embedder, freno) -> int` | orquesta |
| `registro.py` | `configurar(log_dir)`: el `logging` estándar pasa a LogCentral (D42) | fichero de log |

**`memoria.py`**
- `Recuerdo(texto: str, importancia: int, emocion: str, fecha: date | None)`, dataclass congelada.
- `validar(salida) -> list[Recuerdo]`:
  - acepta cualquier cosa y nunca lanza;
  - descarta los elementos que no son dict, tienen el texto vacío tras `strip()` o más largo que
    `MAX_TEXTO`, una importancia fuera de 1-5, una emoción fuera de `EMOTIONS`, o una fecha que no es
    `None` ni `AAAA-MM-DD`;
  - se queda con los 3 primeros válidos.
- `fuerza(importancia, emocion, dias_sin_uso, usos)` = `importancia/5 × (1 si neutral, si no PESO_EMOCION) × 0.5 ** (dias_sin_uso / (VIDA_BASE × (1 + usos)))` (D34).
- `mas_fuertes(recuerdos: list[dict], dia_actual: int, n: int = 15) -> list[dict]`, ordenados por
  fuerza de mayor a menor. Días sin uso = `dia_actual − (ultimo_uso_dia o, si es None, creado_dia)`.
- `transcripcion(turnos) -> str`: `"Mortal: …\nKlothulhu: …"`. El texto de klothulhu va tal cual, con
  sus etiquetas de emoción.

**`sesiones.py`** (D41)
- `Sesion(id, cliente, turnos, inicio)`, dataclass. `id` es un uuid4 en texto, `turnos` es una lista
  de `(texto_usuario, respuesta_cruda)` e `inicio` es un `datetime` con zona `Europe/Madrid`.
- `Sesiones(ttl_seconds, max_turnos=50, clock=time.monotonic)`:
  - `anotar(cid, texto, crudo)`: si la sesión abierta del cliente ya ha caducado, la pasa a
    pendientes y abre otra. Se quedan las últimas `max_turnos` vueltas.
  - `olvidar(cid)`: tira la sesión **abierta** del cliente, sin cerrarla (D37).
  - `vencidas()`: saca y devuelve las pendientes y las abiertas que llevan `>= ttl` sin actividad.
  - `todas()`: saca y devuelve las pendientes y todas las abiertas (para el apagado).

**`gasto.py`** (D40)
- `PRECIOS` en $ por millón de tokens: `{"claude-haiku-5-5": (0.10, 0.50), "text-embedding-3-small": (0.02, 0.0)}`.
  Fuente: skill `claude-api` (2026-10-19) y Sebastian (`core/memoria/embedder.py`). Si cambian, se
  cambian aquí.
- `coste(modelo, tokens_in, tokens_out=0)`: con un modelo desconocido lanza `KeyError`, a propósito
  (no se gasta sin saber cuánto).
- `Freno(tope, almacen)`:
  - `permitido()` es `almacen.gasto_total() < tope`;
  - `anotar(concepto, modelo, tokens_in, tokens_out)` calcula el coste, lo anota y lo devuelve;
  - al pasar de permitido a frenado, deja un `warning` en el log.

**Almacén** (`AlmacenEnMemoria` y `AlmacenMariaQdrant`, el mismo contrato):
- `guardar(*, sesion_id, cliente, recuerdo, vector, creado_dia) -> str`: devuelve el id (uuid4, el
  mismo en MariaDB que en Qdrant). Con `vector=None`, `indexado = False` y no se toca Qdrant. Si
  Qdrant falla, se guarda igual con `indexado = False` (D35).
- `recuerdos() -> list[dict]` con las claves `id texto importancia emocion fecha sesion_id cliente
  creado_dia usos ultimo_uso_dia indexado`, sin los borrados.
- `anotar_dia_uso(dia: date) -> int`: idempotente. Devuelve el número de ese día de uso: 1 el
  primero, 2 el segundo…
- `anotar_gasto(concepto, modelo, tokens_in, tokens_out, coste)`, `gasto_total() -> float`.
- `anotar_sesion(*, id, cliente, inicio, motivo, turnos, recuerdos, coste)`: una fila sin texto por
  sesión cerrada (`motivo` es `ttl` o `apagado`), para el informe de H3. Las sesiones olvidadas no
  se anotan (D37).

**`escritor.py`**
- `ESQUEMA`: `{"recuerdos": [{"texto", "importancia" (enum 1-5), "emocion" (enum EMOTIONS), "fecha" (texto o null)}]}`,
  con `additionalProperties: false` y todos los campos en `required`. Lo demás (longitud, número de
  recuerdos, formato de fecha) lo comprueba `validar()`: no se confía en el esquema para eso.
- `async escribir(transcripcion, previos: list[str], hoy: date) -> (salida: dict, uso: (modelo, in, out))`:
  - una llamada no streaming a `MODELO`, con `effort: low`, `max_tokens = 4096` y la salida estructurada;
  - el mensaje de usuario lleva la fecha de hoy con el día de la semana en castellano (sin `locale`),
    los previos y la charla;
  - con `stop_reason` `refusal` o `max_tokens`, devuelve `{"recuerdos": []}` y deja un `warning`.
- `async embeber(texto) -> (vector, uso)`.
- Los clientes de Anthropic y OpenAI se crean al primer uso, no al importar: las pruebas importan
  el módulo sin claves.
- Con `KLOTHULHU_FAKE=1`, `app` usa `escribir_falso` (un recuerdo fijo) y `embeber_falso` (un vector
  fijo). Así el circuito entero se prueba gratis contra la BD de desarrollo.

**`escritor_prompt.md`** (lo escribe el programador, con estas reglas; lo revisaré):
- habla klothulhu, en primera persona y en su voz (como `prompt.md`), de lo que quiere recordar del
  mortal o de sí mismo;
- **0 recuerdos es una respuesta normal**: una charla de trámite no deja nada;
- no repetir lo que ya está en los previos;
- como mucho 3, de una o dos frases cada uno;
- importancia: 1 una anécdota, 3 algo personal del mortal, 5 un hecho vital o una fecha que importa;
- emoción: la que sintió klothulhu, con una de las 7;
- fecha: solo si el recuerdo se refiere a un día concreto («el jueves» se resuelve con la fecha de hoy);
- **nunca** guardar contraseñas, claves ni datos que el mortal pida no recordar.

**`cierre.cerrar()`** (D34, D35, D40). Nunca lanza.
1. `dia = almacen.anotar_dia_uso(sesion.inicio.date())`.
2. Si `not freno.permitido()`: un log y devuelve 0, sin llamar a nadie.
3. `previos` = los textos de `mas_fuertes(almacen.recuerdos(), dia)`.
4. `salida, uso = await escritor(transcripcion(turnos), previos, sesion.inicio.date())` y
   `freno.anotar("escritor", *uso)`.
5. Para cada recuerdo de `validar(salida)`:
   - si el embedder funciona: `vector`, y `freno.anotar("embedding", …)`;
   - si falla: `vector = None`;
   - después, `almacen.guardar(…, creado_dia=dia)`.
6. `almacen.anotar_sesion(…)` y un log con el id de la sesión, cuántas vueltas, cuántos recuerdos y
   el coste. **Sin texto** (D42).
7. Devuelve cuántos recuerdos guardó.

Si algo falla en los pasos 3-5, devuelve lo que llevara guardado y deja un `warning` con el tipo de
excepción, nunca su mensaje: puede llevar texto. El almacén es síncrono, así que `cerrar()` lo llama
con `asyncio.to_thread`.

**`app.py`**
- Ajustes nuevos:
  - `MEMORIA = KLOTHULHU_MEMORIA == "1"` (por defecto `0`);
  - `KLOTHULHU_MEMORIA_TOPE` (`1.0`);
  - `KLOTHULHU_DB_HOST`, `_PORT`, `_USER`, `_PASSWORD` y `_NAME` (por defecto `klothulhu_dev`);
  - `KLOTHULHU_QDRANT_URL` (`http://localhost:6333`) y `KLOTHULHU_QDRANT_COLECCION` (por defecto
    `klothulhu_memoria_dev`);
  - `OPENAI_API_KEY`;
  - `LOGCENTRAL_LOG_DIR`: si está, `registro.configurar()`; si no, el `basicConfig` de hoy.
- `sesiones = Sesiones(HISTORY_TTL_MIN * 60)` a nivel de módulo, siempre. Después de
  `history.append`, **solo si `MEMORIA`**, `sesiones.anotar(cid, text, "".join(raw))`.
- `DELETE /history` también llama a `sesiones.olvidar(cid)` (D37).
- `lifespan`:
  - con `MEMORIA`, abre el almacén y lanza el barrido: cada 60 s, `cerrar()` cada `vencidas()`;
  - al parar, cancela el barrido y cierra `todas()`, con `asyncio.wait_for(…, 20)` en total (D41);
  - si el almacén no abre (BD caída), la memoria queda apagada en ese proceso, con un `error` en el
    log, y klothulhu sigue contestando.
- `/health` añade `"memoria": {"enabled": MEMORIA, "frenada": not freno.permitido()}`, con
  `frenada: false` si la memoria está apagada.

### 3.2 Esquema (`server/esquema.sql`)

```sql
CREATE TABLE IF NOT EXISTS recuerdos (
  id CHAR(36) PRIMARY KEY,               -- el mismo id que el punto de Qdrant
  texto VARCHAR(400) NOT NULL,
  importancia TINYINT NOT NULL,
  emocion VARCHAR(16) NOT NULL,
  fecha DATE NULL,                       -- el día al que se refiere, no cuándo se escribió
  sesion_id CHAR(36) NOT NULL,
  cliente VARCHAR(32) NOT NULL,
  creado DATETIME NOT NULL,
  creado_dia INT NOT NULL,               -- número de día de uso (D34)
  usos INT NOT NULL DEFAULT 0,           -- H2
  ultimo_uso_dia INT NULL,               -- H2
  indexado BOOLEAN NOT NULL DEFAULT 0,   -- 0 = falta en Qdrant (D35)
  nucleo BOOLEAN NOT NULL DEFAULT 0,     -- enfoque C (sueño); en H1 siempre 0
  origen VARCHAR(16) NOT NULL DEFAULT 'sesion',
  borrado DATETIME NULL                  -- H2 (poda)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS dias_uso (dia DATE PRIMARY KEY);

CREATE TABLE IF NOT EXISTS memoria_gasto (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  cuando DATETIME NOT NULL,
  concepto VARCHAR(16) NOT NULL,         -- escritor | embedding (H2: juez)
  modelo VARCHAR(64) NOT NULL,
  tokens_in INT NOT NULL,
  tokens_out INT NOT NULL,
  coste DOUBLE NOT NULL                  -- DOUBLE, no DECIMAL(10,6): un embedding cuesta ~2e-7
);

CREATE TABLE IF NOT EXISTS sesiones (
  id CHAR(36) PRIMARY KEY,
  cliente VARCHAR(32) NOT NULL,
  inicio DATETIME NOT NULL,
  cierre DATETIME NOT NULL,
  motivo VARCHAR(16) NOT NULL,           -- ttl | apagado
  turnos INT NOT NULL,
  recuerdos INT NOT NULL,
  coste DOUBLE NOT NULL
);
```

**Qdrant:** colección de 1536 dimensiones, distancia coseno. El payload lleva `texto importancia
emocion fecha creado`, para poder verla sin MariaDB.

## 4. H1 · Tareas

Rama `fase7`, worktree `/data/klothulhu-fase7` (ya creado), con su `.venv` 3.12 propio. Una tarea,
un commit. Cita D<n> en el código, en la costura que cada decisión gobierna.

- **T1 · Dependencias y configuración.**
  - `requirements.txt`: `PyMySQL`, `qdrant-client` y `openai`, fijados a la versión que instales
    (pictohistorias usa `qdrant-client==1.19.1` y `openai==3.14.1`), y
    `-e /data/logcentral/packages/client/`.
  - `.env.example` (desarrollo) y `server/klothulhu.env.example` con las variables nuevas. Comprueba
    que `.gitignore` excluye `.env`.
  - `ruff.toml`: `extend-exclude` para `docs/fase7/normativas`, y `per-file-ignores` para la copia
    en `tests/` si hace falta.
- **T2 · `registro.py`** (M10). Lleva el `logging` estándar a `logcentral_client.get_logger("klothulhu", log_dir)`
  (un manejador del logger raíz que reenvía a loguru). Es idempotente: llamarlo dos veces no duplica
  líneas. Los módulos siguen usando `logging.getLogger(...)`.
- **T3 · `memoria.py`** (M1-M3).
- **T4 · `sesiones.py`** (M4).
- **T5 · `gasto.py`** (M5), con `AlmacenEnMemoria` de T6 (empieza por él).
- **T6 · `memoria_bd.py` y `esquema.sql`.**
  - `AlmacenMariaQdrant(db: dict, qdrant_url, coleccion)`, con la comprobación de nombres del §1, y
    `crear()`, que aplica `esquema.sql` y crea la colección si no existe.
  - `tests/test_memoria_bd.py`, **no normativo**:
    - corre el mismo contrato sobre los dos almacenes;
    - el real, solo con `KLOTHULHU_TEST_DB=1` y contra `klothulhu_test` / `klothulhu_memoria_test`,
      con vectores falsos (sin OpenAI);
    - vacía sus tablas y su colección al empezar;
    - prueba la negativa a abrir con nombres que no casan.
- **T7 · `escritor.py` y `escritor_prompt.md`** (M9). Los falsos van en el mismo módulo.
- **T8 · `cierre.py` y el cableado en `app.py`** (M6-M8).
- **T9 · `scripts/memoria.py`.**
  - `--env-file` (por defecto, el `.env` de la raíz del repo). La primera línea de la salida
    **siempre** dice qué BD y qué colección está usando.
  - Subórdenes:
    - `crear`;
    - `listar`: id corto, fuerza de hoy, importancia, emoción, fecha, usos, indexado y texto, de
      más fuerte a más débil;
    - `gasto`: el total, y el desglose por concepto y modelo;
    - `reindexar`: embebe y sube los `indexado = 0`.
- **T9b · Unidad.** `server/klothulhu-api.service`:
  - `ReadWritePaths=/data/klothulhu/logs`, porque `ProtectSystem=strict` deja `/data` en solo
    lectura y LogCentral escribe ahí;
  - `TimeoutStopSec=30`, para el cierre de 20 s;
  - crea `logs/` con un `.gitkeep` y comprueba que `.gitignore` excluye `logs/*.log`.

  No la instales: eso lo hace Josem (§6).

**⏸ Parada 1:** las normativas en verde, todas las pruebas, `ruff` y T6 contra `klothulhu_test`. Además,
una pasada a mano con `KLOTHULHU_FAKE=1 KLOTHULHU_MEMORIA=1` y `KLOTHULHU_HISTORY_TTL_MIN=1` contra
`klothulhu_dev`, en el puerto que no use el servicio: dos mensajes, esperar al barrido, `listar`. Y
la misma pasada con «Forget» antes del barrido. Informe en `docs/fase7/H1-informe.md`, con la salida
de `listar` en las dos pasadas.

- **T10 · [API] Escritor real.** Solo después de la revisión de la parada 1 y de que Josem lo
  autorice en el chat (tope $0,05; lo anotaré en el frontmatter).
  - `tests/fixtures/sesiones_muestra.json`, con cuatro charlas que escribes tú:
    1. un dato personal con fecha relativa («el jueves tengo el examen de conducir»);
    2. una de trámite técnico (lista o tupla), que debería dar 0 recuerdos;
    3. una triste (se le ha muerto el gato);
    4. otra que repite el dato de la 1, para ver si respeta los previos.
  - `scripts/memoria_prueba.py`: cierra las cuatro en orden, con Haiku y OpenAI reales, contra
    `klothulhu_test` (vaciada al empezar).
  - Guarda `docs/fase7/capturas/escritor_real.json`: por sesión, la salida cruda, el `stop_reason`,
    los recuerdos validados y los tokens; el coste por modelo y el total.
  - La orden la lanza Josem con las claves en el entorno, como T7 de la fase 6.

**⏸ Parada 2:** anexo del informe con los recuerdos reales y el coste.

## 5. Pruebas normativas

`docs/fase7/normativas/test_fase7_h1.py` se copia tal cual a `tests/test_fase7_h1.py` y se hace pasar.
No se edita. Si algo de ella choca con el código o con este plan, para y pregunta.

| # | Qué fija |
|---|---|
| M1 | `validar()`: descarta los inválidos, como mucho 3 y nunca lanza |
| M2 | `fuerza()` y `mas_fuertes()`, con días de uso y vida media que crece con los usos |
| M3 | El formato de la transcripción |
| M4 | Sesiones: caducan, tope de vueltas, un mensaje tras caducar abre otra, `olvidar` |
| M5 | `coste()` y el freno, que cuenta lo que hay en la BD (sobrevive al reinicio) |
| M6 | `cerrar()`: escribe, anota el día y el gasto, pasa los previos, aguanta fallos y respeta el freno |
| M7 | Ningún log lleva texto de mensajes ni de recuerdos |
| M8 | `app`: anota solo con la memoria encendida, Forget tira la sesión, `/health` |
| M9 | Esquema del escritor, modelos y que el prompt exista |
| M10 | El puente a LogCentral |

## 6. Al cerrar H1 (Josem, con órdenes exactas en el diario cuando toque)

1. Merge `--ff-only` de `fase7` en `main`, desde `/data/klothulhu`.
2. `pip install -r requirements.txt` en `/data/klothulhu/.venv`.
3. En `/etc/klothulhu/klothulhu.env`:
   - `KLOTHULHU_DB_USER=klothulhu`, `KLOTHULHU_DB_PASSWORD`, `KLOTHULHU_DB_NAME=klothulhu`;
   - `KLOTHULHU_QDRANT_COLECCION=klothulhu_memoria`;
   - `OPENAI_API_KEY`;
   - `LOGCENTRAL_LOG_DIR=/data/klothulhu/logs`;
   - `KLOTHULHU_MEMORIA=1`.
4. `sudo .venv/bin/python scripts/memoria.py --env-file /etc/klothulhu/klothulhu.env crear`.
5. Instalar la unidad nueva, `daemon-reload` y reiniciar `klothulhu-api`.
6. Añadir la fuente `klothulhu` a `vector.toml` y reiniciar Vector. Yo pongo `logcentral: klothulhu`
   en `proyecto.md` y paso el validador.

**Prueba en producción (L1-L3):**
- **L1:** habla con él, espera 30 min y `listar` (con `--env-file` de producción) muestra lo que ha
  querido recordar.
- **L2:** charla, «Forget» y espera: no aparece nada nuevo.
- **L3:** `/health` dice `memoria.enabled: true`, y `logcentral query --source klothulhu` muestra
  los cierres sin texto.

## 7. H2 · Recordar (boceto; se completa con sus normativas tras revisar H1)

- **Recuerdos en el prompt:** los 15 más fuertes y los que tengan fecha de hoy. Van en un segundo
  bloque de `system` después de `prompt.md`, con su antigüedad («hace 3 días de uso»). Instrucción:
  usarlos solo cuando vengan a cuento, y sin texto nuevo entre corchetes (el parser lo leería como
  emoción).
- **Búsqueda en paralelo** (D36): por cada mensaje, `embeber` y una consulta a Qdrant en una tarea
  aparte, sin esperarla.
  - Si un recuerdo que no estaba en el prompt pasa el umbral (calibrado con unas 30 parejas, como
    en Sebastian D35, en torno a 0,58) y el juez de Haiku dice que es pertinente, entra en el
    contexto del mensaje siguiente y cuenta como F1.
  - Se guardan siempre las 3 mejores puntuaciones (F2).
- **Refuerzo:** la llamada de cierre dice también qué recuerdos del prompt se usaron (`usos += 1`,
  `ultimo_uso_dia`) y detecta F3-F5. La poda marca `borrado` por debajo de una fuerza mínima y
  quita el punto de Qdrant.
- **`memoria_eventos`:** los eventos esperan en la sesión y solo se escriben al cerrarla (D37).
- **Preguntas abiertas para H2:** el umbral (sin medir con este embedder en klothulhu); si el juez
  merece la pena frente a dejar que el narrador decida (indicador: F5 en la semana); y la latencia
  real de OpenAI desde seb01 (sin medir; el borrador estima 100-300 ms).
