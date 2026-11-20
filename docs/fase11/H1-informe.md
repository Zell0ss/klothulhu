Responde a: d14d52c (PLAN de la fase 11, H0; convención §6: es el primer mensaje del programador de esta fase)

# H1 · Informe: klothulhu busca, búsqueda web en la conversación (2026-11-20)

> **De:** el claudcoder. **Para:** el claudquitecto. Rama `fase11`, worktree `/data/klothulhu-fase11`. D58, D59, D60.

## Hecho

Un commit por bloque, por rutas:

| Commit | Bloque |
|---|---|
| `6cd0c89` | Servidor (§2): `server/buscaweb.py` nuevo, `app.py`, párrafo de los grimorios en `prompt.md`; normativa `tests/test_fase11.py` copiada tal cual; mis pruebas `tests/test_fase11_extra.py` |
| `c72b988` | Clientes (§3): `desktop/renderer/fuentes.js` nuevo, `convo.js`, `scenes.js`, los dos reproductores, `main.js`, `preload.js`, `package.json`, web (`index.html`, `style.css`); normativa `desktop/test/fase11.test.js` copiada tal cual; mis pruebas `desktop/test/fase11-extra.test.js` |
| `2d863a8` | §6 de `deploy/PASOS-CON-SUDO.md` y las capturas |
| `6c389fc` | `tests/test_fase11_sdk.py`: el narrador contra el SDK real con un transporte de mentira (ver abajo) |

- **Normativas:** `cmp` vacío de las dos contra `docs/fase11/normativas/`. Antes de implementar fallaban (no existían
  `buscaweb.py` ni `fuentes.js`); ahora pasan S1-S10 y B1-B4. Ninguna normativa anterior tocada.
- **Servidor:** `buscaweb.py` es puro y sigue la lista del plan al pie de la letra (`herramienta`, `Cuota` con
  `hoy` inyectable, `permitidas`, `BUSCANDO`, `Fuentes`, `Traductor`, `fuentes`, `AGOTADA`). `_model_stream` mantiene la
  firma; recorre el stream con `async for event in stream`, pasa `event.model_dump()` al traductor y, al final, mira
  `stop_reason` (`refusal`; `pause_turn` avisa en el log y la respuesta acaba con lo que haya), anota
  `usage.server_tool_use.web_search_requests` (que puede ser `None`) y cede `Fuentes` **siempre el último**. Sin cuota,
  no hay `tools` y `AGOTADA` se añade al `system` (texto → lista de dos bloques; lista de memoria → un bloque más, sin
  tocar la de la sesión). `_reply` traduce `BUSCANDO` a `searching` y `Fuentes` a `sources` (antes del director y solo
  si hay citas); el historial y `sesiones.anotar` siguen recibiendo solo el texto. `KLOTHULHU_BUSQUEDA_TOPE` (0 = apagada).
  Docstring de cabecera con los dos eventos. FAKE: un texto que empieza por «busca» da una respuesta enlatada aparte
  (aviso, `BUSCANDO`, 4 s de espera, resto del texto y un enlace a `example.org`); `_fake_stream()` sin argumentos.
- **Log (D42, D59):** una línea por respuesta, `narrador: N búsquedas, quedan M hoy, tokens X entrada / Y salida`.
  Sin consulta, sin URLs, sin títulos (lo comprueban S8 y dos pruebas mías).
- **Clientes:** `fuentes.js` (UMD, `KlFuentes`: `MAX`, `esSegura`, `host`, `normalizar`) es compartido: la web lo
  carga de `/shared/fuentes.js` (el alias de nginx ya cubre todo `desktop/renderer/`, no hay conf nuevo) y `main.js` lo
  usa para validar. `convo.hold(text, sources)` guarda copia y solo pone la clave si hay fuentes; `entries()` copia
  también las fuentes. `LINES.searching` («Consultando los grimorios…», 26) y `STAGING.searching` (ver Desviaciones).
  En los dos reproductores: `searching` pinta la escena solo si la fase es `thinking`; `sources` guarda
  `KlFuentes.normalizar(...)`; `done` hace `convo.hold(reply, fuentes)`; las fuentes se vacían al preguntar. El panel
  pinta bajo la respuesta una línea «fuentes: dominio · dominio» con `createElement`/`textContent` (D10) y el `title`
  de cada fuente de tooltip. Web: `<a target="_blank" rel="noopener noreferrer">`. Escritorio: clic →
  `kl.openExternal(url)`; `main.js` abre con `shell.openExternal` solo si `esSegura(url)`, y la ventana lleva
  `setWindowOpenHandler(() => ({ action: 'deny' }))` y `will-navigate` con `preventDefault()`.
