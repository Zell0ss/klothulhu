---
proyecto: klothulhu
fase: 6
titulo: panel de historial y emoción sad
plan: arquitecto
fecha: 2026-10-16
decisiones: "vault 30-projects/klothulhu/ficha.md § Decisiones (D27, D28; también D10, D12, D21, D24-D26)"
gasto_autorizado: "ninguno en H1; H2 lo pedirá cuando llegue el motor"
---

# Fase 6: panel de historial y emoción `sad`

> **Para:** el claudcoder. **Desde:** el claudquitecto, 2026-10-16.
> Convención: `99-meta/arquitecto-programador/arquitecto-programador.md` (vault).

## 0. Qué y por qué

Dos cosas, en dos hitos que no dependen uno del otro:

- **H1 · Panel de historial (D27).** Solo el cliente. Un botón 📜 abre y cierra, a la derecha de la
  franja, un panel con la conversación de esta sesión. La ventana se ensancha para hacerle sitio.
- **H2 · Emoción `sad` (D28).** Espera a que claude-fables entregue una acción triste (pedido en el
  vault, `claude-fables/DE-KLOTHULHU.md` §6). Esta sección del plan se completará entonces, con sus
  pruebas normativas. **No se empieza H2 sin un plan completo.**

**Contrato:** H1 no cambia ninguno: el texto de la conversación ya lo tiene el renderer. H2 cambia
uno, la lista de emociones (P7), así que el plan es del arquitecto.

**Fuera de alcance:**
- guardar la conversación en disco (D27 opción C);
- `GET /history` (opción B);
- estrechar el escenario;
- cualquier emoción que no sea `sad`;
- LogCentral;
- borrar `beats()`.

## 1. Lista previa (convención §4)

- **¿Algo borra o sobrescribe ficheros o datos?** No. La conversación vive en memoria del renderer.
  Las pruebas son puras y no escriben nada.
- **¿API externa?** No en H1. Gasto: 0.
- **¿Producción?** H1 es solo el cliente, así que no hace falta reiniciar el servicio. Al cerrar H1,
  Josem hace merge `--ff-only` de `fase6` en `main` y `git pull` en Konnos. Si H2 va en la misma rama,
  el merge espera a H2. Lo decidirá Josem al cerrar H1.

## 2. H1 · Tareas

Rama `fase6`, worktree `/data/klothulhu-fase6` (ya creado). Una tarea, un commit.

### T1 · `renderer/convo.js` (puro, D27)

Mismo envoltorio UMD que `feed.js`: `module.exports` en Node, y `window.KlConvo` como script clásico.

```
createConvo({ max = 200 } = {}) → { max, add(role, text), clear(), entries() }
```

- `role` es `'user'` o `'klothulhu'`. Con cualquier otro valor, o si `text` no es un string o queda vacío
  tras `trim()`, **no se añade nada**.
- `text` se guarda recortado (`trim()`).
- Con más de `max` entradas, se van las más antiguas.
- `entries()` devuelve una **copia** (array y objetos nuevos).

### T2 · `desktop/layout.js` (puro, D27)

```
PANEL_W = 176                                   // unidades del motor; el bocadillo mide ~168
openBounds(bounds, area, add) → { bounds, shift }
closeBounds(bounds, add, shift) → bounds
```

- `openBounds`:
  - `width + add`;
  - `x = max(area.x, min(bounds.x, area.x + area.width − nuevoAncho))`;
  - `shift = bounds.x − x`, lo que se ha desplazado a la izquierda.
  - `y` y `height` no cambian.
- `closeBounds`: `x + shift` y `width − add`.
- Los dos son puros. Los casos van en J5 y J6.

### T3 · `main.js` y `preload.js`

- **`preload.js`:**
  - `panel: (open) => ipcRenderer.invoke('panel', Boolean(open))`;
  - `onForgotten: (cb) => ipcRenderer.on('forgotten', () => cb())`.
- **`main.js`, `ipcMain.handle('panel', …)`:**
  - calcula `add = Math.round(PANEL_W * cfg.scale)`;
  - toma `area` con `screen.getDisplayMatching(win.getBounds()).workArea`, que es la pantalla donde
    está la ventana;
  - y aplica `openBounds` o `closeBounds` con `win.setBounds`;
  - guarda `shift` mientras el panel está abierto;
  - abrir dos veces o cerrar sin haber abierto **no hace nada**.
  - **Ojo, Windows:** con `resizable: false`, `setBounds` puede no cambiar el tamaño. Si en Konnos no
    crece, envuélvelo en `win.setResizable(true)` … `win.setResizable(false)`. Déjalo hecho de entrada,
    con un comentario.
