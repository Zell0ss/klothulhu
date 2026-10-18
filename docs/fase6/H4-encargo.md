---
proyecto: klothulhu
fase: 6
hito: H4
titulo: tres tamaños de ventana, con tamaño y posición guardados
plan: arquitecto
fecha: 2026-10-18
decisiones: "vault 30-projects/klothulhu/ficha.md § Decisiones (D31; también D10, D12, D25, D27)"
gasto_autorizado: "ninguno: no se llama a la API"
---

# H4 · Tamaños de ventana y estado guardado (D31)

> **Para:** el claudcoder. **Desde:** el claudquitecto, 2026-10-18.

## Para el programador

Responde a: 53ddda9 (H3-informe)

### 0. Qué y por qué

Un botón ⤡ en la franja pasa por tres tamaños: `normal` → `half` → `narrow` → `normal`. El tray ofrece
los tres. El tamaño y la posición de la ventana se guardan en `estado.json` y se recuperan al arrancar.
Solo se cambia de tamaño con klothulhu parado y con el panel 📜 cerrado. Es solo el cliente. El plan es mío
porque `estado.json` es un formato nuevo.

| Tamaño | `zoom` | Ancho del escenario (unidades del motor) | Con `scale` 1,5 |
|---|---|---|---|
| `normal` | `scale` | 640 | 960 × 236 |
| `half` | `scale × 0,5` | 640 | 480 × 140 |
| `narrow` | `scale` | 320 (`limits.minWidth` del motor) | 480 × 236 |

Alto de la ventana = `round(128 × zoom) + INPUT_H` (44 px; la caja de texto no se escala).

**Fuera de alcance:**
- arrastrar el borde para redimensionar;
- otros tamaños;
- guardar si el panel estaba abierto;
- `resumeAt`;
- la transparencia;
- `server/`.

### 1. Lista previa (convención §4)

- **¿Borra o sobrescribe ficheros o datos?** Sí: `estado.json`, en `app.getPath('userData')` (en Konnos,
  `%APPDATA%\klothulhu\estado.json`). Se escribe en un `.tmp` y se renombra encima, para que un corte no lo
  deje a medias. **`config.json` no se escribe nunca** (M6). Las pruebas de lectura y escritura van en
  una carpeta de `fs.mkdtempSync` que se borra al acabar (M5). Ninguna prueba toca `userData`.
- **¿API externa?** No. Gasto: 0.
- **¿Producción?** No hace falta reiniciar el servicio. Josem hace el merge y el `git pull` en Konnos.

### 2. Tareas

Rama `fase6`, worktree `/data/klothulhu-fase6`. Una tarea, un commit.

#### T1 · `desktop/layout.js` (puro)

Se añade, sin tocar `openBounds` ni `closeBounds` (J5 y J6 siguen igual):

```
STAGE_W = 640, STAGE_H = 128, INPUT_H = 44      // main.js deja de definirlos y los importa de aquí
SIZE_ORDER = ['normal', 'half', 'narrow']       // congelado
sizeGeometry(name, scale) → { size, zoom, stageW, width, height }   // nombre desconocido → 'normal'
nextSize(name) → el siguiente de SIZE_ORDER, en círculo                // desconocido → 'normal'
resizeBounds(bounds, area, width, height) → bounds
startBounds(saved, { width, height }, areas, primaryArea) → bounds
```

- `width = round(stageW × zoom)` y `height = round(STAGE_H × zoom) + INPUT_H`.
- **`resizeBounds`** mantiene la esquina de abajo a la derecha (`x + width` y `y + height` no cambian) y
  luego lo mete dentro de `area`: `x = max(area.x, min(x, area.x + area.width − width))`, y lo mismo con `y`.
- **`startBounds`:**
  - Sin posición guardada (`x` o `y` no enteros), la de ahora: abajo a la derecha de `primaryArea`, a 24 px
    del borde derecho y 8 px del de abajo.
  - Con posición, busca la pantalla de `areas` con la que más se solapa. Si no se solapa con ninguna, usa la
    posición por defecto. Si se solapa, se mete dentro de esa pantalla, con la misma regla de arriba.

#### T2 · `desktop/state.js` (nuevo; solo `fs`, sin Electron)

```
parseState(text) → { size, x, y }     // nunca lanza
readState(file)  → { size, x, y }     // fichero ausente o ilegible → por defecto
writeState(file, { size, x, y })      // escribe file + '.tmp' y lo renombra encima
```

- **Por defecto:** `{ size: 'normal', x: null, y: null }`.
- **`size`** tiene que estar en `SIZE_ORDER`; si no, vale `'normal'`.
- **La posición** va entera o no va: si `x` o `y` no es un entero, los dos valen `null`.
- **En disco:** `{ "version": 1, "size": …, "x": …, "y": … }`, con `JSON.stringify(…, null, 2)`.
- **Errores:** `writeState` puede lanzar. Quien lo llama (`main.js`) lo envuelve en `try/catch` y avisa
  por consola (y en el log si `debug`). Un fallo al guardar no rompe nada.

#### T3 · `main.js` y `preload.js`

