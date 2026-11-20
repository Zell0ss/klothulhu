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
