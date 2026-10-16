# Fase 6 · H1 — informe

Responde a: 03f78f1 (PLAN)

## Hecho

- **T1** `desktop/renderer/convo.js` (UMD, puro): `createConvo({ max = 200 })` con `add`, `clear`, `entries` (copia).
- **T2** `desktop/layout.js` (puro): `PANEL_W = 176`, `openBounds`, `closeBounds`.
- **T3** `preload.js` (`panel`, `onForgotten`) y `main.js`: `ipcMain.handle('panel')` con `shift` guardado, abrir dos veces o
  cerrar sin abrir no hace nada, `setBounds` envuelto en `setResizable(true/false)` con su comentario (Windows),
  `screen.getDisplayMatching(win.getBounds()).workArea`; «Forget conversation» envía `forgotten`. `init` devuelve también `panelW`.
- **T4** `index.html`: botón 📜 (`histBtn`, a la izquierda de 📋, siempre visible), `body` en fila (`#col` + `#history`),
  panel oculto al arrancar, `convo.add` en `ask` y en `done` (respuesta entera sin etiquetas), repintado y bajada al final,
  pintado solo con `createElement`/`textContent`, abrir = `await kl.panel(true)` y luego mostrar; cerrar = ocultar y luego
  `kl.panel(false)`; `onForgotten` limpia; `onStrip` incluye el panel y `onButton` el 📜.
- **T5** `npm run check` con `layout.js` y `renderer/convo.js`; normativa `fase6-h1.test.js` copiada byte a byte
  (sha256 `6aca5832…8247` comprobado); README con una sección sobre 📜.
- Verde: `npm test` **49** (42 + 7), `npm run check`, `pytest` **42** sin cambios, `ruff`. Además, el script inline de
  `index.html` pasa `node --check` (extraído a un fichero temporal).
- Commits: 7c7e04a (T1) · b2176e0 (T2) · b72eb49 (T3) · 14a4cfa (T4+T5).

## Gasto

0.

## Desviaciones

- T4 y T5 en un solo commit: el `package.json`, la prueba y el README viven con el cableado que J7 comprueba.
- En el renderer la constante del panel se llama `historyPanel`, no `history`, para no chocar con `window.history`.
- `#history` no lleva margen izquierdo: el ancho exacto es `PANEL_W × scale`, igual que lo que añade la ventana; con margen
  se recortaría 8 px por `overflow: hidden`.
- El `forgotten` del tray se envía cuando `forget(cfg)` termina, haya ido bien o no (`.finally`). Si el servidor no
  contestara, el panel quedaría vacío aunque el servidor recuerde; no cambia nada de lo que ve la ventana.
- **No he podido probar Electron** (seb01 no tiene pantalla): tamaño de la ventana, scroll y rueda quedan para la lista K1-K6.

## Para Josem: lista K1-K6 en Konnos (`git pull` de `fase6`, sin reiniciar el servicio)

| # | Qué mirar |
|---|---|
| K1 | 📜 abre el panel a la derecha, y la ventana crece sin taparse con el borde de la pantalla |
| K2 | Pregunta y respuesta aparecen en el panel, con lo más reciente abajo, y la rueda hace scroll |
| K3 | 📜 otra vez lo cierra, y la ventana vuelve a su tamaño y su sitio |
| K4 | Con el panel abierto, arrastrar la ventana funciona; al cerrarlo, la ventana no salta |
| K5 | «Forget conversation» vacía el panel |
| K6 | Al cerrar y abrir klothulhu, el panel arranca vacío y cerrado (D27) |

## Decisiones que necesito

Ninguna.
