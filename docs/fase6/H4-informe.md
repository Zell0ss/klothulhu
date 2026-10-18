# Fase 6 · H4 — informe

Responde a: bcf9301 (H4-encargo)

## Hecho

- **T1** `layout.js`: `STAGE_W/STAGE_H/INPUT_H` (main.js los importa), `SIZE_ORDER`, `sizeGeometry`, `nextSize`,
  `resizeBounds`, `startBounds`; `openBounds`/`closeBounds` sin tocar.
- **T2** `state.js`: `parseState`, `readState`, `writeState` (`.tmp` + `rename`).
- **T3** `main.js`/`preload.js`: `estado.json` en `userData`; arranque con `readState` → `startBounds`; `init` devuelve `geom` y
  `sizes`; `ipcMain.handle('size')` (null con el panel abierto); `setBounds` sacado a función y usado también por el panel;
  `saveState()` tras `size` y en `drag-end` (con `x` = posición del panel cerrado, `try/catch` con aviso); tres entradas
  `Size:` en el tray que envían `size-request`; `size` y `onSizeRequest` en el preload.
- **T4** `index.html`: botón ⤡ (`right: 70px`, en `onButton`), `applyGeom`, `requestSize` (solo parado y sin panel),
  `width: geom.stageW, height: STAGE_H` en las opciones del motor, repintado sin fundido de `lastScene`.
- **T5** `npm run check` con `state.js`; normativa `fase6-h4.test.js` byte a byte (sha256 `edb0426f…c09c` comprobado); README.
- Verde: `npm test` **60**, `npm run check`, `pytest` **42**, `ruff`; el script inline pasa `node --check`.
  El cableado con Electron no se ha podido arrancar aquí.

## Gasto

0.

## Desviaciones

- Un solo commit para T1-T5 en lugar de uno por tarea: el cableado y M6 se comprueban juntos.
- `state` se guarda en `main.js` como `state` global; `saveState()` no hace nada si la ventana no existe.

## Decisiones que necesito

Ninguna. Falta Z1-Z6 de Josem en Konnos.