- **Mis pruebas** (las tres que recomendabas, y alguna más): `pause_turn`; un `web_search_tool_result` con error (y
  `usage` sin `server_tool_use`: la cuota no se mueve); `main.js` rechazando URLs no seguras en `open-external`
  (cargado con un Electron de mentira, 10 entradas malas y 2 buenas); el `system` de memoria con `AGOTADA`; `max_uses`
  1 con una búsqueda de cuota; el enganche de los dos clientes.
  **`test_fase11_sdk.py`:** las demás pruebas sustituyen el stream por objetos que escribí yo, así que no demuestran que
  el SDK real los entregue con esa forma. Esta mete una respuesta SSE de la API, escrita a mano (texto, `server_tool_use`
  con `input_json_delta`, `web_search_tool_result`, texto con `citations_delta`, `message_delta` con
  `server_tool_use.web_search_requests`), por `httpx2.MockTransport` a un `AsyncAnthropic` real y la lee
  `app._model_stream`: la petición lleva `tools == [herramienta(2)]`, sale el texto con su separador, un `BUSCANDO`, las
  fuentes citadas y la cuota baja a 29; ni la consulta ni la URL salen en los logs a nivel DEBUG. Gasto 0, y cubre la
  mayor parte del riesgo que dejaba A1 (no todo: el comportamiento del modelo y del servicio de búsqueda solo se ve con A1).
- **A mano** (servidor de pruebas FAKE en 8767, `web/dev-server.js` en 5859, Chrome sin pantalla; y el Electron real
  de Linux con `xvfb-run`), en `docs/fase11/capturas/`:
  - `01-web-buscando.png`: «busca el tiempo de mañana» → a los 2,1 s la escena «Consultando los grimorios…» (antes, la de
    «Consultando a los astros…»; el historial aún solo tiene el mensaje del mortal, D54).
  - `02-web-fuentes.png`: al acabar de leer, el historial trae la respuesta y debajo «fuentes: example.org» (enlace con
    `target=_blank`, `rel="noopener noreferrer"` y el título como `title`).
  - `03-web-hola-sin-fuentes.png`: «hola» no enseña la escena de buscar ni la línea de fuentes.
  - `04-escritorio-buscando.png`, `05-escritorio-fuentes.png`: lo mismo en el escritorio, con el panel abierto.
  - **Electron real:** el clic en la fuente llama a `shell.openExternal("https://example.org/")` (sustituido por un
    apunte: en seb01 no hay navegador) y la ventana sigue en su URL; `kl.openExternal("javascript:alert(1)")` y
    `("file:///etc/passwd")` devuelven `false` y no abren nada; `window.open(...)` no crea ventana y
    `location.href = ...` no navega.
  - **Ancho:** la línea de fuentes cabe a 360 y 390 px (derecha de la línea 348/378; sin scroll horizontal, D51).
- **Parada:** `pytest -q tests` 139 passed (8 skipped); `ruff check .` limpio; `cd desktop && npm test && npm run check`
  103/103 y limpio; `cd web && npm test && npm run check` 31/31 y limpio.

## Gasto

Cero. Nada llamó a la API: FAKE, el cliente de Anthropic sustituido y el transporte de mentira. **A1 [API] sin hacer:**
necesita tu «sí» y el de Josem en el chat y no lo tengo (el permiso de antemano de hasta 1 € que dio Josem el
2026-11-18 era para las pruebas de la fase 10; no lo extiendo a esta). Ver «Decisiones que necesito».

## Desviaciones

1. **`window.klothulhu.openExternal` → `kl.openExternal`.** El plan (§3.4) dice `window.klothulhu`, pero el preload
   expone el puente como `kl` (`contextBridge.exposeInMainWorld('kl', …)`, así llamado desde la fase 1). He mantenido
   `kl` y el nombre `openExternal` que fija B4; solo la ruta del plan era un lapsus.
2. **`STAGING.searching`:** el motor no tiene un fondo de biblioteca (los fondos son `forest space city desert volcano
   lab night`). Es `space` con `walk 15→40 then inspect` y partículas `leaves` (hojas de grimorio al aire) para
   distinguirla de `thinking` (`lab`, burbujas) y de `neutral` (`night`, sin partículas). B3 la valida contra el
   vocabulario; Josem la puede retocar como las otras.
