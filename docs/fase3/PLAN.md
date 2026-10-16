---
proyecto: klothulhu
fase: 3
titulo: v2 completa — el cliente pinta las escenas del servidor
plan: programador
fecha: 2026-10-16
decisiones: "vault 30-projects/klothulhu/ficha.md § Decisiones (D21; también D10-D13, D19, D20)"
---

# Fase 3 · PLAN (programador)

Responde a: f08af89 (H0-encargo)

> Aprobado por el arquitecto con M1-M3 (H0-revision.md, 9f6b829); matices aplicados en este commit.

## 0. Resumen

El cliente deja de trocear al llegar `done` y encola cada evento `scene` en cuanto llega (D21). Para que
la lógica se pueda probar sin Electron, la decisión «qué va a la cola» sale de `index.html` a un módulo puro
nuevo, `desktop/renderer/feed.js` (mismo patrón UMD que `scenes.js`). `index.html` solo cablea: eventos →
feed → cola → `paint`.

Servidor, `scenes.js` y las pruebas de las fases 1 y 2 no se tocan. Gasto de API de la fase: **0**.

## 1. Diseño

### 1.1 `renderer/feed.js` (nuevo, puro)

```js
const feed = KlFeed.createFeed();       // uno por respuesta; ask() crea uno nuevo
feed.onScene(data)  -> item | null      // item = { kind, caption, scene, fromServer: true }
feed.onDone(reply, marks) -> item[]     // [] si ya llegaron escenas; beats() si no llegó ninguna
feed.onError()                          // cierra: las escenas que lleguen después se ignoran
```

- `onScene` valida: `data` objeto, `index` entero ≥ 0, `caption` string no vacío. Si no, `null` (se ignora).
  `kind` = `emotion` si está en `EMOTIONS`, si no `neutral`. `caption` se recorta a `CAPTION_MAX` por
  seguridad (el servidor ya lo respeta). `scene` = `data.scene` si es un objeto, si no `null`.
- `onDone` cierra el feed. Con 0 escenas recibidas devuelve `beats(reply, marks)` como items
  `{kind, caption, scene: null}` (cliente de la fase 1 → servidor de la fase 1; nunca se pintan las dos
  cosas porque «0 recibidas» y «≥ 1 recibida» son excluyentes).
- Estado: `seen` (índices vistos), `count`, `closed`.

### 1.2 `index.html`

- `ask()` crea `feed = KlFeed.createFeed()` y guarda `t0 = performance.now()`.
- Evento `scene` → `const it = feed.onScene(data); if (it) enqueue([it])`. Es lo que hace que la primera
  sustituya a «pensando»: `enqueue` con `phase === 'thinking'` llama a `pump()`, igual que hoy con `done`.
- Evento `done` → `awaiting = false; enqueue(feed.onDone(reply, marks))`. **Se llama a `enqueue` aunque la
  lista esté vacía**: con una respuesta vacía es lo que saca al cliente de «pensando» hacia `lingering`/`idle`
  (hoy pasa igual con `beats('')`).
- Evento `error` → `feed.onError()` y el resto como hoy (cola vaciada, la escena de error espera a que se
  lea la que está en pantalla).
- `play(item)`: si `item.scene`, `paint(item.scene)`; si `paint` devuelve `null` (`renderScene` → `ok:false`
  tras el reintento de `look`), cae a `sceneFor(item.kind, item.caption)`. Si no hay `item.scene`, directo a
  `sceneFor`. `lastBackdrop`, el fundido (`backdrop` distinto del anterior) y `readMs` funcionan igual, con el
  `backdrop` de la escena que se haya pintado y el `caption` del evento (la escena fija usa ese caption,
  como pide D21.2).
- `copyBtn` se muestra en `done` como hoy; `reply` sigue acumulándose con `delta`, así que copiar da la
  respuesta entera.

### 1.3 Medida para D20 (`debug`)

Propongo **`"debug": true` en `config.json` + `kl.debug(line)` por IPC → fichero de log en el proceso
principal**. Justificación: Josem no necesita DevTools (la ventana no tiene marco ni menú, y abrirlos no es algo que quiera hacer) y el fichero se puede abrir con el bloc de notas o mandarme tal cual. Alternativa descartada: escuchar
`console-message` en `main.js`; no me consta que la firma del evento sea estable en Electron 44 y no puedo
probarlo desde seb01.