- **Fichero:** `const STATE_FILE = path.join(app.getPath('userData'), 'estado.json')`, calculado después
  de `app.whenReady()`. Un `saveState()` guarda `{ size, x, y }`, con `x = bounds.x + (panelShift ?? 0)`, es
  decir, la posición del panel cerrado.
- **Arranque:** `readState` → `sizeGeometry(state.size, cfg.scale)` → `startBounds(state, geom,
  screen.getAllDisplays().map(d => d.workArea), screen.getPrimaryDisplay().workArea)`. Con eso se crea la
  ventana. `init` devuelve además `geom` y `sizes: SIZE_ORDER`.
- **`ipcMain.handle('size', (_e, name) => …)`:**
  - con el panel abierto (`panelShift !== null`), devuelve `null` y no hace nada;
  - si no, calcula `sizeGeometry(name, cfg.scale)` y llama a `resizeBounds(win.getBounds(), workArea de
    getDisplayMatching, geom.width, geom.height)`;
  - aplica el resultado con el mismo envoltorio `setResizable(true)` … `setResizable(false)` que el panel
    (sácalo a una función y úsala en los dos);
  - guarda el estado y devuelve `geom`.
- **`drag-end`:** después de parar el arrastre, `saveState()`.
- **Tray:** tres entradas, antes del separador: `Size: normal`, `Size: half` y `Size: narrow`. Cada una
  hace `win.webContents.send('size-request', name)`. Si se puede o no cambiar lo decide el renderer, que es
  quien sabe si klothulhu está parado.
- **`preload.js`:**
  - `size: (name) => ipcRenderer.invoke('size', String(name))`;
  - `onSizeRequest: (cb) => ipcRenderer.on('size-request', (_e, n) => cb(String(n)))`.
- **Panel de historial:** no cambia. Su ancho sigue siendo `PANEL_W × cfg.scale` en cualquier tamaño.

#### T4 · `renderer/index.html`

- **El botón:** `<button id="sizeBtn" type="button" title="Tamaño" aria-label="Tamaño">⤡</button>`, a la
  izquierda de 📜 (`right: 70px`), con el mismo estilo. Entra en `onButton`.
- **`let geom`:** se toma de `init`. Una función `applyGeom(geom)` fija los anchos y altos que hoy se calculan
  con `STAGE_W * cfg.scale` en `col`, `stage` y `sceneImg`, ahora con `geom.stageW * geom.zoom` ×
  `STAGE_H * geom.zoom`. El panel no cambia.
- **El motor:** en `paint`, las opciones llevan `width: geom.stageW, height: STAGE_H`, para que el motor
  pinte un escenario de ese ancho (`stageWidth` de claude-fables). Lo demás de `opts` no cambia (I5 sigue).
- **Parado** = `!awaiting && (phase === 'idle' || phase === 'lingering') && !historyOpen`.
- **`requestSize(name)`:**
  - si no está parado, no hace nada;
  - si lo está, `await kl.size(name)`; con `null`, no hace nada;
  - si no, `geom = g`, `applyGeom(g)` y se repinta la última escena pintada, sin fundido: `play` guarda
    la escena que pinta. El temporizador de la espera (`LINGER_MS`) sigue como estaba.
- **Quién lo llama:**
  - `sizeBtn` → `requestSize(siguiente de sizes)`;
  - `kl.onSizeRequest(requestSize)`.
- **D10:** nada de HTML; solo `textContent` y atributos.

#### T5 · Pruebas, comprobación y README

- `npm run check` añade `node --check state.js`.
- Prueba normativa: copiar **byte a byte** `docs/fase6/normativas/fase6-h4.test.js` a
  `desktop/test/fase6-h4.test.js`. Su sha256 es
  `edb0426fba789d36049f6df893faa44a49ffa66844b13b7a06ec1dd1cb03c09c`.
- README del cliente: unas líneas sobre ⤡, el tray y `estado.json` (dónde está y que borrarlo devuelve
  klothulhu a su tamaño y a su sitio de siempre).

**Comprobado:** monté en mi scratchpad un prototipo de las piezas puras (T1 y T2) y de lo que comprueba M6.
Las 6 pruebas nuevas pasan, y el cliente queda en 60 (54 + 6). El prototipo no arranca Electron: el
cableado real es tuyo.

### 3. Parada

- `npm test` 60;
- `npm run check`;
- `pytest` y `ruff` sin cambios.

**Para** y deja `docs/fase6/H4-informe.md`, con commit. Lo que no se puede probar sin Electron lo prueba
Josem en Konnos:

| # | Qué mirar |
|---|---|
| Z1 | ⤡ pasa por normal → mitad → estrecho → normal, y la esquina de abajo a la derecha no se mueve |
| Z2 | Las tres entradas `Size:` del tray hacen lo mismo |
| Z3 | Mientras habla o piensa, o con 📜 abierto, ⤡ no hace nada |
| Z4 | Al cerrar y abrir klothulhu, vuelve con el mismo tamaño y en el mismo sitio, también si lo moviste con 📜 abierto |
| Z5 | En `narrow` se ven klothulhu y el bocadillo; en `half` se lee el bocadillo |
| Z6 | Al borrar `%APPDATA%\klothulhu\estado.json`, arranca como siempre: `normal`, abajo a la derecha |