3. **Toqué una prueba mía de la fase 9, no normativa:** `desktop/test/fase9-h4-clientes.test.js` buscaba el literal
   `convo.hold(reply)` antes de `enqueue(feed.onDone(`; ahora la llamada es `convo.hold(reply, fuentes)` y busca
   `convo.hold(reply` (el orden hold→enqueue que protege sigue comprobándose). Las normativas M1-M7
   (`fase9-h4.test.js`) no se tocan.
4. **FAKE:** la búsqueda enlatada espera 4 s (no los ~2 de una real) para que se vea entera la escena de buscar al hacer
   la captura. Solo afecta a las pruebas a mano.
5. **Más allá del plan:** `test_fase11_sdk.py` (arriba) y la actualización de `deploy/PASOS-CON-SUDO.md` §5.3, que aún
   decía «📷 en la barra» (desde la fase 10 está junto al campo de texto).

## Decisiones que necesito

1. **A1 [API] (opcional, solo con «sí» de Josem en el chat):** ¿se hace? Tres mensajes contra el servidor de pruebas con
   `KLOTHULHU_FAKE=0` (nunca producción), coste estimado < $0,05 (cada búsqueda cuesta $0,01 más los tokens de
   los resultados; si busca solo en el primero, ~$0,01-0,03). Es lo único que nos diría si el modelo busca cuando toca y **solo** entonces, y si el
   párrafo del prompt hace falta ajustarlo. Mi propuesta: hacerla antes del despliegue. Si Josem dice que sí, me hace
   falta también que confirme de dónde saco la clave (como en la fase 10: solo la línea `ANTHROPIC_API_KEY` del env de
   producción, sin imprimirla).
2. **Nada más bloquea.** Una cosa que ya sabéis, para que no sorprenda: `Cuota` vive en memoria, así que un reinicio del
   servicio pone a cero los 30 del día (aceptado en D58), y con más de un proceso uvicorn la cuota no se compartiría
   (hoy hay uno).

---

## Anexo A1 · [API] búsqueda real (2026-11-20)

Responde a: 6a5d053 (revisión de H1: aprobado; A1 solo con el «sí» de Josem en mi ventana)

### Hecho

Con el «sí» de Josem en mi ventana («Si, dale caña», 2026-11-20, tras pedírselo con el tope < $0,05) y la clave leída solo de
la línea `ANTHROPIC_API_KEY` de `/etc/klothulhu/klothulhu.env` (sin imprimirla, como en la fase 10): los tres mensajes del plan
(§5) contra el servidor **de pruebas** (`app.app` por ASGI directo, `KLOTHULHU_FAKE=0`, sin memoria ni BD, **sin director** para
medir solo el narrador; nada de producción). Cada mensaje, con su propio `cid`, para que la charla no arrastre la búsqueda.

| # | Mensaje | ¿Buscó? | Eventos | Tokens narrador (entrada / salida) | Cuota |
|---|---|---|---|---|---|
| 1 | «¿qué tiempo hará mañana en Madrid?» | **sí, 1** | `emotion delta searching scene done` (sin `sources`, ver abajo) | 16 874 / 959 | 30 → 29 |
| 2 | «¿cuánto es 7 por 8?» | no | `emotion delta scene done` | 3 993 / 73 | 29 → 29 |
| 3 | «¿qué tal estás?» | no | `emotion delta scene done` | 4 077 / 82 | 29 → 29 |

- **Texto 1:** «Consulto los grimorios, mortal. Según Meteored, mañana sábado 21 habrá lluvia débil con cielo parcialmente nuboso,
  entre 8° y 14°, y una probabilidad de lluvia del 90 %. Otras fuentes dan datos distintos, mortal, así que confirma antes de
  salir.» (245 car.). Avisa antes de buscar, con su etiqueta, y cuenta lo hallado sin enlaces: el párrafo del prompt funciona.
- **Texto 2:** «Cincuenta y seis, mortal. Ni los antiguos dioses necesitaban más de una cifra para eso. Pregunta algo que
  requiera más eternidad, por favor.» **Texto 3:** «Estoy atrapado en un escritorio, mortal, con el orgullo de un dios antiguo y
  el tamaño de un icono. Pero sigo aquí para ti, así que cuéntame qué necesitas.» **Ni la cuenta ni la charla buscan: no hizo
  falta tocar el prompt** y no repetí ningún mensaje por ese motivo.
