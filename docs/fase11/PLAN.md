---
proyecto: klothulhu
fase: 11
titulo: klothulhu busca (búsqueda web en la conversación)
plan: arquitecto
fecha: 2026-11-20
decisiones: "vault 30-projects/klothulhu/ficha.md § Decisiones (D58, D59, D60; también D10, D42, D54, D57)"
gasto_autorizado: "ninguno. El paso [API] A1 es opcional y necesita el «sí» de Josem en el chat (coste < $0,05)"
---

# Fase 11: klothulhu busca

> **Para:** el claudcoder. **Desde:** el claudquitecto, 2026-11-20.
> Convención: `99-meta/arquitecto-programador/arquitecto-programador.md` (vault).

## 0. Qué y por qué

klothulhu podrá **buscar en la web** cuando le haga falta un dato actual o algo que no sabe, o cuando Josem
se lo pida. Se usa la herramienta de servidor de Anthropic (`web_search`): la búsqueda ocurre **dentro de
la misma petición** al narrador, así que el streaming de texto y emociones no cambia de forma. No hay
bucle de herramientas propio ni infraestructura nueva (D58; descartados SearXNG y Brave, ver la ficha).

- Como mucho **2 búsquedas por mensaje** y **30 al día** (D58).
- Mientras busca, el cliente enseña una escena de «consultando los grimorios» (D60).
- Debajo de la respuesta, en el panel de historial, las **fuentes citadas**, como enlaces (D60).
- El historial corto y la memoria larga guardan **solo lo que klothulhu dijo**; ni resultados, ni páginas,
  ni consultas. La consulta tampoco va nunca a los logs (D59).

**Contrato:** sí cambia, y de ahí que el plan sea mío:

- el SSE gana dos eventos: `searching` (`{}`, cada vez que el modelo lanza una búsqueda) y `sources`
  (`{"items": [{"title", "url"}]}`, una vez, tras el texto y antes de las escenas, solo si hay citas);
- el IPC del escritorio gana `openExternal(url)`;
- `convo.hold(text, sources)` y las entradas del historial pueden llevar `sources`.

`POST /chat`, las escenas y el historial del servidor no cambian de forma.

## 1. Lista previa (convención §4)

- **¿Borra o sobrescribe datos?** No.
- **¿Llama a una API externa?** Sí. Comprobado con la documentación vigente (página «Web search tool»,
  2026-11-20):
  - `claude-haiku-5-5` está en la lista de modelos de la herramienta. Se usa la versión **básica**
    `web_search_20250305` (sin filtrado dinámico por código: más rápida, y en una charla pesa más la espera).
  - Coste: **$10 por 1 000 búsquedas** más los tokens de los resultados (entrada). Una búsqueda fallida no
    se cobra. Con el tope de 30 al día, el máximo teórico son ~$9 al mes; con el uso previsto (~10 al día),
    ~$3.
  - `usage.server_tool_use.web_search_requests` dice cuántas hubo; con eso se lleva la cuota.
  - Errores de búsqueda: llegan dentro de la respuesta (200), como un `web_search_tool_result` con
    `error_code`; el modelo sigue y contesta. `stop_reason: "pause_turn"` es posible pero improbable con
    `max_uses: 2`: si llega, se da la respuesta por terminada con lo que haya y se avisa en el log.
  - Para continuar una conversación **con** los bloques de búsqueda habría que reenviarlos tal cual (con
    `encrypted_content`). No se hace: el historial guarda solo el texto (D59), que es una vuelta de
    asistente normal.
  - Las pruebas no gastan (`KLOTHULHU_FAKE=1` o el cliente sustituido). Solo A1 (§5) gasta, y es opcional.
- **¿Toca producción?** Sí, y lo hace Josem: merge y reinicio de `klothulhu-api.service`; en Konnos,
  `git pull` y reiniciar la app. nginx no cambia.

## 2. Servidor