- Renderer: al pintarse el **primer item de servidor** de la respuesta (es decir, el primer `scene`, lleve
  `scene` no nulo o `null`):
  `const line = \`first-scene ms=${Math.round(performance.now() - t0)} director=${item.scene ? 1 : 0} painted=${ok ? 'server' : 'fixed'}\``;
  `console.info('[klothulhu]', line); if (cfg.debug) kl.debug(line)`.
  `director=0` distingue «el director falló/está apagado» de «tardó». Añado también `done ms=…` (ms hasta
  `done`) y `scenes=n`: un dato más por el mismo coste, útil para ver cuánto del tiempo es narrador y cuánto
  director (D20).
- `preload.js`: `debug: (line) => ipcRenderer.send('debug', String(line))`.
- `main.js`: `ipcMain.on('debug', (_e, line) => { if (cfg.debug) appendLog(logFile, line); })`, donde `logFile`
  es `desktop/klothulhu-debug.log` (ruta fija; el renderer no elige nada). `init` devuelve también `debug`.
- `desktop/debug-log.js` (nuevo, puro, con prueba): `appendLog(file, line)` escribe
  `<ISO fecha> <línea recortada a 500 chars sin saltos de línea>\n`; si el fichero pasa de 256 KB, lo
  trunca antes de escribir (tope, sin rotación).
- `config.example.json`: `"debug": false`. `.gitignore`: `desktop/klothulhu-debug.log`.

## 2. Casos raros

| Caso | Qué hace el cliente | Por qué |
|---|---|---|
| `scene` después de `done` | Se ignora (`closed`), sin pintar | El contrato (D13) las manda antes de `done`. Pintarlas tras `done` mezclaría con una pregunta nueva |
| `index` repetido | Se ignora el segundo | Evita pintar dos veces la misma frase |
| `index` fuera de orden (p. ej. 1 antes que 0) | Se encola en **orden de llegada** | SSE sobre TCP no reordena y el servidor las manda en orden (D19). Un buffer de reordenación añade latencia y complejidad para un caso que no debería existir. Se anota con `console.warn` |
| `index` huecos (llegan 0 y 2) | Se pintan las que llegan; no hay fallback a `beats()` | «Nunca se pintan las dos cosas» (D21.3) |
| `scene` con datos inválidos | Se ignora | Defensa; el servidor ya valida |
| `error` a mitad de las escenas | Cola vaciada, la escena de error espera a la que está en pantalla (como hoy); `feed` cerrado | Comportamiento actual de la fase 1; no cambia |
| `done` sin ningún `scene` | `beats()` como en la fase 1 | D21.3 |
| `done` con respuesta vacía | `enqueue([])` → `lingering` → `idle` | Como hoy |
| Pregunta nueva mientras se leen las escenas | **No cambia.** `awaiting` sigue bloqueando el `Enter` hasta `done`/`error`; como todas las escenas llegan antes de `done`, al poder preguntar ya están todas encoladas. Preguntar entonces corta la lectura y pasa a «pensando» (`think()` vacía la cola), igual que hoy | Cambiarlo (encadenar preguntas, leer mientras se piensa) es otra feature |
| Escenas de una petición anterior | No llegan: `main.js` descarta eventos de una petición abortada y `awaiting` impide solapar peticiones | — |

## 3. Accesorios con estilos 3D (`props-not-drawn`)

Propongo **nada + dejarlo documentado y visible**: `paint()` ya recibe `r.warnings` del motor; lo registro con
`console.warn` y, con `debug`, en el log, una vez por advertencia distinta y respuesta. Se documenta en
`desktop/README.md`: con `look` 3D los accesorios que ponga el director no se ven.
El motor sí expone la figura (`renderScene(escena, { figure: 'auto' | 'pixel' | '3d' })`), pero fijar `pixel` estropearía justo el look 3D que Josem elija (M3). Con `pixel` (el suyo) no pasa. Si Josem prueba un
3D y le molesta, llegará como encargo.

## 4. Tareas

| # | Tarea | Commit |
|---|---|---|
| T1 | `renderer/feed.js` + `test/fase3.test.js` (C1-C8). Sin tocar `index.html` | `Fase 3: feed puro` |
| T2 | `debug-log.js` + prueba C9; `config.example.json`, `.gitignore` | `Fase 3: log de depuración` |
| T3 | `index.html` (cola, `play` con fallback, medidas), `preload.js`, `main.js`, `package.json` (`check` y `test` incluyen los ficheros nuevos) | `Fase 3: el cliente pinta las escenas del servidor` |
| T4 | Humo en Node del script de `index.html` con `window`/`kl` simulados y un flujo SSE grabado (como en la fase 1) | `Fase 3: humo` |
| T5 | Humo contra un servidor local (puerto 8766, `KLOTHULHU_FAKE=1`, `.venv` propio) leyendo el stream con `sse-client.js`: confirma que `scene` llega a `onEvent` y que el feed las emite en orden | — (va al informe) |
| T6 | `desktop/README.md` (escenas del servidor, `debug`, nota de accesorios 3D); `tomorrow.md` | `Fase 3: README` |
| T7 | Push de `fase3`, informe `docs/fase3/H1-informe.md` con commit | — |