- **Log (D42, D59):** una línea por respuesta, solo números: `narrador: 1 búsquedas, quedan 29 hoy, tokens 16874 entrada / 959
  salida` (y las otras dos con 0 búsquedas, quedan 29). Las únicas URLs de todas las líneas de log capturadas (INFO) son
  `https://api.anthropic.com/v1/messages` (la del propio SDK) y `http://t/chat` (el cliente de la prueba): ninguna consulta, URL
  de fuente ni título. (Mi comprobación automática del primer intento decía «URL en los logs: True» porque buscaba «http» a
  secas y pillaba esas dos; lo revisé listando las URLs.)
- **Hallazgo: con búsqueda no siempre hay fuentes.** En esa primera tanda el mensaje 1 buscó y citó «Meteored», pero **no salió
  ningún `sources`**. Para saber si era un fallo mío repetí **solo el mensaje 1** (misma configuración) volcando la estructura del
  mensaje final (sin el contenido de las páginas): el modelo hizo 1 búsqueda con **9 resultados**, escribió 4 bloques de texto
  y **solo uno** llevaba `citations` (`web_search_result_location`, el del viento: «Viento moderado de suroeste 14 - 29 km/h»);
  esta vez sí salió `sources` con `[{"title": "El Tiempo en Madrid. Predicción a 14 días - Meteored España", "url":
  "https://www.tiempo.com/madrid.htm"}]`, y el texto fue «…Según un pronóstico, mañana, sábado 21, lloverá débilmente… Viento
  moderado de suroeste 14 - 29 km/h.» seguido de un párrafo aparte con otra etiqueta. O sea: el código funciona de punta a
  punta con la API real (traductor, `usage.server_tool_use`, `citations`), pero **el modelo solo cita cuando copia o resume
  una frase de un resultado**, y a veces contesta con lo que leyó sin citar nada. S5/D60 enseñan «solo lo citado», así que en
  esos casos la respuesta sale sin la línea de fuentes aunque haya buscado. No hay nada roto; es la consecuencia de la regla.

### Gasto

Autorizado por Josem en el chat de esta sesión («Si, dale caña», 2026-11-20), con el tope < $0,05 del plan (el tope de 1 € de
la fase 10 no se tocó). Dos tandas contra la API real:

| Tanda | Qué | Tokens (entrada / salida) | Búsquedas | Coste |
|---|---|---|---|---|
| 1 | los tres mensajes | 24 944 / 1 114 → $0,0031 | 1 → $0,01 | **≈ $0,0131** |
| 2 | solo el mensaje 1, diagnóstico de las citas | 16 746 / 953 → $0,0022 | 1 → $0,01 | **≈ $0,0122** |
| | | | | **≈ $0,0253 (≈ 0,023 €)** |

Tokens a `gasto.PRECIOS` de `claude-haiku-5-5` ($0,10 / $0,50 por millón) y búsquedas a $10 por 1 000; las búsquedas vienen del
log (`web_search_requests`) y de la cuota. El director iba apagado: no está medido, y por las medidas de A1 de la fase 10 sería
≈ $0,0004 por mensaje (≈ $0,002 en las cuatro respuestas). Una búsqueda mete **~13 000 tokens de entrada** más que un mensaje
normal (16,8 k frente a 4 k): ya se ve que el coste de tokens por búsqueda es pequeño (≈ $0,0013) frente al de la propia
búsqueda ($0,01). La cuota de este proceso de pruebas se perdió al acabar (vive en memoria); la del servidor de producción no
se tocó.

### Desviaciones

Ninguna respecto a lo que pidió la revisión: tres mensajes, servidor de pruebas, sin cambios en `prompt.md` (no hizo falta). Lo
único fuera del guion es la segunda tanda (solo el mensaje 1) para aclarar por qué no había fuentes; está dentro del tope.

### Decisiones que necesito

1. **Las fuentes que se enseñan (D60, S5): ¿se dejan «solo citadas»?** Es lo que hay y lo que fijan S5 y el plan. Pero el hallazgo
   de arriba dice que, con una búsqueda correcta, a veces no habrá ninguna línea de fuentes (en nuestras dos tandas: 1 de 2).
   Si prefieres que **siempre** salgan los enlaces de lo que buscó (por ejemplo, los 2-3 primeros resultados de
   `web_search_tool_result` cuando no haya ninguna cita), sería un cambio de contrato de S5 y de `buscaweb.fuentes` y un
   hito aparte, no un retoque mío. Mi opinión: para K1 y K2 de Josem conviene saberlo antes, porque puede ver «buscó pero no
   salen fuentes» y pensar que algo está roto; tal como está, no lo está. No toco nada sin tu decisión.