- **El «Forget conversation» del tray** sigue llamando a `forget(cfg)`, y además hace
  `win.webContents.send('forgotten')`.

### T4 · `renderer/index.html`

- **Script:** `<script src="convo.js"></script>`, clásico, después de `feed.js`. La CSP no cambia (D10).
- **Botón `histBtn` (📜):** a la izquierda de 📋, con el mismo estilo; siempre visible.
- **Diseño:**
  - `body` pasa a fila: una columna con escenario y entrada, y al lado `<div id="history">`;
  - el panel mide `PANEL_W × scale` de ancho y todo el alto de la ventana;
  - va oculto al arrancar;
  - fondo `var(--box)`, borde `var(--rust)` y letra monoespaciada, como la entrada;
  - tiene `overflow-y: auto`.
  `layout.js` es del proceso principal; en el renderer, `PANEL_W` llega por `init`.
- **Qué se guarda:**
  - en `ask(text)`, `convo.add('user', text)`;
  - en `done`, `convo.add('klothulhu', reply)`, que es la respuesta entera sin etiquetas, lo mismo que
    copia 📋;
  - en `error`, nada;
  - después de cada `add`, si el panel está abierto se vuelve a pintar y se baja al final.
- **Pintado:** cada entrada es un `div`, con un `span` para «tú:» o «klothulhu:» y el texto. Todo con
  `createElement` y `textContent`. **Nunca HTML** (D10, J7).
- **Abrir y cerrar:** al pulsar 📜, el panel se muestra solo **después** de que `kl.panel(true)` haya
  respondido, para que no salga aplastado. Al cerrar, primero se oculta y luego se llama a
  `kl.panel(false)`.
- **Olvido:** `kl.onForgotten`, igual que «Forget conversation», llama a `convo.clear()` y vuelve a
  pintar el panel.
- **Ratón (D12):** el panel es zona interactiva: `onStrip` lo incluye y la rueda hace scroll. 📜 está en
  `onButton`, así que no abre la caja de texto ni arrastra. Arrastrar la ventana sigue funcionando
  desde la franja.

### T5 · Pruebas, comprobación y README

- `npm run check` añade `node --check layout.js` y `node --check renderer/convo.js`.
- Prueba normativa: copiar **byte a byte** `docs/fase6/normativas/fase6-h1.test.js` a
  `desktop/test/fase6-h1.test.js`. Su sha256 es
  `6aca5832867c9589af5d3a6b449938b0c89d5bce5506d54101ce4744850e8247`.
- README del cliente: una línea sobre 📜.

**Comprobado:** el arquitecto montó en su scratchpad un prototipo mínimo de T1, T2 y el cableado, y
las 7 pruebas pasan: 49 en el cliente (42 + 7). Impleméntalo tú.

## 3. H1 · Parada

- `npm test` 49;
- `npm run check`;
- `pytest` 42 sin cambios (no se toca `server/`);
- `ruff`.

**Para** y deja `docs/fase6/H1-informe.md`. Todo lo que no se puede probar sin Electron (tamaño de la
ventana, scroll, rueda) lo prueba Josem en Konnos con esta lista:

| # | Qué mirar |
|---|---|
| K1 | 📜 abre el panel a la derecha, y la ventana crece sin taparse con el borde de la pantalla |
| K2 | Pregunta y respuesta aparecen en el panel, con lo más reciente abajo, y la rueda hace scroll |
| K3 | 📜 otra vez lo cierra, y la ventana vuelve a su tamaño y su sitio |
| K4 | Con el panel abierto, arrastrar la ventana funciona; al cerrarlo, la ventana no salta |
| K5 | «Forget conversation» vacía el panel |
| K6 | Al cerrar y abrir klothulhu, el panel arranca vacío y cerrado (D27) |

## 4. H2 · Emoción `sad` (pendiente del motor)

Se completará cuando claude-fables avise en su `PARA-KLOTHULHU.md`. Por ahora, el alcance (D28):
- vendorizar el motor nuevo;
- `sad` en `server/emotion_parser.py`, `scenes.js` (`EMOTIONS` y `STAGING`) y `server/prompt.md`, con
  los dos usos;
- la pista en `director_prompt.md`;
- una pasada [API] con 3-4 preguntas tristes, para comprobar el indicador de D28.