### Pruebas propias (`desktop/test/fase3.test.js`, `node:test`)

| # | Comprueba |
|---|---|
| C1 | `onScene` con evento válido y `scene` no nulo → item con esa escena, `kind` = emoción |
| C2 | `scene: null` → item con `scene: null` y el `caption` del evento |
| C3 | Emoción desconocida → `neutral`; caption > `CAPTION_MAX` recortado |
| C4 | `index` repetido y datos inválidos → `null` |
| C5 | Llegada en orden de llegada con `index` desordenado |
| C6 | `onDone` con escenas recibidas → `[]`; sin ninguna → `beats()` (compara con `scenes.beats`) |
| C7 | `onScene` tras `onDone` o tras `onError` → `null` |
| C8 | Con 0 escenas, nunca se emite una escena de servidor tras el fallback y viceversa (excluyentes) |
| C9 | `appendLog`: formato, recorte de 500, una sola línea, truncado a 256 KB (en carpeta temporal `os.tmpdir()`, nunca la real) |

Todo el flujo debe seguir en verde: `npm test`, `npm run check`, `pytest -q tests` y `ruff check .`.

## 5. Prueba en Konnos (Josem, después del informe)

```powershell
cd <repo>\desktop ; git fetch ; git checkout fase3 ; npm ci ; npm test ; npm start
```

Antes: copiar `config.example.json` si hace falta y añadir `"debug": true` en `config.json`.

| # | Qué mirar | Si falla |
|---|---|---|
| L1 | Todo lo de K1-K7 de la fase 1 sigue igual: arranque, 📋 copia la respuesta entera, ✕ cierra, clic/arrastre/clic-a-través, `look` válido e inventado | Regresión de la fase 3 en `index.html` |
| L2 | Una pregunta: «pensando» y después las escenas. En el log, `first-scene ms` **menor** que `done ms`; a simple vista, la segunda escena no tarda más en aparecer que la primera (M1) | Las escenas no se encolan al llegar (D21.1) |
| L3 | Las escenas ya no son siempre el mismo plano por emoción: hay variedad de fondos y movimientos | El director falla o está apagado; mira `director=` en el log |
| L4 | Con `debug: true` aparece `desktop\klothulhu-debug.log` con `first-scene ms=…` por pregunta | `init`/IPC `debug` |
| L5 | Anota 5 valores de `first-scene ms` (medida de D20). **Si notas la espera hasta la primera escena como demasiado larga, dilo; con eso se reabre D20** (M2) | — (dato, no fallo) |
| L6 | Para el servidor o quita red a mitad de pregunta: sale el mensaje de error y el cliente sigue vivo para la siguiente | Error con feed cerrado |
| L7 | Una pregunta que dé una respuesta de una sola frase: una sola escena, sin «pensando» colgado | Cola/pump |

## 6. Lista previa (convención §4)

- **¿Algo borra o sobrescribe ficheros o datos?** Solo el log de depuración propio: `appendLog` lo trunca a
  los 256 KB. Las pruebas lo ejercitan en una carpeta temporal, no en `desktop/`. No se borra nada del repo
  ni de datos del usuario.
- **¿API externa?** Desde las pruebas automáticas, **no**: `npm test` y el servidor local con
  `KLOTHULHU_FAKE=1`. Cada pregunta que Josem haga en Konnos va contra el servidor de **producción** y gasta
  API de Anthropic (narrador + director; en la fase 2 todo el gasto de pruebas fue $0.0187): uso normal, no un paso [API] de este plan.
- **¿Producción?** El servidor no cambia. El cliente corre en Konnos. En seb01 no se despliega nada; el merge
  de `fase3` a `main` lo hace Josem.

## 7. Fuera de alcance (propuesto)

- `prefers-reduced-motion` (fase 1, revisión §2.5).
- Empaquetado del cliente.
- Continuidad de escenas entre respuestas.
- Poder preguntar mientras se leen las escenas, y cola de preguntas.
- Reordenar escenas por `index`.
- Configurar la figura del motor (`figure`).

## 8. Punto de parada

Este plan. **Para** hasta la aprobación del arquitecto. Después, T1-T7 y parada con el informe (H1).

## Decisiones que necesito

1. ¿Te vale `debug` + IPC + fichero (§1.3), o prefieres otra forma?
2. ¿Orden de llegada sin reordenar (§2) y nada con los accesorios 3D (§3)?
3. ~~¿C1-C9 normativas?~~ No (revisión): son mías; si las cambio, lo explico en el informe.