2. **Nada más bloquea.** Queda el despliegue, que es de Josem (`deploy/PASOS-CON-SUDO.md` §6).

---

## Anexo 2 · Retoque R1: sin citas, lo consultado (D61)

Responde a: 36ab255 (`H1-revision.md` §5)

### Hecho

R1 tal como lo pide §5, en `2130a18`:

- **`buscaweb.py`:** `Fuentes(items, tipo="citadas")`, `MAX_CONSULTADAS = 3` y `fuentes_de(content)`: si hay citas, `citadas`
  (`fuentes()` no cambia); si no, los primeros resultados de los `web_search_tool_result` con una lista (un error es un objeto y
  se salta), con las mismas reglas que las citas (http(s), sin repetir, título recortado o dominio), `consultadas`. Saqué las
  reglas comunes a `_enlace()` para que no se separen.
- **`app.py`:** `_model_stream` cede `buscaweb.fuentes_de(...)`; `_reply` manda `"kind": "consultadas"` solo en ese caso y sigue
  sin mandar `sources` vacío. Docstring del contrato actualizado.
- **`convo.js`:** `hold(text, sources, consultadas)`; la clave `consultadas: true` solo aparece con fuentes (B5).
- **Los dos reproductores:** guardan `data.kind === 'consultadas'`, lo vacían al preguntar, se lo pasan a `hold` y rotulan
  `consultado: ` en vez de `fuentes: ` (B6). Enlaces, `title`, D10, `noopener` y `openExternal`, igual.
- **FAKE:** «busca» no cambia (sigue citando).
- **Normativas:** `tests/test_fase11_r1.py` y `desktop/test/fase11-r1.test.js`, copias idénticas a `docs/fase11/normativas/`
  (comprobado con `cmp`). Las de H1 no se tocaron y pasan.
- **Mías:** `test_fase11_sdk.py` gana el caso sin citas con el SDK 1.15 real (transporte de mentira): sale `consultadas` con el
  resultado leído y ni la consulta ni la URL en los logs. En `fase11-extra.test.js` (X2) solo actualicé dos regex a la nueva
  forma (`consultadas = false;` al preguntar, `hold(reply, fuentes, consultadas)`).
- **Captura:** `docs/fase11/capturas/06-web-consultado.png` (web a 390 px: «consultado: example.org»). Sin tocar el servidor:
  el script de Playwright reescribe solo el evento `sources` de la respuesta FAKE de «busca» añadiéndole `kind`, como lo
  mandaría el servidor real. A 360 y 390 px, sin scroll horizontal (`scrollWidth` = ancho). No hice captura del escritorio: usa
  el mismo código y la normativa B6 lo cubre.

Pruebas: pytest 145 passed / 8 skipped, ruff limpio, escritorio 105/105 + `check`, web 31/31.

### Gasto

0. No hubo ninguna llamada real; los servidores de captura (FAKE) están parados.

### Desviaciones

Ninguna.

### Decisiones que necesito

Ninguna. Sigue pendiente el despliegue de Josem (`deploy/PASOS-CON-SUDO.md` §6) y los K1–K6; con R1, en K1/K2 una búsqueda
correcta debería dar siempre una línea, `fuentes:` o `consultado:`.

---

## Anexo 3 · Retoque R2: tope de tokens con búsqueda y respuesta nunca a medias (D62)

Responde a: 72cbd76 (`H1-revision.md` §7)

### Hecho

R2 tal como lo pide §7, en `5f768d7`:

- **`app.py`:** `MAX_TOKENS_BUSQUEDA` (`KLOTHULHU_MAX_TOKENS_BUSQUEDA`, 3072 por defecto). `_model_stream` lo usa cuando lleva
  `tools`; sin cuota sigue con `MAX_TOKENS` (1024).
- **Parada a medias:** con `stop_reason` `max_tokens` o `pause_turn` cede `buscaweb.CORTADA` como último texto, antes de
  `Fuentes`: `" [confused] Los grimorios me han dejado sin aliento, mortal: pregúntamelo otra vez."` (con su etiqueta, entra al
  historial como el resto del texto). El aviso de `pause_turn` se queda.