1. **`server/buscaweb.py`** (nuevo y puro; lo fijan S1-S5):
   - `TOOL_TYPE = "web_search_20250305"`, `MAX_USES = 2`, `TOPE_DIA = 30`.
   - `herramienta(max_uses=MAX_USES) -> dict`: `type`, `name: "web_search"`, `max_uses` y
     `user_location: {"type": "approximate", "country": "ES", "timezone": "Europe/Madrid"}`.
   - `Cuota(tope, hoy=<fecha local de Europe/Madrid>)`: `quedan()` y `anotar(n)`. Se reinicia al cambiar el
     día; nunca baja de 0. **Vive en memoria del proceso**: un reinicio la pone a cero (aceptado en D58).
     `permitidas(cuota) = min(MAX_USES, cuota.quedan())`.
   - `BUSCANDO`: un centinela (objeto único). `Fuentes`: dataclass con `items: list[dict]`.
   - `Traductor`, con estado: `feed(evento: dict) -> list` traduce los eventos crudos del stream:
     - `content_block_delta` con `text_delta` → el texto (`str`);
     - `content_block_start` de un `server_tool_use` llamado `web_search` → `BUSCANDO`;
     - en el primer `text_delta` del primer bloque de texto **que sigue a un `web_search_tool_result`**, si lo
       emitido hasta ahí no acaba en blanco y el texto nuevo no empieza por blanco, antes un `" "`: así no
       sale «grimorios.Mañana». **Entre bloques de texto sin búsqueda en medio no se añade nada**: con citas,
       el modelo parte una frase en varios bloques (S4);
     - todo lo demás (pensamiento, `input_json_delta` con la consulta, citas, desconocidos) → nada.
   - `fuentes(content: list[dict]) -> list[dict]`: de los bloques `text` del mensaje final, sus `citations`
     de tipo `web_search_result_location`, en orden; solo `http`/`https`, sin repetir URL, como mucho 5,
     `title` recortado a 80 caracteres y, si viene vacío, el dominio sin `www.`. **Solo lo citado**: un
     resultado que el modelo no usó no se enseña (S5).
   - `AGOTADA`: una frase corta, en tercera persona y sin corchetes, que se añade al `system` cuando ya no
     quedan búsquedas hoy (por ejemplo «(Hoy los grimorios están cerrados: no puedes buscar más hasta
     mañana.)»).
2. **`app.py`:**
   - `BUSQUEDA_TOPE = int(os.getenv("KLOTHULHU_BUSQUEDA_TOPE", str(buscaweb.TOPE_DIA)))` y
     `_cuota = buscaweb.Cuota(BUSQUEDA_TOPE)` a nivel de módulo (S8 lo sustituye). Tope 0 = búsqueda apagada.
   - `_model_stream(cid, content, system)` **mantiene la firma** (las normativas de la fase 10 la sustituyen
     con tres argumentos):
     - `n = buscaweb.permitidas(_cuota)`; si `n > 0`, `tools=[buscaweb.herramienta(n)]`; si no, sin `tools` y
       con `AGOTADA` añadida al `system` (si `system` es texto, pasa a lista de dos bloques);
     - recorre el stream con `async for event in stream`, pasa `event.model_dump()` al `Traductor` y cede lo
       que salga (`str` o `BUSCANDO`);
     - al final: `stop_reason` (`refusal` como hoy; `pause_turn`, aviso), `_cuota.anotar(...)` con
       `usage.server_tool_use.web_search_requests` (puede ser `None`), y cede `Fuentes(buscaweb.fuentes(
       [b.model_dump() for b in final.content]))` **siempre como último elemento**;
     - **log (D42, D59):** una línea por respuesta con el número de búsquedas, cuántas quedan hoy y los
       tokens; **nunca la consulta**, ni URLs, ni resultados (S8).
   - `_reply`: en el bucle de `source`, si el elemento es `BUSCANDO`, cede `_sse("searching", {})`; si es
     `Fuentes`, lo guarda; si es `str`, como hoy. Tras `parser.flush()`, si hay fuentes, cede
     `_sse("sources", {"items": ...})` **antes** del director. El historial y `sesiones.anotar` siguen
     recibiendo `"".join(raw)`, que solo tiene texto (S6, S7). Los `str` de las fuentes enlatadas de la fase
     10 siguen funcionando: un `source` que solo cede `str` se comporta igual que antes.
   - **FAKE:** si el texto empieza por «busca» (sin mayúsculas ni blancos delante), una respuesta enlatada
     aparte que cede texto, `BUSCANDO`, más texto y unas `Fuentes` con un enlace de ejemplo (`https://example.org/`)
     (S10). `_fake_stream()` sigue **sin argumentos**.
   - Actualiza el contrato del docstring de cabecera con los dos eventos nuevos.
3. **`server/prompt.md`:** un párrafo nuevo, en la voz del prompt, que diga:
   - que puede consultar los grimorios (buscar en la web) cuando necesite algo actual o que no sabe, o
     cuando el mortal se lo pida; que **no** busque para charlar, opinar ni lo que ya sabe;
   - que, si busca, lo diga antes en una frase corta y con su etiqueta de emoción (el aviso queda bonito
     con la escena de «buscando»), y que después cuente lo que encontró **sin enlaces ni URLs** en el texto
     (las fuentes ya salen aparte);
   - que, si no puede buscar (cuota agotada, error), lo diga en su papel y conteste con lo que sepa.
   El formato de etiquetas y lo demás del prompt no cambian. Si al probar (A1) se pasa buscando, se ajusta
   este párrafo: es el sitio para dirigirlo (lo dice la documentación).

## 3. Clientes

1. **`desktop/renderer/fuentes.js`** (nuevo, UMD como `convo.js`, global `KlFuentes`; lo fija B1):
   - `MAX = 5`; `esSegura(url)`: solo `http:`/`https:` (con `new URL`), lo demás `false`;
   - `host(url)`: el dominio sin `www.`, o `''` si no es una URL;
   - `normalizar(items)`: de lo que llega en `sources.items`, solo objetos con URL segura, sin repetir,
     como mucho `MAX`, con `{ title, url, host }` y el dominio como título si falta. Cualquier otra cosa → `[]`.