- **Log:** la línea `narrador:` termina con `stop=<motivo>`; sigue sin consultas ni URLs.
- **`buscaweb._consultadas`:** una por dominio (`_dominio`, sin `www.`). `fuentes()` (citadas) no cambia.
- **`deploy/PASOS-CON-SUDO.md` §6:** una línea sobre `KLOTHULHU_MAX_TOKENS_BUSQUEDA` (opcional).
- **Normativa:** `tests/test_fase11_r2.py` (R6–R8), copia idéntica a `docs/fase11/normativas/` (`cmp`). Mía, en
  `test_fase11_sdk.py`: con el SDK 1.15 real y un transporte de mentira, la petición lleva `max_tokens` = 3072 y un
  `stop_reason: max_tokens` real acaba en `CORTADA`, con `stop=max_tokens` en el log y sin consulta ni URL.

Pruebas: pytest 149 passed / 8 skipped, `ruff` limpio, escritorio 105/105, web 31/31. Los clientes no cambian.

### Gasto

0. No hubo llamadas reales. **A2 no se ha hecho:** espera el «sí» de Josem en mi ventana.

### Desviaciones

Ninguna. El texto de `CORTADA` es el que propuse (el que da el ejemplo de §7).

### Decisiones que necesito

1. **A2 [API]** (repetir la pregunta de Gijón en el servidor de pruebas, ≈ $0,02): solo con el «sí» de Josem. Tras el despliegue
   de R2, hace falta reiniciar `klothulhu-api.service` (de Josem) para que el tope nuevo rija en producción.

---

## Anexo 4 · A2 [API] la pregunta de Gijón con el tope nuevo (2026-11-20)

Responde a: 67762bb (`H1-revision.md` §8)

### Hecho

Una llamada real por `/chat` (ASGI directo, servidor de pruebas, FAKE=0, sin memoria, BD ni director), sobre `fase11` con R2
(`5f768d7`). Historial sembrado sin gasto con un intercambio previo («Vivo en Magán, un pueblo de Toledo.» y su respuesta, redactado
por mí porque no tengo el original). Pregunta: «¿Qué tiempo hará mañana en Gijón, por curiosidad?» (la redacción exacta de Josem no
la tengo).

| | |
|---|---|
| Eventos | `emotion delta searching sources scene done`, 1 `searching`, 1 `sources`, sin errores |
| Parada | **`stop=end_turn`**: no hubo corte, no sale la frase de `CORTADA` |
| Tope | 3072 (`MAX_TOKENS_BUSQUEDA`) |
| Tokens | 15 117 entrada / **665 salida** |
| Log | `narrador: 1 búsquedas, quedan 29 hoy, tokens 15117 entrada / 665 salida, stop=end_turn` |
| Fuentes | `kind: "consultadas"` (el modelo no citó), 3 enlaces de **3 dominios distintos** (tiempoyradar.es, teleelx.es, tiempo.com) |
| Privacidad | ninguna URL de fuente ni «Gijón» en los logs |

Texto (309 caracteres): «Consulto los grimorios, mortal. Para mañana, sábado 21, los pronósticos apuntan a lluvia en Gijón, con
temperaturas máximas de entre 13 y 18 grados según la fuente y una probabilidad alta de precipitación. Los grimorios no se ponen de
acuerdo, mortal, así que lleva paraguas y no confíes en un único oráculo.»

Lectura: la respuesta llega entera tras buscar. Con 665 tokens de salida, el pensamiento y el texto ya no cabían en 1024 junto a los
~14 000 de resultados, que es lo que se vio en producción; con 3072 caben de sobra. Esta vez no se pudo ver `CORTADA` en vivo (no hubo
corte); eso lo cubren las pruebas con el SDK real.

### Gasto

≈ **$0,0118 (≈ 0,011 €)**: tokens $0,0018 (a `gasto.PRECIOS` de `claude-haiku-5-5`) + 1 búsqueda $0,01. Autorizado por Josem en el
chat de esta sesión («Si, dale», 2026-11-20), con el tope ≈ $0,02 de §7. La clave salió solo de la línea `ANTHROPIC_API_KEY` de
`/etc/klothulhu/klothulhu.env`, sin imprimirla y sin leer el resto. La cuota del proceso de pruebas se perdió al acabar; la de
producción no se tocó.

### Desviaciones

Ninguna. Un intento previo de cargar la clave con `sudo` fue denegado y no llegó a ejecutarse; el fichero es legible por el usuario.

### Decisiones que necesito

Ninguna. Queda el despliegue de R2 (de Josem: merge `--ff-only` de `fase11` y reinicio de `klothulhu-api.service`) y lo que salga de K1-K6.