2. **`convo.js`:** `hold(text, sources)`: si `sources` es un array no vacío, la entrada lleva `sources`
   (copia); si no, la entrada es la de siempre, **sin** la clave. `entries()` devuelve copias también de
   `sources` (B2).
3. **`scenes.js`:** `LINES.searching` («Consultando los grimorios…» o similar, ≤ `CAPTION_MAX`, distinta de
   `LINES.thinking`) y `STAGING.searching` con fondo, acción y partículas del vocabulario del motor (B3).
   Josem la puede retocar, como las otras.
4. **Los dos reproductores** (`web/app.js` y `desktop/renderer/index.html`, copia deliberada, D50):
   - **`searching`:** si se está esperando (fase `thinking`), pinta `sceneFor('searching', LINES.searching)`.
     Si ya hay escenas en marcha, no hace nada;
   - **`sources`:** guarda `KlFuentes.normalizar(data.items)` para esta respuesta; al llegar `done`,
     `convo.hold(reply, fuentes)`. Se vacía al empezar cada pregunta;
   - **panel de historial:** bajo la respuesta que tenga `sources`, una línea pequeña con los dominios
     (`host`) como enlaces, con `title` como `title` del enlace. Con `textContent` y `createElement`, nunca
     `innerHTML` (D10). Que quepa en todos los tamaños del panel (el del escritorio, D51 en el móvil).
   - **web:** `<a href target="_blank" rel="noopener noreferrer">`. La CSP no cambia (los enlaces no son
     peticiones).
   - **escritorio:** clic → `window.klothulhu.openExternal(url)`. `preload.js`: `openExternal: (url) =>
     ipcRenderer.invoke('open-external', url)`. `main.js`: el manejador solo abre si `esSegura(url)` (de
     `fuentes.js`) y usa `shell.openExternal`; además, `webContents.setWindowOpenHandler(() => ({ action:
     'deny' }))` y `will-navigate` con `preventDefault()`, para que la ventana nunca navegue (B4).
   - carga `fuentes.js` en los dos y añádelo a `npm run check` del escritorio (B4).
5. `sse-client.js` no cambia: ya pasa cualquier evento con nombre.

## 4. Despliegue (Josem)

Merge `--ff-only` → reiniciar `klothulhu-api.service` → recargar el móvil; en Konnos, `git pull` y
reiniciar la app. No hay nginx ni variables nuevas obligatorias (`KLOTHULHU_BUSQUEDA_TOPE` es opcional; 0
la apaga sin desplegar nada).

## 5. Pruebas y parada

- **Normativas:** copia tal cual `docs/fase11/normativas/test_fase11.py` a `tests/test_fase11.py`, y
  `docs/fase11/normativas/fase11.test.js` a `desktop/test/fase11.test.js`. No se editan. Las de las fases
  anteriores tienen que seguir pasando sin tocarlas.
- **Tuyas** (recomendado): `pause_turn`; un `web_search_tool_result` con error; que `main.js` rechace una
  URL no segura en `open-external`.
- **A mano**, con el servidor de pruebas de la fase 9 (`KLOTHULHU_FAKE=1`) y Chrome sin pantalla: «busca …»
  enseña la escena de buscar, luego la respuesta, y en el historial la línea de fuentes con el enlace; «hola»
  no la enseña. Captura de las dos.
- **[API] A1, opcional y solo con el «sí» de Josem en el chat:** con `KLOTHULHU_FAKE=0` contra el servidor
  de pruebas (no producción), tres mensajes: uno que pida buscar («¿qué tiempo hará mañana en Madrid?»),
  uno que no lo necesite («¿cuánto es 7 por 8?») y uno de charla («¿qué tal estás?»). En el informe: si
  buscó en cada uno, el texto, las fuentes, el log (sin la consulta) y el coste con lo que digan los logs y la
  cuota (< $0,05). Si busca en la charla, ajusta el prompt y repite solo ese mensaje.
- **Parada:** `pytest -q tests`, `ruff check .`, `cd desktop && npm test && npm run check`,
  `cd web && npm test && npm run check`. Informe en `docs/fase11/H1-informe.md`, con las capturas.
  **Para ahí.**

## 6. Pruebas de Josem tras el despliegue (K)

- K1: en el móvil, «¿qué tiempo hará mañana?»: escena de buscar, respuesta con datos de mañana y fuentes.
- K2: en Konnos, lo mismo; clic en una fuente → se abre en el navegador, no en la ventana de klothulhu.
- K3: una charla normal («¿qué tal el día?»): no busca.
- K4: «busca quién ganó ayer el partido del Madrid»: busca aunque sea deporte (se lo has pedido).
- K5: en el mensaje siguiente, «¿y pasado mañana?»: se acuerda de lo que dijo (no de la página).
- K6: los logs de ese día: el número de búsquedas, sin consultas ni URLs.
